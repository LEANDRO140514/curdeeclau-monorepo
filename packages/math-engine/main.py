"""
API REST para el motor matemático de covering designs.

Endpoints:
  POST /solve       — Resolver un covering design
  GET  /health      — Health check
  GET  /catalog     — Catálogo de reducciones soportadas
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from solver import CoveringSolver, CoveringSolution

app = FastAPI(
    title="Math Engine — Covering Design Solver",
    description="Resuelve covering designs para reducciones de quiniela usando OR-Tools CP-SAT.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

solver = CoveringSolver(timeout_segundos=300)


class SolveRequest(BaseModel):
    triples: int = Field(ge=0, le=14, description="Número de posiciones triples (base 3)")
    dobles: int = Field(ge=0, le=14, description="Número de posiciones dobles (base 2)")
    fallos_permitidos: int = Field(
        ge=1, le=3,
        description="Máximo de fallos permitidos (1=nivel 13, 2=nivel 12, 3=nivel 11)"
    )
    max_columnas: int | None = Field(
        default=None, ge=1,
        description="Cota superior conocida (ej: de tablas oficiales LAE)"
    )


class SolveResponse(BaseModel):
    triples: int
    dobles: int
    fallos_permitidos: int
    columnas_encontradas: int
    columnas: list[list[int]]
    tiempo_segundos: float
    optimalidad: str
    cota_inferior: int | None = None
    mensaje: str


class ReduccionCatalogo(BaseModel):
    id: int
    nombre: str
    triples: int
    dobles: int
    nivel_global: int
    columnas_oficiales: int
    fallos_permitidos: int


CATALOGO = [
    ReduccionCatalogo(id=1,  nombre="4 Triples",            triples=4, dobles=0,  nivel_global=13, columnas_oficiales=9,   fallos_permitidos=1),
    ReduccionCatalogo(id=2,  nombre="7 Dobles",              triples=0, dobles=7,  nivel_global=13, columnas_oficiales=16,  fallos_permitidos=1),
    ReduccionCatalogo(id=3,  nombre="3T + 3D",               triples=3, dobles=3,  nivel_global=13, columnas_oficiales=24,  fallos_permitidos=1),
    ReduccionCatalogo(id=4,  nombre="2T + 6D",               triples=2, dobles=6,  nivel_global=13, columnas_oficiales=64,  fallos_permitidos=1),
    ReduccionCatalogo(id=5,  nombre="8 Triples",             triples=8, dobles=0,  nivel_global=13, columnas_oficiales=81,  fallos_permitidos=1),
    ReduccionCatalogo(id=6,  nombre="11 Dobles",             triples=0, dobles=11, nivel_global=13, columnas_oficiales=132, fallos_permitidos=1),
    ReduccionCatalogo(id=7,  nombre="5T + 4D",               triples=5, dobles=4,  nivel_global=12, columnas_oficiales=192, fallos_permitidos=2),
    ReduccionCatalogo(id=8,  nombre="3T + 8D",               triples=3, dobles=8,  nivel_global=12, columnas_oficiales=216, fallos_permitidos=2),
    ReduccionCatalogo(id=9,  nombre="6T + 2D",               triples=6, dobles=2,  nivel_global=12, columnas_oficiales=288, fallos_permitidos=2),
    ReduccionCatalogo(id=10, nombre="4T + 6D",               triples=4, dobles=6,  nivel_global=11, columnas_oficiales=432, fallos_permitidos=3),
    ReduccionCatalogo(id=11, nombre="7T + 3D",               triples=7, dobles=3,  nivel_global=11, columnas_oficiales=648, fallos_permitidos=3),
    ReduccionCatalogo(id=12, nombre="10D + 1T",              triples=1, dobles=10, nivel_global=11, columnas_oficiales=512, fallos_permitidos=3),
]


@app.get("/health")
def health():
    return {"status": "ok", "solver": "OR-Tools CP-SAT"}


@app.get("/catalog")
def catalog() -> list[ReduccionCatalogo]:
    return CATALOGO


@app.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest):
    if req.triples + req.dobles == 0:
        raise HTTPException(status_code=400, detail="Al menos un triple o doble requerido")
    if req.triples + req.dobles > 14:
        raise HTTPException(status_code=400, detail="Máximo 14 posiciones totales")

    solution = solver.resolver(
        triples=req.triples,
        dobles=req.dobles,
        fallos_permitidos=req.fallos_permitidos,
        max_columnas=req.max_columnas,
    )

    return SolveResponse(
        triples=solution.triples,
        dobles=solution.dobles,
        fallos_permitidos=solution.fallos_permitidos,
        columnas_encontradas=solution.columnas_encontradas,
        columnas=solution.columnas,
        tiempo_segundos=solution.tiempo_segundos,
        optimalidad=solution.optimalidad,
        cota_inferior=solution.cota_inferior,
        mensaje=solution.mensaje,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
