import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../services/language.service';

/**
 * `{{ 'shell.navDashboard' | translate }}`
 * Impura de propósito: precisa de reavaliar quando o idioma muda (o LanguageService
 * usa um signal, não um Observable, por isso a pipe não consegue "ouvir" a mudança
 * de outra forma sem tornar cada template dependente de um efeito manual).
 */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private lang = inject(LanguageService);

  transform(key: string): string {
    return this.lang.t(key);
  }
}
