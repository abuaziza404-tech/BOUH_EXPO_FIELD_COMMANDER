import { KLEMM_SITES, TARGETS } from "@/core/repository";
import { PixelSpectralResult, SpectralTarget } from "@/core/types";
import { clamp } from "@/utils/format";
import { haversineMeters } from "@/utils/haversine";
import { querySpectralSidecar } from "./mbtiles";
import { readSpectralNative } from "./nativeBridge";

function embeddedApproximation(lat: number, lon: number): PixelSpectralResult {
  let nearest: SpectralTarget = TARGETS[0];
  let dist = Number.POSITIVE_INFINITY;
  TARGETS.forEach((target) => {
    const d = haversineMeters({ lat, lon }, { lat: target.lat, lon: target.lon });
    if (d < dist) {
      dist = d;
      nearest = target;
    }
  });
  const distancePenalty = clamp(1 - dist / 3000, 0, 1);
  const clay = 0.85 + nearest.asterAlteration * 0.95;
  const ironOxide = 0.8 + nearest.gossanSupport * 1.2;
  const silica = nearest.silicaSupport;
  const lineamentDensity = clamp((nearest.richScore * 0.55 + nearest.abuazizaAnalog * 0.45) * distancePenalty, 0, 1);
  const shearIntersection = clamp((nearest.finalScore * 0.60 + nearest.sentinelSupport * 0.40) * distancePenalty, 0, 1);
  const targetConfidence = predictTargetConfidence({
    lat, lon, elevation: 0, fractureDensity: lineamentDensity, ironOxide, clay, klemmDistanceM: nearestKlemmDistance(lat, lon), silica, shearIntersection
  });
  return { lat, lon, clay, ironOxide, silica, asterSilica: silica, lineamentDensity, shearIntersection, targetConfidence, source: "embedded" };
}

export function nearestKlemmDistance(lat: number, lon: number): number {
  let best = Number.POSITIVE_INFINITY;
  KLEMM_SITES.forEach((site) => {
    const d = haversineMeters({ lat, lon }, { lat: site.lat, lon: site.lon });
    if (d < best) best = d;
  });
  return best;
}

export function predictTargetConfidence(input: {
  lat: number;
  lon: number;
  elevation: number;
  fractureDensity: number;
  ironOxide: number;
  clay: number;
  klemmDistanceM: number;
  silica: number;
  shearIntersection: number;
}): number {
  const iron = clamp((input.ironOxide - 0.8) / 2.2);
  const clay = clamp((input.clay - 0.8) / 2.0);
  const silica = clamp(input.silica);
  const structure = clamp(input.fractureDensity * 0.55 + input.shearIntersection * 0.45);
  const klemm = clamp(1 - input.klemmDistanceM / 35000);
  const raw = 100 * (
    0.22 * iron +
    0.20 * clay +
    0.22 * silica +
    0.26 * structure +
    0.10 * klemm
  );
  return clamp(raw, 0, 100);
}

export async function analyzePixelAt(params: {
  lat: number;
  lon: number;
  dataPackagePath?: string;
}): Promise<PixelSpectralResult> {
  const { lat, lon, dataPackagePath } = params;
  if (dataPackagePath) {
    const native = await readSpectralNative(dataPackagePath, lat, lon);
    if (native) {
      const clay = Number(native.clay ?? native.b6 / Math.max(0.000001, native.b7));
      const ironOxide = Number(native.ironOxide ?? native.b4 / Math.max(0.000001, native.b2));
      const silica = Number(native.silica ?? native.asterSilica ?? 0);
      const lineamentDensity = Number(native.lineamentDensity ?? 0);
      const shearIntersection = Number(native.shearIntersection ?? 0);
      const targetConfidence = predictTargetConfidence({
        lat, lon, elevation: Number(native.elevation ?? 0), fractureDensity: lineamentDensity, ironOxide, clay, klemmDistanceM: nearestKlemmDistance(lat, lon), silica, shearIntersection
      });
      return { lat, lon, clay, ironOxide, silica, asterSilica: silica, lineamentDensity, shearIntersection, targetConfidence, source: "native" };
    }
    const sidecar = await querySpectralSidecar(dataPackagePath, lat, lon).catch(() => null);
    if (sidecar) {
      const targetConfidence = predictTargetConfidence({
        lat, lon, elevation: 0, fractureDensity: sidecar.lineamentDensity, ironOxide: sidecar.ironOxide, clay: sidecar.clay, klemmDistanceM: nearestKlemmDistance(lat, lon), silica: sidecar.silica, shearIntersection: sidecar.shearIntersection
      });
      return { ...sidecar, targetConfidence, source: "sqlite" };
    }
  }
  return embeddedApproximation(lat, lon);
}
