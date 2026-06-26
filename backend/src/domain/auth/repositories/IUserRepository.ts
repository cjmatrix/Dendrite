import { IBaseRepository } from '../../../application/common/ports/IBaseRepository';
import { IUser } from '../entities/User';

export interface IUserRepository extends IBaseRepository<IUser> {
  findById(id: string): Promise<IUser | null>;
  findByIdSafe(id: string): Promise<IUser | null>;
  findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(userData: Partial<IUser>): Promise<IUser>;
  findAll(filter?: Record<string, unknown>, options?: { limit?: number; skip?: number; sort?: Record<string, unknown> }): Promise<IUser[]>;
  count(filter?: Record<string, unknown>): Promise<number>;
  aggregate(pipeline: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
  findByBillingCustomerId(customerId: string): Promise<IUser | null>;
  updateByBillingCustomerId(customerId: string, update: Record<string, unknown>): Promise<IUser | null>;
}
