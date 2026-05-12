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

// ─── CAPA DE PRODUCTO (MVP) ───

// Contest — Formats
export {
  PROGOL_14,
  REVANCHA_7,
  MEDIA_SEMANA_9,
  PRIVATE_11,
  CONTEST_FORMATS,
  PRIMARY_FORMATS,
  WEEKEND_FORMATS,
  getFormat,
  isAddon,
  getParentFormats,
  formatSupportsLevel,
} from './contest/formats'
export type {
  ContestFormatId,
  ContestCategory,
  FormatTier,
  ContestFormat,
  ReductionSize,
} from './contest/formats'

// Contest — Products
export {
  createProduct,
  createProgolProduct,
  createPrivate11Product,
  createMediaSemanaProduct,
  isValidProduct,
  validateProduct,
} from './contest/products'
export type {
  ContestAddon,
  ContestProduct,
  ProductConfig,
} from './contest/products'

// Contest — Addons
export {
  REVANCHA_ADDON,
  ADDONS,
  isAddonAvailable,
  canPurchaseAddon,
  getAddonReductions,
  isValidAddonReduction,
  addonPrice,
} from './contest/addons'
export type { AddonType, AddonDefinition } from './contest/addons'

// Contest — Pricing
export {
  calculatePrice,
  calculateSavings,
  createProgolPrivate11Bundle,
  DEFAULT_PROMOTIONS,
} from './contest/pricing'
export type {
  DiscountType,
  Discount,
  PricingConfig,
  Bundle,
  Promotion,
} from './contest/pricing'

// Contest — Rules
export {
  FORMAT_RULES,
  validatePurchase,
  legalDisclaimer,
  probabilityDisclaimer,
  PRODUCT_LOOP_STEPS,
  getNextStep,
} from './contest/rules'
export type {
  FormatRules,
  PurchaseValidation,
  ProductLoopStep,
} from './contest/rules'

// Reductions — Compatibility
export {
  COMPATIBILITY_MATRIX,
  getCompatibleReductions,
  isReductionCompatible,
  getAvailableSizes,
  findEntry,
  allReductionSizes,
} from './reductions/compatibility'
export type { CompatibilityEntry, CompatibilityMatrix } from './reductions/compatibility'

// Reductions — Catalog
export {
  REDUCTION_CATALOG,
  getProduct,
  getProductsForFormat,
  getProductsByIntensity,
  getProductPrice,
  getIntensity,
  getBenefits,
} from './reductions/catalog'
export type {
  ReductionIntensity,
  ReductionBenefits,
  ReductionProduct,
} from './reductions/catalog'

// Entitlements
export {
  createEntitlements,
  processPurchase,
  addPrivate11Entries,
  totalPrivate11Entries,
  canAccess,
  hasPurchased,
  totalSpent,
  maxIntensity,
} from './entitlements'
export type { UserEntitlements, PurchaseRecord } from './entitlements'

// Oráculo — Probabilities
export {
  analyzeMatch,
  analyzeQuiniela,
  quickAnalysis,
  recommendReductions,
  suggestConfig,
} from './oraculo/probabilities'
export type {
  MatchAnalysis,
  QuinielaAnalysis,
  ReductionRecommendation,
} from './oraculo/probabilities'

// Oráculo — Public Analysis
export {
  generatePublicAnalysis,
  compareReductions,
} from './oraculo/analysis'
export type {
  PublicMatchCard,
  PublicJornadaAnalysis,
  PublicReductionCard,
} from './oraculo/analysis'

// Communication — Telegram
export {
  SYSTEM_EVENTS,
  TELEGRAM_TEMPLATES,
  defaultSubscription,
  createTelegramDispatcher,
} from './communication/telegram'
export type {
  EventCategory,
  EventPriority,
  TelegramEvent,
  TelegramTemplate,
  SubscriptionTopic,
  UserSubscription,
  TelegramDispatcher,
} from './communication/telegram'
