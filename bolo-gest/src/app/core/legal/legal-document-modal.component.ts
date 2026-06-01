import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LEGAL_DOCUMENTS, LegalDocumentId } from './legal-content';

@Component({
  selector: 'app-legal-document-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-document-modal.component.html',
  styleUrl: './legal-document-modal.component.scss',
})
export class LegalDocumentModalComponent {
  @Input({ required: true }) documentId!: LegalDocumentId;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  get document() {
    return LEGAL_DOCUMENTS[this.documentId];
  }

  get fullPageLink(): string {
    return this.documentId === 'terms' ? '/termos' : '/privacidade';
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('legal-modal__backdrop')) {
      this.close();
    }
  }
}
