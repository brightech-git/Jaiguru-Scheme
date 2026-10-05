// Src/Screens/Auth/Login/validation/loginSchema.ts
// -----------------------------------------------------------------------------
// Dependency-free, Zod-style typed validation for the login form.
// (Zod isn't installed in this project; this mirrors its shape/ergonomics so it
//  can be swapped for a real Zod schema later with minimal changes.)
// -----------------------------------------------------------------------------

export interface LoginValues {
  contactNumber: string;
}

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export interface LoginValidationResult {
  success: boolean;
  errors: LoginErrors;
}

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export function validateField<K extends keyof LoginValues>(
  field: K,
  value: string,
): string | undefined {
  if (field === 'contactNumber') {
    const v = value.trim();
    if (!v) return 'Please enter your contact number';
    if (!MOBILE_REGEX.test(v)) return 'Enter a valid 10-digit contact number';
  }
  return undefined;
}

export function validateLogin(values: LoginValues): LoginValidationResult {
  const errors: LoginErrors = {};
  const contactError = validateField('contactNumber', values.contactNumber);
  if (contactError) errors.contactNumber = contactError;
  return { success: Object.keys(errors).length === 0, errors };
}

export const LOGIN_CONSTRAINTS = { mobileLength: 10 } as const;
