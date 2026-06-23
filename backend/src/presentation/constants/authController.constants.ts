export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  UNAUTHORIZED: 401,
} as const;

export const AUTH_MESSAGES = {
  REGISTRATION_INITIATED: "Registration initiated. Verification OTP sent.",
  LOGGED_IN: "Logged in successfully",
  TOKEN_REFRESHED: "Token refreshed",
  LOGGED_OUT: "Logged out successfully",
  FCM_TOKEN_UPDATED: "FCM token updated successfully",
  OTP_SENT: "OTP sent successfully",
  OTP_VERIFIED: "OTP verified and account activated successfully. Please log in.",
  GOOGLE_AUTH_SUCCESS: "Successfully authenticated with Google",
  UNAUTHORIZED: "Unauthorized",
  FORGOT_PASSWORD_SENT: "If that email address exists, we have sent a reset link to it.",
  PASSWORD_RESET_SUCCESS: "Password reset successful. You can now login with your new password.",
} as const;

export const ADMIN_AUTH_MESSAGES = {
  LOGGED_IN: "Successfully logged in as admin",
  LOGGED_OUT: "Successfully logged out from Admin Portal",
  TOKEN_REFRESHED: "Token refreshed",
  UNAUTHORIZED: "Unauthorized",
} as const;

export const ADMIN_USER_MESSAGES = {
  USERS_RETRIEVED: "Users retrieved successfully",
  USER_DETAILS_RETRIEVED: "User details retrieved successfully",
  USER_SUSPENDED: "User suspended successfully",
  USER_UNSUSPENDED: "User unsuspended successfully",
  USER_TOGGLE_BAN: (status: "banned" | "unbanned") =>
    `User ${status} successfully`,
} as const;
