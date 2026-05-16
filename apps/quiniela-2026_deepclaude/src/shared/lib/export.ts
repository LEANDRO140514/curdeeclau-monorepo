import type { Signo, BoletosGenerados } from '../types'

/** Exportar configuración a CSV */
export function exportarCSV(data: BoletosGenerados): void {
  let csv = 'Partido,Signo\n'
  data.config.forEach((signo, i) => {
    csv += `${i + 1},${signo}\n`
  })
  if (data.columnas) {
    csv += '\nColumnas generadas\n'
    csv += 'Boleto,' + Array.from({ length: 14 }, (_, i) => `P${i + 1}`).join(',') + '\n'
    data.columnas.forEach((col, idx) => {
      csv += `${idx + 1},${col.join(',')}\n`
    })
  }
  descargarArchivo(csv, `quiniela_${data.modelo}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;')
}

/** Exportar a texto plano (para WhatsApp) */
export function exportarTexto(data: BoletosGenerados): string {
  let txt = `🎯 Progol — ${data.titulo}\n`
  txt += `📋 ${data.boletos.toLocaleString('es-MX')} boletos | 💰 ${data.precio}\n`
  txt += `📉 Ahorro: ${data.ahorro} | 🛡️ ${data.garantia}\n\n`
  txt += `🏟️ CONFIGURACIÓN:\n`
  data.config.forEach((s, i) => {
    const emoji = s === '1X2' ? '🔴' : s.length === 2 ? '🟡' : '🟢'
    txt += `P${String(i + 1).padStart(2, '0')}: ${emoji} [${s}]\n`
  })
  if (data.columnas) {
    txt += `\n📊 PRIMERAS 10 COLUMNAS:\n`
    data.columnas.slice(0, 10).forEach((col, idx) => {
      txt += `B${String(idx + 1).padStart(2, '0')}: ${col.join(' ')}\n`
    })
    if (data.columnas.length > 10) txt += `... y ${data.columnas.length - 10} más\n`
  }
  return txt
}

/** Copiar al portapapeles */
export async function copiarPortapapeles(data: BoletosGenerados): Promise<boolean> {
  try {
    const texto = exportarTexto(data)
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

/** Descargar archivo genérico */
function descargarArchivo(contenido: string, nombre: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

/** Simular exportación de imagen (genera un mensaje para el usuario) */
export function exportarImagen(data: BoletosGenerados): string {
  // En una versión real usaríamos html2canvas, aquí simulamos
  return `🖼️ Preview de imagen generada para "${data.titulo}" con ${data.boletos} boletos.`
}
