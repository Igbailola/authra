import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-md p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Authra
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Secure authentication. Production ready. Zero shortcuts.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Log In
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">bcrypt</p>
              <p className="text-xs text-gray-500">Password hashing</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">JWT</p>
              <p className="text-xs text-gray-500">Session handling</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Rate limited</p>
              <p className="text-xs text-gray-500">Brute force protection</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}