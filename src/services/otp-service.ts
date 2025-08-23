
'use server';

import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

if (!host || !user || !pass) {
    console.warn("Email service is not configured. OTP emails will not be sent.");
}

const transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user,
        pass,
    },
});

export async function sendOtpEmail(to: string, otp: string) {
    if (!host || !user || !pass) {
        console.error("Cannot send OTP email because email service is not configured.");
        // In a real app, you might want to return an error or handle this differently.
        // For this context, we will not throw an error to avoid breaking the flow for users without .env setup.
        return;
    }
    
    const mailOptions = {
        from: `"HariumAI" <${user}>`,
        to: to,
        subject: 'Your HariumAI Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                <h2>Welcome to HariumAI!</h2>
                <p>Your one-time verification code is:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px; padding: 10px; background-color: #f2f2f2; border-radius: 5px;">
                    ${otp}
                </p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">&copy; HariumAI by Chohan.Space</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent to:', to);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Could not send verification email.');
    }
}
