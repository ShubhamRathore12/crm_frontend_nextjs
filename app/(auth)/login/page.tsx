"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowRight, Lock, Mail, Sparkles, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

// Animated grid dot background
function AnimatedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    const dots: { x: number; y: number; baseAlpha: number }[] = [];
    const spacing = 40;

    const initDots = () => {
      dots.length = 0;
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          dots.push({ x, y, baseAlpha: Math.random() * 0.15 + 0.03 });
        }
      }
    };
    initDots();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;
        const influence = Math.max(0, 1 - dist / maxDist);
        const alpha = dot.baseAlpha + influence * 0.6;
        const size = 1.5 + influence * 2.5;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(75, 184, 166, ${alpha})`;
        ctx.fill();

        if (influence > 0.3) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, size + 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(75, 184, 166, ${influence * 0.1})`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />;
}

// Magnetic button component
function MagneticButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

// Text reveal animation component
function TextReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chars = el.querySelectorAll(".char");
    gsap.fromTo(
      chars,
      { y: 80, opacity: 0, rotateX: -90 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        stagger: 0.04,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay,
      }
    );
  }, [delay]);

  return (
    <span ref={containerRef} className={cn("inline-flex overflow-hidden", className)}>
      {text.split("").map((char, i) => (
        <span key={i} className="char inline-block" style={{ perspective: "500px" }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    if (!mounted) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the orbit ring
    if (orbitRef.current) {
      gsap.fromTo(
        orbitRef.current,
        { scale: 0, opacity: 0, rotation: -180 },
        { scale: 1, opacity: 1, rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.5)", delay: 0.3 }
      );
      gsap.to(orbitRef.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
      });
    }

    // Animate form fields
    if (formRef.current) {
      const fields = formRef.current.querySelectorAll(".form-field");
      tl.fromTo(
        fields,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.15, duration: 0.7, delay: 0.6 }
      );
    }

    // Animate features
    if (featuresRef.current) {
      const items = featuresRef.current.querySelectorAll(".feature-item");
      gsap.fromTo(
        items,
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, delay: 1.2, ease: "back.out(1.5)" }
      );
    }
  }, [mounted]);

  // Input focus animation
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const parent = e.target.closest(".input-wrapper");
    if (parent) {
      gsap.to(parent, { scale: 1.02, duration: 0.3, ease: "power2.out" });
      gsap.to(parent.querySelector(".input-glow"), { opacity: 1, duration: 0.3 });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const parent = e.target.closest(".input-wrapper");
    if (parent) {
      gsap.to(parent, { scale: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(parent.querySelector(".input-glow"), { opacity: 0, duration: 0.3 });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Button press animation
    const btn = e.currentTarget.querySelector("button[type=submit]");
    if (btn) gsap.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

    try {
      const { token } = await api.auth.login(email, password);
      localStorage.setItem("token", token);

      // Success animation before redirect
      if (containerRef.current) {
        await gsap.to(containerRef.current, { y: -20, opacity: 0, duration: 0.4, ease: "power2.in" });
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      // Shake animation on error
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: [-10, 10, -8, 8, -4, 4, 0],
          duration: 0.5,
          ease: "power2.out",
        });
      }
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[hsl(220,18%,6%)]">
      <AnimatedGrid />

      {/* Gradient orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div ref={containerRef} className="relative z-10 w-full max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col gap-8">
          {/* Animated orbit ring */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <div ref={orbitRef} className="absolute inset-0 rounded-full border border-primary/20">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/50" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/30" />
            </div>
            <div className="absolute inset-8 rounded-full border border-primary/10 flex items-center justify-center">
              <div className="text-center">
                <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
                <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Secured</span>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              <TextReveal text="Welcome" delay={0.2} />
              <br />
              <span className="text-primary">
                <TextReveal text="Back" delay={0.5} />
              </span>
            </h1>
            <p className="mt-4 text-muted-foreground/70 text-base max-w-sm leading-relaxed">
              Your intelligent CRM command center. Manage leads, close deals, and grow revenue — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div ref={featuresRef} className="flex flex-wrap gap-3 mt-2">
            <div className="feature-item flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-medium text-white/70">Real-time Analytics</span>
            </div>
            <div className="feature-item flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-white/70">AI-Powered Insights</span>
            </div>
            <div className="feature-item flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-white/70">Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Sign <span className="text-primary">In</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground/60">Access your CRM dashboard</p>
          </div>

          {/* Glass card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
            {/* Card glow effect */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="relative">
              {/* Card header */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight">Sign in to your account</h2>
                <p className="text-sm text-muted-foreground/50 mt-1">Enter your credentials below</p>
              </div>

              <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="form-field">
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="input-wrapper relative group">
                    <div className="input-glow absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/40 to-primary/20 opacity-0 blur-sm transition-opacity pointer-events-none" />
                    <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all group-focus-within:border-primary/50">
                      <Mail className="h-4 w-4 text-white/30 mr-3 shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder="name@company.com"
                        required
                        className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="form-field">
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="input-wrapper relative group">
                    <div className="input-glow absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/40 to-primary/20 opacity-0 blur-sm transition-opacity pointer-events-none" />
                    <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all group-focus-within:border-primary/50">
                      <Lock className="h-4 w-4 text-white/30 mr-3 shrink-0" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        required
                        className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <p className="text-red-400 text-xs font-medium">{error}</p>
                  </div>
                )}

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary/70 hover:text-primary transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit button */}
                <div className="form-field pt-2">
                  <MagneticButton
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center items-center py-3.5 px-6 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </MagneticButton>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[hsl(220,18%,6%)] text-white/30 font-medium">or</span>
                </div>
              </div>

              {/* Register link */}
              <div className="text-center">
                <p className="text-sm text-white/40">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <p className="text-center text-[10px] text-white/20 mt-6 font-mono uppercase tracking-widest">
            Protected by enterprise-grade encryption
          </p>
        </div>
      </div>
    </main>
  );
}
