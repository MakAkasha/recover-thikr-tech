export interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

export interface RecoveryJobData {
  storeId: string;
  cartId: string;
  customerPhone: string;
  customerName: string;
  cartItems: CartItem[];
  cartValue: number;
}
