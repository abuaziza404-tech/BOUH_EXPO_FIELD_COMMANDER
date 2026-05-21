import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { COLORS, MAP_DEFAULTS } from "@/core/constants";
import { SpectralTarget, TargetBox } from "@/core/types";

type Props = {
  targets: SpectralTarget[];
  boxes: TargetBox[];
  center: { lat: number; lon: number };
  spectralOpacity: number;
  dataPackagePath?: string;
  onPress: (lat: number, lon: number) => void;
};

function boxPolygon(box: TargetBox) {
  const halfLat = (box.sizeM / 111320) / 2;
  const halfLon = (box.sizeM / (111320 * Math.cos(box.centerLat * Math.PI / 180))) / 2;
  return [[
    [box.centerLon - halfLon, box.centerLat - halfLat],
    [box.centerLon + halfLon, box.centerLat - halfLat],
    [box.centerLon + halfLon, box.centerLat + halfLat],
    [box.centerLon - halfLon, box.centerLat + halfLat],
    [box.centerLon - halfLon, box.centerLat - halfLat]
  ]];
}

export default function BouhMapWeb({ targets, boxes, center, spectralOpacity, onPress }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: divRef.current,
      center: [center.lon, center.lat],
      zoom: MAP_DEFAULTS.zoom,
      minZoom: MAP_DEFAULTS.minZoom,
      maxZoom: MAP_DEFAULTS.maxZoom,
      style: {
        version: 8,
        sources: {
          googleSatellite: {
            type: "raster",
            tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
            tileSize: 256
          },
          targets: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: targets.map((t) => ({
                type: "Feature",
                properties: { id: t.id, rank: t.rank, score: t.richScore },
                geometry: { type: "Point", coordinates: [t.lon, t.lat] }
              }))
            }
          },
          boxes: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: boxes.map((b) => ({
                type: "Feature",
                properties: { id: b.id, score: b.maxScore },
                geometry: { type: "Polygon", coordinates: boxPolygon(b) }
              }))
            }
          }
        },
        layers: [
          { id: "satellite", type: "raster", source: "googleSatellite", paint: { "raster-opacity": 0.92 } },
          { id: "boxFill", type: "fill", source: "boxes", paint: { "fill-color": COLORS.sovereignGold, "fill-opacity": 0.12 } },
          { id: "boxLine", type: "line", source: "boxes", paint: { "line-color": COLORS.sovereignGold, "line-width": 1.2 } },
          { id: "targetCircle", type: "circle", source: "targets", paint: { "circle-radius": 9, "circle-color": COLORS.cyberCyan, "circle-stroke-color": COLORS.sovereignGold, "circle-stroke-width": 2 } }
        ]
      }
    });
    map.on("click", (e) => onPress(e.lngLat.lat, e.lngLat.lng));
    mapRef.current = map;
    return () => map.remove();
  }, [targets, boxes, center, onPress]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer("bouhSpectralLayer")) {
      map.setPaintProperty("bouhSpectralLayer", "raster-opacity", spectralOpacity);
    }
  }, [spectralOpacity]);

  return (
    <View style={styles.wrap}>
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />
      <View pointerEvents="none" style={styles.crosshair}>
        <Text style={styles.crosshairText}>⌖</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.obsidian },
  crosshair: { position: "absolute", left: "50%", top: "50%", marginLeft: -20, marginTop: -20 },
  crosshairText: { color: COLORS.sovereignGold, fontSize: 40, fontWeight: "900" }
});
