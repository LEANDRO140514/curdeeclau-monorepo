/**
 * Lexical Grounding v1 — cliente puro de scoring.
 *
 * NO es grounding semantico. NO usa LLM ni embeddings. Calcula coverage de
 * bigramas entre `aiOutputText` y los `excerpt` de las referencias RAG, tras
 * tokenizar (lowercase + strip puntuacion) y filtrar stopwords ES+EN basicas.
 *
 * Limitaciones conocidas:
 *   - Falsos POSITIVOS: hallucinations que reusan vocabulario del prompt
 *     pueden pasar (lexical no captura semantica).
 *   - Falsos NEGATIVOS: parafrasis genuina con sinonimos baja coverage real
 *     y puede ser marcada como ungrounded.
 *
 * Es un FLOOR honesto sobre la heuristica trivial `references.length > 0`.
 * v2 (embeddings cosine) y v3 (LLM-as-judge) son trabajo futuro.
 *
 * IMPORTANTE: este modulo NUNCA importa del core. Es puro y sintetizable.
 */

const SPANISH_ENGLISH_STOPWORDS: ReadonlySet<string> = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "y",
  "o",
  "u",
  "de",
  "del",
  "al",
  "a",
  "en",
  "que",
  "se",
  "no",
  "es",
  "son",
  "fue",
  "ser",
  "haber",
  "ha",
  "han",
  "su",
  "sus",
  "lo",
  "le",
  "les",
  "me",
  "te",
  "nos",
  "por",
  "para",
  "con",
  "sin",
  "como",
  "pero",
  "si",
  "mas",
  "muy",
  "ya",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "the",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "by",
  "as",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "you",
  "he",
  "she",
  "we",
  "they",
]);

const MIN_TOKEN_LENGTH = 2;

function tokenize(text: string): string[] {
  const lowered = text.toLowerCase();
  const stripped = lowered.replace(/[^\p{L}\p{N}\s]/gu, " ");
  const split = stripped.split(/\s+/);
  const out: string[] = [];
  for (const tok of split) {
    if (tok.length < MIN_TOKEN_LENGTH) continue;
    if (SPANISH_ENGLISH_STOPWORDS.has(tok)) continue;
    out.push(tok);
  }
  return out;
}

function bigramsOf(tokens: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    out.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return out;
}

export type LexicalGroundingClientOptions = {
  /**
   * Largo minimo (en chars post-trim) del aiOutputText para producir un score.
   * Por debajo: kind="empty_input" con `reason="short_text"`.
   */
  readonly minOutputChars?: number;
};

export type LexicalGroundingResult =
  | {
      readonly kind: "ok";
      readonly score: number;
      readonly coveredBigrams: number;
      readonly totalBigrams: number;
      readonly latencyMs: number;
    }
  | {
      readonly kind: "empty_input";
      readonly reason: "short_text" | "no_bigrams" | "no_excerpts";
      readonly latencyMs: number;
    };

const DEFAULT_MIN_OUTPUT_CHARS = 20;

/**
 * Cliente puro: dado `aiOutputText` y referencias con `excerpt?`, devuelve un
 * score 0..1 (coverage de bigramas) o un `empty_input` con el motivo.
 *
 * Nunca lanza excepciones. El adapter superior (`LexicalGroundingPort`)
 * traduce el resultado al contrato `GroundingPortOutput`.
 */
export class LexicalGroundingClient {
  private readonly minOutputChars: number;

  constructor(opts: LexicalGroundingClientOptions = {}) {
    this.minOutputChars = opts.minOutputChars ?? DEFAULT_MIN_OUTPUT_CHARS;
  }

  score(
    aiOutputText: string,
    references: readonly { readonly excerpt?: string }[],
  ): LexicalGroundingResult {
    const t0 = Date.now();
    const text = aiOutputText.trim();
    if (text.length < this.minOutputChars) {
      return {
        kind: "empty_input",
        reason: "short_text",
        latencyMs: Date.now() - t0,
      };
    }

    const outputTokens = tokenize(text);
    const outputBigrams = bigramsOf(outputTokens);
    if (outputBigrams.size === 0) {
      return {
        kind: "empty_input",
        reason: "no_bigrams",
        latencyMs: Date.now() - t0,
      };
    }

    const refExcerpts: string[] = [];
    for (const ref of references) {
      const ex = ref.excerpt;
      if (typeof ex === "string" && ex.trim().length > 0) {
        refExcerpts.push(ex);
      }
    }
    if (refExcerpts.length === 0) {
      return {
        kind: "empty_input",
        reason: "no_excerpts",
        latencyMs: Date.now() - t0,
      };
    }

    const refBigrams = new Set<string>();
    for (const excerpt of refExcerpts) {
      const refTokens = tokenize(excerpt);
      for (const bg of bigramsOf(refTokens)) {
        refBigrams.add(bg);
      }
    }

    let covered = 0;
    for (const bg of outputBigrams) {
      if (refBigrams.has(bg)) covered += 1;
    }

    const total = outputBigrams.size;
    return {
      kind: "ok",
      score: total === 0 ? 0 : covered / total,
      coveredBigrams: covered,
      totalBigrams: total,
      latencyMs: Date.now() - t0,
    };
  }
}
