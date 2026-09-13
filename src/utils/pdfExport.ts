import { jsPDF } from 'jspdf';

export interface PdfReportSection {
  label: string;
  value: string;
  isHighlight?: boolean;
}

export interface PdfReportData {
  title: string;
  subtitle?: string;
  dateStr?: string;
  metrics: PdfReportSection[];
  tableHeaders?: string[];
  tableRows?: string[][];
  notes?: string;
}

export function generatePdfReport(data: PdfReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Header Banner Background
  doc.setFillColor(10, 10, 12); // #0a0a0c Obsidian
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title
  doc.setTextColor(16, 185, 129); // Emerald #10b981
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SMART CALCULATOR FINANCIAL REPORT', 14, yPos);

  yPos += 8;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(data.title.toUpperCase(), 14, yPos);

  if (data.subtitle) {
    yPos += 6;
    doc.setTextColor(156, 163, 175); // gray-400
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(data.subtitle, 14, yPos);
  }

  const currentDate = data.dateStr || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(9);
  doc.text(`Generated on: ${currentDate}`, pageWidth - 14, 15, { align: 'right' });

  yPos = 45;

  // Key Metrics Grid
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text('KEY FINANCIAL METRICS', 14, yPos);
  yPos += 6;

  const colWidth = (pageWidth - 28) / 2;
  data.metrics.forEach((m, idx) => {
    const col = idx % 2;
    const x = 14 + col * colWidth;

    if (col === 0 && idx > 0) {
      yPos += 12;
    }

    doc.setFillColor(243, 244, 246); // Light gray background box
    doc.roundedRect(x, yPos - 4, colWidth - 4, 11, 2, 2, 'F');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(m.label, x + 3, yPos + 1);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    if (m.isHighlight) {
      doc.setTextColor(234, 88, 12); // Darker orange
    } else {
      doc.setTextColor(17, 24, 39);
    }
    doc.text(m.value, x + colWidth - 8, yPos + 1, { align: 'right' });
  });

  yPos += 18;

  // Table Data if present
  if (data.tableHeaders && data.tableRows && data.tableRows.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text('SCHEDULE & BREAKDOWN', 14, yPos);
    yPos += 6;

    // Header row
    doc.setFillColor(234, 88, 12);
    doc.rect(14, yPos, pageWidth - 28, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);

    const numCols = data.tableHeaders.length;
    const tableColWidth = (pageWidth - 28) / numCols;

    data.tableHeaders.forEach((header, i) => {
      const align = i === 0 ? 'left' : 'right';
      const xPos = i === 0 ? 16 : 14 + (i + 1) * tableColWidth - 4;
      doc.text(header, xPos, yPos + 5, { align });
    });

    yPos += 8;

    // Rows
    data.tableRows.slice(0, 30).forEach((row, rowIdx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 15;
      }

      if (rowIdx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, yPos - 4, pageWidth - 28, 6, 'F');
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);

      row.forEach((cell, i) => {
        const align = i === 0 ? 'left' : 'right';
        const xPos = i === 0 ? 16 : 14 + (i + 1) * tableColWidth - 4;
        doc.text(cell, xPos, yPos, { align });
      });

      yPos += 6;
    });
  }

  // Footer Note
  if (data.notes) {
    yPos = Math.max(yPos + 10, 270);
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(data.notes, 14, yPos);
  }

  // Save / Download PDF
  const filename = `${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_report.pdf`;
  doc.save(filename);
}
