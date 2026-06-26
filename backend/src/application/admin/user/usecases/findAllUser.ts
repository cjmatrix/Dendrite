import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IFindAllUserUseCase } from "./interfaces";
import { UserManagementMapper, UserPaginationOutputDTO } from "../dtos/userManagement.dto";


@injectable()
export class FindAllUser implements IFindAllUserUseCase {
    constructor (@inject("IUserRepository") private userRepo:IUserRepository){}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(query: any): Promise<UserPaginationOutputDTO> {
        const { page, limit, search, status, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (search) {
          filter.$or = [{"name":{ $regex: search, $options: "i" }},{"email":{ $regex: search, $options: "i" }}];
     
        }
        if (status) {
          filter.status = status;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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