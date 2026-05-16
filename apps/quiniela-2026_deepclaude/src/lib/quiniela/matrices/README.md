# Matrices de Reducción Oficiales

## Estado: PENDIENTE DE INTEGRACIÓN

## Qué falta

Las reducciones oficiales de Progol / La Quiniela usan **matrices predefinidas** de columnas.  
No se generan algorítmicamente — se obtienen de tablas oficiales.

Para cada reducción del catálogo (12 en total), necesitamos:

1. **Las columnas específicas** que componen la reducción
2. **La fuente** (organismo oficial, año de publicación)

## Formato esperado

Cada archivo de matriz debe exportar un `MatrizReduccion`:

```typescript
import type { MatrizReduccion, Columna } from '../types'

export const matrizReduccion1: MatrizReduccion = {
  meta: { id: 1, nombre: '...', triples: 4, dobles: 0, columnasRequeridas: 9, nivel: 13 },
  columnas: [
    ['1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
    ['X','1','1','1','X','1','1','X','X','1','1','1','X','1'],
    // ... 9 columnas total
  ],
  fuente: 'Loterías y Apuestas del Estado, Tabla Oficial 2024',
}
```

Las columnas usan POSICIONES para indicar qué signo del usuario va en cada lugar:
- `'1'` = primer signo del doble/triple del usuario
- `'X'` = segundo signo
- `'2'` = tercer signo (solo triples)

## Dónde conseguir las matrices

- **España**: Loterías y Apuestas del Estado publica tablas oficiales de reducidas
- **México**: Progol publica tablas de reducciones autorizadas
- **Covering designs**: Literatura matemática (Steiner systems, covering numbers)

## Referencia técnica

El problema matemático se llama **"covering design"** o **"lotto design"**:
- Dados 14 partidos con T triples y D dobles (V = 3^T × 2^D combinaciones)
- Encontrar el mínimo número de columnas que garantizan al menos N aciertos
- Es un problema NP-hard; las matrices se precalculan con búsqueda computacional
