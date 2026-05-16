/**
 * AGENT ARCHITECTURE — ATLAS | ORÁCULO | HERMES | IRIS
 *
 * Aligned with OpenSpec Plataforma Mundial 2026 (Section 7).
 * Contracts and interfaces for the 4-agent system.
 *
 * Principle:
 * - HERMES defines (rules, schedule, config)
 * - ATLAS decides (picks, settlement, scoring)
 * - ORÁCULO interprets (probabilities, recommendations)
 * - IRIS distributes (notifications, Telegram, push, email)
 */

import type { SurvivorRuleset, TournamentWindow, SurvivorEntry, SurvivorPick, UsedTeam, LifeEvent, PickValidation, LeaderboardRow, LeaderboardScope } from '../survivor/types'
import type { MatchProbabilities } from '../probabilities/schema'
import type { QuinielaAnalysis, ReductionRecommendation, MatchAnalysis } from '../oraculo/probabilities'
import type { ContestFormatId, ReductionSize } from '../contest/formats'
import type { TelegramEvent, TelegramTemplate, UserSubscription, SubscriptionTopic } from './telegram'

// ═══════════════════════════════════════════════════
// ATLAS — Game Engine
// ═══════════════════════════════════════════════════

export interface AtlasContracts {
  // Pick management
  validatePick(entry: SurvivorEntry, window: TournamentWindow, teamId: string, usedTeams: UsedTeam[], eligibleTeamIds: string[]): PickValidation
  submitPick(entry: SurvivorEntry, window: TournamentWindow, teamId: string): { pick: SurvivorPick; events: DomainEvent[] }
  lockPick(pick: SurvivorPick): { pick: SurvivorPick; events: DomainEvent[] }

  // Window management
  openWindow(window: TournamentWindow): { window: TournamentWindow; events: DomainEvent[] }
  lockWindow(window: TournamentWindow): { window: TournamentWindow; events: DomainEvent[] }
  settleWindow(window: TournamentWindow, entryResults: Array<{ entryId: string; pickId: string; outcome: 'win' | 'draw' | 'loss' | 'void' }>): { entries: SurvivorEntry[]; lifeEvents: LifeEvent[]; events: DomainEvent[] }

  // Life management
  applyLifeEvent(entry: SurvivorEntry, event: LifeEvent): { entry: SurvivorEntry; events: DomainEvent[] }
  transitionToSpectator(entry: SurvivorEntry): { entry: SurvivorEntry; events: DomainEvent[] }

  // Leaderboard
  generateLeaderboard(tournamentId: string, scope: LeaderboardScope, scopeId?: string): LeaderboardRow[]
  cacheLeaderboardTopN(tournamentId: string, scope: LeaderboardScope, n: number): void

  // Entry management
  createEntry(userId: string, tournamentId: string, ruleset: SurvivorRuleset): SurvivorEntry
  getEntryStatus(entryId: string): SurvivorEntry
}

// ═══════════════════════════════════════════════════
// ORÁCULO — Intelligence Layer
// ═══════════════════════════════════════════════════

export interface OraculoContracts {
  // Analysis
  analyzeMatch(index: number, homeTeam: string, awayTeam: string, probabilities: MatchProbabilities): MatchAnalysis
  analyzeWindow(teams: Array<{ id: string; name: string; fifaCode: string }>, matches: Array<{ homeTeamId: string; awayTeamId: string; probabilities: MatchProbabilities }>): QuinielaAnalysis

  // Recommendations
  recommendReductions(analysis: QuinielaAnalysis): ReductionRecommendation[]
  recommendTeams(windowAnalysis: QuinielaAnalysis, usedTeams: string[]): Array<{ teamId: string; score: number; risk: 'low' | 'medium' | 'high'; reason: string }>

  // Strategic planning
  suggestStrategy(entry: SurvivorEntry, remainingWindows: TournamentWindow[], usedTeams: UsedTeam[]): {
    conservative: string[]
    balanced: string[]
    aggressive: string[]
  }

  // Public content
  generatePublicInsight(windowId: string): { headline: string; body: string; disclaimer: string }
  compareHumanVsAI(windowId: string): { aiPick: string; communityPick: string; accuracy: number }

  // Premium
  getPremiumInsights(entryId: string, windowId: string): { depth: number; scenarios: string[]; opportunityCost: Record<string, number> }
}

// ═══════════════════════════════════════════════════
// HERMES — Rules, Schedule & OpenSpec
// ═══════════════════════════════════════════════════

export interface HermesContracts {
  // Tournament config
  getRuleset(tournamentId: string): SurvivorRuleset
  publishRuleset(tournamentId: string, ruleset: SurvivorRuleset): SurvivorRuleset

  // Window schedule
  defineWindows(tournamentId: string, phases: Array<{ stage: string; matches: Array<{ homeTeamId: string; awayTeamId: string; startsAt: number }> }>): TournamentWindow[]
  validateWindowSchedule(windows: TournamentWindow[]): { valid: boolean; issues: string[] }

  // Eligibility
  getEligibleTeams(window: TournamentWindow): string[]
  isTeamEligible(teamId: string, window: TournamentWindow): boolean

  // OpenSpec
  getOpenSpec(tournamentId: string): {
    tournament: { slug: string; edition: number; sport: string }
    ruleset: SurvivorRuleset
    windows: TournamentWindow[]
    publishedAt: number
    version: string
  }
  versionOpenSpec(spec: Record<string, unknown>): { version: string; hash: string }
  freezeOpenSpec(tournamentId: string): { version: string; frozenAt: number }

  // Calendar
  getMatchdaySchedule(tournamentId: string): Array<{ date: string; matches: number; windowId: string }>
  getNextLockTime(tournamentId: string): number | null
}

// ═══════════════════════════════════════════════════
// IRIS — Messaging & Notifications
// ═══════════════════════════════════════════════════

export interface IrisContracts {
  // Dispatch
  sendMessage(userId: string, templateKey: string, data: Record<string, unknown>): Promise<{ sent: boolean; messageId?: string }>
  broadcastMessages(userIds: string[], templateKey: string, data: Record<string, unknown>): Promise<number>

  // Scheduling
  scheduleReminder(userId: string, templateKey: string, scheduledFor: number, data: Record<string, unknown>): { jobId: string }
  cancelScheduled(jobId: string): void

  // Telegram
  linkTelegram(userId: string, telegramUserId: number): Promise<void>
  handleWebhook(payload: unknown): Promise<void>

  // Subscriptions
  getSubscriptions(userId: string): UserSubscription
  updateSubscriptions(userId: string, topics: SubscriptionTopic[]): UserSubscription

  // Templates
  renderTemplate(templateKey: string, data: Record<string, unknown>, channel: 'telegram' | 'push' | 'email'): string
  getTemplate(templateKey: string): TelegramTemplate | null

  // Deduplication
  shouldSend(userId: string, templateKey: string, dedupeKey: string): boolean
}

// ═══════════════════════════════════════════════════
// DOMAIN EVENT BUS
// ═══════════════════════════════════════════════════

export type DomainEventType =
  // ATLAS events
  | 'pick_submitted'
  | 'pick_confirmed'
  | 'pick_locked'
  | 'pick_settled'
  | 'window_opened'
  | 'window_locked'
  | 'window_settled'
  | 'entry_created'
  | 'entry_eliminated'
  | 'entry_spectator'
  | 'life_event'
  | 'leaderboard_updated'
  // ORÁCULO events
  | 'analysis_generated'
  | 'insight_published'
  | 'recommendation_ready'
  | 'comparison_generated'
  // HERMES events
  | 'ruleset_published'
  | 'windows_defined'
  | 'spec_frozen'
  | 'schedule_updated'
  // IRIS events
  | 'message_sent'
  | 'message_failed'
  | 'telegram_linked'
  | 'reminder_scheduled'
  | 'subscription_updated'
  // System events
  | 'tournament_started'
  | 'tournament_completed'
  | 'phase_transitioned'

export interface DomainEvent {
  id: string
  type: DomainEventType
  aggregateType: 'atlas' | 'oraculo' | 'hermes' | 'iris' | 'system'
  aggregateId: string
  tournamentId: string | null
  payload: Record<string, unknown>
  occurredAt: number
  correlationId: string | null
  causationId: string | null
  version: number
}

export type EventHandler = (event: DomainEvent) => Promise<void>

export interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(eventType: DomainEventType, handler: EventHandler): () => void
  unsubscribe(subscriptionId: string): void
}

/**
 * Simple in-memory event bus implementation.
 * Production should use Redis Pub/Sub or similar.
 */
type SubEntry = { id: string; handler: EventHandler }

function removeSubscription(
  map: Map<DomainEventType, Set<SubEntry>>,
  eventType: DomainEventType,
  subId: string,
): void {
  const subs = map.get(eventType)
  if (!subs) return
  for (const entry of subs) {
    if (entry.id === subId) {
      subs.delete(entry)
      return
    }
  }
}

export function createEventBus(): EventBus {
  const handlers = new Map<DomainEventType, Set<SubEntry>>()
  let subId = 0

  const bus: EventBus = {
    async publish(event) {
      const subs = handlers.get(event.type)
      if (!subs) return
      const promises: Promise<void>[] = []
      for (const { handler } of subs) {
        promises.push(handler(event))
      }
      await Promise.all(promises)
    },

    subscribe(eventType, handler) {
      const id = `sub_${++subId}`
      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set())
      }
      handlers.get(eventType)!.add({ id, handler })
      return () => removeSubscription(handlers, eventType, id)
    },

    unsubscribe(subscriptionId) {
      for (const eventType of handlers.keys()) {
        removeSubscription(handlers, eventType, subscriptionId)
      }
    },
  }

  return bus
}

// ═══════════════════════════════════════════════════
// AGENT WIRING
// ═══════════════════════════════════════════════════

/**
 * Wire ATLAS domain events to IRIS notifications.
 * This is the bridge that makes the product loop work:
 * ATLAS decides → events fire → IRIS distributes.
 */
export function wireAtlasToIris(
  bus: EventBus,
  iris: IrisContracts,
): () => void {
  const unsubscribers: Array<() => void> = []

  unsubscribers.push(
    bus.subscribe('pick_confirmed', async (event) => {
      await iris.sendMessage(
        event.aggregateId,
        'pick_confirmed',
        event.payload as Record<string, unknown>,
      )
    }),
  )

  unsubscribers.push(
    bus.subscribe('pick_settled', async (event) => {
      const outcome = event.payload.outcome as string
      const templateKey =
        outcome === 'win' ? 'result_survived' :
        outcome === 'draw' ? 'result_lost_life' :
        'result_eliminated'

      await iris.sendMessage(
        event.aggregateId,
        templateKey,
        event.payload as Record<string, unknown>,
      )
    }),
  )

  unsubscribers.push(
    bus.subscribe('entry_eliminated', async (event) => {
      await iris.sendMessage(
        event.aggregateId,
        'result_eliminated',
        event.payload as Record<string, unknown>,
      )
    }),
  )

  unsubscribers.push(
    bus.subscribe('window_locked', async (event) => {
      const tournamentId = event.payload.tournamentId as string
      const userIds = event.payload.activeUserIds as string[]
      if (userIds?.length) {
        await iris.broadcastMessages(
          userIds,
          'window_closed',
          event.payload as Record<string, unknown>,
        )
      }
    }),
  )

  unsubscribers.push(
    bus.subscribe('window_settled', async (event) => {
      const userIds = event.payload.activeUserIds as string[]
      if (userIds?.length) {
        await iris.broadcastMessages(
          userIds,
          'recap_jornada',
          event.payload as Record<string, unknown>,
        )
      }
    }),
  )

  return () => unsubscribers.forEach((unsub) => unsub())
}

// ═══════════════════════════════════════════════════
// FACTORY HELPERS
// ═══════════════════════════════════════════════════

export function createDomainEvent(
  type: DomainEventType,
  aggregateType: DomainEvent['aggregateType'],
  aggregateId: string,
  tournamentId: string | null,
  payload: Record<string, unknown>,
  causationId?: string,
): DomainEvent {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    aggregateType,
    aggregateId,
    tournamentId,
    payload,
    occurredAt: Date.now(),
    correlationId: null,
    causationId: causationId ?? null,
    version: 1,
  }
}

/** Utility: generate a stable deduplication key for notifications */
export function notificationDedupeKey(
  userId: string,
  templateKey: string,
  windowId?: string,
): string {
  return [userId, templateKey, windowId].filter(Boolean).join(':')
}
