"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Invalid admin access.");
      }

      sessionStorage.setItem("dawn-admin-token", result.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-md rounded-3xl border border-[#c9a46a]/40 bg-[#151515] p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46a]">Dawn Tattoo Ink</p>
        <h1 className="mt-4 text-3xl font-black uppercase">Admin Access</h1>
        <p className="mt-3 text-sm text-gray-400">
          Use the studio admin secret to view pending tickets and website visitor questions.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm text-gray-300">
            Admin secret
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Enter studio key"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 outline-none focus:border-[#c9a46a]"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#c9a46a] px-6 py-3.5 font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#d6b57a]"
          >
            {isSubmitting ? "Checking access..." : "Open Admin Dashboard"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
