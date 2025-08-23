
'use server';

/**
 * @fileOverview A Genkit flow to verify a One-Time Password (OTP).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserByEmail, verifyUser } from '@/services/user-service';

const VerifyOtpInputSchema = z.object({
  email: z.string().email().describe('The email address to verify.'),
  otp: z.string().length(6).describe('The 6-digit OTP.'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

const VerifyOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
  return verifyOtpFlow(input);
}

const verifyOtpFlow = ai.defineFlow(
  {
    name: 'verifyOtpFlow',
    inputSchema: VerifyOtpInputSchema,
    outputSchema: VerifyOtpOutputSchema,
  },
  async ({ email, otp }) => {
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.isVerified) {
        return { success: true, message: 'User is already verified.' };
    }

    if (!user.otp || !user.otpExpires) {
        throw new Error('No OTP found for this user. Please request a new one.');
    }

    if (new Date() > new Date(user.otpExpires)) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (user.otp !== otp.toUpperCase()) {
      throw new Error('Invalid OTP.');
    }

    // OTP is correct, mark user as verified and clear OTP fields
    await verifyUser(email);

    return {
      success: true,
      message: 'Email successfully verified.',
    };
  }
);
