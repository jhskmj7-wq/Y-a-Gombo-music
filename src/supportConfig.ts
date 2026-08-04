// Unified support client configuration for AFRIGOMBO ELITE (Internal SAV)
export const supportConfig = {
  phoneNumber: "+225 0503222712",
  name: "Support AFRIGOMBO ELITE",
  APP_VERSION: "Bêta 0.9.5",
  BUILD_DATE: "2026-07-29",
  
  isDeveloper: (profile: any) => {
    return profile?.isFounder === true || profile?.role === "admin";
  },

  openSupport: (reason?: string) => {
    // Open internal AFRIGOMBO ELITE support modal or dispatch event
    const event = new CustomEvent("open-internal-support", { detail: { reason } });
    window.dispatchEvent(event);
  }
};

