import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  transactionId: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  tier: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMongoTransactionDocument extends Omit<ITransaction, "userId">, Document {
  userId: mongoose.Types.ObjectId;
}

const TransactionSchema = new Schema<IMongoTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    subscriptionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    tier: { type: String, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const MongoTransaction: Model<IMongoTransactionDocument> =
  mongoose.model<IMongoTransactionDocument>("Transaction", TransactionSchema);
