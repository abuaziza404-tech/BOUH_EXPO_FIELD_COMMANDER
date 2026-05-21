import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SavedFieldTarget } from "@/core/types";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function exportKml(points: SavedFieldTarget[]) {
  const body = points.map((p) => {
    const desc = `confidence=${p.confidence.toFixed(4)} clay=${p.clay.toFixed(4)} iron=${p.ironOxide.toFixed(4)} silica=${p.silica.toFixed(4)}`;
    return `<Placemark><name>${esc(p.id)}</name><description>${esc(desc)}</description><Point><coordinates>${p.lon},${p.lat},0</coordinates></Point></Placemark>`;
  }).join("\n");
  const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>BOUH Field Targets</name>${body}</Document></kml>`;
  const path = `${FileSystem.documentDirectory}BOUH_Field_Targets_${Date.now()}.kml`;
  await FileSystem.writeAsStringAsync(path, kml);
  await Sharing.shareAsync(path);
  return path;
}

export async function exportGpx(points: SavedFieldTarget[]) {
  const body = points.map((p) => `<wpt lat="${p.lat}" lon="${p.lon}"><name>${esc(p.id)}</name><desc>confidence=${p.confidence.toFixed(4)}</desc></wpt>`).join("\n");
  const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="BOUH GOLD PRO ULTRA">${body}</gpx>`;
  const path = `${FileSystem.documentDirectory}BOUH_Field_Targets_${Date.now()}.gpx`;
  await FileSystem.writeAsStringAsync(path, gpx);
  await Sharing.shareAsync(path);
  return path;
}

export async function exportCsv(points: SavedFieldTarget[]) {
  const header = "id,lat,lon,createdAt,nearestTargetId,confidence,clay,ironOxide,silica,lineamentDensity,note";
  const rows = points.map((p) => [
    p.id, p.lat.toFixed(8), p.lon.toFixed(8), p.createdAt, p.nearestTargetId,
    p.confidence.toFixed(4), p.clay.toFixed(4), p.ironOxide.toFixed(4), p.silica.toFixed(4), p.lineamentDensity.toFixed(4),
    `"${p.note.replace(/"/g, '""')}"`
  ].join(","));
  const path = `${FileSystem.documentDirectory}BOUH_Field_Targets_${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(path, [header, ...rows].join("\n"));
  await Sharing.shareAsync(path);
  return path;
}
