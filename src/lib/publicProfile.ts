/**
 * Helper function to open the universal AFRIGOMBO Public Profile (Fiche Publique / CV Musical)
 * from anywhere in the application.
 */
export function openPublicProfile(userId?: string | null) {
  if (userId) {
    window.dispatchEvent(new CustomEvent("open-public-profile", { detail: { userId } }));
  }
}
