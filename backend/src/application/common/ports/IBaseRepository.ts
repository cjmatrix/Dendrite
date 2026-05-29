export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  create(data: any): Promise<T>;
  save(entity: T): Promise<T>;
  count(filter?: any): Promise<number>;
  findByIdAndUpdate(id: string, update: any): Promise<T | null>;
}
