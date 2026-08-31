"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/firebase/client";
import ErrorAlert from "@/components/ui/ErrorAlert";
import Loader from "@/components/ui/Loader";
import logo from "@/assets/logo.png";

export default function LandingPage() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GSAP refs
  const pageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // ── Auth logic (unchanged) ──────────────────────────────────────────────────
  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: result.data }),
      });
      if (!res.ok) {
        setError("Authentication service unavailable. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setLoading(false);
    }
  };

  // ── GSAP animations on mount ────────────────────────────────────────────────
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const run = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Badge
        if (badgeRef.current) {
          tl.fromTo(
            badgeRef.current,
            { opacity: 0, y: -16, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6 },
            0,
          );
        }

        // Headline words stagger
        if (headlineRef.current) {
          const words = headlineRef.current.querySelectorAll(".headline-word");
          tl.fromTo(
            words,
            { opacity: 0, y: 40, skewX: -2 },
            { opacity: 1, y: 0, skewX: 0, duration: 0.8, stagger: 0.12 },
            0.1,
          );
        }

        // Subtitle
        if (subRef.current) {
          tl.fromTo(
            subRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.5,
          );
        }

        // Auth card
        if (cardRef.current) {
          tl.fromTo(
            cardRef.current,
            { opacity: 0, y: 30, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: "back.out(1.1)",
            },
            0.3,
          );
        }

        // Floating particles
        if (particlesRef.current) {
          const dots = particlesRef.current.children;
          gsap.fromTo(
            dots,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 1.5,
              stagger: 0.1,
              ease: "power1.out",
              delay: 0.4,
            },
          );
        }

        // Features cards ScrollTrigger (Bento-style reveal)
        const featureCards = document.querySelectorAll(".feature-card");
        if (featureCards.length) {
          gsap.fromTo(
            featureCards,
            { opacity: 0, y: 35, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: featureCards[0],
                start: "top 88%",
              },
            },
          );
        }

        // Stats section
        const statCards = document.querySelectorAll(".stat-card");
        if (statCards.length) {
          gsap.fromTo(
            statCards,
            { opacity: 0, scale: 0.94 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.08,
              ease: "back.out(1.2)",
              scrollTrigger: {
                trigger: statCards[0],
                start: "top 88%",
              },
            },
          );
        }

        // Testimonial cards
        const testCards = document.querySelectorAll(".testimonial-card");
        if (testCards.length) {
          gsap.fromTo(
            testCards,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: testCards[0],
                start: "top 88%",
              },
            },
          );
        }
      }, pageRef);
    };

    run();
    return () => ctx?.revert();
  }, []);

  // ── Features data ───────────────────────────────────────────────────────────
  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      ),
      title: "Build Together",
      desc: "Collaborate with talented developers and designers in real-time hackathons with phase-by-phase tracking.",
      color: "#c084fc",
      bg: "rgba(192,132,252,0.06)",
      className: "md:col-span-2",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Ship Fast",
      desc: "From idea to deployed project in 24-48 hours. Structured phases keep you on track.",
      color: "#ec4899",
      bg: "rgba(236,72,153,0.06)",
      className: "md:col-span-1",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      title: "Win & Showcase",
      desc: "Compete for prizes, get featured on our hall of fame, and build a killer resume.",
      color: "#f97316",
      bg: "rgba(249,115,22,0.06)",
      className: "md:col-span-1",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM16 20a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      title: "Connect & Network",
      desc: "Meet industry professionals, mentors, and fellow innovators to forge lasting relationships and career pathways.",
      color: "#10b981",
      bg: "rgba(16,185,129,0.06)",
      className: "md:col-span-2",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Learn & Grow",
      desc: "Master new frameworks and tools with direct mentorship and support.",
      color: "#ec4899",
      bg: "rgba(236,72,153,0.06)",
      className: "md:col-span-1",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
      ),
      title: "Cloud Resources",
      desc: "Get free cloud credits, API access, and premier resources from leading tech partners.",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.06)",
      className: "md:col-span-2",
    },
  ];

  return (
    <div
      ref={pageRef}
      className="min-h-screen w-full overflow-x-hidden bg-[#05050a] relative selection:bg-purple-500/30 selection:text-white"
    >
      {/* ══════════ FIXED BACKGROUND ══════════ */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Floating gradient meshes */}
        <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_70%)] blur-[130px] animate-pulse-slow" />
        <div className="absolute top-[25%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.08)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[45vh] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.06)_0%,transparent_75%)] blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,10,0.8)_85%)]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#05050a]/75 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-auto h-10 sm:h-12 flex items-center justify-center relative overflow-hidden group">
              <img
                className="w-auto h-full object-contain drop-shadow-md"
                src={logo.src}
                alt="Logo"
              />
            </div>
            <span className="font-orbitron font-black text-sm sm:text-lg text-white tracking-widest uppercase whitespace-nowrap">
              IIE{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                HACK
              </span>{" "}
              LAB
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:flex items-center gap-1.5 font-mono-cc text-[9px] text-[rgba(241,240,255,0.5)] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              Base Online
            </span>
            <button
              onClick={handleSignIn}
              disabled={loading || authLoading}
              className="btn-primary py-1.5! px-3! sm:px-5! text-[9px] sm:text-[11px] font-bold tracking-widest uppercase magnetic-btn"
            >
              {loading || authLoading ? "..." : "Connect Portal"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
        {/* Floating particles */}
        <div
          ref={particlesRef}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Headline + info */}
          <div className="space-y-6 sm:space-y-8 lg:col-span-7">
            {/* Badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-purple-500/15 bg-purple-500/5 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse-dot" />
              <span className="font-orbitron font-bold text-[8.5px] sm:text-[9.5px] text-purple-300 uppercase tracking-widest">
                IIE HackLab — Active Hackathon Hub
              </span>
            </div>

            {/* Headline */}
            <div ref={headlineRef} className="overflow-hidden">
              <h1 className="font-orbitron font-black leading-tight uppercase tracking-tighter text-left">
                <span className="headline-word block text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-sm">
                  PARTICIPATE
                </span>
                <span className="headline-word block text-4xl sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  BUILD
                </span>
                <span
                  className="headline-word block text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-transparent"
                  style={{
                    WebkitTextStroke: "1.5px rgba(236,72,153,0.5)",
                  }}
                >
                  INNOVATE
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p
              ref={subRef}
              className="font-grotesk text-sm sm:text-base md:text-lg text-[rgba(241,240,255,0.6)] max-w-lg leading-relaxed flex items-start gap-4"
            >
              <span className="w-5 h-px bg-purple-400/50 mt-3.5 shrink-0" />
              Join a premier collaborative network of student builders. Build
              high-impact projects, showcase your technical skills, and
              accelerate your engineering journey.
            </p>
          </div>

          {/* RIGHT COLUMN — Auth Card */}
          <div
            ref={cardRef}
            className="w-full max-w-sm mx-auto lg:col-span-5 relative z-10"
          >
            <div className="relative">
              {/* Card glowing aura */}
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-35 transition duration-500" />

              <div className="glass-card relative p-6 sm:p-8 border-purple-500/20 overflow-visible rounded-2xl bg-[#0f0f24]/50 backdrop-blur-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center relative rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <svg
                      className="relative z-10 w-5 h-5 text-purple-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12L11 14L15 10M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12C21 7 17 3 12 3Z"
                      />
                    </svg>
                  </div>

                  <h2 className="font-orbitron font-bold text-lg text-white uppercase tracking-wider mb-1">
                    Connect Portal
                  </h2>
                  <p className="font-mono-cc text-[10px] text-[rgba(241,240,255,0.45)] uppercase tracking-widest">
                    Enter the builder ecosystem
                  </p>
                </div>

                {error && (
                  <div className="mb-5">
                    <ErrorAlert
                      title="Connection Failed"
                      message={error}
                      onRetry={() => setError(null)}
                    />
                  </div>
                )}

                {/* Google Sign In */}
                <button
                  id="auth-google-btn"
                  onClick={handleSignIn}
                  disabled={loading || authLoading}
                  className="w-full relative overflow-hidden group flex items-center justify-center gap-3 py-3 px-5 bg-white text-[#05050a] rounded-lg font-semibold font-orbitron text-xs uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {loading || authLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#05050a] border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-purple-500/10" />
                  <span className="font-mono-cc text-[8px] text-[rgba(241,240,255,0.2)] uppercase tracking-[0.25em]">
                    Secure Uplink
                  </span>
                  <div className="flex-1 h-px bg-purple-500/10" />
                </div>

                {/* Security attributes */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { icon: "🛡️", label: "SSL secure" },
                    { icon: "⚡", label: "Instant" },
                    { icon: "🔑", label: "OAuth 2.0" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg border border-white/5 bg-white/[0.01]"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="font-mono-cc text-[8px] text-[rgba(241,240,255,0.35)] uppercase tracking-wider font-semibold">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid Features ── */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14 sm:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-purple-500/15 bg-purple-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse-dot" />
              <span className="font-orbitron font-bold text-[9px] text-purple-300 uppercase tracking-widest">
                Workspace Features
              </span>
            </div>
            <h2 className="font-orbitron font-black text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-tighter">
              Unlock Your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Potential
              </span>
            </h2>
            <p className="font-grotesk text-sm sm:text-base text-[rgba(241,240,255,0.5)] max-w-xl mx-auto leading-relaxed">
              Equipped with elite resources to help you ideate, build, and
              deploy high-impact software projects
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <div
                key={f.title}
                className={`feature-card glass-card p-6 sm:p-8 group relative overflow-hidden cursor-default ${f.className || ""}`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="card-shimmer" />

                {/* Icon block */}
                <div
                  className="w-10 h-10 rounded-lg mb-6 flex items-center justify-center border transition-all duration-300 group-hover:scale-105"
                  style={{
                    borderColor: `${f.color}30`,
                    background: f.bg,
                    color: f.color,
                  }}
                >
                  {f.icon}
                </div>

                {/* Content */}
                <h3 className="font-orbitron font-bold text-base text-white mb-2 uppercase tracking-wide">
                  {f.title}
                </h3>
                <p className="font-grotesk text-xs sm:text-sm text-[rgba(241,240,255,0.5)] leading-relaxed max-w-xl">
                  {f.desc}
                </p>

                {/* Accent border highlight */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-purple-500/15 bg-purple-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse-dot" />
            <span className="font-orbitron font-bold text-[9px] text-purple-300 uppercase tracking-widest">
              Join Today
            </span>
          </div>

          <h2 className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tighter leading-tight">
            Build Something{". "}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Amazing
            </span>
          </h2>

          <p className="font-grotesk text-sm sm:text-base text-[rgba(241,240,255,0.55)] max-w-xl mx-auto leading-relaxed">
            Register now to join the upcoming cohort of developers, designers,
            and innovators. Shape the future in our next collaborative sprint.
          </p>

          <div className="glass-card border-purple-500/10 p-6 sm:p-10 relative overflow-hidden max-w-md mx-auto rounded-2xl bg-[#0f0f24]/30">
            <div className="card-shimmer" />

            {error && (
              <div className="mb-5">
                <ErrorAlert
                  title="Connection Failed"
                  message={error}
                  onRetry={() => setError(null)}
                />
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={loading || authLoading}
              className="w-full relative overflow-hidden group flex items-center justify-center gap-3 py-3.5 px-5 bg-white text-[#05050a] rounded-lg font-semibold font-orbitron text-xs uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.01] mb-4 disabled:opacity-50 disabled:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading || authLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#05050a] border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Join with Google — Free
                </>
              )}
            </button>

            <p className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.3)] tracking-wide text-center uppercase">
              Secure OAuth 2.0 authorization • Instant Setup
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
