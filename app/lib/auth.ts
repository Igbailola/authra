import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { loginRatelimit } from "@/app/lib/ratelimit";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                console.log("🔐 Authorize function called");

                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                let rateLimited = false;
                try {
                    const { success, remaining } = await loginRatelimit.limit(
                        credentials.email
                    );
                    console.log(`Rate limit - success: ${success}, remaining: ${remaining}`);
                    if (!success) {
                        rateLimited = true;
                    }
                } catch (rateLimitError) {
                    console.error("Rate limit check failed:", rateLimitError);
                }

                if (rateLimited) {
                    throw new Error("Too many login attempts. Please wait 10 minutes.");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error("Invalid email or password");
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!passwordMatch) {
                    throw new Error("Invalid email or password");
                }

                if (!user.emailVerified) {
                    throw new Error("Please verify your email before logging in");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session.user as { id: string }).id = token.id as string;
            }
            return session;
        },
    },
};

export default NextAuth(authOptions);