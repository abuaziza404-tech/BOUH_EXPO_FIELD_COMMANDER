import { SpectralTarget } from "@/core/types";

export type GPZCalibration = {
  groundType: "Severe/Difficult" | "Normal";
  goldMode: "High Yield" | "General/Deep";
  sensitivityMin: number;
  sensitivityMax: number;
  audioSmoothing: "Low/On" | "Off";
  swing: string;
  gridM: number;
};

export function gpzCalibration(target: SpectralTarget | null): GPZCalibration {
  const magRisk = target?.magRiskProxy ?? 0;
  const regolith = (target?.targetType ?? "").toLowerCase().includes("regolith") || (target?.targetType ?? "").toLowerCase().includes("dark");
  if (magRisk > 0.75 || regolith) {
    return {
      groundType: "Severe/Difficult",
      goldMode: "High Yield",
      sensitivityMin: 8,
      sensitivityMax: 11,
      audioSmoothing: "Low/On",
      swing: "Slow cross-grid swing over dark regolith, repeat from two directions",
      gridM: 8
    };
  }
  return {
    groundType: "Normal",
    goldMode: "General/Deep",
    sensitivityMin: 12,
    sensitivityMax: 16,
    audioSmoothing: "Off",
    swing: "Slow controlled swing over quartz/silica or shallow bedrock pockets",
    gridM: 10
  };
}
