import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { createPasswordResetToken } from "@/app/lib/tokens";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { forgotPasswordRatelimit } from "@/app/lib/ratelimit";

const schema = z.object({
    email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

        const { success } = await forgotPasswordRatelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                {
                    error:
                        "Too many requests. Please wait 10 minutes before trying again.",
                },
                { status: 429 }
            );
        }

        const body = await request.json();

        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email } = validation.data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                {
                    message:
                        "If an account exists with this email, you will receive a password reset link shortly.",
                },
                { status: 200 }
            );
        }

        const token = await createPasswordResetToken(email);
        await sendPasswordResetEmail(email, token);

        return NextResponse.json(
            {
                message:
                    "If an account exists with this email, you will receive a password reset link shortly.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}