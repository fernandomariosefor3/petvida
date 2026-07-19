import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Pet, HealthRecord, Reminder } from '@/types';

export type PdfPeriod = '6m' | '1y' | 'all';

const HEALTH_TYPE_LABELS: Record<string, string> = {
  appointment: 'Consulta', vaccine: 'Vacina', weight: 'Pesagem',
  exam: 'Exame', surgery: 'Cirurgia', other: 'Outro',
};

function periodCutoff(period: PdfPeriod): Date | null {
  if (period === 'all') return null;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - (period === '6m' ? 6 : 12));
  return cutoff;
}

function formatDate(d: string): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

function getAge(birthDate: string): string {
  if (!birthDate) return '—';
  const bd = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (months < 12) return `${months} meses`;
  return `${Math.floor(months / 12)} anos`;
}

export function exportPetHealthPdf(
  pet: Pet,
  healthRecords: HealthRecord[],
  reminders: Reminder[],
  period: PdfPeriod = 'all'
): void {
  const cutoff = periodCutoff(period);
  const records = healthRecords
    .filter((h) => h.petId === pet.id)
    .filter((h) => !cutoff || new Date(h.date) >= cutoff)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingVaccines = reminders
    .filter((r) => r.petId === pet.id && r.type === 'vaccine' && !r.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129);
  doc.text('PetVida Care', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text('Histórico de saúde do pet', 14, 25);

  doc.setDrawColor(230, 230, 230);
  doc.line(14, 30, pageWidth - 14, 30);

  // Pet basic info
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text(pet.name, 14, 40);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const infoLine = [
    pet.breed || pet.species,
    getAge(pet.birthDate),
    pet.weight ? `${pet.weight} kg` : null,
    pet.microchip ? `Microchip: ${pet.microchip}` : null,
  ].filter(Boolean).join('  ·  ');
  doc.text(infoLine, 14, 47);

  let cursorY = 56;

  // Upcoming vaccines
  if (upcomingVaccines.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Próximos reforços de vacina', 'Data']],
      body: upcomingVaccines.map((r) => [r.title, formatDate(r.date)]),
      theme: 'plain',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9 },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Vaccines history
  const vaccineRecords = records.filter((h) => h.type === 'vaccine');
  if (vaccineRecords.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Data', 'Vacina', 'Veterinário/Clínica']],
      body: vaccineRecords.map((h) => [formatDate(h.date), h.notes || '—', [h.vet, h.clinic].filter(Boolean).join(' / ') || '—']),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9 },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Consultations
  const consultRecords = records.filter((h) => h.type === 'appointment' || h.type === 'exam' || h.type === 'surgery');
  if (consultRecords.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Data', 'Tipo', 'Veterinário', 'Clínica', 'Observações']],
      body: consultRecords.map((h) => [
        formatDate(h.date), HEALTH_TYPE_LABELS[h.type] ?? h.type, h.vet || '—', h.clinic || '—', h.notes || '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9 },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Weight evolution
  const weightRecords = records.filter((h) => h.type === 'weight' && h.weight).reverse();
  if (weightRecords.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Data', 'Peso (kg)']],
      body: weightRecords.map((h) => [formatDate(h.date), String(h.weight)]),
      theme: 'plain',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} por PetVida Care`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`historico-${pet.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
