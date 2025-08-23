
'use server';

/**
 * @fileOverview A Genkit flow to generate and send a One-Time Password (OTP).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserByEmail, saveOtp } from '@/services/user-service';
import { sendOtpEmail } from '@/services/otp-service';
import { randomBytes } from 'crypto';

const SendOtpInputSchema = z.object({
  email: z.string().email().describe('The email address to send the OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async ({ email }) => {
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error('No user found with this email address.');
    }
    
    // Generate a 6-digit OTP
    const otp = randomBytes(3).toString('hex').toUpperCase();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    await saveOtp(email, otp, expires);
    await sendOtpEmail(email, otp);

    return {
      success: true,
      message: 'An OTP has been sent to your email address.',
    };
  }
);
