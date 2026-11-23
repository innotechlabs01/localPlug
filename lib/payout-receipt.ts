// Payout receipt as a professional PDF using pdf-lib (pure JS, serverless safe).
// Used by the driver/hotel payout statement endpoints for format=pdf.
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'
import type { PayoutStatement } from '@/lib/payout'

const GOLD = rgb(0.83, 0.66, 0.29)
const DARK = rgb(0.13, 0.13, 0.13)
const MUTED = rgb(0.5, 0.5, 0.5)
const LINE = rgb(0.9, 0.9, 0.9)
const W = 612
const H = 792
const M = 48

export async function statementToPdf(
  stmt: PayoutStatement,
  opts: { payeeType: 'driver' | 'hotel'; payeeName: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  let page = doc.addPage([W, H])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = H - M
  const right = (text: string, size: number, f: PDFFont) => W - M - f.widthOfTextAtSize(text, size)

  const label = opts.payeeType === 'driver' ? 'Estado de cuenta · Conductor' : 'Estado de cuenta · Hotel'

  // Header
  page.drawText('LocalPlug', { x: M, y, size: 26, font: bold, color: GOLD })
  page.drawText(label, { x: M, y: y - 22, size: 13, font, color: MUTED })
  page.drawText(`Periodo: ${stmt.period}`, { x: right(`Periodo: ${stmt.period}`, 13, bold), y, size: 13, font: bold, color: DARK })
  page.drawText(opts.payeeName, { x: right(opts.payeeName, 12, font), y: y - 22, size: 12, font, color: DARK })

  y -= 52
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE })
  y -= 24

  // Table header
  page.drawText('Reserva', { x: M, y, size: 10, font: bold, color: MUTED })
  page.drawText('Monto (USD)', { x: 230, y, size: 10, font: bold, color: MUTED })
  page.drawText('Estado', { x: 350, y, size: 10, font: bold, color: MUTED })
  page.drawText('Fecha', { x: 440, y, size: 10, font: bold, color: MUTED })
  y -= 18

  const rowHeight = 18
  const lines = stmt.lines
  const overflow = lines.length - Math.floor((y - 140) / rowHeight)

  for (const l of lines) {
    if (y < 120) {
      page = doc.addPage([W, H])
      y = H - M
    }
    page.drawText(String(l.booking_reference || ''), { x: M, y, size: 10, font, color: DARK })
    page.drawText(l.amount_usd.toFixed(2), { x: 230, y, size: 10, font, color: DARK })
    page.drawText(l.status, { x: 350, y, size: 10, font, color: l.status === 'paid' ? rgb(0.29, 0.65, 0.5) : DARK })
    page.drawText((l.earned_at || '').slice(0, 10), { x: 440, y, size: 10, font, color: MUTED })
    y -= rowHeight
  }
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.8, color: LINE })

  // Totals
  y -= 22
  if (overflow > 0) {
    const overText = `… y ${overflow} registros más (descarga CSV para el detalle completo)`
    page.drawText(overText, { x: M, y, size: 9, font, color: MUTED })
    y -= 18
  }
  const totalText = `Total del periodo  ${Number(stmt.total || 0).toFixed(2)} USD`
  page.drawText(totalText, { x: right(totalText, 14, bold), y, size: 14, font: bold, color: DARK })
  y -= 20
  const detailText = `Disponible: ${Number(stmt.total - stmt.requested - stmt.paid - stmt.written_off).toFixed(2)}   Solicitado: ${Number(stmt.requested).toFixed(2)}   Pagado: ${Number(stmt.paid).toFixed(2)}   Write-off: ${Number(stmt.written_off).toFixed(2)}`
  page.drawText(detailText, { x: right(detailText, 9, font), y, size: 9, font, color: MUTED })

  // Footer
  const foot = 'LocalPlug · Pagos por transferencia · Thank you for being part of the network'
  const footWidth = font.widthOfTextAtSize(foot, 8)
  page.drawText(foot, { x: (W - footWidth) / 2, y: M - 24, size: 8, font, color: MUTED })

  return doc.save()
}