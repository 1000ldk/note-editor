"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false, // Prevent NextAuth from automatically redirecting to its own page so we can handle it
      });

      if (signInRes?.error) {
        throw new Error("メールアドレス、またはパスワードが間違っています。");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-outline-variant/20">
        <h2 className="text-3xl font-bold text-center text-on-surface mb-8 font-sans">ログイン</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-container text-white font-bold py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            ログイン
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          初めてですか？{" "}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            新規登録はこちらから
          </Link>
        </p>
      </div>
    </div>
  );
}