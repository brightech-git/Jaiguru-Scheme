import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const registerSchema = z.object({
  contactNumber: z
    .string()
    .trim()
    .regex(mobileRegex, 'Enter a valid 10-digit contact number'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const REGISTER_DEFAULTS: RegisterFormValues = {
  contactNumber: '',
};
