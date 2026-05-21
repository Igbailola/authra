import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

interface Props {
    params: Promise<{ token: string }>;
}

export default async function VerifyEmailPage({ params }: Props) {
    const { token } = await params;

    if (!token) {
        redirect("/login?error=Invalid verification link");
    }

    const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
    });

    if (!verificationToken) {
        redirect("/login?error=Invalid or expired verification link");
    }

    if (verificationToken.expires < new Date()) {
        await prisma.verificationToken.delete({
            where: { token },
        });
        redirect("/login?error=Verification link has expired. Please sign up again.");
    }

    await prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
        where: { token },
    });

    redirect("/login?message=Email verified successfully. You can now log in.");
}