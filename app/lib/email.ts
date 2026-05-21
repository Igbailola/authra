import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
    email: string,
    token: string
): Promise<void> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email/${token}`;

    const result = await resend.emails.send({
        from: "Authra <onboarding@resend.dev>",
        to: email,
        subject: "Verify your Authra account",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Verify your email</h2>
        <p style="color: #555;">Thanks for signing up for Authra. Click the button below to verify your email address.</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 12px;">This link expires in 15 minutes. If you did not sign up, ignore this email.</p>
      </div>
    `,
    });

    console.log("Resend result:", JSON.stringify(result));
}
