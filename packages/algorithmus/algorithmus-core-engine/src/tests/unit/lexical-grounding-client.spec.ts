import { describe, expect, it } from "@jest/globals";
import { LexicalGroundingClient } from "../../infra/grounding/LexicalGroundingClient";

/**
 * Tests del cliente puro de Lexical Grounding v1. Verifica el algoritmo
 * (tokenizacion + bigram coverage) y los modos `empty_input` que el adapter
 * traduce a `ungrounded_output` (NO a `port_unavailable`).
 */
describe("LexicalGroundingClient (unit)", () => {
  it("LGC-1: 100% overlap (mismo texto en output y excerpt) -> score 1.0", () => {
    const client = new LexicalGroundingClient({ minOutputChars: 5 });
    const result = client.score(
      "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante",
      [
        {
          excerpt:
            "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante",
        },
      ],
    );
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.score).toBeCloseTo(1.0, 5);
    expect(result.coveredBigrams).toBe(result.totalBigrams);
  });

  it("LGC-2: cero overlap (vocabulario disjunto) -> score 0", () => {
    const client = new LexicalGroundingClient({ minOutputChars: 5 });
    const result = client.score("rocket nasa apollo lunar mission orbit", [
      { excerpt: "futbol jugador estadio campeonato pelota cancha" },
    ]);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.score).toBe(0);
    expect(result.coveredBigrams).toBe(0);
  });

  it("LGC-3: aiOutputText demasiado corto -> empty_input(short_text)", () => {
    const client = new LexicalGroundingClient({ minOutputChars: 20 });
    const result = client.score("hola", [
      { excerpt: "Texto largo de referencia con suficiente contenido" },
    ]);
    expect(result.kind).toBe("empty_input");
    if (result.kind === "empty_input") {
      expect(result.reason).toBe("short_text");
    }
  });

  it("LGC-4: texto sin palabras significativas -> empty_input(no_bigrams)", () => {
    const client = new LexicalGroundingClient({ minOutputChars: 5 });
    const result = client.score("a el la los y de en con por", [
      { excerpt: "Texto largo de referencia" },
    ]);
    expect(result.kind).toBe("empty_input");
    if (result.kind === "empty_input") {
      expect(result.reason).toBe("no_bigrams");
    }
  });

  it("LGC-5: referencias sin excerpt utilizable -> empty_input(no_excerpts)", () => {
    const client = new LexicalGroundingClient({ minOutputChars: 5 });
    const result = client.score(
      "Las botas tienen suela antideslizante y plantilla",
      [{ excerpt: "" }, { excerpt: "   " }, {}],
    );
    expect(result.kind).toBe("empty_input");
    if (result.kind === "empty_input") {
      expect(result.reason).toBe("no_excerpts");
    }
  });

  it("LGC-6: overlap parcial -> score intermedio (>0 y <1)", () => {
    const client = new LexicalGroundingClient({ minOutputChars: 5 });
    const result = client.score(
      "Las botas Prima Donna usan suela goma con dibujos taqueados",
      [
        {
          excerpt:
            "Las botas Prima Donna ofrecen plantilla anatomica y suela antideslizante",
        },
      ],
    );
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });
});
