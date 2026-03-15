"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SplashScreen } from "@/components/auth/splash-screen";
import { AuthBackground } from "@/components/auth/auth-background";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.auth.register(name, email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground">
      <SplashScreen />
      <AuthBackground />

      <div className={cn(
        "w-full max-w-md space-y-12 transition-opacity duration-1000",
        showForm ? "opacity-100" : "opacity-0"
      )}>
        <div className="text-center space-y-2 animate-fadeInUp">
          <div className="inline-block px-4 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-4">
            New User Protocol
          </div>
          <h1 className="text-[#F4F4ED] font-serif text-6xl md:text-7xl leading-tight tracking-tighter">
            CREATE <span className="text-primary">ACCOUNT</span>
          </h1>
          <p className="text-muted-foreground/60 font-medium tracking-tight">
            Initialize your access credentials.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-8 animate-fadeInUp delay-200">
          <div className="space-y-6">
            <div className="group relative">
              <label className="absolute left-0 -top-3.5 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest transition-all group-focus-within:text-primary">
                Name
              </label>
              <div className="flex items-center border-b border-[#F4F4ED]/20 py-2 transition-all group-focus-within:border-primary">
                <User className="h-4 w-4 text-[#F4F4ED]/30 mr-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[#F4F4ED] placeholder:text-[#F4F4ED]/20"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            <div className="group relative">
              <label className="absolute left-0 -top-3.5 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest transition-all group-focus-within:text-primary">
                Identification
              </label>
              <div className="flex items-center border-b border-[#F4F4ED]/20 py-2 transition-all group-focus-within:border-primary">
                <Mail className="h-4 w-4 text-[#F4F4ED]/30 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[#F4F4ED] placeholder:text-[#F4F4ED]/20"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="group relative">
              <label className="absolute left-0 -top-3.5 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest transition-all group-focus-within:text-primary">
                Authentication
              </label>
              <div className="flex items-center border-b border-[#F4F4ED]/20 py-2 transition-all group-focus-within:border-primary">
                <Lock className="h-4 w-4 text-[#F4F4ED]/30 mr-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[#F4F4ED] placeholder:text-[#F4F4ED]/20"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                Initialize Access
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-muted-foreground/60">
            Already have access?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
