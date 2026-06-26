import { ITokenUsage } from "../../auth/entities/User";

export interface IDailyTokenUsage {
  _id?: string;
  userId: string;
  date: Date;
  tierAtTime: string;
  token_usage?: ITokenUsage;
}
