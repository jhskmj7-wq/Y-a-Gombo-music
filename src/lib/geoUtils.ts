/**
 * AFRIGOMBO ELITE GEO ENGINE UTILS
 * Pure mathematical functions for distance and time estimation.
 */

/**
 * Calculates the distance between two points in km using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Returns a human-readable distance label.
 */
export function getDistanceLabel(distanceKm: number, context?: { userCommune?: string; itemCommune?: string; userCity?: string; itemCity?: string }): string {
  if (context?.itemCommune && context?.userCommune && context.itemCommune.toLowerCase() === context.userCommune.toLowerCase()) {
    return "Même commune";
  }
  if (context?.itemCity && context?.userCity && context.itemCity.toLowerCase() === context.userCity.toLowerCase()) {
    return "Même ville";
  }
  
  if (distanceKm < 1) return "moins de 1 km";
  if (distanceKm < 5) return "moins de 5 km";
  if (distanceKm < 10) return "moins de 10 km";
  if (distanceKm < 25) return "moins de 25 km";
  return `à env. ${Math.round(distanceKm)} km`;
}

/**
 * Estimates travel time in minutes.
 * Average speeds: Walk 5km/h, Moto 30km/h, Car 25km/h (Abidjan Traffic)
 */
export function estimateTravelTimes(distanceKm: number) {
  const walkSpeed = 5;
  const motoSpeed = 30;
  const carSpeed = 25;

  return {
    walk: Math.round((distanceKm / walkSpeed) * 60),
    moto: Math.round((distanceKm / motoSpeed) * 60),
    car: Math.round((distanceKm / carSpeed) * 60),
  };
}

/**
 * Formats coordinates for privacy (removes exact precision).
 */
export function obfuscateCoordinates(lat: number, lng: number) {
  return {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
  };
}
