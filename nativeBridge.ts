import { NativeModules, Platform } from "react-native";

type BouhNativeType = {
  startTileServer: (mbtilesPath: string, port: number) => Promise<string>;
  stopTileServer: () => Promise<boolean>;
  readSpectralAt: (packagePath: string, lat: number, lon: number) => Promise<Record<string, number>>;
  haversineMetersNative: (lat1: number, lon1: number, lat2: number, lon2: number) => Promise<number>;
};

const Native = NativeModules.BouhNativeModule as BouhNativeType | undefined;

export async function startNativeTileServer(mbtilesPath: string, port = 8787): Promise<string> {
  if (!Native || Platform.OS === "web") {
    return "";
  }
  return Native.startTileServer(mbtilesPath, port);
}

export async function stopNativeTileServer(): Promise<boolean> {
  if (!Native || Platform.OS === "web") return false;
  return Native.stopTileServer();
}

export async function readSpectralNative(packagePath: string, lat: number, lon: number) {
  if (!Native || Platform.OS === "web") return null;
  try {
    return await Native.readSpectralAt(packagePath, lat, lon);
  } catch {
    return null;
  }
}
