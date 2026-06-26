export interface IRateLimit {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}
