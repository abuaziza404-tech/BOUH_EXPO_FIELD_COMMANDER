import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "@/core/constants";
import { KLEMM_SITES } from "@/core/repository";
import { Panel } from "@/components/Panel";
import { Metric } from "@/components/Metric";
import { useLiveLocation } from "@/hooks/useLocation";
import { nearestKlemmSites } from "@/services/nearest";

export default function KlemmScreen() {
  const { location } = useLiveLocation();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return KLEMM_SITES.slice(0, 80);
    return KLEMM_SITES.filter((x) => `${x.id} ${x.name} ${x.group} ${x.priority} ${x.analogClass}`.toLowerCase().includes(needle)).slice(0, 120);
  }, [q]);
  const nearest = location ? nearestKlemmSites(location, 3) : [];
  return (
    <View style={styles.root}>
      <Text style={styles.header}>KLEMM HISTORICAL GPS WORKSPACE</Text>
      <Panel title="NEAREST KLEMM">
        {nearest.map((k) => <Metric key={k.id} label={k.id} value={`M:${k.distanceM.toFixed(2)} B:${k.bearingDeg.toFixed(2)} E:${k.evidenceScore.toFixed(4)}`} />)}
      </Panel>
      <TextInput value={q} onChangeText={setQ} style={styles.input} placeholder="Klemm ID / Site / Group" placeholderTextColor="rgba(255,255,255,0.35)" />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Panel>
            <Text style={styles.title}>{item.name}</Text>
            <Metric label="ID" value={item.id} />
            <Metric label="LAT" value={item.lat.toFixed(6)} />
            <Metric label="LON" value={item.lon.toFixed(6)} />
            <Metric label="EVIDENCE" value={item.evidenceScore.toFixed(4)} />
            <Metric label="PAGES" value={item.pageRange} />
            <Text style={styles.desc}>{item.description}</Text>
          </Panel>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, backgroundColor: COLORS.obsidian },
  header: { color: COLORS.sovereignGold, fontWeight: "900", fontSize: 16, marginBottom: 10 },
  input: { borderColor: COLORS.panelBorder, borderWidth: 1, borderRadius: 10, padding: 10, color: "white", marginBottom: 10 },
  title: { color: COLORS.sovereignGold, fontWeight: "900" },
  desc: { color: "rgba(255,255,255,0.70)", fontSize: 11, marginTop: 6 }
});
