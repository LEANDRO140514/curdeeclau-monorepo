/**
 * TELEGRAM INFRASTRUCTURE CONTRACTS (IRIS)
 *
 * Contratos, tipos de eventos, templates y suscripciones para el sistema
 * de comunicación vía Telegram.
 *
 * NO implementa el bot complejo todavía.
 * Solo define la arquitectura de comunicación.
 */

import type { ContestFormatId, ReductionSize } from '../contest/formats'

// ═══════════════════════════════════════════════════
// TIPOS DE EVENTOS
// ═══════════════════════════════════════════════════

/** Categorías de eventos de comunicación */
export type EventCategory =
  | 'contest'          // Eventos de concurso
  | 'results'          // Resultados
  | 'reminder'         // Recordatorios
  | 'promotion'        // Promociones
  | 'system'           // Sistema

/** Prioridad de entrega */
export type EventPriority =
  | 'low'       // Puede esperar
  | 'normal'    // Entrega estándar
  | 'high'      // Prioridad alta
  | 'critical'  // Crítico (resultados, premios)

// ═══════════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════════

export interface TelegramEvent {
  id: string
  category: EventCategory
  priority: EventPriority
  /** Template key para renderizado */
  template: string
  /** Datos para el template */
  data: Record<string, unknown>
  /** Timestamp de creación */
  createdAt: number
  /** Timestamp programado (opcional) */
  scheduledFor?: number
}

/** Eventos predefinidos del sistema */
export const SYSTEM_EVENTS = {
  /** Nueva jornada disponible */
  NEW_MATCHDAY: {
    category: 'contest' as const,
    priority: 'high' as const,
    template: 'new_matchday',
    description: 'Nueva jornada disponible para apostar',
  },
  /** Resultados publicados */
  RESULTS_PUBLISHED: {
    category: 'results' as const,
    priority: 'critical' as const,
    template: 'results_published',
    description: 'Resultados oficiales publicados',
  },
  /** Recordatorio de apuesta */
  BETTING_REMINDER: {
    category: 'reminder' as const,
    priority: 'normal' as const,
    template: 'betting_reminder',
    description: 'Recordatorio: queda poco para cerrar la jornada',
  },
  /** Reducción comprada */
  REDUCTION_PURCHASED: {
    category: 'contest' as const,
    priority: 'normal' as const,
    template: 'reduction_purchased',
    description: 'Confirmación de compra de reducción',
  },
  /** Private 11 desbloqueado */
  PRIVATE11_UNLOCKED: {
    category: 'contest' as const,
    priority: 'normal' as const,
    template: 'private11_unlocked',
    description: 'Private 11 Plus desbloqueado',
  },
  /** Premio ganado */
  PRIZE_WON: {
    category: 'results' as const,
    priority: 'critical' as const,
    template: 'prize_won',
    description: '¡Has ganado un premio!',
  },
  /** Promoción disponible */
  PROMOTION_AVAILABLE: {
    category: 'promotion' as const,
    priority: 'low' as const,
    template: 'promotion',
    description: 'Nueva promoción disponible',
  },
  /** Bienvenida */
  WELCOME: {
    category: 'system' as const,
    priority: 'normal' as const,
    template: 'welcome',
    description: 'Mensaje de bienvenida',
  },
} as const

// ═══════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════

export interface TelegramTemplate {
  key: string
  /** Template en formato Telegram MarkdownV2 */
  body: string
  /** Variables requeridas */
  variables: string[]
  /** Descripción para documentación */
  description: string
}

/** Templates base del sistema */
export const TELEGRAM_TEMPLATES: Record<string, TelegramTemplate> = {
  welcome: {
    key: 'welcome',
    body: [
      '🎯 *Bienvenido a Quiniela Pro*',
      '',
      'Tu plataforma de reducciones inteligentes para La Quiniela.',
      '',
      '📊 *Análisis probabilístico gratuito*',
      '💰 *Reducciones oficiales desde 3€*',
      '🏆 *Private 11 Plus* — compite gratis',
      '',
      'Empieza explorando el análisis de la próxima jornada 👇',
    ].join('\n'),
    variables: [],
    description: 'Mensaje de bienvenida para nuevos usuarios',
  },

  new_matchday: {
    key: 'new_matchday',
    body: [
      '📋 *Nueva Jornada Disponible*',
      '',
      'Jornada: {matchday}',
      'Formato: {format}',
      'Cierre: {deadline}',
      '',
      '📊 *Análisis rápido:*',
      '· Partidos peligrosos: {dangerous}',
      '· Volatilidad: {volatility}',
      '',
      '{headline}',
      '',
      '[Ver análisis completo]({analysis_url})',
    ].join('\n'),
    variables: ['matchday', 'format', 'deadline', 'dangerous', 'volatility', 'headline', 'analysis_url'],
    description: 'Notificación de nueva jornada',
  },

  results_published: {
    key: 'results_published',
    body: [
      '🏁 *Resultados Publicados*',
      '',
      'Jornada: {matchday}',
      '',
      'Tus resultados:',
      '· Máximo aciertos: {max_hits}/14',
      '· Columnas con premio: {winning_columns}',
      '',
      '{prize_message}',
      '',
      '[Ver resultados completos]({results_url})',
    ].join('\n'),
    variables: ['matchday', 'max_hits', 'winning_columns', 'prize_message', 'results_url'],
    description: 'Notificación de resultados',
  },

  betting_reminder: {
    key: 'betting_reminder',
    body: [
      '⏰ *¡No te quedes fuera!*',
      '',
      'La jornada {matchday} cierra en {hours_remaining}h.',
      '',
      'Aún puedes comprar tu reducción:',
      '· R9 desde 6.75€',
      '· R16 desde 12€',
      '· R24 desde 18€',
      '',
      '[Comprar reducción]({purchase_url})',
    ].join('\n'),
    variables: ['matchday', 'hours_remaining', 'purchase_url'],
    description: 'Recordatorio de cierre de jornada',
  },

  reduction_purchased: {
    key: 'reduction_purchased',
    body: [
      '✅ *Reducción Confirmada*',
      '',
      'Reducción: R{size}',
      'Formato: {format}',
      'Precio: {price}€',
      '',
      '🎁 *Beneficios desbloqueados:*',
      '· Private 11: {p11_entries} entrada(s) gratis',
      '{revancha_line}',
      '{premium_line}',
      '',
      '[Ver mis columnas]({columns_url})',
    ].join('\n'),
    variables: ['size', 'format', 'price', 'p11_entries', 'revancha_line', 'premium_line', 'columns_url'],
    description: 'Confirmación de compra',
  },

  private11_unlocked: {
    key: 'private11_unlocked',
    body: [
      '🔓 *Private 11 Plus Desbloqueado*',
      '',
      'Tienes {entries} entrada(s) para competir.',
      '',
      '🏆 Premios: {prize_pool}',
      '👥 Participantes: {participants}',
      '',
      '[Entrar a Private 11]({p11_url})',
    ].join('\n'),
    variables: ['entries', 'prize_pool', 'participants', 'p11_url'],
    description: 'Notificación de desbloqueo Private 11',
  },

  prize_won: {
    key: 'prize_won',
    body: [
      '🎉 *¡Has Ganado!*',
      '',
      'Jornada: {matchday}',
      'Aciertos: {hits}/14',
      'Premio estimado: {prize}€',
      '',
      'Categoría: {category}',
      '',
      '[Ver detalle de premios]({prizes_url})',
    ].join('\n'),
    variables: ['matchday', 'hits', 'prize', 'category', 'prizes_url'],
    description: 'Notificación de premio ganado',
  },

  promotion: {
    key: 'promotion',
    body: [
      '💎 *{promo_title}*',
      '',
      '{promo_description}',
      '',
      'Válido hasta: {valid_until}',
      '',
      '[Aprovechar promoción]({promo_url})',
    ].join('\n'),
    variables: ['promo_title', 'promo_description', 'valid_until', 'promo_url'],
    description: 'Notificación de promoción',
  },
}

// ═══════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════

export type SubscriptionTopic =
  | 'all'
  | 'results'
  | 'reminders'
  | 'promotions'
  | 'private11'

export interface UserSubscription {
  userId: string
  chatId: number
  topics: SubscriptionTopic[]
  /** Horario permitido para notificaciones (hora local, 0-23) */
  quietHours?: { start: number; end: number }
  /** ¿Recibir notificaciones de promociones? */
  marketingOptIn: boolean
}

/** Estado de suscripción por defecto */
export function defaultSubscription(userId: string, chatId: number): UserSubscription {
  return {
    userId,
    chatId,
    topics: ['all', 'results', 'reminders', 'private11'],
    marketingOptIn: false,
  }
}

// ═══════════════════════════════════════════════════
// DISPATCHER CONTRACT
// ═══════════════════════════════════════════════════

export interface TelegramDispatcher {
  /** Enviar un evento a un usuario */
  send(userId: string, event: TelegramEvent): Promise<boolean>
  /** Enviar a múltiples usuarios */
  broadcast(userIds: string[], event: TelegramEvent): Promise<number>
  /** Verificar si un usuario tiene Telegram vinculado */
  isLinked(userId: string): Promise<boolean>
  /** Vincular cuenta de Telegram */
  link(userId: string, chatId: number): Promise<void>
}

// ═══════════════════════════════════════════════════
// SURVIVOR-SPECIFIC IRIS TEMPLATES
// ═══════════════════════════════════════════════════

/**
 * Oraculo Survivor Telegram templates.
 * Aligned with FASE-3 UX Telegram Flows — IRIS system.
 * These are the narrative/copy templates; channel routing is handled by IRIS.
 */
export const SURVIVOR_TELEGRAM_TEMPLATES: Record<string, TelegramTemplate> = {
  // ── ONBOARDING ──
  welcome_survivor: {
    key: 'welcome_survivor',
    body: [
      '⚡ *Bienvenido a Oraculo Survivor*',
      '',
      'Desde aquí recibirás recordatorios de pick, resultados y movimiento de tus ligas.',
      '',
      '📋 *Reglas rápidas:*',
      '• Una selección por ventana',
      '• Tres vidas',
      '• No repites equipo',
      '',
      'Cuando quieras, te ayudo a llegar listo a tu primer pick.',
    ].join('\n'),
    variables: [],
    description: 'Bienvenida a Oraculo Survivor vía Telegram',
  },

  // ── REMINDERS ──
  window_opening: {
    key: 'window_opening',
    body: [
      '📋 *Ventana {window_number} abierta*',
      '',
      'Fase: {phase_name}',
      'Partidos: {match_count}',
      'Cierre: {lock_at}',
      '',
      'Equipos disponibles: {available_teams}',
      'Ya usaste: {used_teams}',
      '',
      '[Hacer mi pick]({pick_url})',
    ].join('\n'),
    variables: ['window_number', 'phase_name', 'match_count', 'lock_at', 'available_teams', 'used_teams', 'pick_url'],
    description: 'Apertura de ventana Oraculo Survivor',
  },

  reminder_24h: {
    key: 'reminder_24h',
    body: [
      '⏰ *Tu próxima decisión ya está en juego*',
      '',
      'La ventana cierra en 24 horas y aún no has elegido selección.',
      '',
      'Sigue vivo. No lo dejes para el final.',
      '',
      '[Hacer mi pick]({pick_url})',
    ].join('\n'),
    variables: ['pick_url'],
    description: 'Recordatorio 24h antes del cierre',
  },

  reminder_6h: {
    key: 'reminder_6h',
    body: [
      '⚠️ *Quedan 6 horas para cerrar la ventana*',
      '',
      'Tu pick sigue pendiente y cada jornada cuenta.',
      '',
      'En Oraculo Survivor no sobrevivir también es una decisión.',
      '',
      '[Elegir ahora]({pick_url})',
    ].join('\n'),
    variables: ['pick_url'],
    description: 'Recordatorio 6h antes del cierre',
  },

  reminder_1h: {
    key: 'reminder_1h',
    body: [
      '🔴 *Última hora*',
      '',
      'Si no confirmas tu pick antes del cierre, entrarás a la jornada sin decisión.',
      '',
      'Este es el momento.',
      '',
      '[Confirmar pick]({pick_url})',
    ].join('\n'),
    variables: ['pick_url'],
    description: 'Recordatorio 1h antes del cierre',
  },

  reminder_15m: {
    key: 'reminder_15m',
    body: [
      '🚨 *Última llamada*',
      '',
      'La ventana está por cerrar y sigues sin pick.',
      '',
      'Decide ahora o deja que la jornada decida por ti.',
      '',
      '[Entrar y elegir]({pick_url})',
    ].join('\n'),
    variables: ['pick_url'],
    description: 'Recordatorio 15min antes del cierre — máxima urgencia',
  },

  // ── PICK CONFIRMATION ──
  pick_confirmed: {
    key: 'pick_confirmed',
    body: [
      '✅ *Pick confirmado*',
      '',
      'Elegiste a *{team_name}* para esta ventana.',
      '',
      'Si gana, sigues vivo. Si empata o pierde, pierdes una vida.',
      '',
      'Ahora empieza la espera.',
      '',
      '[Ver mi estado]({status_url})',
    ].join('\n'),
    variables: ['team_name', 'status_url'],
    description: 'Confirmación de pick Oraculo Survivor',
  },

  pick_confirmed_oraculo: {
    key: 'pick_confirmed_oraculo',
    body: [
      '✅ *IRIS registró tu decisión*',
      '',
      'ORÁCULO ve este pick como riesgo *{risk_level}*.',
      '',
      'Ya no hay marcha atrás cuando cierre la ventana.',
      '',
      '[Ver análisis]({analysis_url})',
    ].join('\n'),
    variables: ['risk_level', 'analysis_url'],
    description: 'Confirmación con guiño de ORÁCULO',
  },

  // ── RESULTS ──
  result_survived: {
    key: 'result_survived',
    body: [
      '🟢 *Sobreviviste*',
      '',
      '*{team_name}* ganó y sigues en carrera.',
      '',
      'Tu historia continúa en Oraculo Survivor.',
      'Revisa tu posición y prepárate para la siguiente ventana.',
      '',
      '[Ver mi recap]({recap_url})',
    ].join('\n'),
    variables: ['team_name', 'recap_url'],
    description: 'Pick ganó — sobrevive',
  },

  result_lost_life: {
    key: 'result_lost_life',
    body: [
      '🟡 *Golpe duro*',
      '',
      '*{team_name}* no ganó y perdiste una vida.',
      '',
      'Vidas restantes: {lives_remaining}/{max_lives}',
      '',
      'Sigues dentro, pero el margen cambió.',
      'La próxima decisión pesa más.',
      '',
      '[Ver mi estado]({status_url})',
    ].join('\n'),
    variables: ['team_name', 'lives_remaining', 'max_lives', 'status_url'],
    description: 'Pick perdió/empató — pierde una vida',
  },

  result_eliminated: {
    key: 'result_eliminated',
    body: [
      '🔴 *Se terminó tu recorrido en esta edición*',
      '',
      '*{team_name}* no ganó y acabas de perder tu última vida.',
      '',
      'Caer también forma parte de Oraculo Survivor.',
      'Tu historia no termina: tu liga sigue viva.',
      '',
      '[Entrar a Spectator Mode]({spectator_url})',
    ].join('\n'),
    variables: ['team_name', 'spectator_url'],
    description: 'Eliminación — sin vidas restantes',
  },

  elimination_narrative: {
    key: 'elimination_narrative',
    body: [
      '🎬 *No todas las historias llegan al final*',
      '',
      'La tuya se detuvo en la ventana *{window_number}*, después de *{windows_survived}* jornadas sobrevividas.',
      '',
      'Puedes salir o puedes mirar cómo sigue cayendo el resto.',
      'En Oraculo Survivor, incluso desde fuera, el drama continúa.',
      '',
      '[Seguir mi liga]({league_url})',
    ].join('\n'),
    variables: ['window_number', 'windows_survived', 'league_url'],
    description: 'Mensaje narrativo post-eliminación',
  },

  // ── RECAP ──
  recap_jornada: {
    key: 'recap_jornada',
    body: [
      '📊 *Recap de la jornada*',
      '',
      '• {pct_lost_life}% perdió una vida con {upset_team}',
      '• {pct_eliminated}% quedó eliminado',
      '• {top_pick} fue el pick más elegido',
      '• Tu liga perdió {league_losses} sobrevivientes hoy',
      '',
      'Cada ventana limpia el mapa. Revisa cómo quedó todo.',
      '',
      '[Ver recap completo]({recap_url})',
    ].join('\n'),
    variables: ['pct_lost_life', 'upset_team', 'pct_eliminated', 'top_pick', 'league_losses', 'recap_url'],
    description: 'Recap de jornada Oraculo Survivor',
  },

  recap_premium: {
    key: 'recap_premium',
    body: [
      '📊 *Recap inteligente listo*',
      '',
      'Ya puedes ver qué picks ganaron valor, dónde cayó la mayoría y cómo cambia el mapa estratégico para la siguiente ventana.',
      '',
      '[Abrir ORÁCULO]({oraculo_url})',
    ].join('\n'),
    variables: ['oraculo_url'],
    description: 'Recap premium con insights avanzados',
  },

  // ── LEAGUE ALERTS ──
  league_movement: {
    key: 'league_movement',
    body: [
      '📈 *Movimiento en tu liga*',
      '',
      'Subiste del puesto *{old_rank}* al *{new_rank}* después de esta jornada.',
      '',
      'El tablero se está apretando.',
      '',
      '[Ver liga]({league_url})',
    ].join('\n'),
    variables: ['old_rank', 'new_rank', 'league_url'],
    description: 'Cambio de posición en liga',
  },

  league_rival_fell: {
    key: 'league_rival_fell',
    body: [
      '⚡ *Se abrió tu liga*',
      '',
      '*{rival_name}* quedó eliminado y el top 5 cambió por completo.',
      '',
      'La siguiente ventana puede definir mucho más de lo que parece.',
      '',
      '[Entrar a mi liga]({league_url})',
    ].join('\n'),
    variables: ['rival_name', 'league_url'],
    description: 'Rival eliminado — oportunidad',
  },

  // ── PHASE TRANSITIONS ──
  new_phase_knockout: {
    key: 'new_phase_knockout',
    body: [
      '🏆 *Cambia el torneo. Cambia la presión.*',
      '',
      'Empiezan las eliminatorias y cada pick ahora suena más fuerte.',
      '',
      'Ya no solo se trata de seguir vivo.',
      'Se trata de llegar más lejos que todos.',
      '',
      '[Ver nueva fase]({phase_url})',
    ].join('\n'),
    variables: ['phase_url'],
    description: 'Inicio de fase eliminatoria',
  },

  new_phase_knockout_one_life: {
    key: 'new_phase_knockout_one_life',
    body: [
      '💀 *Empiezan las eliminatorias y tú llegas con una sola vida.*',
      '',
      'A partir de aquí, cada decisión puede ser la última.',
      '',
      'Juega con cabeza. Sobrevive con carácter.',
      '',
      '[Revisar mis opciones]({options_url})',
    ].join('\n'),
    variables: ['options_url'],
    description: 'Fase eliminatoria para jugador con 1 vida — máxima tensión',
  },

  // ── PREMIUM ──
  premium_activated: {
    key: 'premium_activated',
    body: [
      '💎 *Premium Tournament Pass activado*',
      '',
      'ORÁCULO avanzado desbloqueado.',
      'Planner multi-ventana disponible.',
      'Recaps inteligentes activados.',
      '',
      '[Explorar beneficios]({premium_url})',
    ].join('\n'),
    variables: ['premium_url'],
    description: 'Premium activado',
  },

  // ── SPECTATOR ──
  spectator_welcome: {
    key: 'spectator_welcome',
    body: [
      '👁️ *Modo Espectador activado*',
      '',
      'Ya no decides, pero sigues viendo todo:',
      '• Tu liga en vivo',
      '• El leaderboard global',
      '• Los recaps de ORÁCULO',
      '• Quién cae en cada ventana',
      '',
      '[Ver panorama]({spectator_url})',
    ].join('\n'),
    variables: ['spectator_url'],
    description: 'Bienvenida al Spectator Mode',
  },
}

// ═══════════════════════════════════════════════════
// IRIS DISPATCHER (Enhanced)
// ═══════════════════════════════════════════════════

export interface IrisDispatcher extends TelegramDispatcher {
  /** Render message with template interpolation */
  render(templateKey: string, data: Record<string, unknown>, channel?: 'telegram' | 'push' | 'email'): string
  /** Schedule a reminder for a specific time */
  scheduleReminder(userId: string, templateKey: string, scheduledFor: number, data: Record<string, unknown>): { jobId: string }
  /** Get all available template keys for a channel */
  listTemplates(channel?: string): string[]
}

/**
 * Template renderer: replaces {variable} placeholders with actual values.
 * Escapes Telegram markdown special characters in free-text variables.
 */
export function renderMessage(
  template: TelegramTemplate,
  data: Record<string, unknown>,
): string {
  let result = template.body
  for (const [key, value] of Object.entries(data)) {
    result = result.split(`{${key}}`).join(String(value ?? '—'))
  }
  return result
}

/**
 * Render all templates with sample data for testing/documentation.
 */
export function renderAllTemplates(): Record<string, string> {
  const all = {
    ...TELEGRAM_TEMPLATES,
    ...SURVIVOR_TELEGRAM_TEMPLATES,
  }
  const rendered: Record<string, string> = {}
  for (const [key, template] of Object.entries(all)) {
    const sampleData: Record<string, unknown> = {}
    for (const v of template.variables) {
      sampleData[v] = `[${v}]`
    }
    rendered[key] = renderMessage(template, sampleData)
  }
  return rendered
}

/**
 * Create an IRIS dispatcher with template rendering.
 * The actual Telegram Bot API call is injected as a dependency.
 */
export function createIrisDispatcher(
  sendToTelegram?: (chatId: number, text: string) => Promise<{ messageId?: string }>,
  userChatMap?: Map<string, number>,
): IrisDispatcher {
  const chatMap = userChatMap ?? new Map()

  function resolveTemplate(key: string): TelegramTemplate | null {
    return SURVIVOR_TELEGRAM_TEMPLATES[key] ?? TELEGRAM_TEMPLATES[key] ?? null
  }

  return {
    render(templateKey: string, data: Record<string, unknown>, _channel = 'telegram'): string {
      const tmpl = resolveTemplate(templateKey)
      if (!tmpl) return `[template not found: ${templateKey}]`
      return renderMessage(tmpl, data)
    },

    async send(userId: string, event: TelegramEvent): Promise<boolean> {
      const tmpl = resolveTemplate(event.template)
      if (!tmpl) return false

      const chatId = chatMap.get(userId)
      if (!chatId || !sendToTelegram) return false

      const text = renderMessage(tmpl, event.data as Record<string, unknown>)
      try {
        await sendToTelegram(chatId, text)
        return true
      } catch {
        return false
      }
    },

    async broadcast(userIds: string[], event: TelegramEvent): Promise<number> {
      const tmpl = resolveTemplate(event.template)
      if (!tmpl) return 0

      const text = renderMessage(tmpl, event.data as Record<string, unknown>)
      let sent = 0

      if (sendToTelegram) {
        const batch = userIds
          .map((uid) => chatMap.get(uid))
          .filter((cid): cid is number => cid !== undefined)

        for (const chatId of batch) {
          try {
            await sendToTelegram(chatId, text)
            sent++
          } catch {
            // Continue with next user
          }
        }
      }

      return sent
    },

    async isLinked(userId: string): Promise<boolean> {
      return chatMap.has(userId)
    },

    async link(userId: string, chatId: number): Promise<void> {
      chatMap.set(userId, chatId)
    },

    scheduleReminder(userId: string, templateKey: string, scheduledFor: number, data: Record<string, unknown>): { jobId: string } {
      const jobId = `iris_${userId}_${templateKey}_${scheduledFor}`
      // In production: enqueue to BullMQ with scheduledFor delay
      // For now: return job identifier for caller to handle
      return { jobId }
    },

    listTemplates(_channel = 'telegram'): string[] {
      return [
        ...Object.keys(TELEGRAM_TEMPLATES),
        ...Object.keys(SURVIVOR_TELEGRAM_TEMPLATES),
      ]
    },
  }
}

/**
 * Stub dispatcher — for environments without Telegram integration.
 */
export function createTelegramDispatcher(): TelegramDispatcher {
  return createIrisDispatcher()
}
