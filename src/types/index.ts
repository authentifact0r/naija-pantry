import type {
  Product,
  Order,
  OrderItem,
  Address,
  User,
  InventoryBatch,
  Warehouse,
  Subscription,
  Recipe,
  RecipeItem,
  FlashSale,
} from "@prisma/client";

// Extended types with relations
export type ProductWithInventory = Product & {
  inventoryBatches: InventoryBatch[];
  flashSale: FlashSale | null;
  totalStock: number;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
  address: Address;
  warehouse: Warehouse | null;
};

export type RecipeWithItems = Recipe & {
  items: (RecipeItem & { product: Product })[];
};

export type SubscriptionWithProduct = Subscription & {
  product: Product;
};

// Cart types (for guest/localStorage)
export interface GuestCartItem {
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: string;
    images: string[];
    weightKg: string;
    isPerishable: boolean;
    slug: string;
  };
}

// Auth
export type SafeUser = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "phone" | "role"
>;

// Shipping
export interface ShippingOption {
  method: string;
  name: string;
  cost: number;
  estimatedDays: number;
  carrier: string;
}

// API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
