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

/**
 * Stub del dispatcher — implementación real requiere:
 * - Bot token de Telegram
 * - Webhook o long polling
 * - Base de datos de usuarios
 */
export function createTelegramDispatcher(): TelegramDispatcher {
  return {
    async send(_userId: string, _event: TelegramEvent): Promise<boolean> {
      // TODO: Implementar con Telegram Bot API
      return false
    },
    async broadcast(_userIds: string[], _event: TelegramEvent): Promise<number> {
      // TODO: Implementar envío masivo con rate limiting
      return 0
    },
    async isLinked(_userId: string): Promise<boolean> {
      return false
    },
    async link(_userId: string, _chatId: number): Promise<void> {
      // TODO: Persistir vinculación
    },
  }
}
