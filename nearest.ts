import { KLEMM_SITES, TARGETS } from "@/core/repository";
import { KlemmSite, LatLon, SpectralTarget } from "@/core/types";
import { bearingDegrees, haversineMeters } from "@/utils/haversine";

export type NearestTarget = SpectralTarget & { distanceM: number; bearingDeg: number };
export type NearestKlemm = KlemmSite & { distanceM: number; bearingDeg: number };

export function nearestTargets(point: LatLon, limit = 3): NearestTarget[] {
  return TARGETS
    .map((target) => ({
      ...target,
      distanceM: haversineMeters(point, { lat: target.lat, lon: target.lon }),
      bearingDeg: bearingDegrees(point, { lat: target.lat, lon: target.lon })
    }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

export function nearestKlemmSites(point: LatLon, limit = 3): NearestKlemm[] {
  return KLEMM_SITES
    .map((site) => ({
      ...site,
      distanceM: haversineMeters(point, { lat: site.lat, lon: site.lon }),
      bearingDeg: bearingDegrees(point, { lat: site.lat, lon: site.lon })
    }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}
