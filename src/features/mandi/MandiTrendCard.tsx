import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { percentChange } from "@/shared/chartMath";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Sparkline } from "@/components/Sparkline";
import { BlockSkeleton } from "@/components/Skeleton";
import { mandiService } from "./mandiService";
import { useT } from "@/i18n/useT";

/** A trend line through fewer days than this says nothing — show the awaiting-data state instead. */
export const MIN_TREND_POINTS = 3;

interface MandiTrendCardProps {
  commodity: string;
  state?: string;
}

/**
 * Price trend for the selected commodity (and state, if chosen) from the
 * public GET /mandi/prices/trend — one point per day, the average modal price
 * across the matching markets, which is why the label says so. Only real
 * synced data is ever drawn; with no data yet it says it's awaiting Agmarknet.
 */
export const MandiTrendCard = ({ commodity, state }: MandiTrendCardProps) => {
  const { t } = useT();
  const trendQuery = useQuery({
    queryKey: ["mandi-trend", commodity, state],
    queryFn: () => mandiService.getTrend(commodity, state),
  });

  if (trendQuery.isLoading) {
    return (
      <View style={styles.wrap}>
        <BlockSkeleton height={84} />
      </View>
    );
  }
  if (trendQuery.isError) {
    return (
      <View style={styles.wrap}>
        <ErrorState message={t("mandi.trendLoadError")} onRetry={() => void trendQuery.refetch()} />
      </View>
    );
  }

  const points = trendQuery.data ?? [];
  if (points.length < MIN_TREND_POINTS) {
    return (
      <View style={styles.wrap}>
        <EmptyState
          icon="📈"
          message={
            points.length === 0
              ? t("mandi.awaiting")
              : t("mandi.trendAwaitingDays", { min: MIN_TREND_POINTS, count: points.length })
          }
        />
      </View>
    );
  }

  const values = points.map((p) => p.modalPrice);
  const latest = values[values.length - 1];
  const change = percentChange(values[0], latest);
  const rising = change !== null && change >= 0;

  return (
    <View style={[styles.wrap, styles.card]}>
      <View style={styles.textBlock}>
        <Text style={styles.caption}>{t("mandi.avgAcrossMarkets", { commodity })}</Text>
        <Text style={styles.price}>₹{Math.round(latest)}</Text>
        {change !== null && (
          <Text style={[styles.change, { color: rising ? colors.success : colors.error }]}>
            {t("mandi.trendChange", { arrow: rising ? "▲" : "▼", percent: Math.abs(change).toFixed(1), days: points.length })}
          </Text>
        )}
      </View>
      <Sparkline values={values} width={120} height={44} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
  },
  textBlock: { flex: 1, paddingRight: 12 },
  caption: { fontSize: 12, color: colors.textSecondary },
  price: { fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginTop: 2 },
  change: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});
