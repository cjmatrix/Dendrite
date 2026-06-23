export interface IGetRateLimitsUseCase {
  execute(): Promise<Record<string, any>>;
}

export interface IUpdateRateLimitUseCase {
  execute(key: string, value: any): Promise<void>;
}
