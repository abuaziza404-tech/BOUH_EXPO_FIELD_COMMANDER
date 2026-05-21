import { LatLon, PixelSpectralResult } from "@/core/types";
import { gpzCalibration } from "./gpz";
import { nearestKlemmSites, nearestTargets } from "./nearest";
import { fixed4, pct2 } from "@/utils/format";

export function parseLocalCommand(command: string, point: LatLon, spectral: PixelSpectralResult | null): string {
  const q = command.trim().toLowerCase();
  const nearTargets = nearestTargets(point, 3);
  const nearKlemm = nearestKlemmSites(point, 3);
  const t = nearTargets[0] ?? null;
  const gpz = gpzCalibration(t);

  if (!q) return "CODE:000;INPUT:EMPTY";

  if (q.includes("أقرب") && (q.includes("كليم") || q.includes("klemm"))) {
    const k = nearKlemm[0];
    return [
      "CODE:101",
      `KLEMM_ID:${k.id}`,
      `DIST_M:${k.distanceM.toFixed(2)}`,
      `BEARING_DEG:${k.bearingDeg.toFixed(2)}`,
      `EVIDENCE:${k.evidenceScore.toFixed(4)}`,
      `LAT:${k.lat.toFixed(6)}`,
      `LON:${k.lon.toFixed(6)}`
    ].join(";");
  }

  if (q.includes("معايرة") || q.includes("gpz") || q.includes("جهاز")) {
    return [
      "CODE:201",
      `TARGET:${t?.id ?? "NA"}`,
      `GROUND:${gpz.groundType}`,
      `MODE:${gpz.goldMode}`,
      `SENS_MIN:${gpz.sensitivityMin}`,
      `SENS_MAX:${gpz.sensitivityMax}`,
      `AUDIO:${gpz.audioSmoothing}`,
      `GRID_M:${gpz.gridM}`,
      `MAG_RISK:${(t?.magRiskProxy ?? 0).toFixed(4)}`
    ].join(";");
  }

  if (q.includes("حلل") || q.includes("تحليل") || q.includes("نقطة")) {
    return [
      "CODE:301",
      `LAT:${point.lat.toFixed(6)}`,
      `LON:${point.lon.toFixed(6)}`,
      `TARGET:${t?.id ?? "NA"}`,
      `DIST_M:${(t?.distanceM ?? 0).toFixed(2)}`,
      `CLAY:${fixed4(spectral?.clay ?? 0)}`,
      `IRON:${fixed4(spectral?.ironOxide ?? 0)}`,
      `SILICA:${fixed4(spectral?.silica ?? 0)}`,
      `LINEAMENT:${fixed4(spectral?.lineamentDensity ?? 0)}`,
      `CONF:${pct2(spectral?.targetConfidence ?? 0)}`
    ].join(";");
  }

  if (q.includes("أقرب") || q.includes("هدف")) {
    return nearTargets.map((x, i) => [
      `RANK:${i + 1}`,
      `ID:${x.id}`,
      `DIST_M:${x.distanceM.toFixed(2)}`,
      `BEARING:${x.bearingDeg.toFixed(2)}`,
      `SCORE:${x.richScore.toFixed(4)}`
    ].join(";")).join("\n");
  }

  if (q.includes("شفافية")) {
    return "CODE:401;SPECTRAL_OPACITY_MIN:0.3500;SPECTRAL_OPACITY_TERRAIN:0.6800;FIELD_WALK_OPACITY:0.7500";
  }

  return [
    "CODE:900",
    `TARGET:${t?.id ?? "NA"}`,
    `DIST_M:${(t?.distanceM ?? 0).toFixed(2)}`,
    `CONF:${pct2(spectral?.targetConfidence ?? 0)}`,
    `GPZ:${gpz.groundType}/${gpz.goldMode}/${gpz.sensitivityMin}-${gpz.sensitivityMax}`
  ].join(";");
}
