export type AppLanguage = 'en' | 'ar';
export type AppTheme = 'light' | 'dark';

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku?: string;
  minimumOrderQuantity?: number;
  availabilityStatus?: string;
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  images: string[];
  thumbnail: string;
  reviews?: ProductReview[];
}

export interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
  gender?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string | null;
  refreshToken: string | null;
  demoSignup?: boolean;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface CartSummary {
  lines: CartLine[];
  itemCount: number;
  total: number;
}