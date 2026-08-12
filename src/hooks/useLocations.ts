import { useState, useEffect } from "react";
import { LocationService, DEFAULT_INITIAL_LOCATIONS } from "../lib/LocationService";
import { AfriGomboLocation, LocationProposal } from "../types";

export function useLocations() {
  const [locations, setLocations] = useState<AfriGomboLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = LocationService.subscribeActiveLocations((data) => {
      setLocations(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Utility to get list of communes
  const communes = locations
    .filter(l => l.type === "Commune" || l.type === "Ville")
    .map(l => l.name);

  // Fallback merged with default if database is loading or empty
  const defaultCommuneNames = DEFAULT_INITIAL_LOCATIONS
    .filter(l => l.type === "Commune" || l.type === "Ville")
    .map(l => l.name);

  const allCommuneNames = Array.from(new Set([...communes, ...defaultCommuneNames]))
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

  return {
    locations,
    communeNames: allCommuneNames,
    loading,
    submitProposal: LocationService.submitProposal.bind(LocationService)
  };
}

export function useAdminLocations() {
  const [locations, setLocations] = useState<AfriGomboLocation[]>([]);
  const [proposals, setProposals] = useState<LocationProposal[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);

  useEffect(() => {
    const unsubLoc = LocationService.subscribeAllLocations((data) => {
      setLocations(data);
      setLoadingLocations(false);
    });

    const unsubProp = LocationService.subscribeProposals((data) => {
      setProposals(data);
      setLoadingProposals(false);
    });

    return () => {
      unsubLoc();
      unsubProp();
    };
  }, []);

  const pendingProposalsCount = proposals.filter(p => p.status === "PENDING" || p.status === "pending").length;

  return {
    locations,
    proposals,
    pendingProposalsCount,
    loading: loadingLocations || loadingProposals,
    addLocation: LocationService.addLocation.bind(LocationService),
    updateLocation: LocationService.updateLocation.bind(LocationService),
    toggleStatus: LocationService.toggleStatus.bind(LocationService),
    approveProposal: LocationService.approveProposal.bind(LocationService),
    rejectProposal: LocationService.rejectProposal.bind(LocationService)
  };
}
