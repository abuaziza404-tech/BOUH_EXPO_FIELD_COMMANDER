import targetsRaw from "@/data/targets.json";
import boxesRaw from "@/data/boxes.json";
import klemmRaw from "@/data/klemm.json";
import studiesRaw from "@/data/studies.json";
import analogsRaw from "@/data/analogs.json";
import { FieldAnalog, KlemmSite, SpectralTarget, StudyModel, TargetBox } from "./types";

export const TARGETS = targetsRaw as SpectralTarget[];
export const TARGET_BOXES = boxesRaw as TargetBox[];
export const KLEMM_SITES = klemmRaw as KlemmSite[];
export const STUDIES = studiesRaw as StudyModel[];
export const FIELD_ANALOGS = analogsRaw as FieldAnalog[];

export function getTargetById(id: string): SpectralTarget | undefined {
  return TARGETS.find((target) => target.id === id);
}

export function getKlemmById(id: string): KlemmSite | undefined {
  return KLEMM_SITES.find((site) => site.id === id);
}
