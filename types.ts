export type LatLon = {
  lat: number;
  lon: number;
};

export type SpectralTarget = {
  id: string;
  rank: number;
  lat: number;
  lon: number;
  richScore: number;
  finalScore: number;
  asterAlteration: number;
  abuazizaAnalog: number;
  sentinelSupport: number;
  gossanSupport: number;
  silicaSupport: number;
  gpzRegolithSupport: number;
  magRiskProxy: number;
  targetType: string;
  decision: string;
  truthTag: string;
  fieldStrategy: string;
};

export type TargetBox = {
  id: string;
  rank: number;
  centerLat: number;
  centerLon: number;
  maxScore: number;
  sizeM: number;
  areaM2: number;
  dominantType: string;
  decision: string;
  truthTag: string;
};

export type KlemmSite = {
  id: string;
  siteId: string;
  name: string;
  group: string;
  lat: number;
  lon: number;
  priority: string;
  reliability: string;
  evidenceScore: number;
  analogClass: string;
  coordinateQuality: string;
  pageRange: string;
  description: string;
};

export type StudyModel = {
  id: string;
  year: number;
  citation: string;
  area: string;
  model: string;
  features: string[];
  weight: number;
};

export type FieldAnalog = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  class: string;
  magRisk: number;
};

export type SavedFieldTarget = {
  id: string;
  lat: number;
  lon: number;
  createdAt: string;
  note: string;
  nearestTargetId: string;
  confidence: number;
  clay: number;
  ironOxide: number;
  silica: number;
  lineamentDensity: number;
};

export type PixelSpectralResult = {
  lat: number;
  lon: number;
  clay: number;
  ironOxide: number;
  silica: number;
  asterSilica: number;
  lineamentDensity: number;
  shearIntersection: number;
  targetConfidence: number;
  source: "native" | "sqlite" | "embedded" | "unavailable";
};

export type CompassReading = {
  azimuth: number;
  dip: number;
  strike: number;
};
