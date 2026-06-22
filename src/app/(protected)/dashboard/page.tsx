"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import HackathonCard from "@/components/hackathon/HackathonCard";
import { useAuth } from "@/hooks/useAuth";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { fetchProgress } from "@/store/hackathonStore";
import type { Hackathon, HackathonProgress } from "@/types/hackathon";
import { signOutUser } from "@/lib/firebase/client";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/site";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-68px)] bg-transparent animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative h-40 sm:h-56 md:h-64 shrink-0 overflow-hidden border-b border-purple-500/10">
        <div className="absolute inset-0 bg-[rgba(255,255,255,0.02)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-2 w-20 bg-[rgba(255,255,255,0.05)] rounded" />
              <div className="h-8 sm:h-12 w-48 sm:w-64 bg-[rgba(255,255,255,0.05)] rounded" />
              <div className="h-3 w-64 sm:w-96 bg-[rgba(255,255,255,0.03)] rounded" />
              <div className="flex gap-3 pt-1">
                <div className="h-9 w-28 bg-[rgba(255,255,255,0.05)] rounded" />
                <div className="h-9 w-20 bg-[rgba(255,255,255,0.02)] rounded" />
              </div>
            </div>
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.05)] hidden sm:block" />
          </div>
        </div>
      </div>
      {/* Filter Skeleton */}
      <div className="border-b border-purple-500/5 bg-[#05050a]/40 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-4 flex gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 w-12 bg-[rgba(255,255,255,0.03)] rounded" />
          ))}
        </div>
      </div>
      {/* Cards Skeleton */}
        <main className="flex-1 w-full bg-transparent max-w-7xl mx-auto px-5 py-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card h-28 sm:h-36 w-full" />
        ))}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { loading: authLoading, user, error: authError } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, HackathonProgress>>({});
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [hackathonsLoading, setHackathonsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  // GSAP refs
  const heroRef = useRef<HTMLDivElement>(null);
  const statusDotRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await Promise.all([
      fetch("/api/auth/logout", { method: "POST" }),
      signOutUser(),
    ]);
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchAll = async () => {
      setFetchError(null);
      try {
        const hRes = await fetch(`${API_BASE_URL}/hackathons`);
        if (!hRes.ok) throw new Error("Failed to retrieve mission log.");
        const hData = await hRes.json();
        setHackathons(hData);

        if (user) {
          const pMap: Record<string, HackathonProgress> = {};
          await Promise.all(
            hData.map(async (h: Hackathon) => {
              const p = await fetchProgress(h.id, user.uid);
              if (p) pMap[h.id] = p;
            })
          );
          setProgressMap(pMap);
        }
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : "Connection severed.");
      } finally {
        setHackathonsLoading(false);
      }
    };
    if (!authLoading) fetchAll();
  }, [user, authLoading]);

  const availableFilters = useMemo(() => ["All", "Live", "Completed", "In Progress", "Upcoming", "Closed"], []);

  const filteredHackathons = useMemo(() => {
    if (activeFilter === "All") return hackathons;
    return hackathons.filter((h) => {
      const p = progressMap[h.id];
      const completedPhases = p?.responses ? Object.keys(p.responses).length : 0;
      const totalPhases = h.phases?.length || 1;
      const pct = Math.min(Math.round((completedPhases / totalPhases) * 100), 100);
      const now = new Date();
      const startDate = h.startDate ? new Date(h.startDate) : null;
      const endDate = h.endDate ? new Date(h.endDate) : null;
      const isUpcoming = startDate && now < startDate;
      const isClosed = endDate && now > endDate;
      let status = "Live";
      if (pct >= 100) status = "Completed";
      else if (completedPhases > 0) status = "In Progress";
      else if (isClosed) status = "Closed";
      else if (isUpcoming) status = "Upcoming";
      return status === activeFilter;
    });
  }, [hackathons, progressMap, activeFilter]);

  const loading = authLoading || hackathonsLoading;

  // GSAP hero animation
  useEffect(() => {
    if (loading) return;
    let ctx: { revert: () => void } | null = null;

    const runGSAP = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Hero timeline
        const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (statusDotRef.current) {
          heroTl.fromTo(
            statusDotRef.current.parentElement!,
            { opacity: 0, x: -16 },
            { opacity: 1, x: 0, duration: 0.5 },
            0
          );
        }
        if (nameRef.current) {
          heroTl.fromTo(
            nameRef.current,
            { opacity: 0, y: 30, skewX: -3 },
            { opacity: 1, y: 0, skewX: 0, duration: 0.8 },
            0.1
          );
        }
        if (subtitleRef.current) {
          heroTl.fromTo(
            subtitleRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5 },
            0.4
          );
        }
        if (actionsRef.current) {
          heroTl.fromTo(
            actionsRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5 },
            0.55
          );
        }
        if (avatarRef.current) {
          heroTl.fromTo(
            avatarRef.current,
            { opacity: 0, scale: 0.8, rotation: -10 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "back.out(1.4)" },
            0.2
          );
        }

        // Filter bar slide in
        if (filterBarRef.current) {
          gsap.fromTo(
            filterBarRef.current,
            { opacity: 0, y: -8 },
            { opacity: 1, y: 0, duration: 0.5, delay: 0.6, ease: "power2.out" }
          );
        }

        // Cards ScrollTrigger stagger
        if (cardsContainerRef.current) {
          const cards = cardsContainerRef.current.querySelectorAll(".hackathon-card-wrapper");
          gsap.fromTo(
            cards,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power3.out",
              delay: 0.7,
            }
          );
        }
      });
    };

    runGSAP();
    return () => ctx?.revert();
  }, [loading]);

  // Animate cards when filter changes
  useEffect(() => {
    if (!cardsContainerRef.current || loading) return;
    const runFilterAnim = async () => {
      const { gsap } = await import("gsap");
      const cards = cardsContainerRef.current!.querySelectorAll(".hackathon-card-wrapper");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
      );
    };
    runFilterAnim();
  }, [activeFilter, loading]);

  if (loading) return <DashboardSkeleton />;

  if (authError || fetchError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
        <ErrorAlert
          title={authError ? "Auth Protocol Failure" : "Data Link Error"}
          message={authError || fetchError || "Unknown system error."}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Hacker";

  const filterColors: Record<string, string> = {
    All: "#ffffff",
    Live: "#ec4899",
    Completed: "#10b981",
    "In Progress": "#f97316",
    Upcoming: "#a855f7",
    Closed: "#ef4444",
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* ── Hero Banner ── */}
      <div
        ref={heroRef}
        className="relative h-32 sm:h-44 md:h-56 shrink-0 overflow-hidden border-b border-purple-500/15"
      >
        {/* BG layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(139,92,246,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_20%,rgba(236,72,153,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#05050a]/90 via-[#05050a]/30 to-transparent" />

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-5 pb-5 sm:pb-7 lg:pb-9 flex flex-row items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Status indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span ref={statusDotRef} className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse-dot" />
                <span className="font-orbitron font-bold text-[9px] sm:text-[10px] text-purple-300 uppercase tracking-[0.3em]">
                  Agent.Verified
                </span>
                {/* Live missions count badge */}
                {hackathons.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/25 font-mono text-[8px] text-purple-300">
                    {hackathons.length} missions
                  </span>
                )}
              </div>
              {/* Name */}
              <h1
                ref={nameRef}
                className="font-orbitron font-black text-3xl sm:text-5xl md:text-6xl bg-gradient-to-r from-white via-purple-200 to-fuchsia-300 bg-clip-text text-transparent uppercase tracking-tighter leading-none mb-2 drop-shadow-[0_0_30px_rgba(139,92,246,0.25)] truncate"
              >
                {user?.displayName || firstName}
              </h1>
              {/* Subtitle */}
              <p ref={subtitleRef} className="font-mono-cc text-xs text-[rgba(241,240,255,0.5)] mb-3 hidden sm:flex items-center gap-2">
                <span className="w-3 h-px bg-purple-500/40" />
                Welcome back, {firstName}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div
        ref={filterBarRef}
        className="border-b border-white/[0.06] bg-[#05050a]/80 backdrop-blur-md sticky top-(--nav-h) z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3 sm:py-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-5 sm:gap-8 min-w-max">
            <span className="font-orbitron text-[9px] font-bold text-[rgba(241,240,255,0.3)] uppercase tracking-[0.3em] flex items-center gap-2 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M20 3h-16a1 1 0 0 0 -1 1v2.227l.008 .223a3 3 0 0 0 .772 1.795l4.22 4.641v8.114a1 1 0 0 0 1.316 .949l6 -2l.108 -.043a1 1 0 0 0 .576 -.906v-6.586l4.121 -4.12a3 3 0 0 0 .879 -2.123v-2.171a1 1 0 0 0 -1 -1z" />
              </svg>
              Filter
            </span>
            <div className="flex items-center gap-4 sm:gap-6">
              {availableFilters.map((label) => {
                const color = filterColors[label] || "#a855f7";
                const isActive = activeFilter === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveFilter(label)}
                    className={`filter-btn flex items-center gap-1.5 transition-all duration-300 outline-none pb-1 ${
                      isActive ? "opacity-100 active" : "opacity-40 hover:opacity-75"
                    }`}
                    style={{ color: isActive ? color : undefined }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
                      style={{
                        background: color,
                        boxShadow:
                          isActive &&
                          label !== "Upcoming" &&
                          label !== "Closed" &&
                          label !== "All"
                            ? `0 0 8px ${color}`
                            : "none",
                        transform: isActive ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                    <span
                      className={`font-orbitron font-bold text-[10px] uppercase tracking-wider ${
                        isActive ? "text-white" : "text-[rgba(241,240,255,0.8)]"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hackathon List ── */}
      <main className="flex-1 w-full bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-4 sm:py-6 lg:py-8">
          {filteredHackathons.length === 0 ? (
            <div className="glass-card p-10 sm:p-16 text-center max-w-md mx-auto animate-scale-in">
              <div className="w-14 h-14 mx-auto mb-4 border border-purple-500/20 flex items-center justify-center bg-purple-500/5 animate-pulse-slow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-purple-400/80"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 3c3.067 0 5.6 2.29 5.957 5.246c3.067 .903 5.043 2.476 5.043 4.478c0 2.3 -2.653 4.053 -6.427 4.833l1.26 1.888a1 1 0 1 1 -1.665 1.11l-1.78 -2.67c-.77 .076 -1.57 .115 -2.388 .115c-.966 0 -1.905 -.055 -2.801 -.16l-1.305 2.607a1 1 0 0 1 -1.788 -.894l1.028 -2.06c-3.618 -.807 -6.134 -2.529 -6.134 -4.768c0 -1.999 1.981 -3.58 5.044 -4.483c.36 -2.955 2.89 -5.242 5.956 -5.242m.01 10l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993m-5 -1l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993m10 0l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993m-5.01 -7c-2.11 0 -3.835 1.618 -3.989 3.667a1 1 0 0 1 .057 .4c.104 .087 .348 .251 .768 .419c.806 .322 1.94 .514 3.164 .514s2.358 -.192 3.164 -.514c.445 -.178 .693 -.352 .789 -.435l-.003 -.051q 0 -.113 .029 -.229l.014 -.046c-.125 -2.076 -1.864 -3.725 -3.993 -3.725" />
                </svg>
              </div>
              <h3 className="font-orbitron font-black text-sm text-white uppercase tracking-wider mb-2">
                No Missions Found
              </h3>
              <p className="font-mono-cc text-xs text-[rgba(241,240,255,0.4)] leading-relaxed">
                {activeFilter !== "All"
                  ? `No hackathons match: ${activeFilter}.`
                  : "No hackathons available. Check back soon."}
              </p>
            </div>
          ) : (
            <div
              ref={cardsContainerRef}
              className="flex flex-col gap-3 sm:gap-4"
            >
              {filteredHackathons.map((h) => (
                <div
                  key={h.id}
                  className="hackathon-card-wrapper w-full"
                >
                  <HackathonCard hackathon={h} progress={progressMap[h.id]} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
