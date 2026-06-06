import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
};

export const accessTokenMaxAge = Number(process.env.ACCESS_TOKEN_MAX_AGE || 15 * 60 * 1000);
export const refreshTokenMaxAge = Number(process.env.REFRESH_TOKEN_MAX_AGE || 7 * 24 * 60 * 60 * 1000);

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  isAdmin = false
): void {
  const accessCookieName = isAdmin ? "adminAccessToken" : "accessToken";
  const refreshCookieName = isAdmin ? "adminRefreshToken" : "refreshToken";

  res.cookie(accessCookieName, tokens.accessToken, {
    ...cookieOptions,
    maxAge: accessTokenMaxAge,
  });

  res.cookie(refreshCookieName, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenMaxAge,
  });
}

export function clearAuthCookies(res: Response, isAdmin = false): void {
  const accessCookieName = isAdmin ? "adminAccessToken" : "accessToken";
  const refreshCookieName = isAdmin ? "adminRefreshToken" : "refreshToken";

  res.clearCookie(accessCookieName, cookieOptions);
  res.clearCookie(refreshCookieName, cookieOptions);
}
