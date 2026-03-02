import { IUser } from '../models/User';

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
