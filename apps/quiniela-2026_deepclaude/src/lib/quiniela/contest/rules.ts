/**
 * CONTEST RULES — Reglas de negocio y validaciones.
 *
 * Define restricciones, límites y reglas de cada formato de concurso.
 * NO lógica de UI. Puramente funcional.
 */

import type { ContestFormatId, ReductionSize } from './formats'
import type { ContestProduct } from './products'
import type { UserEntitlements } from '../entitlements'
import { canAccess } from '../entitlements'
import { getCompatibleReductions } from '../reductions/compatibility'
import { getProduct } from '../reductions/catalog'

// ═══════════════════════════════════════════════════
// REGLAS POR FORMATO
// ═══════════════════════════════════════════════════

export interface FormatRules {
  /** Máximo de reducciones que se pueden comprar para este formato */
  maxReductionsPerContest: number
  /** ¿Permite múltiples reducciones? */
  allowMultipleReductions: boolean
  /** ¿Requiere verificación de identidad? */
  requiresIdentityVerification: boolean
  /** Edad mínima */
  minAge: number
  /** Máximo gasto diario */
  maxDailySpend: number
}

export const FORMAT_RULES: Record<ContestFormatId, FormatRules> = {
  progol_14: {
    maxReductionsPerContest: 1,
    allowMultipleReductions: false,
    requiresIdentityVerification: true,
    minAge: 18,
    maxDailySpend: 200,
  },
  revancha_7: {
    maxReductionsPerContest: 1,
    allowMultipleReductions: false,
    requiresIdentityVerification: false,
    minAge: 18,
    maxDailySpend: 50,
  },
  media_semana_9: {
    maxReductionsPerContest: 1,
    allowMultipleReductions: false,
    requiresIdentityVerification: true,
    minAge: 18,
    maxDailySpend: 150,
  },
  private_11: {
    maxReductionsPerContest: 1,
    allowMultipleReductions: false,
    requiresIdentityVerification: false,
    minAge: 18,
    maxDailySpend: 100,
  },
}

// ═══════════════════════════════════════════════════
// VALIDACIONES DE COMPRA
// ═══════════════════════════════════════════════════

export interface PurchaseValidation {
  allowed: boolean
  reasons: string[]
}

/** Valida si un usuario puede comprar un producto */
export function validatePurchase(
  product: ContestProduct,
  entitlements: UserEntitlements,
): PurchaseValidation {
  const reasons: string[] = []
  const rules = FORMAT_RULES[product.format]

  // Verificar acceso al formato
  if (!canAccess(entitlements, product.format) && product.format !== 'progol_14' && product.format !== 'media_semana_9') {
    reasons.push(`No tienes acceso a ${product.format}`)
  }

  // Verificar límite de reducciones por concurso
  const existingForFormat = entitlements.purchases.filter(
    (p) => p.format === product.format,
  )
  if (existingForFormat.length >= rules.maxReductionsPerContest) {
    reasons.push(`Máximo ${rules.maxReductionsPerContest} reducción por ${product.format}`)
  }

  // Verificar gasto diario
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySpend = entitlements.purchases
    .filter((p) => p.purchasedAt >= today.getTime())
    .reduce((sum, p) => sum + p.price, 0)

  if (todaySpend + product.totalPrice > rules.maxDailySpend) {
    reasons.push(`Excede límite de gasto diario (${rules.maxDailySpend} MXN)`)
  }

  // Verificar compatibilidad
  const compatible = getCompatibleReductions(product.format)
  if (!compatible.some((c) => c.size === product.reductionSize)) {
    reasons.push(`R${product.reductionSize} no compatible con ${product.format}`)
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  }
}

// ═══════════════════════════════════════════════════
// REGLAS DE PRODUCTO
// ═══════════════════════════════════════════════════

/** Mensajes legales requeridos por formato */
export function legalDisclaimer(format: ContestFormatId): string {
  const disclaimers: Record<string, string> = {
    progol_14:
      'Los juegos de azar están reservados para mayores de 18 años. ' +
      'Juega responsablemente. Las reducciones no garantizan premios.',
    revancha_7:
      'La Revancha es un addon opcional. No garantiza aciertos adicionales.',
    media_semana_9:
      'Juego reservado para mayores de 18 años. Consulte los resultados oficiales.',
    private_11:
      'Private 11 Plus es un sistema social. Los premios se rigen por las bases del concurso.',
  }
  return disclaimers[format] ?? 'Juega responsablemente.'
}

/** Mensaje de probabilidad (requerido legalmente) */
export function probabilityDisclaimer(): string {
  return 'Los porcentajes representan estimaciones probabilísticas generadas por nuestro modelo y NO garantizan resultados.'
}

// ═══════════════════════════════════════════════════
// PRODUCT LOOP
// ═══════════════════════════════════════════════════

/**
 * El Product Loop MVP:
 *
 * 1. Análisis probabilístico gratuito → engagement
 * 2. Compra reducción → monetización
 * 3. Desbloquea Private 11 → retención
 * 4. Compite → experiencia
 * 5. Telegram updates → re-engagement
 * 6. Regresa siguiente jornada → loop cerrado
 */
export const PRODUCT_LOOP_STEPS = [
  'analysis',
  'purchase',
  'unlock_private11',
  'compete',
  'telegram_update',
  'return_next_matchday',
] as const

export type ProductLoopStep = typeof PRODUCT_LOOP_STEPS[number]

export function getNextStep(current: ProductLoopStep): ProductLoopStep | null {
  const idx = PRODUCT_LOOP_STEPS.indexOf(current)
  if (idx < 0 || idx >= PRODUCT_LOOP_STEPS.length - 1) return null
  return PRODUCT_LOOP_STEPS[idx + 1]
}
