import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';

export interface RevenueByMonthDto {
  month: string;
  revenue: number;
}

export interface ReportsExportSummary {
  label: string;
  value: string;
  detail?: string;
}

export interface ReportsExportPayload {
  isAdmin: boolean;
  userName?: string;
  extractedAt: Date;
  periodLabel: string;
  summary: ReportsExportSummary[];
  revenueByMonth: RevenueByMonthDto[];
  chartImageDataUrl?: string;
  chartTitle?: string;
  chartBreakdown?: { label: string; value: number; color: string }[];
}

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

@Injectable({ providedIn: 'root' })
export class ReportsExportService {
  private readonly brand: [number, number, number] = [15, 118, 110];
  private readonly margin = 18;
  private readonly logoUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${BRAND_ASSETS.logoFull}`;
  private logoBase64Cache: string | null = null;

  async exportPdf(payload: ReportsExportPayload): Promise<void> {
    const logo = await this.loadLogoBase64();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = this.drawHeader(doc, payload, logo);

    y = this.drawSectionTitle(doc, y, 'Informação do documento');
    const metaRows: [string, string][] = [
      ['Data de extracção', this.formatDateTime(payload.extractedAt)],
      ['Período do relatório', payload.periodLabel],
      ...(payload.userName ? [['Utilizador', payload.userName] as [string, string]] : []),
    ];
    y = this.drawMetaTable(doc, y, metaRows) + 6;

    if (payload.summary.length > 0) {
      y = this.ensureSpace(doc, y, 24);
      y = this.drawSectionTitle(doc, y, 'Resumo do período');
      y = this.drawSummaryTable(doc, y, payload.summary) + 6;
    }

    if (payload.chartImageDataUrl) {
      y = this.ensureSpace(doc, y, 78);
      y = this.drawSectionTitle(doc, y, payload.chartTitle ?? 'Distribuição financeira');
      y = this.drawChartImage(doc, y, payload.chartImageDataUrl) + 4;

      if (payload.chartBreakdown?.length) {
        y = this.ensureSpace(doc, y, 24);
        y = this.drawBreakdownTable(doc, y, payload.chartBreakdown) + 6;
      }
    }

    if (payload.revenueByMonth.length > 0) {
      y = this.ensureSpace(doc, y, 24);
      y = this.drawSectionTitle(
        doc,
        y,
        payload.isAdmin ? 'Receita por mês (plataforma)' : 'Receita por mês',
      );
      this.drawRevenueTable(doc, y, payload.revenueByMonth);
    }

    this.drawFooter(doc);
    doc.save(this.buildFilename(payload));
  }

  private drawHeader(doc: jsPDF, payload: ReportsExportPayload, logoDataUrl: string): number {
    const pageW = doc.internal.pageSize.getWidth();
    let textX = this.margin;

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', this.margin, 12, 18, 18);
        textX = this.margin + 22;
      } catch {
        // Logo opcional — continua só com texto
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...this.brand);
    doc.text('Flow Cakes', textX, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Relatório financeiro — ${payload.isAdmin ? 'Administração' : 'Análise do negócio'}`,
      textX,
      26,
    );

    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.6);
    doc.line(this.margin, 32, pageW - this.margin, 32);

    return 38;
  }

  private drawSectionTitle(doc: jsPDF, y: number, title: string): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...this.brand);
    doc.text(title.toUpperCase(), this.margin, y);
    return y + 6;
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
    return (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? y + 20;
  }

  private drawSummaryTable(doc: jsPDF, y: number, summary: ReportsExportSummary[]): number {
    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor', 'Detalhe']],
      body: summary.map((row) => [row.label, row.value, row.detail ?? '—']),
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [236, 253, 245],
        textColor: this.brand,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold', textColor: this.brand },
        2: { textColor: [100, 116, 139] },
      },
    });
    return (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? y + 20;
  }

  private drawChartImage(doc: jsPDF, y: number, dataUrl: string): number {
    const pageW = doc.internal.pageSize.getWidth();
    const maxW = pageW - this.margin * 2;
    const imgH = 68;
    doc.addImage(dataUrl, 'PNG', this.margin, y, maxW, imgH);
    return y + imgH;
  }

  private drawBreakdownTable(
    doc: jsPDF,
    y: number,
    slices: { label: string; value: number; color: string }[],
  ): number {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor (MZN)', 'Peso']],
      body: slices.map((slice) => {
        const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0.0';
        return [slice.label, this.formatMoney(slice.value), `${pct}%`];
      }),
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [236, 253, 245],
        textColor: this.brand,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold', textColor: this.brand },
        2: { textColor: [100, 116, 139] },
      },
    });
    return (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? y + 20;
  }

  private drawRevenueTable(doc: jsPDF, y: number, revenueByMonth: RevenueByMonthDto[]): number {
    autoTable(doc, {
      startY: y,
      head: [['Mês', 'Receita (MZN)']],
      body: revenueByMonth.map((row) => [
        this.formatMonthLabel(row.month),
        this.formatMoney(row.revenue),
      ]),
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [236, 253, 245],
        textColor: this.brand,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold', textColor: this.brand },
      },
    });
    return (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? y + 20;
  }

  private ensureSpace(doc: jsPDF, y: number, needed: number): number {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + needed > pageH - 22) {
      doc.addPage();
      return this.margin + 4;
    }
    return y;
  }

  private drawFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();
      const y = pageH - 14;
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
        { align: 'center' },
      );
    }
  }

  private buildFilename(payload: ReportsExportPayload): string {
    const stamp = payload.extractedAt.toISOString().slice(0, 10);
    const scope = payload.isAdmin ? 'admin' : 'negocio';
    return `relatorio-flow-cakes-${scope}-${stamp}.pdf`;
  }

  private async loadLogoBase64(): Promise<string> {
    if (this.logoBase64Cache) return this.logoBase64Cache;
    try {
      const res = await fetch(this.logoUrl);
      if (!res.ok) return '';
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      this.logoBase64Cache = dataUrl;
      return dataUrl;
    } catch {
      return '';
    }
  }

  private formatDateTime(d: Date): string {
    return d.toLocaleString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatMonthLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [y, m] = ym.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const i = parseInt(m, 10) - 1;
    return `${months[i] ?? m} ${y}`;
  }

  private formatMoney(n: number): string {
    return Number(n).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
