export interface IGetRateLimitsUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(): Promise<Record<string, any>>;
}

export interface IUpdateRateLimitUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(key: string, value: any): Promise<void>;
}
