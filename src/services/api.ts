import type { Category, Product, ProductPage, User } from '../types';

const API_BASE = 'https://dummyjson.com';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('network');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body.message ?? 'server', response.status);
  }
  return body as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<User & { accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, expiresInMins: 30 }),
    }),

  signup: (input: { firstName: string; lastName: string; age: number; email: string; username: string; password: string }) =>
    request<User>('/users/add', { method: 'POST', body: JSON.stringify(input) }),

  me: (accessToken: string) =>
    request<User>('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken, expiresInMins: 30 }),
    }),

  products: (options: { skip: number; limit: number; query?: string; category?: string; sortBy?: string; order?: 'asc' | 'desc' }) => {
    const params = new URLSearchParams({ limit: String(options.limit), skip: String(options.skip) });
    if (options.query?.trim()) params.set('q', options.query.trim());
    if (options.sortBy) {
      params.set('sortBy', options.sortBy);
      params.set('order', options.order ?? 'asc');
    }
    const path = options.query?.trim()
      ? `/products/search?${params}`
      : options.category
        ? `/products/category/${encodeURIComponent(options.category)}?${params}`
        : `/products?${params}`;
    return request<ProductPage>(path);
  },

  categories: () => request<Category[]>('/products/categories'),
  product: (id: number) => request<Product>(`/products/${id}`),

  userCarts: (userId: number, accessToken?: string | null) => request<{ carts: unknown[] }>(`/carts/user/${userId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  }),
  addCart: (userId: number, products: { id: number; quantity: number }[], accessToken?: string | null) =>
    request('/carts/add', { method: 'POST', body: JSON.stringify({ userId, products }), headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined }),
  updateCart: (cartId: number, products: { id: number; quantity: number }[], accessToken?: string | null) =>
    request(`/carts/${cartId}`, { method: 'PUT', body: JSON.stringify({ products }), headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined }),
  deleteCart: (cartId: number, accessToken?: string | null) => request(`/carts/${cartId}`, {
    method: 'DELETE', headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  }),
};

export function discountedPrice(product: Product): number {
  return product.price * (1 - product.discountPercentage / 100);
}