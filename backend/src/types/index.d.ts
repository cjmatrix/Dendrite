import { IUser } from "../infrastructure/auth/models/MongoUserModel";

export interface UserPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
