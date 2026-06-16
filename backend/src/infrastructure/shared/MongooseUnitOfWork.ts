import mongoose, { ClientSession } from "mongoose";
import { IUnitOfWorkRepository } from "../../application/common/ports/IUnitOfWorkRepository";

import { AsyncLocalStorage } from "async_hooks";
import { injectable } from "tsyringe";

export const transactionStorage = new AsyncLocalStorage<ClientSession>();

@injectable()
export class MongooseUnitOfWork implements IUnitOfWorkRepository {
  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    let result: T;

    try {
      await session.withTransaction(async () => {
        result = await transactionStorage.run(session, work);
      });

      return result!;
    } finally {
      await session.endSession();
    }
  }
}
