/**
 * MVP PRODUCT LOOP — State Machine Implementation
 *
 * Pure functional implementation of the product loop:
 * analysis → purchase → unlock_private11 → compete → telegram_update → return_next_matchday
 */

import type {
  OrchestratorState,
  OrchestratorCommand,
  OrchestratorEvent,
  LoopPhase,
  LoopTransition,
} from './types'
import { VALID_TRANSITIONS, TRANSITION_TARGET } from './types'
import type { ContestFormatId, ReductionSize } from '../contest/formats'
import { getCompatibleReductions } from '../reductions/compatibility'
import { getProduct, getProductPrice } from '../reductions/catalog'
import { createProduct } from '../contest/products'
import { createEntitlements, processPurchase, totalPrivate11Entries } from '../entitlements'
import { quickAnalysis, recommendReductions } from '../oraculo/probabilities'
import type { SubscriptionTopic } from '../communication/telegram'

// ═══════════════════════════════════════════════════
// CORE STATE MACHINE
// ═══════════════════════════════════════════════════

export function dispatch(
  state: OrchestratorState,
  command: OrchestratorCommand,
): [OrchestratorState, OrchestratorEvent[]] {
  switch (command.type) {
    case 'INIT_SESSION':
      return initSession(command.userId, command.format, command.matchday)
    case 'REQUEST_ANALYSIS':
      return requestAnalysis(state)
    case 'SELECT_REDUCTION':
      return selectReduction(state, command.size)
    case 'CONFIRM_PURCHASE':
      return confirmPurchase(state)
    case 'ENTER_PRIVATE11':
      return enterPrivate11(state)
    case 'LOCK_PICKS':
      return lockPicks(state)
    case 'RECEIVE_RESULTS':
      return receiveResults(state, command.matchday)
    case 'NEXT_MATCHDAY':
      return nextMatchday(state, command.matchday)
    case 'LINK_TELEGRAM':
      return linkTelegram(state, command.chatId)
    case 'UPDATE_SUBSCRIPTIONS':
      return updateSubscriptions(state, command.topics)
    case 'RESET':
      return reset()
  }
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function canTransition(phase: LoopPhase, t: LoopTransition): boolean {
  return VALID_TRANSITIONS[phase]?.includes(t) ?? false
}

function applyTransition(
  state: OrchestratorState,
  transition: LoopTransition,
  patch: Partial<OrchestratorState> = {},
): [OrchestratorState, OrchestratorEvent[]] {
  const from = state.phase
  const to = TRANSITION_TARGET[transition]
  const now = Date.now()

  const newState: OrchestratorState = {
    ...state,
    ...patch,
    phase: to,
    lastTransitionAt: now,
    history: [...state.history, { from, to, transition, timestamp: now }],
  }

  return [newState, [{ type: 'PHASE_CHANGED', from, to, transition }]]
}

function error(code: string, message: string): [OrchestratorState, OrchestratorEvent[]] {
  return [null as unknown as OrchestratorState, [{ type: 'ERROR', code, message }]]
}

// ═══════════════════════════════════════════════════
// COMMAND HANDLERS
// ═══════════════════════════════════════════════════

function initSession(
  userId: string,
  format: ContestFormatId,
  matchday: number,
): [OrchestratorState, OrchestratorEvent[]] {
  const now = Date.now()
  const state: OrchestratorState = {
    phase: 'idle',
    userId,
    currentMatchday: matchday,
    format,
    analysis: null,
    selectedReduction: null,
    reductionSize: null,
    entitlements: createEntitlements(),
    telegramLinked: false,
    subscriptions: ['all', 'results', 'reminders', 'private11'],
    iteration: 0,
    startedAt: now,
    lastTransitionAt: now,
    history: [],
  }
  return [state, []]
}

function requestAnalysis(
  state: OrchestratorState,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'start_analysis')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot start analysis from ${state.phase}` }]]
  }

  const analysis = quickAnalysis(state.format)
  const recommendations = recommendReductions(analysis)

  const [next, events] = applyTransition(state, 'start_analysis', { analysis })
  events.push({ type: 'ANALYSIS_READY', analysis, recommendations })
  return [next, events]
}

function selectReduction(
  state: OrchestratorState,
  size: ReductionSize,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'select_reduction')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot select reduction from ${state.phase}` }]]
  }

  const analysis = state.analysis ?? quickAnalysis(state.format)
  const recommendations = recommendReductions(analysis)
  const selected = recommendations.find((r) => r.size === size)

  if (!selected) {
    return [state, [{ type: 'ERROR', code: 'INVALID_REDUCTION', message: `R${size} not available for ${state.format}` }]]
  }

  const price = getProductPrice(size)

  const [next, events] = applyTransition(state, 'select_reduction', {
    selectedReduction: selected,
    reductionSize: size,
  })

  events.push({ type: 'REDUCTION_SELECTED', size, price, savings: selected.estimatedSavings })
  events.push({
    type: 'TELEGRAM_DISPATCH',
    templateKey: 'reduction_selected',
    data: { size, format: state.format, price, savings: selected.estimatedSavings },
  })

  return [next, events]
}

function confirmPurchase(
  state: OrchestratorState,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'confirm_purchase')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot confirm purchase from ${state.phase}` }]]
  }

  if (!state.reductionSize) {
    return [state, [{ type: 'ERROR', code: 'NO_REDUCTION', message: 'No reduction selected' }]]
  }

  const product = createProduct({
    format: state.format,
    reductionSize: state.reductionSize,
    level: 13,
  })

  const entitlements = state.entitlements ?? createEntitlements()
  const updatedEntitlements = processPurchase(entitlements, product)
  const p11Entries = totalPrivate11Entries(updatedEntitlements)

  const [next, events] = applyTransition(state, 'confirm_purchase', { entitlements: updatedEntitlements })

  events.push({
    type: 'PURCHASE_CONFIRMED',
    purchases: updatedEntitlements.purchases.length,
    private11Entries: p11Entries,
  })

  events.push({
    type: 'TELEGRAM_DISPATCH',
    templateKey: 'reduction_purchased',
    data: {
      size: state.reductionSize,
      format: state.format,
      price: product.totalPrice,
      p11_entries: p11Entries,
      revancha_line: '',
      premium_line: '',
    },
  })

  events.push({ type: 'PRIVATE11_UNLOCKED', entries: p11Entries })
  events.push({
    type: 'TELEGRAM_DISPATCH',
    templateKey: 'private11_unlocked',
    data: { entries: p11Entries, prize_pool: '7,500 MXN', participants: '—' },
  })

  return [next, events]
}

function enterPrivate11(
  state: OrchestratorState,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'enter_private11')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot enter P11 from ${state.phase}` }]]
  }

  const [next, events] = applyTransition(state, 'enter_private11')
  events.push({ type: 'TELEGRAM_DISPATCH', templateKey: 'p11_entered', data: {} })
  return [next, events]
}

function lockPicks(
  state: OrchestratorState,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'lock_picks')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot lock picks from ${state.phase}` }]]
  }

  const [next, events] = applyTransition(state, 'lock_picks')
  events.push({ type: 'PICKS_LOCKED', matchday: state.currentMatchday })
  return [next, events]
}

function receiveResults(
  state: OrchestratorState,
  matchday: number,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'receive_results')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot receive results from ${state.phase}` }]]
  }

  const [next, events] = applyTransition(state, 'receive_results', { currentMatchday: matchday })

  events.push({ type: 'RESULTS_RECEIVED', matchday, hits: 0, won: false })
  events.push({
    type: 'TELEGRAM_DISPATCH',
    templateKey: 'results_published',
    data: { matchday, max_hits: 0, winning_columns: 0, prize_message: 'Sin premio esta jornada' },
  })

  return [next, events]
}

function nextMatchday(
  state: OrchestratorState,
  matchday: number,
): [OrchestratorState, OrchestratorEvent[]] {
  if (!canTransition(state.phase, 'next_matchday')) {
    return [state, [{ type: 'ERROR', code: 'INVALID_TRANSITION', message: `Cannot advance matchday from ${state.phase}` }]]
  }

  const [next, events] = applyTransition(state, 'next_matchday', {
    currentMatchday: matchday,
    iteration: state.iteration + 1,
    analysis: null,
    selectedReduction: null,
    reductionSize: null,
  })

  events.push({ type: 'LOOP_COMPLETED', iteration: next.iteration })
  events.push({
    type: 'TELEGRAM_DISPATCH',
    templateKey: 'new_matchday',
    data: {
      matchday,
      format: state.format,
      deadline: '—',
      dangerous: '—',
      volatility: '—',
      headline: 'Nueva jornada disponible',
      analysis_url: '',
    },
  })

  return [next, events]
}

function linkTelegram(
  state: OrchestratorState,
  chatId: number,
): [OrchestratorState, OrchestratorEvent[]] {
  const next: OrchestratorState = { ...state, telegramLinked: true }
  const events: OrchestratorEvent[] = [
    { type: 'TELEGRAM_LINKED', chatId },
    { type: 'TELEGRAM_DISPATCH', templateKey: 'welcome', data: { chatId } },
  ]
  return [next, events]
}

function updateSubscriptions(
  state: OrchestratorState,
  topics: SubscriptionTopic[],
): [OrchestratorState, OrchestratorEvent[]] {
  return [{ ...state, subscriptions: topics }, []]
}

function reset(): [OrchestratorState, OrchestratorEvent[]] {
  return [
    {
      phase: 'idle',
      userId: '',
      currentMatchday: 0,
      format: 'progol_14',
      analysis: null,
      selectedReduction: null,
      reductionSize: null,
      entitlements: null,
      telegramLinked: false,
      subscriptions: [],
      iteration: 0,
      startedAt: Date.now(),
      lastTransitionAt: Date.now(),
      history: [],
    },
    [],
  ]
}

// ═══════════════════════════════════════════════════
// HIGH-LEVEL FLOW HELPERS
// ═══════════════════════════════════════════════════

export function runFullLoop(
  userId: string,
  format: ContestFormatId,
  matchday: number,
  reductionSize: ReductionSize,
): OrchestratorEvent[] {
  const events: OrchestratorEvent[] = []
  let [state] = initSession(userId, format, matchday)

  const commands: OrchestratorCommand[] = [
    { type: 'REQUEST_ANALYSIS' },
    { type: 'SELECT_REDUCTION', size: reductionSize },
    { type: 'CONFIRM_PURCHASE' },
    { type: 'ENTER_PRIVATE11' },
    { type: 'LOCK_PICKS' },
    { type: 'RECEIVE_RESULTS', matchday },
    { type: 'NEXT_MATCHDAY', matchday: matchday + 1 },
  ]

  for (const cmd of commands) {
    const [s, evts] = dispatch(state, cmd)
    state = s
    events.push(...evts)
    // Stop if we hit an error
    if (evts.some((e) => e.type === 'ERROR')) break
  }

  return events
}

export function getLoopPosition(state: OrchestratorState): {
  step: number
  total: number
  label: string
  description: string
  nextAction: string
} {
  const positions: Record<LoopPhase, { step: number; label: string; description: string; nextAction: string }> = {
    idle:               { step: 0, label: 'Inicio', description: 'Sin actividad', nextAction: 'Iniciar análisis' },
    analysis:           { step: 1, label: 'Análisis', description: 'Revisando probabilidades', nextAction: 'Elegir reducción' },
    purchase:           { step: 2, label: 'Compra', description: 'Seleccionando reducción', nextAction: 'Confirmar compra' },
    unlock_private11:   { step: 3, label: 'Desbloqueo', description: 'Private 11 disponible', nextAction: 'Entrar a Private 11' },
    compete:            { step: 4, label: 'Competición', description: 'Jugando la jornada', nextAction: 'Esperar resultados' },
    telegram_update:    { step: 5, label: 'Resultados', description: 'Revisando resultados', nextAction: 'Siguiente jornada' },
    return_next_matchday:{ step: 6, label: 'Siguiente', description: 'Preparando próxima jornada', nextAction: 'Nuevo análisis' },
  }
  const pos = positions[state.phase]
  return { ...pos, total: 6 }
}
