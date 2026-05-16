/**
 * SURVIVOR ENGINE — Oraculo Survivor Types
 *
 * Survivor 2+1 format: 3 lives, 1 pick per window, no-repeat teams,
 * max 8 windows (3 groups + 5 knockout).
 *
 * Part of the Oraculo Society platform. Multi-tournament from day 1.
 */

// ═══════════════════════════════════════════════════
// TOURNAMENT STRUCTURE
// ═══════════════════════════════════════════════════

export type TournamentKind =
  | 'survivor'
  | 'quiniela_full'
  | 'quiniela_knockout'
  | 'ai_challenge'
  | 'lead_magnet'

export type TournamentStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'archived'

export type MatchStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'third_place'
  | 'final'

export type WindowStatus =
  | 'scheduled'
  | 'open'
  | 'locked'
  | 'in_progress'
  | 'awaiting_results'
  | 'settled'
  | 'reopened'
  | 'cancelled'

export interface TournamentWindow {
  id: string
  tournamentId: string
  phaseId: string
  windowNumber: number
  name: string
  windowType: 'matchday' | 'phase_round' | 'custom'
  startsAt: number
  lockAt: number
  endsAt: number
  status: WindowStatus
  eligibleMatchCount: number
}

export interface TournamentPhase {
  id: string
  tournamentId: string
  stage: MatchStage
  label: string
  order: number
  startsAt: number
  endsAt: number
}

export interface SurvivorTeam {
  id: string
  tournamentId: string
  fifaCode: string
  name: string
  shortName: string
  confederation: string
  groupCode: string
  isActive: boolean
  strengthRating: number | null
}

export interface SurvivorMatch {
  id: string
  tournamentId: string
  phaseId: string
  windowId: string
  homeTeamId: string
  awayTeamId: string
  startsAt: number
  status: 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed' | 'awarded'
  homeScore: number | null
  awayScore: number | null
  resultType: 'home_win' | 'away_win' | 'draw' | 'void' | 'pending'
}

// ═══════════════════════════════════════════════════
// ENTRY & GAME STATE
// ═══════════════════════════════════════════════════

export type EntryStatus =
  | 'active'
  | 'eliminated'
  | 'spectator'
  | 'withdrawn'
  | 'banned'

export type EntryType =
  | 'free'
  | 'premium'
  | 'sponsor'
  | 'creator'
  | 'admin_test'

export interface SurvivorEntry {
  id: string
  tournamentId: string
  userId: string
  entryType: EntryType
  status: EntryStatus
  joinedAt: number
  eliminatedAt: number | null
  spectatorSince: number | null
  currentLives: number
  maxLives: number
  usedTeamsCount: number
  lastSettledWindowId: string | null
  lastPickWindowId: string | null
  countryCodeSnapshot: string | null
}

// ═══════════════════════════════════════════════════
// PICKS
// ═══════════════════════════════════════════════════

export type PickStatus =
  | 'draft'
  | 'confirmed'
  | 'locked'
  | 'settled_win'
  | 'settled_loss'
  | 'settled_draw'
  | 'void'
  | 'reversed'

export type PickSource = 'manual' | 'telegram' | 'auto' | 'admin'

export interface SurvivorPick {
  id: string
  tournamentId: string
  windowId: string
  entryId: string
  userId: string
  selectedTeamId: string
  source: PickSource
  status: PickStatus
  submittedAt: number
  lockedAt: number | null
  settledAt: number | null
  riskSnapshot: RiskSnapshot | null
}

export interface RiskSnapshot {
  winProbability: number
  riskScore: number
  volatilityScore: number
  confidenceScore: number
  reserveValueScore: number
}

// ═══════════════════════════════════════════════════
// LIVES & TEAM HISTORY
// ═══════════════════════════════════════════════════

export type LifeEventType =
  | 'initial_grant'
  | 'bonus_grant'
  | 'life_lost'
  | 'life_restored'
  | 'manual_adjustment'
  | 'final_elimination'

export interface LifeEvent {
  id: string
  tournamentId: string
  entryId: string
  windowId: string | null
  pickId: string | null
  eventType: LifeEventType
  delta: number
  balanceAfter: number
  reasonCode: string
  createdAt: number
}

export interface UsedTeam {
  id: string
  tournamentId: string
  entryId: string
  teamId: string
  firstUsedWindowId: string
  pickId: string
  createdAt: number
}

// ═══════════════════════════════════════════════════
// LEAGUES & LEADERBOARDS
// ═══════════════════════════════════════════════════

export type LeagueType =
  | 'private_basic'
  | 'pro'
  | 'creator'
  | 'brand'
  | 'global_country'
  | 'system'

export type LeagueVisibility = 'private' | 'link_only' | 'public'

export interface SurvivorLeague {
  id: string
  tournamentId: string
  slug: string
  name: string
  leagueType: LeagueType
  ownerUserId: string
  visibility: LeagueVisibility
  joinCode: string
  maxMembers: number
  status: string
}

export interface LeagueMember {
  id: string
  leagueId: string
  entryId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: number
}

export type LeaderboardScope = 'global' | 'league' | 'country'

export interface LeaderboardRow {
  entryId: string
  userId: string
  rank: number
  score: number
  livesRemaining: number
  survivalStreak: number
  usedTeamsCount: number
  tiebreakScore: number
  countryCode: string
  isEliminated: boolean
}

// ═══════════════════════════════════════════════════
// SURVIVOR RULES CONFIG (from HERMES)
// ═══════════════════════════════════════════════════

export interface SurvivorRuleset {
  version: string
  lives: {
    base: number
    bonus: number
  }
  pickPolicy: {
    perWindow: number
    repeatTeam: boolean
  }
  windowPolicy: {
    maxWindows: number
    lockRule: 'before_first_match' | 'before_window_start' | 'custom'
  }
  settlementPolicy: {
    win: 'survive'
    draw: 'lose_life'
    loss: 'lose_life'
    void: 'no_penalty'
  }
}

export const SURVIVOR_DEFAULT_RULESET: SurvivorRuleset = {
  version: '1.0.0',
  lives: { base: 2, bonus: 1 },
  pickPolicy: { perWindow: 1, repeatTeam: false },
  windowPolicy: { maxWindows: 8, lockRule: 'before_first_match' },
  settlementPolicy: {
    win: 'survive',
    draw: 'lose_life',
    loss: 'lose_life',
    void: 'no_penalty',
  },
}

// ═══════════════════════════════════════════════════
// PICK VALIDATION
// ═══════════════════════════════════════════════════

export interface PickValidation {
  valid: boolean
  code?: string
  message?: string
}

export function validateSurvivorPick(
  entry: SurvivorEntry,
  window: TournamentWindow,
  teamId: string,
  usedTeams: UsedTeam[],
  eligibleTeams: SurvivorTeam[],
): PickValidation {
  // 1. Entry is active
  if (entry.status !== 'active') {
    return { valid: false, code: 'ENTRY_NOT_ACTIVE', message: `Entry status is ${entry.status}` }
  }

  // 2. Window is open
  if (window.status !== 'open') {
    return { valid: false, code: 'WINDOW_NOT_OPEN', message: `Window status is ${window.status}` }
  }

  // 3. Window not yet locked
  if (Date.now() >= window.lockAt) {
    return { valid: false, code: 'WINDOW_LOCKED', message: 'Window has already locked' }
  }

  // 4. Team belongs to tournament
  if (!eligibleTeams.some((t) => t.id === teamId)) {
    return { valid: false, code: 'TEAM_NOT_ELIGIBLE', message: 'Team not eligible for this tournament' }
  }

  // 5. Team not already used
  if (usedTeams.some((ut) => ut.teamId === teamId)) {
    return { valid: false, code: 'TEAM_ALREADY_USED', message: 'This team has already been used' }
  }

  return { valid: true }
}

// ═══════════════════════════════════════════════════
// LIFE MANAGEMENT
// ═══════════════════════════════════════════════════

export function applyPickOutcome(
  entry: SurvivorEntry,
  pick: SurvivorPick,
  matchResult: SurvivorMatch['resultType'] | 'void',
  ruleset: SurvivorRuleset = SURVIVOR_DEFAULT_RULESET,
): { entry: SurvivorEntry; lifeEvent: LifeEvent; eliminated: boolean } {
  let delta = 0
  let eventType: LifeEventType = 'life_lost'
  let reasonCode = ''

  if (matchResult === 'void' || pick.status === 'void') {
    delta = 0
    eventType = 'life_lost'
    reasonCode = 'void_result'
  } else if (matchResult === 'home_win' || matchResult === 'away_win') {
    // Team won: check if the picked team is the winner
    delta = 0 // survived — no life lost
    eventType = 'life_lost'
    reasonCode = 'pick_won'
  } else {
    // Draw or loss: lose a life
    delta = -1
    eventType = 'life_lost'
    reasonCode = matchResult === 'draw' ? 'pick_drew' : 'pick_lost'
  }

  const balanceAfter = entry.currentLives + delta
  const eliminated = balanceAfter <= 0

  const lifeEvent: LifeEvent = {
    id: '',
    tournamentId: entry.tournamentId,
    entryId: entry.id,
    windowId: pick.windowId,
    pickId: pick.id,
    eventType: eliminated ? 'final_elimination' : eventType,
    delta,
    balanceAfter,
    reasonCode,
    createdAt: Date.now(),
  }

  const updatedEntry: SurvivorEntry = {
    ...entry,
    currentLives: Math.max(0, balanceAfter),
    status: eliminated ? 'eliminated' : entry.status,
    eliminatedAt: eliminated ? Date.now() : entry.eliminatedAt,
    spectatorSince: eliminated ? Date.now() : entry.spectatorSince,
  }

  return { entry: updatedEntry, lifeEvent, eliminated }
}

// ═══════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════

export function createSurvivorEntry(
  id: string,
  tournamentId: string,
  userId: string,
  ruleset: SurvivorRuleset = SURVIVOR_DEFAULT_RULESET,
): SurvivorEntry {
  return {
    id,
    tournamentId,
    userId,
    entryType: 'free',
    status: 'active',
    joinedAt: Date.now(),
    eliminatedAt: null,
    spectatorSince: null,
    currentLives: ruleset.lives.base + ruleset.lives.bonus,
    maxLives: ruleset.lives.base + ruleset.lives.bonus,
    usedTeamsCount: 0,
    lastSettledWindowId: null,
    lastPickWindowId: null,
    countryCodeSnapshot: null,
  }
}
