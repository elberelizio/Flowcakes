import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LEGAL_DOCUMENTS, LegalDocumentId } from '@app/core/legal/legal-content';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';

@Component({
  selector: 'app-legal-document-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicSiteNavComponent],
  templateUrl: './legal-document-page.component.html',
  styleUrl: './legal-document-page.component.scss',
})
export class LegalDocumentPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private title = inject(Title);

  documentId: LegalDocumentId = 'terms';

  get document() {
    return LEGAL_DOCUMENTS[this.documentId];
  }

  ngOnInit(): void {
    const tipo = this.route.snapshot.data['legalType'] as LegalDocumentId | undefined;
    this.documentId = tipo === 'privacy' ? 'privacy' : 'terms';
    this.title.setTitle(`${this.document.title} — Flow Cakes`);
  }
}
