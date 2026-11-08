import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { db } from './data';

/** Persists the mock API's existing collections in Neon as JSONB documents. */
@Injectable()
export class NeonStore implements OnApplicationShutdown {
  private readonly pool?: Pool;
  private saveChain: Promise<void> = Promise.resolve();

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      this.pool = new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      });
    }
  }

  async initialize(): Promise<void> {
    if (!this.pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL is required in production');
      }
      console.warn('DATABASE_URL is not set; using in-memory demo data.');
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tqms_app_state (
        collection text PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Seed each collection only when it has no stored value. Existing Neon data
    // always wins over the local demo seed.
    for (const collection of this.collections()) {
      await this.pool.query(
        `INSERT INTO tqms_app_state (collection, value)
         VALUES ($1, $2::jsonb) ON CONFLICT (collection) DO NOTHING`,
        [collection, JSON.stringify(db[collection])],
      );
    }

    const { rows } = await this.pool.query<{ collection: string; value: unknown }>(
      'SELECT collection, value FROM tqms_app_state',
    );
    for (const row of rows) {
      if (row.collection in db && row.collection !== 'sessions') {
        (db as any)[row.collection] = row.value;
      }
    }
    const displayName = process.env.CHECKPOINT_DISPLAY_NAME?.trim() || 'lodbod checkpoint';
    if (db.users[0] && db.users[0].name !== displayName) {
      db.users[0].name = displayName;
      await this.persist();
    }
    console.log('Connected to Neon and loaded persisted application data.');
  }

  /** Save writes before returning the successful API response. */
  persist(): Promise<void> {
    if (!this.pool) return Promise.resolve();
    this.saveChain = this.saveChain.then(async () => {
      const client = await this.pool!.connect();
      try {
        await client.query('BEGIN');
        for (const collection of this.collections()) {
          await client.query(
            `INSERT INTO tqms_app_state (collection, value, updated_at)
             VALUES ($1, $2::jsonb, now())
             ON CONFLICT (collection) DO UPDATE
             SET value = EXCLUDED.value, updated_at = now()`,
            [collection, JSON.stringify(db[collection])],
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
    return this.saveChain;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }

  private collections(): (keyof typeof db)[] {
    return (Object.keys(db) as (keyof typeof db)[]).filter(
      (key) => key !== 'sessions',
    );
  }
}
