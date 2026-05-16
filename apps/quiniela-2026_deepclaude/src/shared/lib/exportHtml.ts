import type { BoletosGenerados } from '../types'
import type { Signo } from '../../lib/quiniela'

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 11pt;
  color: #111;
  padding: 20px;
  max-width: 100%;
}
h1 { font-size: 16pt; font-weight: 700; margin-bottom: 4px; }
h2 { font-size: 12pt; font-weight: 600; color: #333; margin-bottom: 12px; }
.header { border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
.header-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10pt; color: #555; margin-top: 8px; }
.header-meta span { background: #f0f0f0; padding: 2px 10px; border-radius: 4px; }
.config-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 20px; }
.config-pill {
  padding: 2px 8px; font-size: 9pt; font-weight: 600; border: 1px solid #999;
  border-radius: 4px; min-width: 32px; text-align: center;
}
.config-pill.triple { border-color: #cc00aa; color: #cc00aa; border-width: 2px; }
.config-pill.doble { border-color: #0088cc; color: #0088cc; border-width: 2px; }
.config-pill.fijo { border-color: #999; color: #555; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th { background: #111; color: #fff; padding: 6px 4px; font-size: 9pt; font-weight: 600; text-align: center; }
td { padding: 5px 4px; font-size: 10pt; text-align: center; border-bottom: 1px solid #e0e0e0; }
tr:nth-child(even) td { background: #f5f5f5; }
.col-num { color: #999; font-size: 9pt; width: 30px; }
.info-box {
  background: #fff8e1; border: 1px solid #ffc107; padding: 16px;
  border-radius: 8px; text-align: center; margin: 24px 0; font-size: 11pt;
}
.footer {
  margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd;
  font-size: 9pt; color: #888; text-align: center;
}
.page-break { page-break-before: always; }
@media print {
  @page { size: A4; margin: 1.2cm; }
  body { padding: 0; }
  tr:nth-child(even) td { background: #f5f5f5 !important; print-color-adjust: exact; }
  th { print-color-adjust: exact; }
  .page-break { page-break-before: auto; }
  .no-print { display: none; }
}
`

function signoEscrito(s: string): string {
  if (s === '1X2') return '1X2'
  if (s.length === 2) return s
  return s
}

function signoClass(s: string): string {
  if (s === '1X2') return 'triple'
  if (s.length === 2) return 'doble'
  return 'fijo'
}

export function exportarHTML(resultado: BoletosGenerados): { ok: boolean; reason?: string } {
  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const tieneColumnas = resultado.columnas && resultado.columnas.length > 0

  // Tabla o info box
  let cuerpoHTML: string
  if (tieneColumnas) {
    const thead = '<tr><th>#</th>' + Array.from({ length: 14 }, (_, i) => `<th>P${i + 1}</th>`).join('') + '</tr>'
    const filas: string[] = []
    const columnas = resultado.columnas!
    for (let i = 0; i < columnas.length; i++) {
      // Page break cada 40 filas para impresión
      const pageBreak = i > 0 && i % 40 === 0 ? ' class="page-break"' : ''
      const celdas = columnas[i].map((s) => `<td>${signoEscrito(s)}</td>`).join('')
      filas.push(`<tr${pageBreak}><td class="col-num">${i + 1}</td>${celdas}</tr>`)
    }
    cuerpoHTML = `<table><thead>${thead}</thead><tbody>${filas.join('\n')}</tbody></table>`
  } else {
    cuerpoHTML = `<div class="info-box">
      Esta reducción tiene <strong>${resultado.boletos.toLocaleString('es-MX')} boletos</strong>
      garantizados al nivel especificado, pero las columnas aún no están integradas en el motor.
    </div>`
  }

  const configPills = resultado.config
    .map((s, i) => {
      const label = `${i + 1}: ${signoEscrito(s)}`
      return `<span class="config-pill ${signoClass(s)}" title="P${i + 1}">${label}</span>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Quiniela — ${resultado.titulo}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="header">
    <h1>${resultado.titulo}</h1>
    <h2>${fecha}</h2>
    <div class="header-meta">
      <span>${resultado.boletos.toLocaleString('es-MX')} boletos</span>
      ${resultado.precio ? `<span>${resultado.precio}</span>` : ''}
      ${resultado.ahorro ? `<span>Ahorro: ${resultado.ahorro}</span>` : ''}
      <span>${resultado.garantia}</span>
    </div>
  </div>

  <div class="config-row">${configPills}</div>

  ${cuerpoHTML}

  <div class="footer">
    Genera tu boleto en la ventanilla oficial. Esta guía es generada por quiniela-engine.
  </div>

  <div class="footer no-print" style="margin-top:8px;color:#aaa;">
    Pulsa Ctrl+P (Cmd+P en Mac) para imprimir esta hoja.
  </div>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) {
    // Fallback: download
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiniela_${resultado.modelo}_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
    return { ok: true, reason: 'popup-blocked-download' }
  }

  w.document.write(html)
  w.document.close()
  return { ok: true }
}
