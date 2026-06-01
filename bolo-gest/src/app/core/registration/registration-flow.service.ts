import { Injectable } from '@angular/core';

export type RegistrationFlowPhase = 'choose-plan' | 'finalize';
export type RegistrationPlanChoice = 'trial' | 'paid';

export interface RegistrationFlowState {
  phone: string;
  phase: RegistrationFlowPhase;
  planChoice?: RegistrationPlanChoice;
}

/** Fluxo obrigatório após criar conta: escolher plano → finalizar (login manual ou pagamento). */
@Injectable({ providedIn: 'root' })
export class RegistrationFlowService {
  private readonly storageKey = 'chefcontrol_registration_flow';

  startAfterRegister(phone: string): void {
    this.save({ phone, phase: 'choose-plan' });
  }

  isActive(): boolean {
    return this.read() !== null;
  }

  getState(): RegistrationFlowState | null {
    return this.read();
  }

  getPhone(): string {
    return this.read()?.phone ?? '';
  }

  /** Passo visual da barra de progresso (1–3). */
  getProgressStep(): 1 | 2 | 3 {
    const state = this.read();
    if (!state) {
      return 1;
    }
    if (state.phase === 'choose-plan') {
      return 2;
    }
    return 3;
  }

  markTrialChosen(): void {
    const state = this.read();
    if (!state) {
      return;
    }
    this.save({ ...state, phase: 'finalize', planChoice: 'trial' });
  }

  markPaidChosen(): void {
    const state = this.read();
    if (!state) {
      return;
    }
    this.save({ ...state, phase: 'finalize', planChoice: 'paid' });
  }

  /** Voltar do pagamento (browser ou link) — reabre escolha de plano. */
  reopenPlanChoice(): void {
    const state = this.read();
    if (!state) {
      return;
    }
    this.save({ phone: state.phone, phase: 'choose-plan' });
  }

  isChoosePlanPhase(): boolean {
    return this.read()?.phase === 'choose-plan';
  }

  isFinalizeTrial(): boolean {
    const s = this.read();
    return s?.phase === 'finalize' && s?.planChoice === 'trial';
  }

  isFinalizePaid(): boolean {
    const s = this.read();
    return s?.phase === 'finalize' && s?.planChoice === 'paid';
  }

  mustCompleteOnboarding(): boolean {
    return this.isActive();
  }

  complete(): void {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      /* ignorar */
    }
  }

  private read(): RegistrationFlowState | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as RegistrationFlowState;
      if (!parsed?.phone || !parsed?.phase) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private save(state: RegistrationFlowState): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }
}
