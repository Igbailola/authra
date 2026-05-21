import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";

export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function createVerificationToken(email: string): Promise<string> {
    const token = generateToken();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.deleteMany({
        where: { identifier: email },
    });

    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
        },
    });

    return token;
}

export async function createPasswordResetToken(email: string): Promise<string> {
    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.deleteMany({
        where: { email },
    });

    await prisma.passwordResetToken.create({
        data: {
            email,
            token,
            expires,
        },
    });

    return token;
}