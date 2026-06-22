/**
 * Deployment metadata, frozen at build time by Vite `define` (see vite.config.ts).
 * Use this to show which version/branch is live on a given environment.
 */
export const buildInfo = {
  version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0",
  branch: typeof __GIT_BRANCH__ !== "undefined" ? __GIT_BRANCH__ : "unknown",
  commit: typeof __GIT_COMMIT__ !== "undefined" ? __GIT_COMMIT__ : "unknown",
  buildTime: typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : new Date().toISOString(),
};

/** Build time formatted for display in the user's locale (date + time). */
export function formatBuildTime(iso: string = buildInfo.buildTime): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
