import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface LicenseReciboPdfPayload {
  filename: string;
  issuedAt: string;
  clientName?: string;
  clientPhone?: string;
  rows: [string, string][];
  note?: string;
}

export interface LicenseExtratoPdfPayload {
  filename: string;
  issuedAt: string;
  clientName?: string;
  clientPhone?: string;
  summary: [string, string][];
  payments: {
    receipt: string;
    date: string;
    status: string;
    amount: string;
    period: string;
    validUntil: string;
    txId: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class LicenseReceiptPdfService {
  private readonly brand: [number, number, number] = [15, 118, 110];
  private readonly margin = 18;

  downloadRecibo(payload: LicenseReciboPdfPayload): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = this.drawHeader(doc, 'Recibo de pagamento — Licença', payload.issuedAt);
    y = this.drawClient(doc, y, payload.clientName, payload.clientPhone);
    y = this.drawMetaTable(doc, y, payload.rows);
    if (payload.note) {
      y = this.drawNote(doc, y, payload.note);
    }
    this.drawFooter(doc);
    doc.save(payload.filename.endsWith('.pdf') ? payload.filename : `${payload.filename}.pdf`);
  }

  downloadExtrato(payload: LicenseExtratoPdfPayload): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = this.drawHeader(doc, 'Extrato de pagamentos da licença', payload.issuedAt);
    y = this.drawClient(doc, y, payload.clientName, payload.clientPhone);
    y = this.drawMetaTable(doc, y, payload.summary);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...this.brand);
    doc.text('DETALHE DOS PAGAMENTOS', this.margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Recibo', 'Data', 'Estado', 'Valor', 'Validade', 'Válida até', 'ID e-Mola']],
      body: payload.payments.map((p) => [
        p.receipt,
        p.date,
        p.status,
        p.amount,
        p.period,
        p.validUntil,
        p.txId,
      ]),
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: {
        fillColor: [236, 253, 245],
        textColor: this.brand,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { fontStyle: 'bold', fontSize: 8 },
        3: { halign: 'right', fontStyle: 'bold' },
        6: { font: 'courier', fontSize: 7 },
      },
    });

    this.drawFooter(doc);
    doc.save(payload.filename.endsWith('.pdf') ? payload.filename : `${payload.filename}.pdf`);
  }

  private drawHeader(doc: jsPDF, title: string, issuedAt: string): number {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...this.brand);
    doc.text('Flow Cakes', this.margin, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Gestão para negócios de pastelaria e catering', this.margin, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, pageW - this.margin, 22, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Emitido em ${issuedAt}`, pageW - this.margin, 28, { align: 'right' });

    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.6);
    doc.line(this.margin, 32, pageW - this.margin, 32);

    return 38;
  }

  private drawClient(doc: jsPDF, y: number, name?: string, phone?: string): number {
    if (!name && !phone) return y;
    const pageW = doc.internal.pageSize.getWidth();
    const text = `Cliente: ${name || '—'}${phone ? ` · ${phone}` : ''}`;
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(this.margin, y, pageW - this.margin * 2, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(text, this.margin + 4, y + 6.5);
    return y + 14;
  }

  private drawMetaTable(doc: jsPDF, y: number, rows: [string, string][]): number {
    autoTable(doc, {
      startY: y,
      body: rows,
      theme: 'grid',
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: {
          cellWidth: 62,
          fillColor: [248, 250, 252],
          textColor: [71, 85, 105],
          fontStyle: 'bold',
        },
        1: { fontStyle: 'bold', textColor: [15, 23, 42] },
      },
    });
    return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  }

  private drawNote(doc: jsPDF, y: number, note: string): number {
    const pageW = doc.internal.pageSize.getWidth();
    const w = pageW - this.margin * 2;
    const lines = doc.splitTextToSize(note, w - 8);
    const h = lines.length * 5 + 8;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.8);
    doc.rect(this.margin, y, w, h, 'F');
    doc.line(this.margin, y, this.margin, y + h);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(lines, this.margin + 4, y + 6);
    return y + h + 6;
  }

  private drawFooter(doc: jsPDF): void {
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    const y = pageH - 16;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(this.margin, y - 4, pageW - this.margin, y - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Documento gerado automaticamente pelo Flow Cakes · Valores em meticais (MZN)',
      pageW / 2,
      y,
      { align: 'center' }
    );
  }
}
