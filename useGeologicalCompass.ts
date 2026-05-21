import { Accelerometer, Magnetometer } from "expo-sensors";
import { useEffect, useMemo, useState } from "react";
import { CompassReading } from "@/core/types";

type Vec3 = { x: number; y: number; z: number };

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function useGeologicalCompass(): CompassReading {
  const [mag, setMag] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [acc, setAcc] = useState<Vec3>({ x: 0, y: 0, z: 1 });

  useEffect(() => {
    Magnetometer.setUpdateInterval(250);
    Accelerometer.setUpdateInterval(250);
    const ms = Magnetometer.addListener(setMag);
    const as = Accelerometer.addListener(setAcc);
    return () => {
      ms.remove();
      as.remove();
    };
  }, []);

  return useMemo(() => {
    const azimuth = normalizeAngle(Math.atan2(mag.y, mag.x) * 180 / Math.PI);
    const pitch = Math.atan2(-acc.x, Math.sqrt(acc.y * acc.y + acc.z * acc.z)) * 180 / Math.PI;
    const roll = Math.atan2(acc.y, acc.z) * 180 / Math.PI;
    const dip = Math.min(90, Math.abs(Math.round(Math.sqrt(pitch * pitch + roll * roll))));
    const strike = normalizeAngle(azimuth - 90);
    return { azimuth, dip, strike };
  }, [mag, acc]);
}
