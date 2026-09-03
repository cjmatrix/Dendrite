export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  save(entity: T): Promise<T>;
  count(filter?: Record<string, unknown>): Promise<number>;
  findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
}
