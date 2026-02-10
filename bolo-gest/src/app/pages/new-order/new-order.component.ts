import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OrdersService } from '../../services/orders.service';
import {
  DOCES_SUBCATEGORIES,
  DOCES_SIZES_BY_NAME,
  DOCES_SIZES_BY_NUMBER,
  SALGADOS_SUBCATEGORIES,
  type OrderCategory,
} from '../../models/order.model';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-order.component.html',
  styleUrl: './new-order.component.scss',
})
export class NewOrderComponent {
  step: 1 | 2 = 1;
  category: OrderCategory | null = null;
  paymentPercent: 0 | 50 | 100 = 0;
  submitError = '';
  submitting = false;

  readonly docesSubcategories = DOCES_SUBCATEGORIES;
  readonly salgadosSubcategories = SALGADOS_SUBCATEGORIES;
  readonly docesSizesByName = DOCES_SIZES_BY_NAME;
  readonly docesSizesByNumber = DOCES_SIZES_BY_NUMBER;
  /** Doces: tipo de tamanho — por nome (Pequeno/Médio/Grande/kg) ou por número (15, 20...) */
  sizeType: 'nome' | 'numero' = 'nome';

  form!: FormGroup;

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  get costTotal(): number {
    const ing = this.form.getRawValue().ingredients ?? [];
    const sumIng = ing.reduce(
      (s: number, i: { name: string | null; unitValue: number | null }) =>
        s + (Number(i?.unitValue) || 0),
      0
    );
    const energy = Number(this.form.get('energyCost')?.value ?? 0);
    return sumIng + energy;
  }

  get profit(): number {
    const charged = Number(this.form.get('valueCharged')?.value ?? 0);
    return charged - this.costTotal;
  }

  get paymentStatus(): 'Pendente' | 'Parcial' | 'Pago' {
    const charged = Number(this.form.get('valueCharged')?.value ?? 0);
    const paid = Number(this.form.get('valuePaid')?.value ?? 0);
    if (paid >= charged) return 'Pago';
    if (paid > 0) return 'Parcial';
    return 'Pendente';
  }

  get balance(): number {
    const charged = Number(this.form.get('valueCharged')?.value ?? 0);
    const paid = Number(this.form.get('valuePaid')?.value ?? 0);
    return Math.max(0, charged - paid);
  }

  get isDoces(): boolean {
    return this.category === 'doces';
  }

  get isSalgados(): boolean {
    return this.category === 'salgados';
  }

  get subcategories(): readonly string[] {
    if (this.category === 'doces') return this.docesSubcategories;
    if (this.category === 'salgados') return this.salgadosSubcategories;
    return [];
  }

  setSizeType(type: 'nome' | 'numero'): void {
    this.sizeType = type;
    if (type === 'nome') {
      this.form.patchValue({ size: 'Médio', sizeNumberCustom: null });
    } else {
      this.form.patchValue({ size: '20', sizeNumberCustom: null });
    }
  }

  /** Salgados: total aproximado de unidades (kg × un./kg) */
  get totalUnitsApprox(): number | null {
    if (this.category !== 'salgados') return null;
    const kg = Number(this.form.get('quantityKg')?.value);
    const perKg = Number(this.form.get('unitsPerKg')?.value);
    if (!Number.isFinite(kg) || !Number.isFinite(perKg) || perKg <= 0) return null;
    return Math.round(kg * perKg);
  }

  constructor(
    private fb: FormBuilder,
    private orders: OrdersService,
    private router: Router
  ) {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      clientName: ['', Validators.required],
      subcategory: ['', Validators.required],
      productName: ['', Validators.required],
      size: ['Médio'],
      sizeNumberCustom: [null as number | null],
      quantityKg: [null as number | null],
      unitsPerKg: [null as number | null],
      valueCharged: [0, [Validators.required, Validators.min(1)]],
      valuePaid: [0, [Validators.required, Validators.min(0)]],
      energyCost: [0, [Validators.required, Validators.min(0)]],
      observations: [''],
      ingredients: this.fb.array([]),
    });
  }

  selectCategory(cat: OrderCategory): void {
    this.category = cat;
    const subs = cat === 'doces' ? this.docesSubcategories : this.salgadosSubcategories;
    this.form.patchValue({ subcategory: subs[0] });
    this.ingredients.clear();
    const defaults =
      cat === 'doces'
        ? [
            { name: 'Ovos', unitValue: 0 },
            { name: 'Trigo', unitValue: 0 },
            { name: 'Açúcar', unitValue: 0 },
          ]
        : [
            { name: 'Massa', unitValue: 0 },
            { name: 'Carne', unitValue: 0 },
            { name: 'Óleo', unitValue: 0 },
          ];
    defaults.forEach((d) =>
      this.ingredients.push(
        this.fb.group({
          name: [d.name],
          unitValue: [d.unitValue, [Validators.required, Validators.min(0)]],
        })
      )
    );
    this.step = 2;
  }

  backToCategory(): void {
    this.step = 1;
    this.category = null;
  }

  addIngredient(): void {
    this.ingredients.push(
      this.fb.group({
        name: [''],
        unitValue: [0, [Validators.required, Validators.min(0)]],
      })
    );
  }

  removeIngredient(i: number): void {
    if (this.ingredients.length > 1) this.ingredients.removeAt(i);
  }

  setPaymentPercent(p: 0 | 50 | 100): void {
    this.paymentPercent = p;
    const charged = Number(this.form.get('valueCharged')?.value ?? 0);
    const valuePaid =
      p === 100 ? charged : p === 50 ? charged * 0.5 : 0;
    this.form.patchValue({ valuePaid: Math.round(valuePaid) });
  }

  /** Valor de size a guardar (nome ou número em string) */
  private getSizeValueForSubmit(): string | undefined {
    if (this.category !== 'doces') return undefined;
    const raw = this.form.getRawValue();
    if (this.sizeType === 'nome') return raw.size || undefined;
    if (raw.size === 'outro') {
      const n = raw.sizeNumberCustom;
      return n != null && n !== '' ? String(Number(n)) : undefined;
    }
    return raw.size || undefined;
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.category) return;
    this.submitError = '';
    this.submitting = true;
    const raw = this.form.getRawValue();
    const order = await this.orders.create({
      clientName: raw.clientName,
      category: this.category,
      subcategory: raw.subcategory,
      productName: raw.productName,
      size: this.isDoces ? this.getSizeValueForSubmit() : undefined,
      quantityKg: this.isSalgados && raw.quantityKg != null ? Number(raw.quantityKg) : undefined,
      unitsPerKg:
        this.isSalgados && raw.unitsPerKg != null && raw.unitsPerKg !== ''
          ? Number(raw.unitsPerKg)
          : undefined,
      valueCharged: Number(raw.valueCharged),
      valuePaid: Number(raw.valuePaid),
      ingredients: raw.ingredients.map(
        (i: { name: string | null; unitValue: number | null }) => ({
          name: i.name ?? '',
          unitValue: Number(i.unitValue) || 0,
        })
      ),
      energyCost: Number(raw.energyCost),
      observations: raw.observations?.trim() || undefined,
    });
    this.submitting = false;
    if (order) {
      this.router.navigate(['/pedidos']);
    } else {
      this.submitError = 'Não foi possível criar o pedido. Tente novamente.';
    }
  }
}
