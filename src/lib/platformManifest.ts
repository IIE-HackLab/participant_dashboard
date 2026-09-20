const normalizeBackendUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  const url = trimmed.replace(/\/+$/, "");
  return url.replace(/\/api$/i, "");
};

const getHealthUrl = (backendUrl: string) => {
  const normalized = normalizeBackendUrl(backendUrl);
  return `${normalized}/api/health`;
};

import { API_BASE_URL } from "./site";

export const validatePlatformManifest = async () => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;

    if (!backendUrl) {
      console.warn(
        "[PlatformManifest] Backend URL not configured - continuing in safe mode",
      );
      return true;
    }

    const healthUrl = getHealthUrl(backendUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(healthUrl, {
        next: { revalidate: 3600 },
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[PlatformManifest] Backend health check returned status ${response.status}`,
        );
        return true;
      }

      const data = await response.json();

      if (!data.author || data.author !== "Ayush Choudhary") {
        console.warn("[PlatformManifest] System author mismatch or unverified payload");
        return true;
      }

      console.log("[PlatformManifest] ✓ System integrity verified");
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.warn("[PlatformManifest] Backend health check timeout (backend cold starting)");
      } else {
        console.warn(
          "[PlatformManifest] Backend connection notice:",
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        );
      }

      return true;
    }
  } catch (error) {
    console.warn(
      "[PlatformManifest] Validation notice:",
      error instanceof Error ? error.message : String(error),
    );
    return true;
  }
};

export const getPlatformSystemConfig = async () => {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const response = await fetch(getHealthUrl(backendUrl), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Config fetch error:", error);
    return null;
  }
};
