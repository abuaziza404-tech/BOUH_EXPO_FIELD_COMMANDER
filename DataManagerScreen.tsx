import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/core/constants";
import { Panel } from "@/components/Panel";
import { Metric } from "@/components/Metric";
import { importDataPackage, readMbtilesMetadata } from "@/services/mbtiles";

export default function DataManagerScreen() {
  const [path, setPath] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  async function importPackage() {
    const pkg = await importDataPackage();
    if (!pkg) return;
    setPath(pkg.localPath);
    const md = await readMbtilesMetadata(pkg.localPath).catch(() => ({}));
    setMetadata(md);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.header}>DATA PACKAGE MANAGER</Text>
      <Panel title="USB-C / FILE IMPORT">
        <Pressable style={styles.button} onPress={importPackage}>
          <Text style={styles.buttonText}>IMPORT MBTILES / GPKG / SQLITE PACKAGE</Text>
        </Pressable>
        <Metric label="PATH" value={path || "NA"} />
      </Panel>
      <Panel title="METADATA">
        {Object.entries(metadata).map(([k, v]) => <Metric key={k} label={k} value={v} />)}
      </Panel>
      <Panel title="STRICT NUMERIC OUTPUT">
        <Metric label="ZOOM_MIN" value="5" />
        <Metric label="ZOOM_MAX" value="18" />
        <Metric label="FIELD_RESOLUTION_M" value="5.0000" />
        <Metric label="CLAY_INDEX" value="B6/B7" />
        <Metric label="IRON_OXIDE" value="B4/B2" />
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, backgroundColor: COLORS.obsidian },
  header: { color: COLORS.sovereignGold, fontWeight: "900", fontSize: 16, marginBottom: 10 },
  button: { backgroundColor: COLORS.sovereignGold, padding: 12, borderRadius: 10, marginBottom: 8 },
  buttonText: { color: COLORS.obsidian, fontWeight: "900" }
});
