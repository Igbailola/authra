import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(
                new URL("/login?error=Invalid verification link", request.url)
            );
        }

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.redirect(
                new URL("/login?error=Invalid or expired verification link", request.url)
            );
        }

        if (verificationToken.expires < new Date()) {
            await prisma.verificationToken.delete({
                where: { token },
            });
            return NextResponse.redirect(
                new URL("/login?error=Verification link has expired. Please sign up again.", request.url)
            );
        }

        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        await prisma.verificationToken.delete({
            where: { token },
        });

        return NextResponse.redirect(
            new URL("/login?message=Email verified successfully. You can now log in.", request.url)
        );
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.redirect(
            new URL("/login?error=Something went wrong. Please try again.", request.url)
        );
    }
}