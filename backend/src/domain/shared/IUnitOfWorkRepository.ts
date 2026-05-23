
export interface IUnitOfWorkRepository{
    runInTransaction<T>(work:()=>Promise<T>):Promise<T> 
}