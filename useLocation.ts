import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { LatLon } from "@/core/types";

export function useLiveLocation() {
  const [location, setLocation] = useState<LatLon | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    async function start() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("GPS_PERMISSION_DENIED");
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      if (!cancelled) {
        setLocation({ lat: current.coords.latitude, lon: current.coords.longitude });
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 2,
          timeInterval: 1000
        },
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      );
    }

    start().catch((e) => setError(String(e)));
    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, []);

  return { location, error };
}
