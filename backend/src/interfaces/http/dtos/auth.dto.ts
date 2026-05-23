import { z } from 'zod';


const emailSchema = z.string().trim().email('Invalid email format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const RegisterUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginUserDto = z.infer<typeof LoginUserSchema>;

export const UpdateFcmTokenSchema = z.object({
  fcmToken: z.string().trim().min(1, 'FCM Token cannot be empty'),
});

export type UpdateFcmTokenDto = z.infer<typeof UpdateFcmTokenSchema>;

export class UserResponseDto {
  static toResponse(userEntity: any) {
    if (!userEntity) return null;
    
   
    return {
      id: userEntity._id ? userEntity._id.toString() : (userEntity.id || ''),
      name: userEntity.name,
      email: userEntity.email,
      avatarUrl: userEntity.avatarUrl || '',
      tier: userEntity.tier || 'free',
      tokensUsed: userEntity.tokensUsed || 0,
      settings: {
        theme: userEntity.settings?.theme || 'dark',
        defaultModel: userEntity.settings?.defaultModel || 'gemini-1.5-pro',
        saveHistory: userEntity.settings?.saveHistory !== false,
      },
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
    };
  }
}
