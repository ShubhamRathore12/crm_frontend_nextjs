"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthBackground } from "@/components/auth/auth-background";
import { ArrowLeft, ArrowRight, CheckCircle2, Key, Mail, ShieldCheck } from "lucide-react";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.forgotPassword(email);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Request failed");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.resetPassword({ email, otp, new_password: newPassword });
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Reset failed");
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground">
      <AuthBackground />

      <div className="w-full max-w-md space-y-12">
        {/* Header Area */}
        <div className="text-center space-y-2 animate-fadeInUp">
          <Link
            href="/login"
            className="inline-flex items-center text-[10px] font-mono text-primary hover:text-white transition-colors uppercase tracking-[0.3em] mb-6"
          >
            <ArrowLeft className="h-3 w-3 mr-2" /> Back to Base
          </Link>
          <h1 className="text-[#F4F4ED] font-serif text-5xl md:text-6xl leading-tight tracking-tighter">
            RECOVER <span className="text-primary">KEY</span>
          </h1>
          <p className="text-muted-foreground/60 font-medium tracking-tight">
            Initiate security bypass protocol.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 animate-fadeInUp delay-200">
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-8">
              <div className="space-y-6">
                <div className="group relative">
                  <label className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest transition-all focus-within:text-primary">
                    Target Email
                  </label>
                  <div className="flex items-center border-b border-[#F4F4ED]/20 py-2 transition-all focus-within:border-primary">
                    <Mail className="h-4 w-4 text-[#F4F4ED]/30 mr-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pilot@gate.com"
                      required
                      className="block w-full bg-transparent border-none text-[#F4F4ED] placeholder:text-[#F4F4ED]/10 focus:ring-0 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-mono uppercase bg-red-400/10 p-2 rounded">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "TRANSMITTING..." : "GENERATE ACCESS CODE"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-8">
              <div className="space-y-6 text-center">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <p className="text-[#F4F4ED] text-sm font-medium">Verification Code Transmitted.</p>
                <div className="flex justify-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full max-w-[200px] bg-white/10 border-b-2 border-primary text-center text-4xl tracking-[0.5em] text-primary focus:ring-0 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={() => setStep("reset")}
                className="w-full py-4 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
              >
                VERIFY TRANSMISSION
              </button>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-8">
              <div className="space-y-6">
                <div className="group relative">
                  <label className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest transition-all focus-within:text-primary">
                    New Access Key
                  </label>
                  <div className="flex items-center border-b border-[#F4F4ED]/20 py-2 transition-all focus-within:border-primary">
                    <Key className="h-4 w-4 text-[#F4F4ED]/30 mr-3" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className="block w-full bg-transparent border-none text-[#F4F4ED] placeholder:text-[#F4F4ED]/10 focus:ring-0 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs font-mono uppercase bg-red-400/10 p-2 rounded">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "UPDATING CORE..." : "FINALIZE NEW KEY"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-8 text-center py-4">
              <div className="relative inline-block">
                <CheckCircle2 className="h-20 w-20 text-primary mx-auto" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[#F4F4ED] font-serif text-3xl tracking-tight">ENCRYPTED</h3>
                <p className="text-muted-foreground/60 text-sm">Your new access key is active.</p>
              </div>
              <Link
                href="/login"
                className="block w-full py-4 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
              >
                RETURN TO SIGN IN
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
