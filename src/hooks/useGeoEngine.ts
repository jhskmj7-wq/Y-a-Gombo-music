import { useState, useEffect, useCallback } from "react";
import { User, Gombo, Renfort, UserProfile } from "../types";
import { gomboDB } from "../firebase";
import { calculateDistance, obfuscateCoordinates } from "../lib/geoUtils";
import { resolveGomboCoordinates } from "../components/AfrigoRadarMap";
import { isGpsActive } from "../lib/featureFlags";

interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  commune: string | null;
  city: string | null;
  country: string | null;
  permissionStatus: PermissionState | "loading";
  isTracking: boolean;
}

export function useGeoEngine(profile: UserProfile | null) {
  const gpsActive = isGpsActive(null, profile);

  const [geoState, setGeoState] = useState<GeoLocationState>({
    latitude: gpsActive ? (profile?.latitude || null) : null,
    longitude: gpsActive ? (profile?.longitude || null) : null,
    commune: profile?.commune || null,
    city: profile?.city || null,
    country: profile?.country || null,
    permissionStatus: gpsActive ? "loading" : "denied",
    isTracking: false,
  });

  const [nearbyGombos, setNearbyGombos] = useState<Gombo[]>([]);
  const [nearbyArtists, setNearbyArtists] = useState<User[]>([]);

  // 1. Check Permission Status safely only if GPS is active
  useEffect(() => {
    if (!gpsActive) {
      setGeoState(prev => ({ ...prev, permissionStatus: "denied" }));
      return;
    }

    if ("permissions" in navigator && navigator.permissions?.query) {
      try {
        navigator.permissions.query({ name: "geolocation" as any }).then((result) => {
          setGeoState(prev => ({ ...prev, permissionStatus: result.state }));
          result.onchange = () => {
            setGeoState(prev => ({ ...prev, permissionStatus: result.state }));
          };
        }).catch(() => {
          setGeoState(prev => ({ ...prev, permissionStatus: "prompt" }));
        });
      } catch (e) {
        setGeoState(prev => ({ ...prev, permissionStatus: "prompt" }));
      }
    }
  }, [gpsActive]);

  // 2. Reverse Geocoding using Nominatim (only if GPS is active)
  const reverseGeocode = async (lat: number, lon: number) => {
    if (!gpsActive) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            "User-Agent": "AFRIGOMBO ELITE-App/1.0"
          }
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        return {
          commune: addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || null,
          city: addr.city || addr.county || addr.state || null,
          country: addr.country || null
        };
      }
    } catch (err) {
      console.error("GeoEngine: Reverse geocoding failed", err);
    }
    return null;
  };

  // 3. Update User Position in Firestore (only if GPS is active)
  const updatePosition = useCallback(async (lat: number, lon: number, forceGeocode = false) => {
    if (!profile?.uid || !gpsActive) return;

    let locationData = { commune: geoState.commune, city: geoState.city, country: geoState.country };

    // Only geocode if we don't have it or if forceGeocode is true (e.g. moved > 5km)
    const distanceMoved = geoState.latitude && geoState.longitude 
      ? calculateDistance(geoState.latitude, geoState.longitude, lat, lon)
      : 100;

    if (forceGeocode || !geoState.commune || distanceMoved > 5) {
      const geoResult = await reverseGeocode(lat, lon);
      if (geoResult) {
        locationData = geoResult;
      }
    }

    const obfuscated = obfuscateCoordinates(lat, lon);
    
    setGeoState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      ...locationData
    }));

    await gomboDB.updateUserProfile(profile.uid, {
      latitude: lat,
      longitude: lon,
      commune: locationData.commune || profile.commune || "",
      city: locationData.city || profile.city || "",
      country: locationData.country || profile.country || "",
      lastGeoUpdate: new Date().toISOString()
    });
  }, [profile?.uid, gpsActive, geoState.commune, geoState.city, geoState.country, geoState.latitude, geoState.longitude]);

  // 4. Start Tracking (only if GPS is active)
  const requestLocation = () => {
    if (!gpsActive) {
      console.info("[GeoEngine] GPS feature is disabled in Beta.");
      return;
    }

    if (!("geolocation" in navigator)) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGeoState(prev => ({ ...prev, isTracking: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updatePosition(latitude, longitude, true);
        setGeoState(prev => ({ ...prev, permissionStatus: "granted", isTracking: false }));
      },
      (error) => {
        console.error("GeoEngine: Error getting location", error);
        setGeoState(prev => ({ ...prev, permissionStatus: "denied", isTracking: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // 5. Sort functions for Nearby sections
  const getNearbyItems = useCallback(<T extends Record<string, any>>(items: T[], maxDistance = 50): T[] => {
    if (!gpsActive) {
      return items;
    }

    const userLat = geoState.latitude || 5.3600;
    const userLng = geoState.longitude || -4.0083;

    return items
      .map(item => {
        let itemLat = (item as any).latitude;
        let itemLng = (item as any).longitude;

        if (typeof itemLat !== "number" || typeof itemLng !== "number" || isNaN(itemLat) || isNaN(itemLng)) {
          const coords = resolveGomboCoordinates(item as any);
          itemLat = coords.latitude;
          itemLng = coords.longitude;
        }

        return {
          ...item,
          latitude: itemLat,
          longitude: itemLng,
          distance: calculateDistance(userLat, userLng, itemLat, itemLng)
        };
      })
      .filter((item: any) => item.distance <= maxDistance)
      .sort((a: any, b: any) => a.distance - b.distance);
  }, [gpsActive, geoState.latitude, geoState.longitude]);

  // 6. Availability Mode (Musicians)
  const setAvailability = async (durationHours: number | "today") => {
    if (!profile?.uid) return;

    let expiresAt: string | null = null;
    let label = "Disponible";

    if (durationHours === "today") {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      expiresAt = endOfDay.toISOString();
      label = "Disponible (Aujourd'hui)";
    } else {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + (durationHours as number));
      expiresAt = expiry.toISOString();
      label = `Disponible (${durationHours}h)`;
    }

    await gomboDB.updateUserProfile(profile.uid, {
      availability: {
        status: "available",
        expiresAt,
        durationLabel: label
      }
    });
  };

  const disableAvailability = async () => {
    if (!profile?.uid) return;
    await gomboDB.updateUserProfile(profile.uid, {
      availability: {
        status: "busy",
        expiresAt: null,
        durationLabel: undefined
      }
    });
  };

  return {
    ...geoState,
    requestLocation,
    getNearbyItems,
    setAvailability,
    disableAvailability
  };
}
