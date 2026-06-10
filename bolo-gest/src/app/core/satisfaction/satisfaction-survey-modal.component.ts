import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';
import { SatisfactionPromptService } from '../../services/satisfaction-prompt.service';

@Component({
  selector: 'app-satisfaction-survey-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './satisfaction-survey-modal.component.html',
  styleUrl: './satisfaction-survey-modal.component.scss',
})
export class SatisfactionSurveyModalComponent {
  readonly prompt = inject(SatisfactionPromptService);

  readonly rating = signal(0);
  readonly wouldRecommend = signal<boolean | null>(null);
  readonly comment = signal('');

  readonly stars = [1, 2, 3, 4, 5];

  setRating(value: number): void {
    this.rating.set(value);
  }

  setRecommend(value: boolean): void {
    this.wouldRecommend.set(value);
  }

  skip(): void {
    this.prompt.skip();
  }

  submit(): void {
    if (this.rating() < 1) return;
    void this.prompt.submit(this.rating(), this.wouldRecommend(), this.comment());
  }

  title(): string {
    return this.prompt.mode() === 'logout'
      ? 'Antes de sair, como foi a sua experiência?'
      : 'Como está a sua experiência no Flow Cakes?';
  }

  subtitle(): string {
    return this.prompt.mode() === 'logout'
      ? 'A sua opinião ajuda-nos a melhorar. Pode saltar este passo.'
      : 'Bem-vindo! Diga-nos o que achou até agora — pode saltar e responder mais tarde.';
  }
}
