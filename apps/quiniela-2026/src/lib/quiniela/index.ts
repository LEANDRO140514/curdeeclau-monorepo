/**
 * Baril de exportación del motor de quiniela.
 * Importa desde aquí para acceder a todo el motor.
 */

// Tipos
export type {
  Signo,
  NivelGarantia,
  Columna,
  ConfigUsuario,
  ConteoSignos,
  ResultadoDirecto,
  ReduccionMeta,
  MatrizReduccion,
  EstadoMotor,
} from './types'

// Engine — Validación
export {
  TOTAL_PARTIDOS,
  PRECIO_POR_COLUMNA,
  TOTAL_COLUMNAS_UNIVERSO,
  validarConfig,
  contarSignos,
} from './engine/validate'

// Engine — Pricing
export {
  calcularPresupuestoDirecto,
  esViable,
  calcPremios,
} from './engine/pricing'

// Engine — Directa
export {
  generarDirecta,
  generarPorLotes,
} from './engine/direct'

// Engine — Reducciones
export {
  CATALOGO_REDUCCIONES,
  esCompatible,
  reduccionesCompatibles,
  estadoMotor,
  obtenerColumnasReduccion,
  calcularAhorroReduccion,
} from './engine/reductions'

// Matrices — Registro
export {
  REGISTRO_MATRICES,
  matricesIntegradas,
  matricesPendientes,
} from './matrices/oficiales'

// Matrices — Datos (patrones reales)
export {
  PATRONES_MATRICES,
  matricesConDatos,
  intentarGreedy,
} from './matrices/data'
export type { MatrizPatron } from './matrices/data'

// ─── NUEVA ARQUITECTURA PACKED ───

// Matrices — Schema (tipos + constantes)
export {
  SIGNO_A_BITS,
  BITS_A_SIGNO,
  BITS_POR_POSICION,
  TOTAL_POSICIONES as POSICIONES_POR_COLUMNA,
  MASCARA_POSICION,
  MASCARA_28BITS,
  POPCOUNT_PARES,
} from './matrices/schema'
export type {
  PackedColumna,
  PackedMatriz,
  PackedMatrizMeta,
  ValidacionMatriz,
  BenchmarkResultado,
} from './matrices/schema'

// Matrices — Packer (pack/unpack + bit ops)
export {
  packColumna,
  unpackColumna,
  unpackPosicion,
  bitsASigno,
  packMatriz,
  packDesdePatron,
  unpackMatriz,
  hammingDistancia,
  aciertos as aciertosPacked,
  cumpleGarantia as cumpleGarantiaPacked,
  aciertosVector,
  packDesdeSignos,
  unpackASignos,
  esPackedValido,
  clonarMatriz,
} from './matrices/packer'

// Matrices — Validators
export {
  validarColumnas,
  validarDuplicados,
  validarCobertura,
  validarMetadatos,
  validarMatriz,
} from './matrices/validators'

// Matrices — Loaders
export {
  cargarMatrizEmbebida,
  cargarMatrizRemota,
  cargarTodasEmbebidas,
  obtenerMatrizCache,
  guardarMatrizCache,
  limpiarCache,
} from './matrices/loaders'
export type { CargaMatriz } from './matrices/loaders'

// Matrices — Compression
export {
  serializarMatriz,
  deserializarMatriz,
  aBase64,
  desdeBase64,
  estadisticasTamaño,
} from './matrices/compression'

// Matrices — Metadata
export {
  CATALOGO_METADATA,
  obtenerMeta,
  porNivel,
  resumenIntegracion,
} from './matrices/metadata'

// Matrices — Benchmark
export {
  ejecutarBenchmark,
  imprimirBenchmark,
} from './matrices/benchmark'
export type { ResultadosBenchmark } from './matrices/benchmark'

// Algoritmos — Cobertura
export {
  aciertosColumna,
  aciertosPorColumna,
  cumpleGarantia,
  configCubreResultado,
  tasaCobertura,
} from './algorithms/coverage'
export type { ResultadoReal } from './algorithms/coverage'

// Algoritmos — Set Cover (stubs)
export {
  cotaSchonheim,
} from './algorithms/setCover'
export type { CoveringProblem, CoveringSolution } from './algorithms/setCover'

// Algoritmos — Heurísticas
export {
  filtrarPorFrecuencia,
  scoreDiversidad,
  ordenarPorDiversidad,
  topNDiversas,
  distanciaHamming,
  estadisticasConfig,
} from './algorithms/heuristics'

// ─── CAPA PROBABILÍSTICA + EV ───

// Probabilities — Schema (tipos + constantes)
export {
  BASE_PROBABILITIES,
  UNIFORM_PROBABILITIES,
  PRIZE_DISTRIBUTION,
  COST_PER_COLUMN,
  TOTAL_UNIVERSE,
} from './probabilities/schema'
export type {
  MatchProbabilities,
  ProbabilitySource,
  CalibrationMeta,
  CalibratedMatch,
  ColumnProbability,
  MatrixProbabilities,
  PayoutEstimate,
  EVResult,
  MatrixEV,
  RankingCriterion,
  CompositeWeights,
  RankedColumn,
  SimulationConfig,
  SimulatedDraw,
  SimulationResult,
  SignFrequencies,
  FrequencyComparison,
  HistoricalResult,
  MatchOdds,
  HistoricalDataset,
  OddsDataset,
  DatasetLoader,
} from './probabilities/schema'

// Probabilities — Validation
export {
  isValidMatchProbabilities,
  normalizeProbabilities,
  laplaceSmooth,
  validateMatchProbabilitiesArray,
  oddsToProbabilities,
  entropy as entropyProbabilidad,
  klDivergence,
} from './probabilities/validation'

// Probabilities — Models
export {
  uniformModel,
  baseRateModel,
  empiricalModel,
  laplaceModel,
  oddsModel,
  bayesianModel,
  uniformAll,
  baseRateAll,
  fromCountsMatrix,
  fromOddsMatrix,
} from './probabilities/models'

// Probabilities — Column
export {
  columnProbability,
  columnProbabilityFast,
  buildLookup,
  matrixProbabilities,
  matrixProbabilitiesFast,
} from './probabilities/column'

// Probabilities — Statistics
export {
  countSignFrequencies,
  countSignFrequenciesPacked,
  expectedFrequencies,
  expectedBaseFrequencies,
  compareFrequencies,
  columnDiversity,
  averageDiversity,
  summarizeMatrix,
} from './probabilities/statistics'

// Probabilities — Payout
export {
  estimateFixedPool,
  estimateWinners,
  estimatePayoutPerWinner,
  estimateHitProbabilities,
  expectedPayoutForColumn,
  generatePayoutEstimates,
  historicalPayoutEstimates,
  HISTORICAL_AVERAGE_PRIZES,
} from './probabilities/payout'

// Probabilities — EV
export {
  calculateEV,
  calculateEVPerColumn,
  calculateMatrixEV,
  quickEV,
  quickEVMatrix,
} from './probabilities/ev'

// Probabilities — Ranking
export {
  rankComposite,
  rankByProbability,
  rankByEV,
  rankByDiversity,
  topN,
  filterByMinDistance,
} from './probabilities/ranking'

// Probabilities — Simulation
export {
  generateRandomResult,
  generateUniformResult,
  simulateDraw,
  runSimulation,
  quickSimulation,
  estimateROI,
} from './probabilities/simulation'
export type { PayoutPolicy } from './probabilities/simulation'

// Probabilities — Datasets
export {
  isValidHistoricalResult,
  isValidMatchOdds,
  validateHistoricalDataset,
  validateOddsDataset,
  aggregateFrequencies,
  frequenciesToProbabilities,
  calibrateFromDataset,
  createHistoricalLoader,
  createOddsLoader,
  REFERENCE_FREQUENCIES,
} from './probabilities/datasets'
