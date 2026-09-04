"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/ui/Loader";
import ErrorAlert from "@/components/ui/ErrorAlert";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/site";
import type { ProfileData } from "@/types/profile";

type PublicProfileClientProps = {
  userId: string;
  initialProfile: ProfileData | null;
};

export default function PublicProfileClient({
  userId,
  initialProfile,
}: PublicProfileClientProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  useEffect(() => {
    // Always fetch fresh data on the client to ensure we have the latest updates (Stale-While-Revalidate)
    const fetchPublicProfile = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/users/${userId}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (res.status === 404)
            throw new Error("Agent not found in the database.");
          throw new Error("Failed to retrieve agent data.");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        // Only set error if we don't already have initialProfile to show
        if (!initialProfile) {
          setError(
            err instanceof Error ? err.message : "Network protocol failure.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId, initialProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-68px)] bg-transparent">
        <Loader text="Decrypting Agent Profile..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-20">
        <ErrorAlert
          title="Access Denied"
          message={error || "Target identity not found."}
          onRetry={() => window.location.reload()}
        />
        <div className="mt-8 flex justify-center">
          <Link href="/" className="btn-secondary">
            RETURN TO BASE
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === profile.uid;
  const firstName = profile.name ? profile.name.split(" ")[0] : "Agent";

  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:py-20">
      <div className="max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-2.5 text-purple-300 font-mono-cc text-xs tracking-widest uppercase opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              Public Identity Hub
            </div>
            <h1 className="font-orbitron font-black text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-tighter leading-none">
              Agent{" "}
              <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            {isOwnProfile && (
              <>
                <Link
                  href="/dashboard"
                  className="btn-primary flex items-center gap-2 py-2 px-5 text-[11px]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <path d="M9 22V12h6v10" />
                  </svg>
                  DASHBOARD
                </Link>
                <Link
                  href={`/${profile.uid}/settings`}
                  className="btn-secondary flex items-center gap-2 py-2 px-5 text-[11px]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  EDIT
                </Link>
              </>
            )}
            <button
              onClick={handleShare}
              className={`btn-ghost flex items-center gap-2 py-2 px-5 text-[11px] transition-all duration-300 rounded-lg ${copied ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" : ""}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                {copied ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </>
                )}
              </svg>
              {copied ? "COPIED!" : "SHARE LINK"}
            </button>
          </div>
        </div>

        {/* Profile Grid (Bento style) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Visual Identity Card */}
          <div
            className="space-y-8 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="glass-card overflow-hidden p-1.5 border-purple-500/15 group relative rounded-2xl">
              {/* Outer glow ring for avatar container */}
              <div className="absolute -inset-1 bg-linear-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              <div className="relative aspect-square bg-[#080811] overflow-hidden rounded-xl">
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt={profile.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 30vw"
                    className="object-cover hover:grayscale-0 transition-all duration-500 scale-102 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-500/10">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}

                {/* Role badge over avatar */}
                <div className="absolute top-4 left-4 py-1.5 px-3 bg-[#05050a]/75 backdrop-blur border border-purple-500/20 rounded-lg font-mono-cc text-[9.5px] text-purple-300 tracking-wider uppercase">
                  Class:{" "}
                  {profile.role?.toLowerCase() === "student"
                    ? "Participant"
                    : profile.role}
                </div>
              </div>
            </div>

            {/* Registry Info Bento Card */}
            <div className="glass-card p-6 border-purple-500/10 rounded-2xl">
              <h3 className="font-orbitron text-[10px] text-purple-400 uppercase tracking-widest mb-4 font-semibold">
                SYSTEM METADATA
              </h3>
              <div className="space-y-3 font-mono-cc text-xs text-[rgba(241,240,255,0.6)]">
                <div className="flex justify-between border-b border-white/4 pb-2">
                  <span className="opacity-50">NODE STATUS</span>
                  <span className="text-emerald-400 font-bold">ACTIVE // VERIFIED</span>
                </div>
                {profile.createdAt && (
                  <div className="flex justify-between pt-1">
                    <span className="opacity-50">REGISTRY DATE</span>
                    <span>{new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Intel */}
          <div
            className="lg:col-span-2 space-y-8 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Bio Section */}
            <div className="glass-card p-8 border-purple-500/10 rounded-2xl relative overflow-hidden">
              {/* Purple radial glow in background */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />

              <h3 className="font-orbitron text-base text-white uppercase tracking-wider mb-6 flex items-center gap-3 font-bold">
                <span className="w-5 h-px bg-purple-400/50" />
                Agent Narrative
              </h3>

              <div className="relative">
                <div className="absolute left-0 top-0 w-[1.5px] h-full bg-linear-to-b from-purple-500/40 to-transparent" />
                <p className="pl-6 font-grotesk text-[15px] sm:text-base text-[rgba(241,240,255,0.75)] leading-relaxed italic">
                  {profile.bio ||
                    "This agent has chosen to remain in the shadows, leaving no data in their narrative log. Their silence speaks volumes of their tactical focus."}
                </p>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Educational Nexus Card */}
              <div className="glass-card p-6 sm:p-8 border-purple-500/10 rounded-2xl">
                <h3 className="font-orbitron text-xs text-purple-400 uppercase tracking-widest mb-6 font-semibold">
                  Educational Nexus
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-wider block mb-1">
                      Institute
                    </label>
                    <p className="font-grotesk text-white font-medium text-sm sm:text-base">
                      {profile.collegeName || "Classified"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/4">
                    <div>
                      <label className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-wider block mb-1">
                        Branch
                      </label>
                      <p className="font-grotesk text-white text-sm">
                        {profile.branch || "Unspecified"}
                      </p>
                    </div>
                    <div>
                      <label className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-wider block mb-1">
                        Academic Year
                      </label>
                      <p className="font-grotesk text-white text-sm">
                        {profile.year || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Signature Card */}
              <div className="glass-card p-6 sm:p-8 border-purple-500/10 rounded-2xl">
                <h3 className="font-orbitron text-xs text-purple-400 uppercase tracking-widest mb-6 font-semibold">
                  Personal Signature
                </h3>
                <div className="space-y-4">
                  {profile.phone && (
                    <div>
                      <label className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-wider block mb-1">
                        Phone
                      </label>
                      <p>
                        <a
                          href={`tel:${profile.phone}`}
                          aria-label={`Call ${profile.name}`}
                          className="font-grotesk text-white hover:text-purple-300 transition-colors text-sm"
                        >
                          {profile.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-wider block mb-1">
                      Direct Uplink
                    </label>
                    <p>
                      <a
                        href={`mailto:${profile.email}`}
                        className="font-grotesk text-purple-300 hover:text-pink-300 transition-colors text-sm break-all"
                      >
                        {profile.email}
                      </a>
                    </p>
                  </div>

                  {/* Social Links */}
                  {(profile.github || profile.linkedin) && (
                    <div className="flex gap-3 pt-3 border-t border-white/4">
                      {profile.github && (
                        <a
                          href={profile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white/2 rounded-lg border border-white/8 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex items-center justify-center text-purple-300 hover:text-white"
                          title={`${profile.name}'s GitHub Vault`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z" />
                          </svg>
                        </a>
                      )}
                      {profile.linkedin && (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-white/2 rounded-lg border border-white/8 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex items-center justify-center text-purple-300 hover:text-white"
                          title={`${profile.name}'s LinkedIn Legacy`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M17 2a5 5 0 0 1 5 5v10a5 5 0 0 1 -5 5h-10a5 5 0 0 1 -5 -5v-10a5 5 0 0 1 5 -5zm-9 8a1 1 0 0 0 -1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0 -1 -1m6 0a3 3 0 0 0 -1.168 .236l-.125 .057a1 1 0 0 0 -1.707 .707v5a1 1 0 0 0 2 0v-3a1 1 0 0 1 2 0v3a1 1 0 0 0 2 0v-3a3 3 0 0 0 -3 -3m-6 -3a1 1 0 0 0 -.993 .883l-.007 .127a1 1 0 0 0 1.993 .117l.007 -.127a1 1 0 0 0 -1 -1" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tag */}
        <div
          className="flex justify-center mt-12 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="px-5 py-2 border border-purple-500/10 rounded-full bg-purple-500/2 flex items-center gap-3">
            <span className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-widest">
              Verified CodeCraft Participant
            </span>
            <span className="w-1 h-1 rounded-full bg-pink-500/30" />
            <span className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.35)] uppercase tracking-widest">
              {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
