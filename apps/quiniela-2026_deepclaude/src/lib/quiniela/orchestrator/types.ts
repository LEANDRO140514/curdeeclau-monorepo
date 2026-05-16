/**
 * MVP ORCHESTRATOR TYPES — Product Loop State Machine
 *
 * Coordinates the flow: analysis → purchase → unlock → compete → telegram → return.
 * All state transitions are pure functions. Zero UI dependencies.
 */

import type { ContestFormatId, ReductionSize } from '../contest/formats'
import type { QuinielaAnalysis, ReductionRecommendation } from '../oraculo/probabilities'
import type { UserEntitlements } from '../entitlements'
import type { SubscriptionTopic } from '../communication/telegram'

// ═══════════════════════════════════════════════════
// PRODUCT LOOP PHASES (6 steps)
// ═══════════════════════════════════════════════════

export type LoopPhase =
  | 'idle'                    // Sin actividad
  | 'analysis'                // Explorando análisis probabilístico
  | 'purchase'                // Eligiendo y comprando reducción
  | 'unlock_private11'        // Private 11 desbloqueado
  | 'compete'                 // Jugando / siguiendo resultados
  | 'telegram_update'         // Recibiendo notificaciones
  | 'return_next_matchday'    // Volviendo para siguiente jornada

export type LoopTransition =
  | 'start_analysis'
  | 'select_reduction'
  | 'confirm_purchase'
  | 'enter_private11'
  | 'lock_picks'
  | 'receive_results'
  | 'next_matchday'

// ═══════════════════════════════════════════════════
// ORCHESTRATOR SESSION STATE
// ═══════════════════════════════════════════════════

export interface OrchestratorState {
  phase: LoopPhase
  userId: string
  currentMatchday: number
  format: ContestFormatId
  /** Active analysis for this session */
  analysis: QuinielaAnalysis | null
  /** Selected reduction */
  selectedReduction: ReductionRecommendation | null
  /** Selected reduction size */
  reductionSize: ReductionSize | null
  /** User entitlements snapshot */
  entitlements: UserEntitlements | null
  /** Has Telegram connected */
  telegramLinked: boolean
  /** Active subscription topics */
  subscriptions: SubscriptionTopic[]
  /** Current loop iteration */
  iteration: number
  /** Session start timestamp */
  startedAt: number
  /** Last transition timestamp */
  lastTransitionAt: number
  /** Transition history for debugging */
  history: LoopTransitionRecord[]
}

export interface LoopTransitionRecord {
  from: LoopPhase
  to: LoopPhase
  transition: LoopTransition
  timestamp: number
  metadata?: Record<string, unknown>
}

// ═══════════════════════════════════════════════════
// ORCHESTRATOR COMMANDS (input)
// ═══════════════════════════════════════════════════

export type OrchestratorCommand =
  | { type: 'INIT_SESSION'; userId: string; format: ContestFormatId; matchday: number }
  | { type: 'REQUEST_ANALYSIS' }
  | { type: 'SELECT_REDUCTION'; size: ReductionSize }
  | { type: 'CONFIRM_PURCHASE' }
  | { type: 'ENTER_PRIVATE11' }
  | { type: 'LOCK_PICKS' }
  | { type: 'RECEIVE_RESULTS'; matchday: number }
  | { type: 'NEXT_MATCHDAY'; matchday: number }
  | { type: 'LINK_TELEGRAM'; chatId: number }
  | { type: 'UPDATE_SUBSCRIPTIONS'; topics: SubscriptionTopic[] }
  | { type: 'RESET' }

// ═══════════════════════════════════════════════════
// ORCHESTRATOR EVENTS (output)
// ═══════════════════════════════════════════════════

export type OrchestratorEvent =
  | { type: 'PHASE_CHANGED'; from: LoopPhase; to: LoopPhase; transition: LoopTransition }
  | { type: 'ANALYSIS_READY'; analysis: QuinielaAnalysis; recommendations: ReductionRecommendation[] }
  | { type: 'REDUCTION_SELECTED'; size: ReductionSize; price: number; savings: number }
  | { type: 'PURCHASE_CONFIRMED'; purchases: number; private11Entries: number }
  | { type: 'PRIVATE11_UNLOCKED'; entries: number }
  | { type: 'PICKS_LOCKED'; matchday: number }
  | { type: 'RESULTS_RECEIVED'; matchday: number; hits: number; won: boolean }
  | { type: 'TELEGRAM_LINKED'; chatId: number }
  | { type: 'TELEGRAM_DISPATCH'; templateKey: string; data: Record<string, unknown> }
  | { type: 'LOOP_COMPLETED'; iteration: number }
  | { type: 'ERROR'; code: string; message: string }

// ═══════════════════════════════════════════════════
// TRANSITION TABLE
// ═══════════════════════════════════════════════════

/** Valid transitions from each phase */
export const VALID_TRANSITIONS: Record<LoopPhase, LoopTransition[]> = {
  idle:               ['start_analysis'],
  analysis:           ['select_reduction', 'start_analysis'],
  purchase:           ['confirm_purchase', 'select_reduction', 'start_analysis'],
  unlock_private11:   ['enter_private11', 'lock_picks'],
  compete:            ['receive_results', 'lock_picks'],
  telegram_update:    ['next_matchday', 'start_analysis'],
  return_next_matchday: ['start_analysis'],
}

/** Target phase for each transition */
export const TRANSITION_TARGET: Record<LoopTransition, LoopPhase> = {
  start_analysis:    'analysis',
  select_reduction:  'purchase',
  confirm_purchase:  'unlock_private11',
  enter_private11:   'compete',
  lock_picks:        'compete',
  receive_results:   'telegram_update',
  next_matchday:     'return_next_matchday',
}

// ═══════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════

export function createOrchestratorState(
  userId: string,
  format: ContestFormatId,
  matchday: number,
): OrchestratorState {
  const now = Date.now()
  return {
    phase: 'idle',
    userId,
    currentMatchday: matchday,
    format,
    analysis: null,
    selectedReduction: null,
    reductionSize: null,
    entitlements: null,
    telegramLinked: false,
    subscriptions: ['all', 'results', 'reminders'],
    iteration: 0,
    startedAt: now,
    lastTransitionAt: now,
    history: [],
  }
}
