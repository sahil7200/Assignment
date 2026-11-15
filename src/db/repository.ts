import { getDatabase } from './database';
import type { CartLine, Product } from '../types';

interface CartRow {
  product_json: string;
  quantity: number;
}

interface ProductRow {
  product_json: string;
}

export const repository = {
  async loadCart(): Promise<CartLine[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<CartRow>('SELECT product_json, quantity FROM cart_items ORDER BY product_id');
    return rows.map((row) => ({ product: JSON.parse(row.product_json) as Product, quantity: row.quantity }));
  },

  async saveCartLine(product: Product, quantity: number): Promise<void> {
    const db = await getDatabase();
    if (quantity <= 0) {
      await db.runAsync('DELETE FROM cart_items WHERE product_id = ?', product.id);
      return;
    }
    await db.runAsync(
      'INSERT INTO cart_items (product_id, product_json, quantity) VALUES (?, ?, ?) ON CONFLICT(product_id) DO UPDATE SET product_json = excluded.product_json, quantity = excluded.quantity',
      product.id,
      JSON.stringify(product),
      quantity,
    );
  },

  async loadFavorites(): Promise<Product[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ProductRow>('SELECT product_json FROM favorites ORDER BY product_id');
    return rows.map((row) => JSON.parse(row.product_json) as Product);
  },

  async saveFavorite(product: Product, favorite: boolean): Promise<void> {
    const db = await getDatabase();
    if (!favorite) {
      await db.runAsync('DELETE FROM favorites WHERE product_id = ?', product.id);
      return;
    }
    await db.runAsync(
      'INSERT OR REPLACE INTO favorites (product_id, product_json) VALUES (?, ?)',
      product.id,
      JSON.stringify(product),
    );
  },

  async cacheProducts(products: Product[]): Promise<void> {
    if (!products.length) return;
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const product of products) {
        await db.runAsync(
          'INSERT OR REPLACE INTO cached_products (product_id, product_json) VALUES (?, ?)',
          product.id,
          JSON.stringify(product),
        );
      }
    });
  },

  async loadCachedProducts(): Promise<Product[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ProductRow>('SELECT product_json FROM cached_products ORDER BY product_id');
    return rows.map((row) => JSON.parse(row.product_json) as Product);
  },

  async getPreference<T extends string>(key: string, fallback: T): Promise<T> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', key);
    return (row?.value as T | undefined) ?? fallback;
  },

  async setPreference(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', key, value);
  },
};