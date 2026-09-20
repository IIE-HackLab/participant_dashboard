"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#05050a] text-white min-h-screen flex items-center justify-center p-5 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-[#0f0f24] border border-purple-500/20 p-8 rounded-2xl shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase font-mono">
            System Failure
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            A top-level application exception occurred. Click retry to re-initialize the terminal.
          </p>
          {error.digest && (
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
              Digest: {error.digest}
            </p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Retry Uplink
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              Terminal Root
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
