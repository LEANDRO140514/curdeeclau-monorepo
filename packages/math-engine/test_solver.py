"""
Tests para el solver de covering designs.
Ejecutar: pytest test_solver.py -v
"""

from solver import CoveringSolver


def test_casos_triviales():
    """Casos triviales que cualquier solver debe resolver."""
    s = CoveringSolver(timeout_segundos=30)

    # 1 triple sin fallos → 3 columnas (una por signo)
    sol = s.resolver(triples=1, dobles=0, fallos_permitidos=0)
    assert sol.columnas_encontradas == 3
    assert sol.optimalidad == "optimo"

    # 1 doble sin fallos → 2 columnas (una por signo)
    sol = s.resolver(triples=0, dobles=1, fallos_permitidos=0)
    assert sol.columnas_encontradas == 2
    assert sol.optimalidad == "optimo"

    # 2 dobles sin fallos → 4 columnas
    sol = s.resolver(triples=0, dobles=2, fallos_permitidos=0)
    assert sol.columnas_encontradas == 4
    assert sol.optimalidad == "optimo"

    # 1 doble con 1 fallo permitido → 1 columna (cualquier columna cubre)
    sol = s.resolver(triples=0, dobles=1, fallos_permitidos=1)
    assert sol.columnas_encontradas == 1


def test_hamming_ternario():
    """4 triples con 1 fallo: debe encontrar el código de Hamming ternario (9 cols)."""
    s = CoveringSolver(timeout_segundos=60)
    sol = s.resolver(triples=4, dobles=0, fallos_permitidos=1)
    assert sol.columnas_encontradas == 9
    assert sol.optimalidad in ("optimo", "factible")


def test_hamming_binario():
    """7 dobles con 1 fallo: debe encontrar el código Hamming(7,4) (16 cols)."""
    s = CoveringSolver(timeout_segundos=60)
    sol = s.resolver(triples=0, dobles=7, fallos_permitidos=1)
    assert sol.columnas_encontradas == 16
    assert sol.optimalidad in ("optimo", "factible")


def test_3t3d():
    """3 triples + 3 dobles con 1 fallo: 24 columnas (según tabla LAE)."""
    s = CoveringSolver(timeout_segundos=120)
    sol = s.resolver(triples=3, dobles=3, fallos_permitidos=1, max_columnas=24)
    assert sol.columnas_encontradas <= 24


def test_verifica_cobertura():
    """Verifica que la solución realmente cubra todos los resultados."""
    s = CoveringSolver(timeout_segundos=60)
    sol = s.resolver(triples=4, dobles=0, fallos_permitidos=1)

    # Enumerar los 81 resultados y verificar cobertura
    columnas = sol.columnas
    resultados = s._enumerar_resultados(4, 0)

    for r in resultados:
        cubierto = False
        for col in columnas:
            aciertos = sum(1 for i in range(4) if col[i] == r[i])
            if aciertos >= 3:  # 4 - 1 fallo = 3 aciertos
                cubierto = True
                break
        assert cubierto, f"Resultado {r} no cubierto"


def test_api_catalog():
    """Verifica que el catálogo de la API tenga 12 reducciones."""
    from main import CATALOGO
    assert len(CATALOGO) == 12
    for r in CATALOGO:
        assert 1 <= r.id <= 12
        assert r.nivel_global in (11, 12, 13)
        assert r.triples + r.dobles > 0
