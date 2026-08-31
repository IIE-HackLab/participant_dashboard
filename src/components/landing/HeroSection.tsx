"use client";

import { useEffect, useRef, useState } from "react";

function useCounter(end: number, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

export default function HeroSection() {
  const headlineRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [statsStarted, setStatsStarted] = useState(false);

  const c1 = useCounter(500, 1500, statsStarted);
  const c2 = useCounter(50, 1200, statsStarted);
  const c3 = useCounter(1000, 1800, statsStarted);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    const run = async () => {
      const { gsap } = await import("gsap");
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (badgeRef.current)
          tl.fromTo(badgeRef.current, { opacity: 0, y: -16, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 0);

        if (headlineRef.current) {
          const words = headlineRef.current.querySelectorAll(".hw");
          tl.fromTo(words, { opacity: 0, y: 60, skewX: -5 }, { opacity: 1, y: 0, skewX: 0, duration: 0.9, stagger: 0.15 }, 0.15);
        }

        if (subRef.current)
          tl.fromTo(subRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 }, 0.6);

        if (ctaRef.current) {
          const btns = ctaRef.current.children;
          tl.fromTo(btns, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.75);
        }

        if (statsRef.current)
          tl.fromTo(statsRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, onComplete: () => setStatsStarted(true) }, 0.9);

        if (particlesRef.current) {
          gsap.fromTo(
            particlesRef.current.children,
            { opacity: 0 },
            { opacity: 1, duration: 2, stagger: 0.2, ease: "power1.out", delay: 0.4 }
          );
        }
      });
    };
    run();
    return () => ctx?.revert();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 pb-16 overflow-hidden">
      {/* Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-particle" />
        <div className="hero-particle" />
        <div className="hero-particle" />
        <div className="hero-particle" />
        <div className="hero-particle" />
        <div className="hero-particle" />
        <div className="hero-particle" />
        <div className="hero-particle" />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[rgba(0,245,255,0.3)] pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[rgba(0,245,255,0.15)] pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[rgba(0,245,255,0.15)] pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[rgba(0,245,255,0.3)] pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(0,245,255,0.05)_0%,transparent_70%)]" />

      <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
        {/* Badge */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 px-3 py-1.5 border border-[rgba(0,245,255,0.25)] bg-[rgba(0,245,255,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse-dot" />
          <span className="font-orbitron font-bold text-[9px] sm:text-[10px] text-[#00f5ff] uppercase tracking-[0.35em]">
            Welcome to CodeCraft
          </span>
        </div>

        {/* Headline */}
        <div ref={headlineRef} className="overflow-hidden">
          <h1 className="font-orbitron font-black leading-none uppercase tracking-tighter">
            <span className="hw block text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white">PARTICIPATE</span>
            <span
              className="hw block text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
              style={{ color: "#00f5ff", textShadow: "0 0 50px rgba(0,245,255,0.5), 0 0 100px rgba(0,245,255,0.2)" }}
            >
              BUILD
            </span>
            <span
              className="hw block text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-transparent"
              style={{ WebkitTextStroke: "2px rgba(139,92,246,0.7)" }}
            >
              INNOVATE
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p ref={subRef} className="font-mono-cc text-sm sm:text-base md:text-lg text-[rgba(224,247,255,0.85)] max-w-prose mx-auto leading-relaxed">
          Join a vibrant community of creators and innovators. Participate in cutting-edge hackathons,
          build amazing projects, and unlock your potential with IIE HackLab.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <a
            href="/dashboard"
            className="neon-btn-cyan px-8 py-4 text-sm sm:text-base flex items-center justify-center gap-2 group magnetic-btn"
          >
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            View Open Hackathons
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <button className="btn-primary px-8 py-4 text-sm sm:text-base flex items-center justify-center gap-2 magnetic-btn">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Read the Guide
          </button>
        </div>


        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {["Google OAuth", "Real-time Tracking", "24/7 Support"].map((b) => (
            <div key={b} className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <span className="w-1 h-1 rounded-full bg-[#10b981]" />
              <span className="font-mono-cc text-[9px] text-[rgba(224,247,255,0.45)] uppercase tracking-wider">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-pulse-slow">
        <span className="font-mono-cc text-[8px] text-[rgba(0,245,255,0.3)] uppercase tracking-widest">Scroll</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,245,255,0.3)" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
