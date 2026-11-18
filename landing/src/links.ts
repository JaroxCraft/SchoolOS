// Redirects that Cloudflare serves in front of the site, so they need the full domain
export const BETA_URL = new URL("/beta", import.meta.env.SITE).href;
// The SchoolOS.apk of the latest GitHub release
export const APK_URL = new URL("/apk", import.meta.env.SITE).href;

export const SURVEY_URL = "https://tally.so/forms/6DLaWA";
export const EMAIL = "nico@jarox.dev";
