declare const __AFRIGOMBO_BUILD_ID__: string | undefined;
declare const __AFRIGOMBO_BUILD_TIME__: string | undefined;
declare const __AFRIGOMBO_COMMIT_SHA__: string | undefined;
declare const __AFRIGOMBO_COMMIT_SHORT_SHA__: string | undefined;

declare global {
  interface Window {
    __AFRIGOMBO_BUILD_ID__?: string;
    __AFRIGOMBO_BUILD_TIME__?: string;
    __AFRIGOMBO_COMMIT_SHA__?: string;
    __AFRIGOMBO_COMMIT_SHORT_SHA__?: string;
  }
}

export const BUILD_ID =
  typeof __AFRIGOMBO_BUILD_ID__ !== "undefined"
    ? __AFRIGOMBO_BUILD_ID__
    : `DEV-${new Date().toISOString()}`;

export const BUILD_TIME =
  typeof __AFRIGOMBO_BUILD_TIME__ !== "undefined"
    ? __AFRIGOMBO_BUILD_TIME__
    : new Date().toISOString();

export const COMMIT_SHA =
  typeof __AFRIGOMBO_COMMIT_SHA__ !== "undefined"
    ? __AFRIGOMBO_COMMIT_SHA__
    : "NO_GIT_SHA";

export const COMMIT_SHORT_SHA =
  typeof __AFRIGOMBO_COMMIT_SHORT_SHA__ !== "undefined"
    ? __AFRIGOMBO_COMMIT_SHORT_SHA__
    : "LOCAL";


