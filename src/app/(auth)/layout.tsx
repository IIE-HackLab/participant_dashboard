import type { Metadata } from "next";
import type { ReactNode } from "react";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "IIE HackLab Hackathon Portal",
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: absoluteUrl("/"),
    title: "IIE HackLab Hackathon Portal",
    description: siteConfig.description,
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
