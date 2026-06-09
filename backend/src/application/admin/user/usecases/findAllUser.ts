import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IFindAllUserUseCase } from "./interfaces";
import { UserManagementMapper, UserPaginationOutputDTO } from "../dtos/userManagement.dto";


@injectable()
export class FindAllUser implements IFindAllUserUseCase {
    constructor (@inject("IUserRepository") private userRepo:IUserRepository){}

    async execute(query: any): Promise<UserPaginationOutputDTO> {
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
          sort["tokensUsed"] = sortOrder === "asc" ? 1 : -1;
        } else {
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        }

        const [users, total] = await Promise.all([
          this.userRepo.findAll(filter, { limit, skip, sort }),
          this.userRepo.count(filter)
        ]);

        return UserManagementMapper.toPaginationOutput(users, total, page, limit);
        

    }
}