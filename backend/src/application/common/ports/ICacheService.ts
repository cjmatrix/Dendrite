export interface CacheSetOptions {
  /** Time-to-live in seconds */
  EX?: number;
  /** Time-to-live in milliseconds */
  PX?: number;
  /** Only set the key if it does NOT exist */
  NX?: boolean;
  /** Only set the key if it ALREADY exists */
  XX?: boolean;
  /** Keep the old expiration time */
  KEEPTTL?: boolean;
}

export interface ICacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: CacheSetOptions): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
