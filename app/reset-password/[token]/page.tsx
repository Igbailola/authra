"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return null;
        if (password.length < 6) return "weak";
        if (
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password)
        )
            return "strong";
        return "fair";
    };

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error);
            setLoading(false);
            return;
        }

        router.push("/login?message=Password reset successfully. You can now log in.");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Reset your password
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        {strength && (
                            <div className="mt-2">
                                <div className="h-1.5 w-full bg-gray-200 rounded-full">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-300 ${strength === "weak"
                                                ? "w-1/3 bg-red-500"
                                                : strength === "fair"
                                                    ? "w-2/3 bg-yellow-500"
                                                    : "w-full bg-green-500"
                                            }`}
                                    />
                                </div>
                                <p
                                    className={`text-xs mt-1 ${strength === "weak"
                                            ? "text-red-500"
                                            : strength === "fair"
                                                ? "text-yellow-500"
                                                : "text-green-500"
                                        }`}
                                >
                                    {strength === "weak"
                                        ? "Weak password"
                                        : strength === "fair"
                                            ? "Fair password"
                                            : "Strong password"}
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-500 mt-6">
                    Remember your password?{" "}
                    <Link href="/login" className="text-black font-medium hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}