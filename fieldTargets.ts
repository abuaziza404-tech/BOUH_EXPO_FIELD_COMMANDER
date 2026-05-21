import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedFieldTarget } from "@/core/types";
import { SYSTEM } from "@/core/constants";

const KEY = `${SYSTEM.storagePrefix}:savedFieldTargets`;

export async function loadSavedFieldTargets(): Promise<SavedFieldTarget[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as SavedFieldTarget[] : [];
  } catch {
    return [];
  }
}

export async function saveFieldTargets(items: SavedFieldTarget[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function addSavedFieldTarget(item: SavedFieldTarget): Promise<SavedFieldTarget[]> {
  const current = await loadSavedFieldTargets();
  const next = [item, ...current].slice(0, 5000);
  await saveFieldTargets(next);
  return next;
}

export async function clearSavedFieldTargets(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
