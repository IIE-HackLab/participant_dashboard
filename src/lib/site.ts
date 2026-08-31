const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "https://participant-dashboard.vercel.app",
);

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || "https://backend-u80u.onrender.com/api",
);

export const siteConfig = {
  name: "IIE HackLab Participant Dashboard",
  shortName: "CodeCraft",
  title: "IIE HackLab Participant Dashboard | CodeCraft",
  description:
    "Join IIE HackLab hackathons, manage CodeCraft participation, track phases, and share verified participant profiles.",
  creator: "IIE HackLab",
  locale: "en_US",
  keywords: [
    "IIE HackLab",
    "CodeCraft",
    "participant dashboard",
    "student hackathon",
    "hackathon registration",
    "hackathon portal",
    "student developer community",
    "coding competition",
  ],
};

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function toMetaDescription(value: string | undefined, fallback = siteConfig.description) {
  const text = value?.replace(/\s+/g, " ").trim() || fallback;
  return text.length > 158 ? `${text.slice(0, 155).trim()}...` : text;
}
