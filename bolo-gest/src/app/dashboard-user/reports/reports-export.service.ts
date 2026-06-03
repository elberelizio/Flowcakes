import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

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
  summary: ReportsExportSummary[];
  revenueByMonth: RevenueByMonthDto[];
}

@Injectable({ providedIn: 'root' })
export class ReportsExportService {
  private readonly logoUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/logotipo.png`;
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

  exportWord(payload: ReportsExportPayload): void {
    void this.exportWithLogo(payload, (logo) => {
      const html = this.buildWordHtml(payload, logo);
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword;charset=utf-8',
      });
      this.downloadBlob(blob, this.fileName(payload, 'doc'));
    });
  }

  exportExcel(payload: ReportsExportPayload): void {
    const wb = XLSX.utils.book_new();

    const metaRows: (string | number)[][] = [
      ['Chef Control — Relatório financeiro'],
      ['Data de extracção', this.formatDateTime(payload.extractedAt)],
    ];
    if (payload.userName) {
      metaRows.push(['Utilizador', payload.userName]);
    }
    metaRows.push([]);

    if (payload.summary.length) {
      metaRows.push(['Resumo do negócio']);
      metaRows.push(['Indicador', 'Valor', 'Detalhe']);
      for (const row of payload.summary) {
        metaRows.push([row.label, row.value, row.detail ?? '']);
      }
      metaRows.push([]);
    }

    const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Resumo');

    const revenueRows: (string | number)[][] = [
      ['Mês', 'Receita (MZN)'],
      ...payload.revenueByMonth.map((r) => [this.formatMonthLabel(r.month), Number(r.revenue)]),
    ];
    const wsRevenue = XLSX.utils.aoa_to_sheet(revenueRows);
    XLSX.utils.book_append_sheet(wb, wsRevenue, 'Receita por mês');

    XLSX.writeFile(wb, this.fileName(payload, 'xlsx'));
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

  /** HTML optimizado para Microsoft Word (tabelas + pt). */
  private buildWordHtml(payload: ReportsExportPayload, logoDataUrl: string): string {
    const extracted = this.formatDateTime(payload.extractedAt);
    const subtitle = payload.isAdmin ? 'Administração da plataforma' : 'Análise do negócio';
    const logoCell = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="Chef Control" width="72" height="72" style="display:block;width:72px;height:72px;" />`
      : `<p style="margin:0;font-size:16pt;font-weight:bold;color:#0f766e;">CC</p>`;

    const metaRows = [
      ['Data de extracção', extracted],
      ...(payload.userName ? [['Utilizador', this.escape(payload.userName)]] : []),
    ]
      .map(
        ([label, value]) =>
          `<tr>
            <td style="${this.wordTdLabel}">${label}</td>
            <td style="${this.wordTdValue}">${value}</td>
          </tr>`
      )
      .join('');

    const summaryTable = this.buildWordDataTable(
      'Resumo do negócio',
      ['Indicador', 'Valor', 'Detalhe'],
      payload.summary.map((r) => [
        this.escape(r.label),
        this.escape(r.value),
        this.escape(r.detail ?? '—'),
      ]),
      true
    );

    const revenueTable =
      payload.revenueByMonth.length > 0
        ? this.buildWordDataTable(
            payload.isAdmin ? 'Receita por mês (plataforma)' : 'Receita por mês',
            ['Mês', 'Receita (MZN)'],
            payload.revenueByMonth.map((r) => [
              this.escape(this.formatMonthLabel(r.month)),
              this.formatMoney(r.revenue),
            ]),
            true
          )
        : `<p style="${this.wordP}">Sem dados de receita por mês no período.</p>`;

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatório — Chef Control</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 { size: 595.3pt 841.9pt; margin: 42.5pt 42.5pt 42.5pt 42.5pt; }
    div.Section1 { page: Section1; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      color: #0f172a;
      line-height: 1.35;
    }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    p { margin: 0 0 6pt; font-size: 12pt; }
  </style>
</head>
<body>
  <div class="Section1">
    <!-- Cabeçalho -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14pt;border-bottom:2pt solid #0d9488;">
      <tr>
        <td width="84" valign="middle" style="padding:0 12pt 12pt 0;">${logoCell}</td>
        <td valign="middle" style="padding-bottom:12pt;">
          <p style="margin:0;font-size:20pt;font-weight:bold;color:#0f766e;font-family:Calibri,Arial,sans-serif;">Chef Control</p>
          <p style="margin:4pt 0 0;font-size:12pt;color:#475569;font-family:Calibri,Arial,sans-serif;">Relatório financeiro — ${subtitle}</p>
        </td>
      </tr>
    </table>

    <!-- Metadados -->
    <p style="margin:0 0 6pt;font-size:12pt;font-weight:bold;color:#0f766e;text-transform:uppercase;letter-spacing:0.5pt;">Informação do documento</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18pt;border:1pt solid #cbd5e1;">
      ${metaRows}
    </table>

    ${summaryTable}
    ${revenueTable}

    <p style="margin:18pt 0 0;padding-top:10pt;border-top:1pt solid #e2e8f0;font-size:10pt;color:#64748b;text-align:center;font-family:Calibri,Arial,sans-serif;">
      Documento gerado automaticamente pelo Chef Control. Valores em meticais (MZN).
    </p>
  </div>
</body>
</html>`;
  }

  private readonly wordTdLabel =
    'width:32%;padding:8pt 10pt;font-size:12pt;color:#475569;background:#f8fafc;border:1pt solid #e2e8f0;font-family:Calibri,Arial,sans-serif;vertical-align:middle;';
  private readonly wordTdValue =
    'padding:8pt 10pt;font-size:12pt;font-weight:bold;color:#0f172a;border:1pt solid #e2e8f0;font-family:Calibri,Arial,sans-serif;vertical-align:middle;';
  private readonly wordP =
    'margin:0 0 12pt;font-size:12pt;color:#64748b;font-family:Calibri,Arial,sans-serif;';

  private buildWordDataTable(
    title: string,
    headers: string[],
    rows: string[][],
    rightAlignValueCols = false
  ): string {
    if (!rows.length) return '';

    const th = headers
      .map((h, i) => {
        const align = rightAlignValueCols && i === 1 ? 'text-align:right;' : 'text-align:left;';
        return `<th style="padding:8pt 10pt;font-size:12pt;font-weight:bold;color:#0f766e;background:#ecfdf5;border:1pt solid #99f6e4;${align}font-family:Calibri,Arial,sans-serif;">${h}</th>`;
      })
      .join('');

    const body = rows
      .map((row, rowIdx) => {
        const bg = rowIdx % 2 === 1 ? 'background:#f8fafc;' : '';
        const tds = row
          .map((cell, i) => {
            const isValueCol = i === 1;
            const align = rightAlignValueCols && isValueCol ? 'text-align:right;' : '';
            const weight = isValueCol ? 'font-weight:bold;color:#0f766e;' : '';
            return `<td style="padding:8pt 10pt;font-size:12pt;border:1pt solid #e2e8f0;${align}${weight}${bg}font-family:Calibri,Arial,sans-serif;vertical-align:middle;">${cell}</td>`;
          })
          .join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');

    return `
    <p style="margin:0 0 8pt;font-size:12pt;font-weight:bold;color:#0f766e;text-transform:uppercase;letter-spacing:0.5pt;font-family:Calibri,Arial,sans-serif;">${this.escape(title)}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18pt;">
      <thead><tr>${th}</tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  }

  /** HTML para impressão / PDF no navegador. */
  private buildPrintHtml(payload: ReportsExportPayload, logoDataUrl: string): string {
    const extracted = this.formatDateTime(payload.extractedAt);
    const logoImg = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="Chef Control" width="72" height="72" />`
      : '';

    const metaRows = [
      ['Data de extracção', extracted],
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
        <h2>Resumo do negócio</h2>
        <table class="data"><thead><tr><th>Indicador</th><th>Valor</th><th>Detalhe</th></tr></thead><tbody>${summaryRows}</tbody></table>
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
        : `<p class="empty">Sem dados de receita por mês.</p>`;

    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatório — Chef Control</title>
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
    .block { margin-bottom: 18pt; }
    .block h2 { margin: 0 0 8pt; font-size: 12pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
    table.data { width: 100%; border-collapse: collapse; font-size: 12pt; }
    table.data th, table.data td { border: 1pt solid #e2e8f0; padding: 8pt 10pt; text-align: left; }
    table.data th { background: #ecfdf5; color: #0f766e; font-weight: bold; }
    table.data tr:nth-child(even) td { background: #f8fafc; }
    table.data td.num { text-align: right; font-weight: bold; color: #0f766e; }
    table.data td.muted { color: #64748b; }
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
      <h1>Chef Control</h1>
      <p>Relatório financeiro — ${payload.isAdmin ? 'Administração' : 'Análise do negócio'}</p>
    </div>
  </header>

  <p class="section-title">Informação do documento</p>
  <table class="meta"><tbody>${metaRows}</tbody></table>

  ${summarySection}
  ${revenueSection}

  <p class="footer">Documento gerado automaticamente pelo Chef Control. Valores em meticais (MZN).</p>
</body>
</html>`;
  }

  private fileName(payload: ReportsExportPayload, ext: string): string {
    const d = payload.extractedAt;
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `relatorio-chef-control-${stamp}.${ext}`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  private escape(text: string): string {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
