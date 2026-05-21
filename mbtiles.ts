import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { SYSTEM } from "@/core/constants";

export type ImportedDataPackage = {
  name: string;
  uri: string;
  localPath: string;
  size: number;
};

const DATA_DIR = `${FileSystem.documentDirectory}${SYSTEM.mbtilesDirectory}/`;

export async function ensureDataPackageDirectory(): Promise<string> {
  const info = await FileSystem.getInfoAsync(DATA_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DATA_DIR, { intermediates: true });
  return DATA_DIR;
}

export async function importDataPackage(): Promise<ImportedDataPackage | null> {
  await ensureDataPackageDirectory();
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/octet-stream", "application/x-sqlite3", "application/vnd.sqlite3", "*/*"],
    copyToCacheDirectory: true,
    multiple: false
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  const cleanName = asset.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const localPath = `${DATA_DIR}${Date.now()}_${cleanName}`;
  await FileSystem.copyAsync({ from: asset.uri, to: localPath });
  return {
    name: cleanName,
    uri: asset.uri,
    localPath,
    size: asset.size ?? 0
  };
}

export async function openMbtilesFromPath(localPath: string) {
  const fileName = localPath.split("/").pop() || "package.mbtiles";
  const target = `${DATA_DIR}${fileName}`;
  const targetInfo = await FileSystem.getInfoAsync(target);
  if (!targetInfo.exists && localPath !== target) {
    await FileSystem.copyAsync({ from: localPath, to: target });
  }
  return SQLite.openDatabaseAsync(fileName, {}, DATA_DIR);
}

export async function readMbtilesMetadata(localPath: string): Promise<Record<string, string>> {
  const db = await openMbtilesFromPath(localPath);
  const rows = await db.getAllAsync<{ name: string; value: string }>("select name,value from metadata");
  const out: Record<string, string> = {};
  rows.forEach((row) => { out[row.name] = row.value; });
  return out;
}

export async function querySpectralSidecar(localPath: string, lat: number, lon: number) {
  const db = await openMbtilesFromPath(localPath);
  const rows = await db.getAllAsync<any>(
    `select lat,lon,b2,b4,b6,b7,aster_silica,lineament_density,shear_intersection
     from spectral_pixels
     order by ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) asc
     limit 1`,
    [lat, lat, lon, lon]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  const clay = Number(r.b6) / Math.max(0.000001, Number(r.b7));
  const ironOxide = Number(r.b4) / Math.max(0.000001, Number(r.b2));
  return {
    lat: Number(r.lat),
    lon: Number(r.lon),
    clay,
    ironOxide,
    silica: Number(r.aster_silica),
    asterSilica: Number(r.aster_silica),
    lineamentDensity: Number(r.lineament_density),
    shearIntersection: Number(r.shear_intersection)
  };
}
