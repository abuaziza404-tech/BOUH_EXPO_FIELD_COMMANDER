import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { COLORS, MAP_DEFAULTS } from "@/core/constants";
import { SpectralTarget, TargetBox } from "@/core/types";
import { startNativeTileServer } from "@/services/nativeBridge";

Mapbox.setAccessToken("");

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

export default function BouhMapNative({ targets, boxes, center, spectralOpacity, dataPackagePath, onPress }: Props) {
  const [tileServer, setTileServer] = useState("");

  useEffect(() => {
    if (dataPackagePath && Platform.OS !== "web") {
      startNativeTileServer(dataPackagePath, 8787).then(setTileServer).catch(() => setTileServer(""));
    }
  }, [dataPackagePath]);

  const targetFeatures = {
    type: "FeatureCollection",
    features: targets.map((t) => ({
      type: "Feature",
      properties: { id: t.id, rank: t.rank, score: t.richScore },
      geometry: { type: "Point", coordinates: [t.lon, t.lat] }
    }))
  } as GeoJSON.FeatureCollection;

  const boxFeatures = {
    type: "FeatureCollection",
    features: boxes.map((b) => ({
      type: "Feature",
      properties: { id: b.id, score: b.maxScore },
      geometry: { type: "Polygon", coordinates: boxPolygon(b) }
    }))
  } as GeoJSON.FeatureCollection;

  return (
    <View style={styles.wrap}>
      <Mapbox.MapView
        style={styles.map}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled
        onPress={(event) => {
          const coords = event.geometry.coordinates;
          onPress(coords[1], coords[0]);
        }}
      >
        <Mapbox.Camera
          zoomLevel={MAP_DEFAULTS.zoom}
          centerCoordinate={[center.lon, center.lat]}
          animationDuration={600}
        />
        <Mapbox.RasterSource
          id="googleSatellite"
          tileUrlTemplates={["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"]}
          tileSize={256}
        >
          <Mapbox.RasterLayer id="googleSatelliteLayer" sourceID="googleSatellite" style={{ rasterOpacity: 0.92 }} />
        </Mapbox.RasterSource>
        <Mapbox.RasterSource
          id="usgsTopo"
          tileUrlTemplates={["https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"]}
          tileSize={256}
        >
          <Mapbox.RasterLayer id="usgsTopoLayer" sourceID="usgsTopo" style={{ rasterOpacity: 0.0 }} />
        </Mapbox.RasterSource>
        {tileServer ? (
          <Mapbox.RasterSource
            id="bouhSpectral"
            tileUrlTemplates={[`${tileServer}/tiles/spectral/{z}/{x}/{y}.png`]}
            tileSize={256}
          >
            <Mapbox.RasterLayer id="bouhSpectralLayer" sourceID="bouhSpectral" style={{ rasterOpacity: spectralOpacity }} />
          </Mapbox.RasterSource>
        ) : null}
        <Mapbox.ShapeSource id="boxes" shape={boxFeatures}>
          <Mapbox.FillLayer id="boxFill" style={{ fillColor: COLORS.sovereignGold, fillOpacity: 0.12 }} />
          <Mapbox.LineLayer id="boxLine" style={{ lineColor: COLORS.sovereignGold, lineWidth: 1.4 }} />
        </Mapbox.ShapeSource>
        <Mapbox.ShapeSource id="targets" shape={targetFeatures}>
          <Mapbox.CircleLayer id="targetCircles" style={{
            circleRadius: ["interpolate", ["linear"], ["get", "score"], 0, 5, 1, 13],
            circleColor: COLORS.cyberCyan,
            circleStrokeColor: COLORS.sovereignGold,
            circleStrokeWidth: 2,
            circleOpacity: 0.86
          }} />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
      <View pointerEvents="none" style={styles.crosshair}>
        <Text style={styles.crosshairText}>⌖</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.obsidian },
  map: { flex: 1 },
  crosshair: { position: "absolute", left: "50%", top: "50%", marginLeft: -20, marginTop: -20 },
  crosshairText: { color: COLORS.sovereignGold, fontSize: 40, fontWeight: "900" }
});
