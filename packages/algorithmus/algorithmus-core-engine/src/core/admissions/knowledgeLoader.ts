// ── UV-KB: Knowledge Loader ──────────────────────────────────
//
// Canonical knowledge loading for Universidad Latino admissions.
// Parses CSV catalog + MD files into AdmissionsKnowledge.
//
// Pattern: humans maintain CSV (easy to version diff), system
// parses & injects as markdown table into LLM prompt.
//
// Autoridad: UV-KB-1, UV-KB-2

import * as fs from 'fs';
import * as path from 'path';
import type { AdmissionsKnowledge } from './types';

// ── CSV → Markdown Table ──────────────────────────────────

/** Columns to include in the LLM-facing markdown table */
const TABLE_COLUMNS = [
  'Carrera',
  'Área académica',
  'Duración',
  'Modalidad',
  'Costo mensual',
  'Costo inscripción',
  'Campus',
  'Becas de Excelencia',
];

/**
 * Parse a CSV string into an array of row objects.
 * Handles quoted fields, embedded commas, and CRLF/LF line endings.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Double-quote inside quotes = escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Convert parsed CSV rows into a clean markdown table for LLM injection.
 * Only includes columns defined in TABLE_COLUMNS.
 */
export function catalogToMarkdown(rows: Record<string, string>[]): string {
  if (rows.length === 0) return '';

  // Find which of the desired columns actually exist
  const available = TABLE_COLUMNS.filter((col) => col in rows[0]);
  if (available.length === 0) return '';

  // Build markdown table
  const header = '| ' + available.join(' | ') + ' |';
  const separator = '|' + available.map(() => '---').join('|') + '|';
  const body = rows.map((row) =>
    '| ' + available.map((col) => row[col] ?? '').join(' | ') + ' |',
  );

  return [header, separator, ...body].join('\n');
}

/**
 * Parse a CSV catalog string into a markdown table ready for LLM prompts.
 * Single-step convenience: CSV text → markdown table.
 */
export function parseCatalogCSV(csvText: string): string {
  const rows = parseCSV(csvText);
  return catalogToMarkdown(rows);
}

// ── Knowledge Loading ─────────────────────────────────────

let _cachedKnowledge: AdmissionsKnowledge | null = null;

function getKnowledgeDir(): string {
  // Resolve from engine package root (cwd when run via `pnpm tsx` or `pnpm test`)
  return path.resolve(process.cwd(), '../../../verticals/universidad-latino/knowledge');
}

function loadFile(filename: string): string {
  const filePath = path.join(getKnowledgeDir(), filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[uv-knowledge] Missing knowledge file: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Load the full knowledge base from the vertical's knowledge directory.
 * Cached after first call — subsequent calls return the same instance.
 *
 * Files loaded:
 *   - catalogo-carreras.csv   → parsed into catalogoCarreras (markdown table)
 *   - faq-informativa.md      → combined into faq
 *   - faq-conversacional.md   → combined into faq
 *   - oferta-academica.md     → ofertaAcademica
 *   - comportamiento-agente.md → systemPromptTemplate (personality + placeholders)
 */
export function loadKnowledge(): AdmissionsKnowledge {
  if (_cachedKnowledge) return _cachedKnowledge;

  const csvRaw = loadFile('catalogo-carreras.csv');
  const catalogoCarreras = csvRaw ? parseCatalogCSV(csvRaw) : '';

  const faq = [
    loadFile('faq-informativa.md'),
    loadFile('faq-conversacional.md'),
  ].filter(Boolean).join('\n\n---\n\n');

  const ofertaAcademica = loadFile('oferta-academica.md');
  const comportamiento = loadFile('comportamiento-agente.md');

  const placeholders = [
    '## CATÁLOGO DE CARRERAS',
    '{{CATALOGO_CARRERAS}}',
    '',
    '## CONOCIMIENTO',
    '{{KNOWLEDGE}}',
    '',
    '## OFERTA ACADÉMICA',
    '{{OFERTA_ACADEMICA}}',
    '',
    '## DATOS RECOLECTADOS',
    '{{COLLECTED_DATA}}',
    '',
    '## PRÓXIMO DATO',
    '{{NEXT_FIELD}}',
  ].join('\n');

  const systemPromptTemplate = comportamiento
    ? `${comportamiento}\n\n---\n\n${placeholders}`
    : `Eres el asistente virtual de admisiones de Universidad Latino. Responde preguntas frecuentes, recolecta datos del prospecto y confirma antes de registrar.\n\n${placeholders}`;

  _cachedKnowledge = { faq, ofertaAcademica, catalogoCarreras, systemPromptTemplate };
  return _cachedKnowledge;
}

/** Clear the knowledge cache (useful for tests) */
export function clearKnowledgeCache(): void {
  _cachedKnowledge = null;
}
