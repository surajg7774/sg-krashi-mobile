import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { formatLastUpdated, shouldShowLastUpdated } from "@/offline/screenState";
import { useT } from "@/i18n/useT";

interface LastUpdatedProps {
  /** dataUpdatedAt of the query on screen (for weather this is the fetch time: the payload has no timestamp). */
  timestamp: number | null;
  isShowingOfflineData: boolean;
  /** Show the label even for fresh data (weather). Otherwise it appears only when offline or the data is old. */
  always?: boolean;
  /** An extra quieter line, shown only while offline (e.g. "Order status may be out of date"). */
  offlineNote?: string;
}

// A clock that ticks once a minute, so "just now" turns into a time without the screen re-rendering for another
// reason. Read from state (not Date.now() during render) so renders stay pure. A timestamp newer than this clock
// (data that just arrived) reads as "just now".
const useNow = (): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

export const LastUpdated = ({ timestamp, isShowingOfflineData, always, offlineNote }: LastUpdatedProps) => {
  const now = useNow();
  const { lang } = useT();
  if (!shouldShowLastUpdated({ isShowingOfflineData, lastUpdatedAt: timestamp, now, always })) return null;
  const label = formatLastUpdated(timestamp, now, lang);
  if (!label) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {isShowingOfflineData && offlineNote ? <Text style={styles.note}>{offlineNote}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: { fontSize: 12, color: colors.textSecondary },
  note: { fontSize: 12, color: colors.textPrimary, marginTop: 2, fontWeight: "600" },
});
