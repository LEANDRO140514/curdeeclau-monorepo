"""
Solucionador de Covering Designs para reducciones de quiniela.

Usa OR-Tools CP-SAT para encontrar conjuntos mínimos de columnas
que garanticen N aciertos dados T triples y D dobles.

Problema formal:
  Dados T posiciones con alfabeto {0,1,2} y D posiciones con alfabeto {0,1},
  encontrar el mínimo conjunto C de tuplas (T+D)-dimensionales tal que
  para toda tupla r en el espacio de resultados {0,1,2}^T × {0,1}^D,
  existe c ∈ C con aciertos(c, r) ≥ T+D - E, donde E son los fallos permitidos.

NP-hard. CP-SAT es adecuado para T+D ≤ 10 (espacio de búsqueda ≤ ~60k).
Para problemas más grandes se necesitan metaheurísticas.
"""

from ortools.sat.python import cp_model
import time
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class CoveringSolution:
    triples: int
    dobles: int
    fallos_permitidos: int
    columnas_encontradas: int
    columnas: list[list[int]]  # Cada columna: T valores {0,1,2} + D valores {0,1}
    tiempo_segundos: float
    optimalidad: str  # "optimo" | "factible" | "timeout" | "infactible"
    cota_inferior: Optional[int] = None
    mensaje: str = ""


class CoveringSolver:
    """
    Solver CP-SAT para covering designs mixtos (triples base-3 + dobles base-2).

    Enfoque: formulación como problema de set covering con selección de columnas.
    - Variable binaria x_c para cada columna candidata c
    - Restricción: para cada resultado r, al menos una x_c = 1 donde c cubre r
    - Objetivo: minimizar Σ x_c
    """

    def __init__(self, timeout_segundos: int = 120):
        self.timeout = timeout_segundos

    def resolver(
        self,
        triples: int,
        dobles: int,
        fallos_permitidos: int,
        max_columnas: Optional[int] = None,
    ) -> CoveringSolution:
        """
        Encuentra un covering design para T triples + D dobles
        con E fallos permitidos (E = T+D - aciertos_requeridos).

        Args:
            triples: Número de posiciones triples (alfabeto {0,1,2})
            dobles: Número de posiciones dobles (alfabeto {0,1})
            fallos_permitidos: Máximo número de fallos por columna
            max_columnas: Límite superior conocido (ej: de tablas oficiales)
        """
        inicio = time.monotonic()
        p = triples + dobles  # total de posiciones variables
        aciertos_requeridos = p - fallos_permitidos

        # ── Enumerar espacio de resultados ──
        total_resultados = (3 ** triples) * (2 ** dobles)
        if total_resultados > 100_000:
            return CoveringSolution(
                triples=triples, dobles=dobles, fallos_permitidos=fallos_permitidos,
                columnas_encontradas=0, columnas=[], tiempo_segundos=time.monotonic() - inicio,
                optimalidad="timeout",
                mensaje=f"Espacio de resultados demasiado grande: {total_resultados} > 100k. Usar heurísticas."
            )

        resultados = self._enumerar_resultados(triples, dobles)

        # ── Enumerar columnas candidatas ──
        total_columnas = total_resultados  # Toda columna posible
        if total_columnas > 20_000:
            return CoveringSolution(
                triples=triples, dobles=dobles, fallos_permitidos=fallos_permitidos,
                columnas_encontradas=0, columnas=[], tiempo_segundos=time.monotonic() - inicio,
                optimalidad="timeout",
                mensaje=f"Demasiadas columnas candidatas: {total_columnas} > 20k. Usar generación por columnas."
            )

        # ── Precomputar cobertura ──
        # cubre[c][r] = True si la columna c cubre el resultado r
        cobertura = self._precomputar_cobertura(
            triples, dobles, total_columnas, resultados, aciertos_requeridos
        )

        # ── Modelo CP-SAT ──
        model = cp_model.CpModel()

        # Variables: x[c] = 1 si seleccionamos la columna c
        x = [model.NewBoolVar(f"col_{c}") for c in range(total_columnas)]

        # Restricciones: cada resultado debe estar cubierto
        for r in range(len(resultados)):
            columnas_que_cubren = [c for c in range(total_columnas) if cobertura[c][r]]
            if not columnas_que_cubren:
                return CoveringSolution(
                    triples=triples, dobles=dobles, fallos_permitidos=fallos_permitidos,
                    columnas_encontradas=0, columnas=[], tiempo_segundos=time.monotonic() - inicio,
                    optimalidad="infactible",
                    mensaje=f"Resultado {r} no cubrible con {fallos_permitidos} fallos."
                )
            model.AddBoolOr([x[c] for c in columnas_que_cubren])

        # Objetivo: minimizar número de columnas
        model.Minimize(sum(x))

        # ── Resolver ──
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.timeout
        solver.parameters.log_search_progress = False
        solver.parameters.num_workers = 8

        if max_columnas is not None:
            # Dar una pista al solver: sabemos que existe solución con N columnas
            model.Add(sum(x) <= max_columnas)

        status = solver.Solve(model)

        tiempo = time.monotonic() - inicio

        if status == cp_model.OPTIMAL:
            columnas_seleccionadas = self._extraer_columnas(
                x, solver, triples, dobles, total_columnas
            )
            return CoveringSolution(
                triples=triples, dobles=dobles, fallos_permitidos=fallos_permitidos,
                columnas_encontradas=len(columnas_seleccionadas),
                columnas=columnas_seleccionadas,
                tiempo_segundos=tiempo,
                optimalidad="optimo",
                cota_inferior=len(columnas_seleccionadas),
                mensaje=f"Solución óptima: {len(columnas_seleccionadas)} columnas."
            )
        elif status == cp_model.FEASIBLE:
            columnas_seleccionadas = self._extraer_columnas(
                x, solver, triples, dobles, total_columnas
            )
            return CoveringSolution(
                triples=triples, dobles=dobles, fallos_permitidos=fallos_permitidos,
                columnas_encontradas=len(columnas_seleccionadas),
                columnas=columnas_seleccionadas,
                tiempo_segundos=tiempo,
                optimalidad="factible",
                cota_inferior=solver.BestObjectiveBound(),
                mensaje=f"Solución factible: {len(columnas_seleccionadas)} columnas (cota inf: {solver.BestObjectiveBound()})."
            )
        else:
            return CoveringSolution(
                triples=triples, dobles=dobles, fallos_permitidos=fallos_permitidos,
                columnas_encontradas=0, columnas=[],
                tiempo_segundos=tiempo,
                optimalidad="timeout",
                mensaje=f"No se encontró solución en {self.timeout}s."
            )

    def _enumerar_resultados(self, triples: int, dobles: int) -> list[list[int]]:
        """Genera todos los resultados posibles en {0,1,2}^T × {0,1}^D."""
        total = (3 ** triples) * (2 ** dobles)
        resultados = []
        for n in range(total):
            r = []
            resto = n
            for _ in range(dobles):
                r.append(resto % 2)
                resto //= 2
            for _ in range(triples):
                r.append(resto % 3)
                resto //= 3
            resultados.append(r)
        return resultados

    def _columna_desde_indice(self, idx: int, triples: int, dobles: int) -> list[int]:
        """Convierte un índice lineal en una columna (T+D)-dimensional."""
        col = []
        resto = idx
        for _ in range(dobles):
            col.append(resto % 2)
            resto //= 2
        for _ in range(triples):
            col.append(resto % 3)
            resto //= 3
        return col

    def _precomputar_cobertura(
        self,
        triples: int,
        dobles: int,
        total_columnas: int,
        resultados: list[list[int]],
        aciertos_requeridos: int,
    ) -> list[list[bool]]:
        """Precomputa matriz de cobertura columna × resultado."""
        p = triples + dobles
        cobertura: list[list[bool]] = []

        for c in range(total_columnas):
            col = self._columna_desde_indice(c, triples, dobles)
            cubre_r: list[bool] = []
            for r in resultados:
                aciertos = sum(1 for i in range(p) if col[i] == r[i])
                cubre_r.append(aciertos >= aciertos_requeridos)
            cobertura.append(cubre_r)

        return cobertura

    def _extraer_columnas(
        self,
        x: list[cp_model.IntVar],
        solver: cp_model.CpSolver,
        triples: int,
        dobles: int,
        total_columnas: int,
    ) -> list[list[int]]:
        """Extrae las columnas seleccionadas de la solución."""
        columnas = []
        for c in range(total_columnas):
            if solver.BooleanValue(x[c]):
                columnas.append(self._columna_desde_indice(c, triples, dobles))
        return columnas


# ─── Instancia global ───
solver = CoveringSolver(timeout_segundos=300)
