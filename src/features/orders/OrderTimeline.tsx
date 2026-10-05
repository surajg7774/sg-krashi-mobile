import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { buildOrderSteps, type StepState, type TimelineStep } from "./orderTimelineSteps";
import type { OrderStatus, OrderStatusEvent } from "./types";

const DOT = 14;

const LABEL_COLOR: Record<StepState, string> = {
  done: colors.textPrimary,
  current: colors.textPrimary,
  upcoming: colors.grey300,
  failed: colors.error,
  refunded: colors.textSecondary,
};

const DOT_COLOR: Record<StepState, string> = {
  done: colors.success,
  current: colors.primary,
  upcoming: colors.grey300,
  failed: colors.error,
  refunded: colors.textSecondary,
};

const Dot = ({ state }: { state: StepState }) => {
  if (state === "upcoming") {
    return <View style={[styles.dot, styles.dotHollow]} />;
  }
  if (state === "current") {
    // A ring around the filled dot, so "you are here" does not rely on colour alone.
    return (
      <View style={styles.dotRing}>
        <View style={[styles.dot, { backgroundColor: DOT_COLOR.current }]} />
      </View>
    );
  }
  return <View style={[styles.dot, { backgroundColor: DOT_COLOR[state] }]} />;
};

const accessibilityText = (step: TimelineStep) => {
  const when = step.occurredAt ? `, ${new Date(step.occurredAt).toLocaleString()}` : "";
  const where = step.state === "current" ? ", current step" : step.state === "upcoming" ? ", not yet" : "";
  return `${step.label}${where}${when}`;
};

interface Props {
  events: OrderStatusEvent[];
  /** The order's present status — decides which steps are still ahead. */
  status: OrderStatus;
}

/**
 * Vertical order-tracking stepper built from the order's real status history
 * (see buildOrderSteps): completed steps carry their real time, the current
 * step is highlighted, failed/refunded end the line, and steps still ahead are
 * greyed with no time.
 */
export const OrderTimeline = ({ events, status }: Props) => {
  const steps = buildOrderSteps(events, status);
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const nextIsUpcoming = steps[index + 1]?.state === "upcoming";
        return (
          <View key={step.key} style={styles.row} accessible accessibilityLabel={accessibilityText(step)}>
            <View style={styles.rail}>
              <Dot state={step.state} />
              {!isLast && (
                <View style={[styles.connector, nextIsUpcoming ? styles.connectorDashed : styles.connectorSolid]} />
              )}
            </View>
            <View style={[styles.body, !isLast && styles.bodySpaced]}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: LABEL_COLOR[step.state] }, step.state === "upcoming" && styles.labelUpcoming]}>
                  {step.label}
                </Text>
                {step.state === "current" && (
                  <View style={styles.currentChip}>
                    <Text style={styles.currentChipText}>Current</Text>
                  </View>
                )}
              </View>
              {step.detail && <Text style={styles.detail}>{step.detail}</Text>}
              {step.occurredAt && <Text style={styles.time}>{new Date(step.occurredAt).toLocaleString()}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignSelf: "stretch" },
  row: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center", paddingTop: 4, width: 22 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  dotHollow: { borderWidth: 2, borderColor: colors.grey300, backgroundColor: colors.surface },
  dotRing: {
    width: DOT + 8,
    height: DOT + 8,
    borderRadius: (DOT + 8) / 2,
    backgroundColor: colors.grey100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
  },
  connector: { flexGrow: 1, minHeight: 28, marginVertical: 4, borderLeftWidth: 2, borderColor: colors.divider },
  connectorSolid: { borderStyle: "solid" },
  connectorDashed: { borderStyle: "dashed" },
  body: { flex: 1 },
  bodySpaced: { paddingBottom: 16 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  label: { fontSize: 15, fontWeight: "700" },
  labelUpcoming: { fontWeight: "500" },
  currentChip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  currentChipText: { fontSize: 11, fontWeight: "600", color: colors.primary },
  detail: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  time: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
