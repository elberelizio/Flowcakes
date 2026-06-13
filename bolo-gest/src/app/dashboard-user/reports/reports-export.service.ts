import { Injectable } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class ReportsExportService {
  private readonly logoUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${BRAND_ASSETS.logoFull}`;
  private logoBase64Cache: string | null = null;

  exportPdf(payload: ReportsExportPayload): void {
    void this.exportWithLogo(payload, (logo) => {
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(this.buildPrintHtml(payload, logo));
      w.document.close();
      w.onload = () => w.print();
    });
  }

  private async exportWithLogo(
    payload: ReportsExportPayload,
    action: (logoDataUrl: string) => void
  ): Promise<void> {
    const logo = await this.loadLogoBase64();
    action(logo);
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

  private buildPrintHtml(payload: ReportsExportPayload, logoDataUrl: string): string {
    const extracted = this.formatDateTime(payload.extractedAt);
    const logoImg = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="Flow Cakes" width="72" height="72" />`
      : '';

    const metaRows = [
      ['Data de extracção', extracted],
      ['Período do relatório', this.escape(payload.periodLabel)],
      ...(payload.userName ? [['Utilizador', this.escape(payload.userName)]] : []),
    ]
      .map(
        ([l, v]) =>
          `<tr><td class="meta-label">${l}</td><td class="meta-value">${v}</td></tr>`
      )
      .join('');

    const summaryRows = payload.summary
      .map(
        (r) =>
          `<tr>
            <td>${this.escape(r.label)}</td>
            <td class="num">${this.escape(r.value)}</td>
            <td class="muted">${this.escape(r.detail ?? '—')}</td>
          </tr>`
      )
      .join('');

    const summarySection =
      payload.summary.length > 0
        ? `<section class="block">
        <h2>Resumo do período</h2>
        <table class="data"><thead><tr><th>Indicador</th><th>Valor</th><th>Detalhe</th></tr></thead><tbody>${summaryRows}</tbody></table>
      </section>`
        : '';

    const chartSection = payload.chartImageDataUrl
      ? `<section class="block">
        <h2>${this.escape(payload.chartTitle ?? 'Distribuição financeira')}</h2>
        <div class="chart-print"><img src="${payload.chartImageDataUrl}" alt="Gráfico financeiro" /></div>
        ${this.buildBreakdownTable(payload.chartBreakdown)}
      </section>`
      : '';

    const revenueRows = payload.revenueByMonth
      .map(
        (r) =>
          `<tr><td>${this.escape(this.formatMonthLabel(r.month))}</td><td class="num">${this.formatMoney(r.revenue)}</td></tr>`
      )
      .join('');

    const revenueSection =
      payload.revenueByMonth.length > 0
        ? `<section class="block">
        <h2>${payload.isAdmin ? 'Receita por mês (plataforma)' : 'Receita por mês'}</h2>
        <table class="data"><thead><tr><th>Mês</th><th>Receita (MZN)</th></tr></thead><tbody>${revenueRows}</tbody></table>
      </section>`
        : `<p class="empty">Sem dados de receita no período seleccionado.</p>`;

    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatório — Flow Cakes</title>
  <style>
    @page { margin: 18mm; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      color: #0f172a;
      margin: 0;
      padding: 16pt;
      line-height: 1.4;
    }
    .header {
      display: table;
      width: 100%;
      border-bottom: 2pt solid #0d9488;
      padding-bottom: 12pt;
      margin-bottom: 14pt;
    }
    .header-logo, .header-text { display: table-cell; vertical-align: middle; }
    .header-logo { width: 84pt; padding-right: 12pt; }
    .header-logo img { width: 72pt; height: 72pt; object-fit: contain; display: block; }
    .header-text h1 { margin: 0; font-size: 20pt; color: #0f766e; }
    .header-text p { margin: 4pt 0 0; font-size: 12pt; color: #475569; }
    .section-title {
      margin: 0 0 8pt;
      font-size: 12pt;
      font-weight: bold;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 18pt; }
    .meta td { border: 1pt solid #e2e8f0; padding: 8pt 10pt; font-size: 12pt; }
    .meta-label { width: 32%; background: #f8fafc; color: #475569; }
    .meta-value { font-weight: bold; }
    .block { margin-bottom: 18pt; page-break-inside: avoid; }
    .block h2 { margin: 0 0 8pt; font-size: 12pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
    table.data { width: 100%; border-collapse: collapse; font-size: 12pt; }
    table.data th, table.data td { border: 1pt solid #e2e8f0; padding: 8pt 10pt; text-align: left; }
    table.data th { background: #f0fdfa; color: #0f766e; font-weight: bold; }
    table.data tr:nth-child(even) td { background: #f8fafc; }
    table.data td.num { text-align: right; font-weight: bold; color: #0f766e; }
    table.data td.muted { color: #64748b; }
    .chart-print { text-align: center; margin: 8pt 0; }
    .chart-print img { max-width: 100%; max-height: 280pt; object-fit: contain; }
    .empty { font-size: 12pt; color: #64748b; }
    .footer {
      margin-top: 18pt;
      padding-top: 10pt;
      border-top: 1pt solid #e2e8f0;
      font-size: 10pt;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-logo">${logoImg}</div>
    <div class="header-text">
      <h1>Flow Cakes</h1>
      <p>Relatório financeiro — ${payload.isAdmin ? 'Administração' : 'Análise do negócio'}</p>
    </div>
  </header>

  <p class="section-title">Informação do documento</p>
  <table class="meta"><tbody>${metaRows}</tbody></table>

  ${summarySection}
  ${chartSection}
  ${revenueSection}

  <p class="footer">Documento gerado automaticamente pelo Flow Cakes. Valores em meticais (MZN).</p>
</body>
</html>`;
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

  private buildBreakdownTable(slices?: { label: string; value: number; color: string }[]): string {
    if (!slices?.length) return '';
    const total = slices.reduce((s, x) => s + x.value, 0);
    const rows = slices
      .map((s) => {
        const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0.0';
        return `<tr>
          <td><span style="display:inline-block;width:10pt;height:10pt;border-radius:50%;background:${s.color};margin-right:6pt;"></span>${this.escape(s.label)}</td>
          <td class="num">${this.formatMoney(s.value)}</td>
          <td class="muted">${pct}%</td>
        </tr>`;
      })
      .join('');
    return `<table class="data" style="margin-top:10pt;"><thead><tr><th>Indicador</th><th>Valor (MZN)</th><th>Peso</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  private escape(text: string): string {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
