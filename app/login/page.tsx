"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get("message");

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email: form.email,
            password: form.password,
            redirect: false,
        });

        if (result?.error) {
            setError("Invalid email or password");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
                <p className="text-sm text-gray-500 mb-6">Log in to your Authra account</p>

                {message && (
                    <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg mb-4">
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
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
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <div className="flex justify-between mt-6">
                    <p className="text-sm text-gray-500">
                        No account?{" "}
                        <Link href="/signup" className="text-black font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-black font-medium hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>
            </div>
        </main>
    );
}