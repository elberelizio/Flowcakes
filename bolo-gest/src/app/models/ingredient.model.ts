export interface Ingredient {
  id: string;
  name: string;
  unitValue: number; // MZN
}

export interface OrderIngredient extends Ingredient {
  orderId: string;
}
