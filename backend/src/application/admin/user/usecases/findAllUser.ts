import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";


@injectable()
export class FindAllUser {
    constructor (@inject("IUserRepository") private userRepo:IUserRepository){}

    async execute(query: any){
        const { page, limit, search, status, sortBy, sortOrder } = query;
        let skip = (page - 1) * limit;

        const filter: any = {};
        if (search) {
          filter.$or = [{"name":{ $regex: search, $options: "i" }},{"email":{ $regex: search, $options: "i" }}];
     
        }
        if (status) {
          filter.status = status;
        }

        const sort: any = {};
        if (sortBy === "totalTokens") {
          sort["token_usage.total"] = sortOrder === "asc" ? 1 : -1;
        } else {
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        }

        const [users, total] = await Promise.all([
          this.userRepo.findAll(filter, { limit, skip, sort }),
          this.userRepo.count(filter)
        ]);

        return {
          users,
          total
        }

    }
}