import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';

const CLOSE_ANIMATION_MS = 280;
const AUTO_CLOSE_MS = 4000;

@Component({
  selector: 'app-login-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-success-modal.component.html',
  styleUrl: './login-success-modal.component.scss',
})
export class LoginSuccessModalComponent implements OnInit, OnDestroy {
  readonly brand = BRAND_ASSETS;
  @Output() closed = new EventEmitter<void>();

  closing = false;
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.autoCloseTimer = setTimeout(() => this.close(), AUTO_CLOSE_MS);
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer != null) clearTimeout(this.autoCloseTimer);
  }

  /** Fecha com animação suave e emite depois. */
  close(): void {
    if (this.closing) return;
    if (this.autoCloseTimer != null) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.closing = true;
    setTimeout(() => this.closed.emit(), CLOSE_ANIMATION_MS);
  }
}
