declare global {
  interface Window {
    __AFRIGOMBO_BUILD_ID__?: string;
    __AFRIGOMBO_BUILD_TIME__?: string;
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
