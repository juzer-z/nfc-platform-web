"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      router.push("/admin/profiles");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-sm px-4">
        <form
          onSubmit={handleLogin}
          className="rounded-2xl bg-white p-8 shadow-xl"
        >
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <a
              href="https://1card.fyi"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center transition hover:opacity-80"
              aria-label="Visit 1card.fyi"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/1card-fyi-logo-white.svg"
                alt="1card.fyi"
                className="h-8 w-auto opacity-80 invert"
              />
            </a>

            <h1 className="text-2xl font-bold text-center text-gray-900">
              Admin Login
            </h1>
          </div>

          {error && (
            <p className="text-red-600 mb-4 text-sm text-center">{error}</p>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              className={inputClass}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-3 text-center">
          <a
            href="https://1card.fyi"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center transition hover:opacity-80"
            aria-label="Visit 1card.fyi"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/1card-fyi-logo-white.svg"
              alt="1card.fyi"
              className="h-8 w-auto opacity-50"
            />
          </a>
          <div className="text-xs text-white/30">
            Powered by{" "}
            <a
              href="https://3jtec.com"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 transition hover:text-white/50"
            >
              3J Technologies
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
