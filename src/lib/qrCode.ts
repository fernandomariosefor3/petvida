/** Loaded dynamically so the QR encoder never lands in the main bundle — only pulled in when the SOS modal opens. */
export async function generateQrDataUrl(text: string, size = 512): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(text, { width: size, margin: 1 });
}

export function downloadQrPng(dataUrl: string, petName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `qr-sos-${petName.toLowerCase().replace(/\s+/g, '-')}.png`;
  link.click();
}

/** jsPDF (~400kB) is dynamically imported here too, same reasoning as generateQrDataUrl — it's already lazy-loaded elsewhere (src/lib/pdf.ts) and a static import here would pull it back into the main bundle. */
export async function downloadQrPdf(dataUrl: string, petName: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129);
  doc.text('Perfil SOS — PetVida Care', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(petName, pageWidth / 2, 30, { align: 'center' });

  const qrSize = 100;
  doc.addImage(dataUrl, 'PNG', (pageWidth - qrSize) / 2, 40, qrSize, qrSize);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Escaneie para ver os dados de emergência e o contato do tutor.', pageWidth / 2, 150, { align: 'center' });

  doc.save(`qr-sos-${petName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
