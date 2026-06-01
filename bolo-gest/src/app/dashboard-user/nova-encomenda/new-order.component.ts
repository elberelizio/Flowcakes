import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import {
  DOCES_SUBCATEGORIES,
  DOCES_SIZES_BY_NAME,
  DOCES_SIZES_BY_NUMBER,
  SALGADOS_SUBCATEGORIES,
  type OrderCategory,
} from '../../models/order.model';
import { NEW_ORDER_CATEGORY_META, type NewOrderCategoryMeta } from './new-order.category-meta';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-order.component.html',
  styleUrl: './new-order.component.scss',
})
export class NewOrderComponent implements OnInit {
  step: 1 | 2 = 1;
  category: OrderCategory | null = null;
  expenseMode: 'detalhado' | 'simples' | null = 'simples';
  submitError = '';
  submitting = false;
  private notification = inject(NotificationService);

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  readonly categoryMetaDoces: NewOrderCategoryMeta = NEW_ORDER_CATEGORY_META.doces;
  readonly categoryMetaSalgados: NewOrderCategoryMeta = NEW_ORDER_CATEGORY_META.salgados;
  readonly docesSubcategories = DOCES_SUBCATEGORIES;
  readonly salgadosSubcategories = SALGADOS_SUBCATEGORIES;
  readonly docesSizesByName = DOCES_SIZES_BY_NAME;
  readonly docesSizesByNumber = DOCES_SIZES_BY_NUMBER;
  /** Doces: por número de forma (15, 20, 47) ou por escala (Pequeno, Médio, Grande) - null = nada selecionado */
  sizeType: 'nome' | 'numero' | null = null;

  form!: FormGroup;

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  get isDoces(): boolean {
    return this.category === 'doces';
  }

  get isSalgados(): boolean {
    return this.category === 'salgados';
  }

  get categoryMeta() {
    return this.category ? NEW_ORDER_CATEGORY_META[this.category] : null;
  }

  /** Percentagem aproximada já paga em relação ao valor cobrado */
  get paymentPercentDisplay(): number | null {
    const charged = this.parseOptionalNumber(this.form.get('valueCharged')?.value);
    const paid = this.parseOptionalNumber(this.form.get('valuePaid')?.value);
    if (charged == null || charged <= 0 || paid == null || paid < 0) {
      return null;
    }
    return Math.round((paid / charged) * 100);
  }

  /** Pré-visualização do custo total (despesa) desta encomenda */
  get costTotalPreview(): number | null {
    if (this.expenseMode === 'simples') {
      const raw = this.form.get('expenseTotal')?.value;
      if (raw == null || raw === '') return null;
    } else if (!this.ingredients.length) {
      return null;
    }
    const total = this.getCostTotal();
    return total > 0 ? total : null;
  }

  setSizeType(type: 'nome' | 'numero'): void {
    this.sizeType = type;
    this.form.patchValue({ size: '', sizeNumberCustom: null });
  }

  setHasDelivery(value: boolean): void {
    this.form.patchValue({ hasDelivery: value });
    if (!value) {
      this.form.patchValue({ deliveryAddress: '', deliveryCost: null });
    }
  }

  onClientContactInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.form.get('clientContact')?.setValue(digits, { emitEvent: false });
    if (input.value !== digits) {
      input.value = digits;
    }
  }

  formatSummaryMoney(controlName: string): string {
    const v = this.parseOptionalNumber(this.form.get(controlName)?.value);
    if (v == null) return '—';
    return `${v.toLocaleString('pt-MZ', { maximumFractionDigits: 0 })} MZN`;
  }

  private parseOptionalNumber(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  setExpenseMode(mode: 'detalhado' | 'simples'): void {
    this.expenseMode = mode;
    if (mode === 'detalhado' && this.ingredients.length === 0) {
      this.addIngredient();
    }
  }

  /** Retorna true apenas quando delivery = Sim */
  get isDeliveryYes(): boolean {
    return this.form.get('hasDelivery')?.value === true;
  }

  /** Salgados: total aproximado de unidades */
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
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    const date = this.route.snapshot.queryParamMap.get('deliveryDate');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.form.patchValue({ deliveryDate: date });
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      clientName: ['', Validators.required],
      clientContact: ['', [Validators.pattern(/^\d{0,9}$/)]],
      clientAddress: [''],       // Endereço do cliente (independente do local de entrega)
      deliveryTime: [''],        // Hora de entrega do bolo
      deliveryAddress: [''],     // Local de entrega (só quando delivery = Sim)
      subcategory: ['', Validators.required],
      productName: ['', Validators.required],
      size: [''],
      sizeNumberCustom: [null as number | null],
      quantityKg: [null as number | null],
      unitsPerKg: [null as number | null],
      valueCharged: [null as number | null, [Validators.required, Validators.min(1)]],
      valuePaid: [null as number | null, [Validators.min(0)]],
      discount: [null as number | null, [Validators.min(0)]],
      deliveryDate: ['', Validators.required],
      hasDelivery: [false as boolean | null],
      deliveryCost: [null as number | null, [Validators.min(0)]],
      observations: [''],
      expenseTotal: [null as number | null, [Validators.min(0)]],
      expenseDescription: [''],
      ingredients: this.fb.array([]),
    });
  }

  selectCategory(cat: OrderCategory): void {
    this.category = cat;
    this.sizeType = null;
    this.expenseMode = 'simples';
    this.form.reset({
      clientName: '',
      clientContact: '',
      clientAddress: '',
      deliveryTime: '',
      deliveryAddress: '',
      subcategory: '',
      productName: '',
      size: '',
      sizeNumberCustom: null,
      quantityKg: null,
      unitsPerKg: null,
      valueCharged: null,
      valuePaid: null,
      discount: null,
      deliveryDate: '',
      hasDelivery: false,
      deliveryCost: null,
      observations: '',
      expenseTotal: null,
      expenseDescription: '',
    });
    this.ingredients.clear();
    const date = this.route.snapshot.queryParamMap.get('deliveryDate');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.form.patchValue({ deliveryDate: date });
    }
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
        quantity: [null as number | null, [Validators.min(0)]],
        unitValue: [null as number | null, [Validators.min(0)]],
      })
    );
  }

  removeIngredient(i: number): void {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(i);
    }
  }

  private getCostTotal(): number {
    if (this.expenseMode === 'simples') {
      return Number(this.form.get('expenseTotal')?.value ?? 0);
    }
    const ing = this.form.getRawValue().ingredients ?? [];
    return ing.reduce(
      (s: number, i: { unitValue: number | null }) => s + (Number(i?.unitValue) || 0),
      0
    );
  }

  private getIngredientsForSubmit(): { name: string; unitValue: number }[] {
    if (this.expenseMode === 'simples') {
      const total = Number(this.form.get('expenseTotal')?.value ?? 0);
      if (total <= 0) return [];
      const desc = (this.form.get('expenseDescription')?.value ?? '').toString().trim();
      const name = desc || 'Despesa total';
      return [{ name, unitValue: total }];
    }
    const ing = this.form.getRawValue().ingredients ?? [];
    return ing.map(
      (i: { name: string | null; unitValue: number | null }) => ({
        name: i.name ?? '',
        unitValue: Number(i.unitValue) || 0,
      })
    );
  }

  private getSizeValueForSubmit(): string | undefined {
    if (this.category !== 'doces') return undefined;
    const raw = this.form.getRawValue();
    if (this.sizeType === 'numero') {
      const num = raw.sizeNumberCustom;
      return num != null && num !== '' ? String(num) : undefined;
    }
    return raw.size || undefined;
  }

  private buildObservations(): string {
    const parts: string[] = [];
    const contact = (this.form.get('clientContact')?.value ?? '').trim();
    const deliveryTime = (this.form.get('deliveryTime')?.value ?? '').trim();
    const obs = (this.form.get('observations')?.value ?? '').trim();
    if (contact) parts.push(`Contacto: ${contact}`);
    if (deliveryTime) parts.push(`Hora entrega: ${deliveryTime}`);
    if (obs) parts.push(obs);
    return parts.join(' | ');
  }

  /**
   * Evita duplicação visual entre tipo/categoria e descrição do produto
   * (ex.: subcategoria "Bolo" + nome "Bolo de chocolate" => "de chocolate").
   */
  private normalizeProductName(subcategoryRaw: unknown, productNameRaw: unknown): string {
    const subcategory = String(subcategoryRaw ?? '').trim();
    const productName = String(productNameRaw ?? '').trim();
    if (!subcategory || !productName) return productName;
    const pattern = new RegExp(`^${subcategory}\\s+`, 'i');
    return productName.replace(pattern, '').trim() || productName;
  }

  async submit(): Promise<void> {
    this.submitError = '';
    if (!this.category) return;
    if (this.category === 'doces' && this.sizeType === null) {
      this.submitError = 'Selecione o tipo de tamanho (Número ou Escala).';
      return;
    }
    if (this.form.invalid) return;
    this.submitting = true;

    const raw = this.form.getRawValue();
    const hasDelivery = raw.hasDelivery === true;

    const observations = this.buildObservations();
    const ingredients = this.getIngredientsForSubmit();
    const costTotal = this.getCostTotal();
    const energyCost = 0;
    const normalizedProductName = this.normalizeProductName(raw.subcategory, raw.productName);

    const discount = Number(raw.discount ?? 0) || 0;

    const order = await this.orders.create({
      clientName: raw.clientName,
      category: this.category,
      subcategory: raw.subcategory,
      productName: normalizedProductName,
      size: this.isDoces ? this.getSizeValueForSubmit() : undefined,
      quantityKg: this.isSalgados && raw.quantityKg != null ? Number(raw.quantityKg) : undefined,
      unitsPerKg:
        this.isSalgados && raw.unitsPerKg != null && raw.unitsPerKg !== ''
          ? Number(raw.unitsPerKg)
          : undefined,
      valueCharged: Number(raw.valueCharged),
      valuePaid: (raw.valuePaid != null && raw.valuePaid !== '') ? Number(raw.valuePaid) : 0,
      discount: discount > 0 ? discount : undefined,
      ingredients,
      energyCost,
      deliveryDate: raw.deliveryDate || undefined,
      clientAddress: (raw.clientAddress ?? '').trim() || undefined,
      deliveryAddress: hasDelivery ? (raw.deliveryAddress ?? '').trim() || undefined : undefined,
      hasDelivery,
      deliveryCost: hasDelivery ? (Number(raw.deliveryCost) || 0) : 0,
      observations: observations || undefined,
    });

    this.submitting = false;
    if (order) {
      this.notification.showSuccess('Encomenda criada com sucesso.');
      await this.router.navigate(['/encomendas']);
    } else {
      const msg = this.orders.apiError() ?? 'Não foi possível criar a encomenda. Tente novamente.';
      this.submitError = msg;
      this.notification.showError(msg);
    }
  }
}
