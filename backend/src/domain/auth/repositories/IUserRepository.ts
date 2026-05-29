import { IBaseRepository } from '../../../application/common/ports/IBaseRepository';
import { IUser } from '../entities/User';

export interface IUserRepository extends IBaseRepository<IUser> {
  findById(id: string): Promise<IUser | null>;
  findByIdSafe(id: string): Promise<IUser | null>;
  findByIdAndUpdate(id: string, update: any): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(userData: any): Promise<IUser>;
  findAll(filter?: any, options?: { limit?: number; skip?: number; sort?: any }): Promise<IUser[]>;
  count(filter?: any): Promise<number>;
}
