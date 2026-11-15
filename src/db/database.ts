import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync('morrow-market.db').then(async (database) => {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cart_items (
        product_id INTEGER PRIMARY KEY NOT NULL,
        product_json TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0)
      );
      CREATE TABLE IF NOT EXISTS favorites (
        product_id INTEGER PRIMARY KEY NOT NULL,
        product_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cached_products (
        product_id INTEGER PRIMARY KEY NOT NULL,
        product_json TEXT NOT NULL,
        cached_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return database;
  });
  return databasePromise;
}