export interface ITransaction {
  _id?: string;
  userId: string;
  transactionId: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  tier: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}
