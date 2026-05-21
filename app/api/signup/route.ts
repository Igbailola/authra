import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { createVerificationToken } from "@/app/lib/tokens";
import { sendVerificationEmail } from "@/app/lib/email";

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validation = signUpSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = validation.error
                ? validation.error.issues[0].message
                : "Invalid input";
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        const { name, email, password } = validation.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const token = await createVerificationToken(email);
        await sendVerificationEmail(email, token);

        return NextResponse.json(
            { message: "Account created. Please check your email to verify your account." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}