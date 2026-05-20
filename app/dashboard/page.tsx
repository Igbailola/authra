import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl shadow-md p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Welcome back, {session.user?.name} 👋
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {session.user?.email}
                            </p>
                        </div>
                        <form action="/api/auth/signout" method="POST">
                            <button
                                type="submit"
                                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                            >
                                Log out
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Status
                            </p>
                            <p className="text-lg font-semibold text-green-600">
                                Verified ✓
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Session
                            </p>
                            <p className="text-lg font-semibold text-gray-900">Active</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Security
                            </p>
                            <p className="text-lg font-semibold text-gray-900">JWT</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}