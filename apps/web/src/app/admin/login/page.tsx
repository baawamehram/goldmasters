"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(buildApiUrl("auth/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed. Please check credentials.");
        }

        const token = data?.data?.token;
        if (!token) {
          throw new Error("Authentication response missing token.");
        }

        localStorage.setItem("admin_token", token);
        router.push("/admin/dashboard");
      } catch (submitError) {
        console.error("Admin login error:", submitError);
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Unable to sign in. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [password, router, username]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-modal p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
              Admin Sign In
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access the control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
                placeholder="wish-admin"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-touch px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg text-xs text-muted-foreground text-center">
            <p className="font-medium">Authorized access only.</p>
            <p className="mt-1">Default credentials: wish-admin / admin123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
