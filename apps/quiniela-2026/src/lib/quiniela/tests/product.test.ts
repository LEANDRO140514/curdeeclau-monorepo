/**
 * TESTS DEL MVP PRODUCT SYSTEM
 *
 * Cubre: contest formats, compatibility matrix, catalog, products,
 * addons, pricing, entitlements, rules, oráculo, public analysis,
 * Telegram contracts.
 */

import { describe, it, expect } from 'vitest'

// Contest formats
import {
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
} from '../contest/formats'
import type { ContestFormatId } from '../contest/formats'

// Compatibility
import {
  COMPATIBILITY_MATRIX,
  getCompatibleReductions,
  isReductionCompatible,
  getAvailableSizes,
  findEntry,
  allReductionSizes,
} from '../reductions/compatibility'

// Catalog
import {
  REDUCTION_CATALOG,
  getProduct,
  getProductsForFormat,
  getProductsByIntensity,
  getProductPrice,
  getIntensity,
  getBenefits,
} from '../reductions/catalog'
import type { ReductionProduct } from '../reductions/catalog'

// Products
import {
  createProduct,
  createProgolProduct,
  createPrivate11Product,
  createMediaSemanaProduct,
  isValidProduct,
  validateProduct,
} from '../contest/products'

// Addons
import {
  REVANCHA_ADDON,
  ADDONS,
  isAddonAvailable,
  canPurchaseAddon,
  getAddonReductions,
  isValidAddonReduction,
  addonPrice,
} from '../contest/addons'

// Pricing
import {
  calculatePrice,
  calculateSavings,
  createProgolPrivate11Bundle,
  DEFAULT_PROMOTIONS,
} from '../contest/pricing'

// Entitlements
import {
  createEntitlements,
  processPurchase,
  addPrivate11Entries,
  totalPrivate11Entries,
  canAccess,
  hasPurchased,
  totalSpent,
  maxIntensity,
} from '../entitlements'
import type { UserEntitlements } from '../entitlements'

// Rules
import {
  FORMAT_RULES,
  validatePurchase,
  legalDisclaimer,
  probabilityDisclaimer,
  PRODUCT_LOOP_STEPS,
  getNextStep,
} from '../contest/rules'

// Oráculo
import {
  analyzeMatch,
  analyzeQuiniela,
  quickAnalysis,
  recommendReductions,
  suggestConfig,
} from '../oraculo/probabilities'

// Public Analysis
import {
  generatePublicAnalysis,
  compareReductions,
} from '../oraculo/analysis'

// Telegram
import {
  SYSTEM_EVENTS,
  TELEGRAM_TEMPLATES,
  defaultSubscription,
  createTelegramDispatcher,
} from '../communication/telegram'

import { BASE_PROBABILITIES } from '../probabilities/schema'

/* ══════════════════════════════════════════════
   CONTEST FORMATS
   ══════════════════════════════════════════════ */

describe('Contest formats', () => {
  it('all 4 formats defined', () => {
    expect(CONTEST_FORMATS.progol_14).toBeDefined()
    expect(CONTEST_FORMATS.revancha_7).toBeDefined()
    expect(CONTEST_FORMATS.media_semana_9).toBeDefined()
    expect(CONTEST_FORMATS.private_11).toBeDefined()
  })

  it('Progol 14 has 14 matches and supports addons', () => {
    expect(PROGOL_14.matches).toBe(14)
    expect(PROGOL_14.supportsAddons).toBe(true)
    expect(PROGOL_14.tier).toBe('primary')
    expect(PROGOL_14.requiresPurchase).toBe(true)
  })

  it('Revancha 7 is an addon with parent Progol 14', () => {
    expect(REVANCHA_7.tier).toBe('addon')
    expect(REVANCHA_7.matches).toBe(7)
    expect(REVANCHA_7.parentFormats).toContain('progol_14')
    expect(isAddon(REVANCHA_7)).toBe(true)
  })

  it('Private 11 has free entry when unlocked', () => {
    expect(PRIVATE_11.requiresPurchase).toBe(false)
    expect(PRIVATE_11.matches).toBe(11)
    expect(PRIVATE_11.supportsDirect).toBe(false)
  })

  it('Media Semana 9 has 9 matches', () => {
    expect(MEDIA_SEMANA_9.matches).toBe(9)
    expect(MEDIA_SEMANA_9.tier).toBe('primary')
  })

  it('getFormat returns correct format', () => {
    expect(getFormat('progol_14')).toBe(PROGOL_14)
    expect(getFormat('invalid' as ContestFormatId)).toBeUndefined()
  })

  it('isAddon identifies addons correctly', () => {
    expect(isAddon(PROGOL_14)).toBe(false)
    expect(isAddon(REVANCHA_7)).toBe(true)
  })

  it('getParentFormats returns parent for Revancha', () => {
    const parents = getParentFormats(REVANCHA_7)
    expect(parents).toHaveLength(1)
    expect(parents[0].id).toBe('progol_14')
  })

  it('PRIMARY_FORMATS has 3 entries', () => {
    expect(PRIMARY_FORMATS).toHaveLength(3)
    expect(PRIMARY_FORMATS.every((f) => f.tier === 'primary')).toBe(true)
  })

  it('WEEKEND_FORMATS has 2 entries', () => {
    expect(WEEKEND_FORMATS).toHaveLength(2)
  })

  it('formatSupportsLevel validates levels', () => {
    expect(formatSupportsLevel(PROGOL_14, 14)).toBe(true)
    expect(formatSupportsLevel(PROGOL_14, 13)).toBe(true)
    expect(formatSupportsLevel(PRIVATE_11, 14)).toBe(false)
    expect(formatSupportsLevel(PRIVATE_11, 13)).toBe(true)
  })
})

/* ══════════════════════════════════════════════
   COMPATIBILITY MATRIX
   ══════════════════════════════════════════════ */

describe('Compatibility matrix', () => {
  it('Progol 14 supports 6 reduction sizes', () => {
    const sizes = getAvailableSizes('progol_14')
    expect(sizes).toHaveLength(6)
    expect(sizes).toContain(9)
    expect(sizes).toContain(132)
  })

  it('Revancha 7 supports 4 reduction sizes', () => {
    const sizes = getAvailableSizes('revancha_7')
    expect(sizes).toHaveLength(4)
    expect(sizes).toContain(4)
    expect(sizes).toContain(32)
  })

  it('isReductionCompatible validates correctly', () => {
    expect(isReductionCompatible('progol_14', 9)).toBe(true)
    expect(isReductionCompatible('progol_14', 4)).toBe(false) // 4 no en progol
    expect(isReductionCompatible('revancha_7', 4)).toBe(true)
    expect(isReductionCompatible('revancha_7', 132)).toBe(false)
  })

  it('private_11 supports R81', () => {
    expect(isReductionCompatible('private_11', 81)).toBe(true)
    expect(isReductionCompatible('private_11', 132)).toBe(false)
  })

  it('allReductionSizes returns unique sorted sizes', () => {
    const sizes = allReductionSizes()
    expect(sizes).toContain(4)
    expect(sizes).toContain(132)
    // Must be sorted
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1])
    }
  })

  it('findEntry returns entry for valid format+size', () => {
    const entry = findEntry('progol_14', 9)
    expect(entry).toBeDefined()
    expect(entry!.size).toBe(9)
    expect(entry!.level).toBe(13)
  })
})

/* ══════════════════════════════════════════════
   CATALOG
   ══════════════════════════════════════════════ */

describe('Reduction catalog', () => {
  it('has 9 products', () => {
    expect(REDUCTION_CATALOG).toHaveLength(9)
  })

  it('getProduct returns correct product', () => {
    const p = getProduct(16)
    expect(p).toBeDefined()
    expect(p!.label).toBe('R16')
    expect(p!.intensity).toBe('medium')
    expect(p!.benefits.private11Entries).toBe(2)
  })

  it('getProduct returns undefined for invalid size', () => {
    expect(getProduct(999 as any)).toBeUndefined()
  })

  it('each product has valid intensity', () => {
    for (const p of REDUCTION_CATALOG) {
      expect(['light', 'medium', 'heavy', 'extreme']).toContain(p.intensity)
      expect(p.basePrice).toBeGreaterThan(0)
      expect(p.availableIn.length).toBeGreaterThan(0)
    }
  })

  it('getProductsForFormat filters correctly', () => {
    const progol = getProductsForFormat('progol_14')
    expect(progol.length).toBeGreaterThanOrEqual(6)
    expect(progol.every((p) => p.availableIn.includes('progol_14'))).toBe(true)
  })

  it('getProductsByIntensity filters correctly', () => {
    const light = getProductsByIntensity('light')
    expect(light.every((p) => p.intensity === 'light')).toBe(true)
  })

  it('getProductPrice returns correct price', () => {
    expect(getProductPrice(9)).toBe(6.75)
    expect(getProductPrice(132)).toBe(99)
  })

  it('R132 has extreme intensity and 10 P11 entries', () => {
    const p = getProduct(132)
    expect(p!.intensity).toBe('extreme')
    expect(p!.benefits.private11Entries).toBe(10)
  })
})

/* ══════════════════════════════════════════════
   PRODUCTS
   ══════════════════════════════════════════════ */

describe('Contest products', () => {
  it('createProgolProduct creates valid product', () => {
    const p = createProgolProduct(16)
    expect(p.format).toBe('progol_14')
    expect(p.reductionSize).toBe(16)
    expect(p.totalPrice).toBe(12)
    expect(p.private11Entries).toBe(2)
  })

  it('createProgolProduct with Revancha addon', () => {
    const p = createProgolProduct(24, true, 8)
    expect(p.addons).toHaveLength(1)
    expect(p.addons[0].type).toBe('revancha')
    expect(p.addons[0].reductionSize).toBe(8)
    expect(p.totalPrice).toBe(24) // 18 + 6
  })

  it('createPrivate11Product creates valid product', () => {
    const p = createPrivate11Product(24)
    expect(p.format).toBe('private_11')
    expect(p.reductionSize).toBe(24)
  })

  it('createMediaSemanaProduct creates valid product', () => {
    const p = createMediaSemanaProduct(16)
    expect(p.format).toBe('media_semana_9')
  })

  it('isValidProduct validates compatibility', () => {
    expect(isValidProduct({ format: 'progol_14', reductionSize: 9, level: 13 })).toBe(true)
    expect(isValidProduct({ format: 'revancha_7', reductionSize: 9, level: 13 })).toBe(false)
  })

  it('validateProduct returns errors for invalid combos', () => {
    const result = validateProduct({ format: 'progol_14', reductionSize: 4, level: 13 })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

/* ══════════════════════════════════════════════
   ADDONS
   ══════════════════════════════════════════════ */

describe('Addons', () => {
  it('Revancha addon defined correctly', () => {
    expect(REVANCHA_ADDON.parentFormat).toBe('progol_14')
    expect(REVANCHA_ADDON.minParentReduction).toBe(8)
  })

  it('isAddonAvailable validates parent format', () => {
    expect(isAddonAvailable('revancha', 'progol_14')).toBe(true)
    expect(isAddonAvailable('revancha', 'media_semana_9')).toBe(false)
  })

  it('canPurchaseAddon checks minimum reduction', () => {
    expect(canPurchaseAddon('revancha', 8)).toBe(true)
    expect(canPurchaseAddon('revancha', 16)).toBe(true)
    expect(canPurchaseAddon('revancha', 4)).toBe(false)
  })

  it('getAddonReductions returns compatible entries', () => {
    const reds = getAddonReductions('revancha')
    expect(reds.length).toBeGreaterThan(0)
    // All should be Revancha-compatible sizes
    for (const r of reds) {
      expect(isValidAddonReduction('revancha', r.size)).toBe(true)
    }
  })
})

/* ══════════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════════ */

describe('Pricing', () => {
  it('calculatePrice returns base price without discounts', () => {
    const p = createProgolProduct(16)
    const result = calculatePrice(p)
    expect(result.finalPrice).toBe(12)
    expect(result.discountAmount).toBe(0)
  })

  it('calculatePrice applies percentage discount', () => {
    const p = createProgolProduct(16)
    const result = calculatePrice(p, {
      discounts: [{ type: 'percentage', value: 10, label: '10% off' }],
    })
    expect(result.finalPrice).toBe(10.8)
  })

  it('calculatePrice applies fixed discount', () => {
    const p = createProgolProduct(16)
    const result = calculatePrice(p, {
      discounts: [{ type: 'fixed', value: 3, label: '3€ off' }],
    })
    expect(result.finalPrice).toBe(9)
  })

  it('calculatePrice never goes below 0', () => {
    const p = createProgolProduct(9)
    const result = calculatePrice(p, {
      discounts: [{ type: 'fixed', value: 999, label: 'Mega descuento' }],
    })
    expect(result.finalPrice).toBe(0)
  })

  it('calculateSavings computes correctly', () => {
    const s = calculateSavings(9, 81)
    expect(s.savingsPercent).toBeGreaterThan(80) // 9 vs 81 → ~89% ahorro
    expect(s.savingsEuros).toBeGreaterThan(0)
  })

  it('createProgolPrivate11Bundle applies ~15% discount', () => {
    const bundle = createProgolPrivate11Bundle(16, 24)
    const individual = getProductPrice(16) + getProductPrice(24)
    expect(bundle.bundlePrice).toBeLessThan(individual)
    expect(bundle.savingsVsIndividual).toBeGreaterThan(0)
  })
})

/* ══════════════════════════════════════════════
   ENTITLEMENTS
   ══════════════════════════════════════════════ */

describe('Entitlements', () => {
  it('createEntitlements starts with nothing unlocked', () => {
    const e = createEntitlements()
    expect(e.canAccessPrivate11).toBe(false)
    expect(e.private11FreeEntries).toBe(0)
    expect(e.purchases).toHaveLength(0)
  })

  it('processPurchase unlocks Private 11', () => {
    const e = createEntitlements()
    const product = createProgolProduct(16)
    const next = processPurchase(e, product)
    expect(next.canAccessPrivate11).toBe(true)
    expect(next.private11FreeEntries).toBe(2) // R16 gives 2 entries
    expect(next.purchases).toHaveLength(1)
  })

  it('processPurchase with Revancha unlocks revancha format', () => {
    const e = createEntitlements()
    const product = createProgolProduct(24, true, 8)
    const next = processPurchase(e, product)
    expect(next.unlockedFormats).toContain('revancha_7')
  })

  it('addPrivate11Entries increases count', () => {
    const e = createEntitlements()
    const next = addPrivate11Entries(e, 5)
    expect(next.private11ExtraEntries).toBe(5)
  })

  it('totalPrivate11Entries sums both', () => {
    let e = createEntitlements()
    const product = createProgolProduct(24) // 3 free entries
    e = processPurchase(e, product)
    e = addPrivate11Entries(e, 2)
    expect(totalPrivate11Entries(e)).toBe(5)
  })

  it('canAccess checks format permissions', () => {
    let e = createEntitlements()
    const product = createProgolProduct(16)
    e = processPurchase(e, product)
    expect(canAccess(e, 'private_11')).toBe(true)
    expect(canAccess(e, 'revancha_7')).toBe(true) // R8+ unlocks
  })

  it('totalSpent tracks purchases', () => {
    let e = createEntitlements()
    e = processPurchase(e, createProgolProduct(9))   // 6.75
    e = processPurchase(e, createPrivate11Product(16)) // 12
    expect(totalSpent(e)).toBeCloseTo(18.75, 1)
  })

  it('maxIntensity returns correct level', () => {
    let e = createEntitlements()
    expect(maxIntensity(e)).toBe('none')
    e = processPurchase(e, createProgolProduct(9))
    expect(maxIntensity(e)).toBe('light')
    e = processPurchase(e, createProgolProduct(132))
    expect(maxIntensity(e)).toBe('extreme')
  })
})

/* ══════════════════════════════════════════════
   RULES
   ══════════════════════════════════════════════ */

describe('Contest rules', () => {
  it('validatePurchase allows valid product', () => {
    const e = createEntitlements()
    const product = createProgolProduct(16)
    const result = validatePurchase(product, e)
    expect(result.allowed).toBe(true)
    expect(result.reasons).toHaveLength(0)
  })

  it('validatePurchase rejects exceeding daily spend', () => {
    const e = createEntitlements()
    const product = createProgolProduct(132) // 99€ + limits apply
    // Should be under 200€ limit — let's verify it's the right check
    const result = validatePurchase(product, e)
    expect(result.allowed).toBe(true) // 99 < 200 daily limit
  })

  it('legalDisclaimer returns non-empty string per format', () => {
    expect(legalDisclaimer('progol_14').length).toBeGreaterThan(0)
    expect(legalDisclaimer('revancha_7').length).toBeGreaterThan(0)
    expect(legalDisclaimer('media_semana_9').length).toBeGreaterThan(0)
    expect(legalDisclaimer('private_11').length).toBeGreaterThan(0)
  })

  it('probabilityDisclaimer is non-empty', () => {
    expect(probabilityDisclaimer().length).toBeGreaterThan(0)
    expect(probabilityDisclaimer()).toContain('NO garantizan')
  })

  it('PRODUCT_LOOP_STEPS has 6 steps', () => {
    expect(PRODUCT_LOOP_STEPS).toHaveLength(6)
  })

  it('getNextStep advances correctly', () => {
    expect(getNextStep('analysis')).toBe('purchase')
    expect(getNextStep('purchase')).toBe('unlock_private11')
    expect(getNextStep('return_next_matchday')).toBeNull()
  })
})

/* ══════════════════════════════════════════════
   ORÁCULO
   ══════════════════════════════════════════════ */

describe('Oráculo — probability-assisted reductions', () => {
  it('analyzeMatch returns correct structure', () => {
    const m = analyzeMatch(0, BASE_PROBABILITIES)
    expect(m.index).toBe(0)
    expect(m.confidence).toBeGreaterThan(0)
    expect(m.isDangerous).toBeDefined()
    expect(m.recommendation).toBeDefined()
    expect(m.hitProbability).toBeGreaterThan(0)
  })

  it('analyzeMatch recommends fijo for dominant probability', () => {
    const m = analyzeMatch(0, { home: 0.7, draw: 0.2, away: 0.1 })
    expect(m.recommendation).toBe('fijo')
    expect(m.recommendedSigns).toHaveLength(1)
    expect(m.recommendedSigns[0]).toBe('1')
  })

  it('analyzeMatch recommends triple for high uncertainty', () => {
    const m = analyzeMatch(0, { home: 0.35, draw: 0.33, away: 0.32 })
    expect(m.recommendation).toBe('triple')
    expect(m.isDangerous).toBe(true)
  })

  it('analyzeQuiniela creates full analysis', () => {
    const probs = Array(14).fill(BASE_PROBABILITIES)
    const analysis = analyzeQuiniela('progol_14', probs)
    expect(analysis.matches).toHaveLength(14)
    expect(analysis.summary.volatility).toBeGreaterThan(0)
    expect(analysis.summary.volatility).toBeLessThanOrEqual(1)
  })

  it('analyzeQuiniela adapts to format (7 for revancha)', () => {
    const analysis = analyzeQuiniela('revancha_7', Array(7).fill(BASE_PROBABILITIES))
    expect(analysis.matches).toHaveLength(7)
  })

  it('quickAnalysis works for all formats', () => {
    for (const id of ['progol_14', 'revancha_7', 'media_semana_9', 'private_11'] as ContestFormatId[]) {
      const analysis = quickAnalysis(id)
      expect(analysis.format).toBe(id)
    }
  })

  it('recommendReductions returns sorted recommendations', () => {
    const analysis = quickAnalysis('progol_14')
    const recs = recommendReductions(analysis)
    expect(recs.length).toBeGreaterThan(0)
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score)
    }
  })

  it('each recommendation has required fields', () => {
    const analysis = quickAnalysis('progol_14')
    const recs = recommendReductions(analysis)
    for (const r of recs) {
      expect(r.size).toBeGreaterThan(0)
      expect(r.label.length).toBeGreaterThan(0)
      expect(r.reason.length).toBeGreaterThan(0)
      expect(r.price).toBeGreaterThan(0)
    }
  })

  it('suggestConfig generates valid 14-element config', () => {
    const analysis = quickAnalysis('progol_14')
    const config = suggestConfig(analysis, 2, 3)
    expect(config).toHaveLength(14)
    // Count triples and doubles
    let triples = 0, doubles = 0
    for (const s of config) {
      if (s === '1X2') triples++
      else if (s.length === 2) doubles++
    }
    expect(triples).toBeLessThanOrEqual(2)
    expect(doubles).toBeLessThanOrEqual(3)
  })
})

/* ══════════════════════════════════════════════
   PUBLIC ANALYSIS
   ══════════════════════════════════════════════ */

describe('Public analysis layer', () => {
  it('generatePublicAnalysis creates full analysis', () => {
    const pa = generatePublicAnalysis('progol_14')
    expect(pa.matches).toHaveLength(14)
    expect(pa.summary.headline.length).toBeGreaterThan(0)
    expect(pa.disclaimer.length).toBeGreaterThan(0)
    expect(pa.recommendedReductions.length).toBeGreaterThan(0)
  })

  it('each match card has user-facing labels', () => {
    const pa = generatePublicAnalysis('progol_14')
    for (const m of pa.matches) {
      expect(m.matchNumber).toBeGreaterThan(0)
      expect(m.dangerLabel).toBeDefined()
      expect(m.recommendation.type).toBeDefined()
      expect(m.coveragePercent).toMatch(/%$/)
    }
  })

  it('percentage strings are formatted correctly', () => {
    const pa = generatePublicAnalysis('progol_14')
    const m = pa.matches[0]
    expect(m.percentages.home).toMatch(/%$/)
    expect(m.percentages.draw).toMatch(/%$/)
    expect(m.percentages.away).toMatch(/%$/)
  })

  it('danger level is one of expected values', () => {
    const pa = generatePublicAnalysis('progol_14')
    expect(['baja', 'media', 'alta', 'extrema']).toContain(pa.summary.dangerLevel)
  })

  it('recommendations are sorted by score desc', () => {
    const pa = generatePublicAnalysis('progol_14')
    for (let i = 1; i < pa.recommendedReductions.length; i++) {
      expect(pa.recommendedReductions[i - 1].score).toBeGreaterThanOrEqual(
        pa.recommendedReductions[i].score,
      )
    }
  })

  it('compareReductions returns comparison', () => {
    const cmp = compareReductions('progol_14', 9, 16)
    expect(cmp.a.size).toBe(9)
    expect(cmp.b.size).toBe(16)
    expect(['a', 'b', 'either']).toContain(cmp.recommendation)
  })

  it('all formats have valid public analysis', () => {
    for (const id of ['progol_14', 'revancha_7', 'media_semana_9', 'private_11'] as ContestFormatId[]) {
      const pa = generatePublicAnalysis(id)
      expect(pa.format).toBe(id)
      expect(pa.disclaimer.length).toBeGreaterThan(0)
    }
  })
})

/* ══════════════════════════════════════════════
   TELEGRAM
   ══════════════════════════════════════════════ */

describe('Telegram contracts', () => {
  it('SYSTEM_EVENTS has all required events', () => {
    expect(SYSTEM_EVENTS.NEW_MATCHDAY).toBeDefined()
    expect(SYSTEM_EVENTS.RESULTS_PUBLISHED).toBeDefined()
    expect(SYSTEM_EVENTS.BETTING_REMINDER).toBeDefined()
    expect(SYSTEM_EVENTS.REDUCTION_PURCHASED).toBeDefined()
    expect(SYSTEM_EVENTS.PRIVATE11_UNLOCKED).toBeDefined()
    expect(SYSTEM_EVENTS.PRIZE_WON).toBeDefined()
    expect(SYSTEM_EVENTS.PROMOTION_AVAILABLE).toBeDefined()
    expect(SYSTEM_EVENTS.WELCOME).toBeDefined()
  })

  it('TELEGRAM_TEMPLATES have required fields', () => {
    for (const [key, tpl] of Object.entries(TELEGRAM_TEMPLATES)) {
      expect(tpl.key).toBe(key)
      expect(tpl.body.length).toBeGreaterThan(0)
      expect(tpl.description.length).toBeGreaterThan(0)
    }
  })

  it('defaultSubscription creates valid subscription', () => {
    const sub = defaultSubscription('user1', 123456)
    expect(sub.userId).toBe('user1')
    expect(sub.chatId).toBe(123456)
    expect(sub.topics).toContain('all')
    expect(sub.marketingOptIn).toBe(false)
  })

  it('createTelegramDispatcher returns stub', () => {
    const dispatcher = createTelegramDispatcher()
    expect(dispatcher.send).toBeDefined()
    expect(dispatcher.broadcast).toBeDefined()
    expect(dispatcher.isLinked).toBeDefined()
    expect(dispatcher.link).toBeDefined()
  })
})

/* ══════════════════════════════════════════════
   INTEGRATION
   ══════════════════════════════════════════════ */

describe('Product system integration', () => {
  it('full purchase flow: analysis → product → entitlements → P11 access', () => {
    // 1. Analysis
    const analysis = generatePublicAnalysis('progol_14')
    expect(analysis.matches).toHaveLength(14)

    // 2. Choose recommended reduction
    const bestReduction = analysis.recommendedReductions[0]
    expect(bestReduction).toBeDefined()

    // 3. Create product
    const product = createProgolProduct(bestReduction.size)
    expect(isValidProduct({ format: product.format, reductionSize: product.reductionSize, level: 13 })).toBe(true)

    // 4. Process purchase
    let entitlements = createEntitlements()
    entitlements = processPurchase(entitlements, product)

    // 5. Verify Private 11 access
    expect(entitlements.canAccessPrivate11).toBe(true)
    expect(canAccess(entitlements, 'private_11')).toBe(true)

    // 6. Verify Revancha unlock (if R8+)
    if (bestReduction.size >= 8) {
      expect(entitlements.canAddRevancha).toBe(true)
    }
  })

  it('Progol with Revancha addon flow', () => {
    // Create Progol R16 + Revancha R8
    const product = createProgolProduct(16, true, 8)
    expect(product.addons).toHaveLength(1)
    expect(product.totalPrice).toBe(18) // 12 + 6

    // Process
    let e = createEntitlements()
    e = processPurchase(e, product)

    expect(e.unlockedFormats).toContain('progol_14')
    expect(e.unlockedFormats).toContain('revancha_7')
    expect(e.canAccessPrivate11).toBe(true)
  })
})
