import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";

const schema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validation = schema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { token, password } = validation.data;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset link" },
                { status: 400 }
            );
        }

        if (resetToken.expires < new Date()) {
            await prisma.passwordResetToken.delete({
                where: { token },
            });
            return NextResponse.json(
                { error: "Reset link has expired. Please request a new one." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.delete({
            where: { token },
        });

        return NextResponse.json(
            { message: "Password reset successfully. You can now log in." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}