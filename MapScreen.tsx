import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";
import { COLORS, MAP_DEFAULTS, SYSTEM } from "@/core/constants";
import { TARGET_BOXES, TARGETS } from "@/core/repository";
import { PixelSpectralResult, SavedFieldTarget } from "@/core/types";
import { useLiveLocation } from "@/hooks/useLocation";
import { useGeologicalCompass } from "@/hooks/useGeologicalCompass";
import { nearestTargets } from "@/services/nearest";
import { analyzePixelAt } from "@/services/spectralEngine";
import { addSavedFieldTarget, loadSavedFieldTargets } from "@/services/fieldTargets";
import { exportCsv, exportGpx, exportKml } from "@/services/exporters";
import { parseLocalCommand } from "@/services/localNlp";
import { gpzCalibration } from "@/services/gpz";
import { fixed4, pct2 } from "@/utils/format";
import { Panel } from "@/components/Panel";
import { Metric } from "@/components/Metric";
import BouhMap from "@/components/BouhMap";

export default function MapScreen() {
  const { location } = useLiveLocation();
  const compass = useGeologicalCompass();
  const [point, setPoint] = useState({ lat: MAP_DEFAULTS.centerLat, lon: MAP_DEFAULTS.centerLon });
  const [spectral, setSpectral] = useState<PixelSpectralResult | null>(null);
  const [spectralOpacity, setSpectralOpacity] = useState(MAP_DEFAULTS.spectralOpacity);
  const [saved, setSaved] = useState<SavedFieldTarget[]>([]);
  const [command, setCommand] = useState("معايرة جهاز GPZ");
  const [commandOut, setCommandOut] = useState("");

  useEffect(() => { loadSavedFieldTargets().then(setSaved); }, []);

  const liveOrPoint = location ?? point;
  const nearest = useMemo(() => nearestTargets(liveOrPoint, 3), [liveOrPoint.lat, liveOrPoint.lon]);
  const calibration = useMemo(() => gpzCalibration(nearest[0] ?? null), [nearest]);
  const currentCenter = useMemo(() => ({ lat: point.lat, lon: point.lon }), [point]);

  const analyze = useCallback(async (lat: number, lon: number) => {
    setPoint({ lat, lon });
    const result = await analyzePixelAt({ lat, lon });
    setSpectral(result);
    setCommandOut(parseLocalCommand(command, { lat, lon }, result));
  }, [command]);

  const saveCurrent = useCallback(async () => {
    const result = spectral ?? await analyzePixelAt({ lat: point.lat, lon: point.lon });
    const nearestId = nearestTargets({ lat: point.lat, lon: point.lon }, 1)[0]?.id ?? "NA";
    const item: SavedFieldTarget = {
      id: `BOUH_${Date.now()}`,
      lat: point.lat,
      lon: point.lon,
      createdAt: new Date().toISOString(),
      note: "FIELD_PIN",
      nearestTargetId: nearestId,
      confidence: result.targetConfidence,
      clay: result.clay,
      ironOxide: result.ironOxide,
      silica: result.silica,
      lineamentDensity: result.lineamentDensity
    };
    setSaved(await addSavedFieldTarget(item));
  }, [nearest, point, spectral]);

  return (
    <View style={styles.root}>
      <View style={styles.mapPane}>
        <BouhMap
          targets={TARGETS}
          boxes={TARGET_BOXES}
          center={currentCenter}
          spectralOpacity={spectralOpacity}
          onPress={analyze}
        />
      </View>
      <ScrollView style={styles.tray} contentContainerStyle={styles.trayInner}>
        <Text style={styles.header}>{SYSTEM.appName}</Text>
        <Text style={styles.subHeader}>{SYSTEM.name} — {SYSTEM.developer}</Text>

        <Panel title="MAP OPACITY">
          <Text style={styles.numeric}>SPECTRAL_OPACITY:{fixed4(spectralOpacity)}</Text>
          <Slider
            minimumValue={0}
            maximumValue={1}
            value={spectralOpacity}
            minimumTrackTintColor={COLORS.sovereignGold}
            maximumTrackTintColor="rgba(255,255,255,0.20)"
            thumbTintColor={COLORS.cyberCyan}
            onValueChange={setSpectralOpacity}
          />
        </Panel>

        <Panel title="LIVE POSITION / COMPASS">
          <Metric label="LAT" value={(liveOrPoint.lat).toFixed(6)} />
          <Metric label="LON" value={(liveOrPoint.lon).toFixed(6)} />
          <Metric label="AZIMUTH" value={fixed4(compass.azimuth)} />
          <Metric label="STRIKE" value={fixed4(compass.strike)} />
          <Metric label="DIP" value={fixed4(compass.dip)} />
        </Panel>

        <Panel title="NEAREST 3 TARGETS">
          {nearest.map((t, index) => (
            <Metric
              key={t.id}
              label={`${index + 1}.${t.id}`}
              value={`M:${t.distanceM.toFixed(2)} B:${t.bearingDeg.toFixed(2)} S:${fixed4(t.richScore)}`}
            />
          ))}
        </Panel>

        <Panel title="PIXEL ANALYSIS">
          <Metric label="CLAY" value={fixed4(spectral?.clay ?? 0)} />
          <Metric label="IRON_OXIDE" value={fixed4(spectral?.ironOxide ?? 0)} />
          <Metric label="SILICA" value={fixed4(spectral?.silica ?? 0)} />
          <Metric label="LINEAMENT" value={fixed4(spectral?.lineamentDensity ?? 0)} />
          <Metric label="CONFIDENCE" value={pct2(spectral?.targetConfidence ?? 0)} />
          <Metric label="SOURCE" value={spectral?.source ?? "NA"} />
        </Panel>

        <Panel title="GPZ 7000 FIELD CALIBRATION">
          <Metric label="GROUND_TYPE" value={calibration.groundType} />
          <Metric label="GOLD_MODE" value={calibration.goldMode} />
          <Metric label="SENSITIVITY" value={`${calibration.sensitivityMin}-${calibration.sensitivityMax}`} />
          <Metric label="AUDIO" value={calibration.audioSmoothing} />
          <Metric label="GRID_M" value={`${calibration.gridM}`} />
        </Panel>

        <Panel title="OFFLINE COMMAND">
          <TextInput
            value={command}
            onChangeText={setCommand}
            placeholder="أقرب هدف كليم / معايرة جهاز GPZ / حلل نقطة"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
          />
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => setCommandOut(parseLocalCommand(command, point, spectral))}>
              <Text style={styles.buttonText}>RUN</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={saveCurrent}>
              <Text style={styles.buttonText}>SAVE</Text>
            </Pressable>
          </View>
          <Text style={styles.output}>{commandOut}</Text>
        </Panel>

        <Panel title="EXPORT">
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => exportKml(saved)}>
              <Text style={styles.buttonText}>KML</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => exportGpx(saved)}>
              <Text style={styles.buttonText}>GPX</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => exportCsv(saved)}>
              <Text style={styles.buttonText}>CSV</Text>
            </Pressable>
          </View>
          <Text style={styles.numeric}>SAVED:{saved.length}</Text>
        </Panel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.obsidian },
  mapPane: { height: "54%", backgroundColor: COLORS.obsidian },
  tray: { flex: 1, backgroundColor: COLORS.obsidian },
  trayInner: { padding: 12, paddingBottom: 60 },
  header: { color: COLORS.sovereignGold, fontSize: 18, fontWeight: "900" },
  subHeader: { color: COLORS.cyberCyan, fontSize: 11, marginBottom: 8 },
  numeric: { color: COLORS.cyberCyan, fontSize: 12, fontWeight: "800" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  button: { backgroundColor: COLORS.sovereignGold, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginTop: 8 },
  buttonText: { color: COLORS.obsidian, fontWeight: "900" },
  input: { borderColor: COLORS.panelBorder, borderWidth: 1, borderRadius: 10, padding: 10, color: "white" },
  output: { color: COLORS.cyberCyan, fontFamily: "monospace", marginTop: 8, fontSize: 11 }
});
