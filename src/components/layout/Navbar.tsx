"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { signOutUser } from "@/lib/firebase/client";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  if (pathname === "/") return null;

  const navRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change / outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  // GSAP mount animation
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    const runGSAP = async () => {
      const { gsap } = await import("gsap");
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (brandRef.current) {
          tl.fromTo(
            brandRef.current,
            { opacity: 0, y: -12 },
            { opacity: 1, y: 0, duration: 0.7 },
            0
          );
        }
        if (actionsRef.current) {
          tl.fromTo(
            actionsRef.current,
            { opacity: 0, x: 16 },
            { opacity: 1, x: 0, duration: 0.6 },
            0.15
          );
        }
      }, navRef);
    };
    runGSAP();
    return () => ctx?.revert();
  }, []);

  // GSAP mobile menu animation
  useEffect(() => {
    const runMenu = async () => {
      const { gsap } = await import("gsap");
      if (!menuRef.current) return;
      if (menuOpen) {
        const items = menuRef.current.querySelectorAll(".mobile-menu-item");
        gsap.fromTo(
          menuRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
        );
        gsap.fromTo(
          items,
          { opacity: 0, x: -16 },
          {
            opacity: 1,
            x: 0,
            duration: 0.3,
            stagger: 0.06,
            ease: "power2.out",
            delay: 0.1,
          }
        );
      }
    };
    runMenu();
  }, [menuOpen]);

  const firstName =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Hacker";

  const handleLogout = async () => {
    await Promise.all([
      fetch("/api/auth/logout", { method: "POST" }),
      signOutUser(),
    ]);
    window.location.href = "/";
  };

  return (
    <>
      <header
        ref={navRef}
        style={{ height: "var(--nav-h)" }}
        className={`w-full sticky top-0 z-100 transition-all duration-300 ${
          scrolled
            ? "bg-[#05050a]/95 backdrop-blur-xl border-b border-purple-500/15 shadow-[0_4px_32px_rgba(0,0,0,0.6)]"
            : "bg-[#05050a]/75 backdrop-blur-md border-b border-white/[0.06]"
        }`}
      >
        {/* Data stream line */}
        {scrolled && (
          <div className="data-stream-line" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-5 h-full flex items-center justify-between gap-3">
          {/* Left: hamburger (mobile) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="sm:hidden p-2 -ml-1 text-slate-400 hover:text-purple-400 transition-colors magnetic-btn"
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              {menuOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </div>
          </button>

          {/* Center: Branding */}
          <div className="flex-1 flex justify-center">
            <Link href="/dashboard" className="group navbar-brand" ref={brandRef}>
              <span className="font-charm font-black text-xl sm:text-2xl text-white group-hover:text-purple-400 transition-all duration-300 tracking-wider sm:tracking-widest uppercase whitespace-nowrap relative">
                IIE{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-neon-shimmer">
                  HACK
                </span>{" "}
                LAB
              </span>
              {/* Neon underline sweep */}
              <span
                className="absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-0 group-hover:w-full transition-all duration-500 ease-out"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Right: actions */}
          <div ref={actionsRef} className="flex items-center gap-2 sm:gap-4">
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="sm:hidden fixed left-0 right-0 z-99 bg-[#05050a]/98 backdrop-blur-xl border-b border-purple-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          style={{ top: "var(--nav-h)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top line */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {user && (
              <>
                {/* User info */}
                <div className="mobile-menu-item flex items-center gap-3 px-3 py-3 border-b border-white/5 mb-2">
                  <div className="relative w-9 h-9 rounded-full border border-purple-500/30 bg-[#0f0f24] overflow-hidden shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={firstName}
                        width={36}
                        height={36}
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-300 text-sm font-black font-orbitron">
                        {firstName[0]}
                      </div>
                    )}
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-[#040b14] animate-pulse-dot" />
                  </div>
                  <div>
                    <p className="font-orbitron font-bold text-xs text-white uppercase tracking-wide">
                      {firstName}
                    </p>
                    <p className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="mobile-menu-item flex items-center gap-3 px-3 py-3 font-orbitron font-bold text-xs text-slate-400 hover:text-purple-400 hover:bg-purple-500/5 uppercase tracking-widest transition-all rounded-sm group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="icon icon-tabler icons-tabler-filled icon-tabler-layout-dashboard shrink-0 w-4 h-4"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M9 3a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2zm10 -4a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 -8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z" />
                  </svg>
                  Dashboard
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">→</span>
                </Link>

                <Link
                  href={`/${user.uid}/profile`}
                  onClick={() => setMenuOpen(false)}
                  className="mobile-menu-item flex items-center gap-3 px-3 py-3 font-orbitron font-bold text-xs text-slate-400 hover:text-purple-400 hover:bg-purple-500/5 uppercase tracking-widest transition-all rounded-sm group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="icon icon-tabler icons-tabler-filled icon-tabler-user shrink-0 w-4 h-4"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
                    <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                  </svg>
                  Profile
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">→</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="mobile-menu-item w-full flex items-center gap-3 px-3 py-3 font-orbitron font-bold text-xs text-slate-400 hover:text-rose-400 hover:bg-[rgba(244,63,94,0.04)] uppercase tracking-widest transition-all rounded-sm group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0 -rotate-90"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 3a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h12zm0 2h-12a1 1 0 0 0 -.993 .883l-.007 .117v9h14v-9a1 1 0 0 0 -.883 -.993l-.117 -.007zm-5.387 3.21l.094 .083l2 2a1 1 0 0 1 -1.32 1.497l-.094 -.083l-1.293 -1.292l-1.293 1.292a1 1 0 0 1 -1.32 .083l-.094 -.083a1 1 0 0 1 -.083 -1.32l.083 -.094l2 -2a1 1 0 0 1 1.32 -.083z" />
                  </svg>
                  Logout
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-rose-400">→</span>
                </button>
              </>
            )}
          </div>

          {/* Decorative bottom */}
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.3)] to-transparent" />
        </div>
      )}
    </>
  );
}
