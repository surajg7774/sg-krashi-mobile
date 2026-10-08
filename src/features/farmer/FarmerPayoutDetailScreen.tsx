import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { farmerPayoutService } from "./farmerPayoutService";
import type { FarmerStackParamList } from "@/navigation/FarmerStackNavigator";
import type { PayoutStatus } from "./types";
import { formatDateTime } from "@/i18n/format";
import { useT } from "@/i18n/useT";
import { LINE_TYPE_KEY, PAYOUT_STATUS_KEY } from "./payoutLabels";

type DetailRoute = RouteProp<FarmerStackParamList, "FarmerPayoutDetail">;

const statusColor: Record<PayoutStatus, string> = {
  BATCHED: colors.warning,
  APPROVED: colors.info,
  PAID: colors.success,
};

export const FarmerPayoutDetailScreen = () => {
  const { params } = useRoute<DetailRoute>();
  const { t, lang } = useT();

  const payoutQuery = useQuery({
    queryKey: ["farmer-payout-detail", params.payoutId],
    queryFn: () => farmerPayoutService.getOwnPayoutDetail(params.payoutId),
  });

  if (payoutQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (payoutQuery.isError || !payoutQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorState message={t("farmer.payouts.detailLoadError")} onRetry={() => void payoutQuery.refetch()} />
      </View>
    );
  }

  const payout = payoutQuery.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cycleText}>
          {payout.cycleStartDate} → {payout.cycleEndDate}
        </Text>
        <Text style={[styles.statusBadge, { color: statusColor[payout.status] }]}>
          {PAYOUT_STATUS_KEY[payout.status] ? t(PAYOUT_STATUS_KEY[payout.status]) : payout.status}
        </Text>

        <View style={styles.amountsRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{t("farmer.payouts.gross")}</Text>
            <Text style={styles.amountValue}>₹{payout.grossAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{t("farmer.payouts.commission")}</Text>
            <Text style={styles.amountValue}>₹{payout.commissionAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{t("farmer.payouts.netLabel")}</Text>
            <Text style={[styles.amountValue, { color: colors.primary }]}>₹{payout.netAmount.toFixed(2)}</Text>
          </View>
        </View>

        {payout.approvedAt && <Text style={styles.metaText}>{t("farmer.payouts.approvedAt", { date: formatDateTime(new Date(payout.approvedAt), lang) })}</Text>}
        {payout.paidAt && <Text style={styles.metaText}>{t("farmer.payouts.paidAt", { date: formatDateTime(new Date(payout.paidAt), lang) })}</Text>}
      </View>

      <Text style={styles.sectionTitle}>{t("farmer.payouts.lineItems")}</Text>
      {payout.lines.map((line) => (
        <View key={line.id} style={styles.lineRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineItemName} numberOfLines={1}>
              {line.itemNameSnapshot}
            </Text>
            <Text style={styles.lineOrderNumber}>{t("orders.orderNumber", { number: line.orderNumber })}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.lineTypeBadge, line.lineType === "CLAWBACK" && styles.lineTypeClawback]}>
              {LINE_TYPE_KEY[line.lineType] ? t(LINE_TYPE_KEY[line.lineType]) : line.lineType}
            </Text>
            <Text style={styles.lineAmount}>₹{line.netAmount.toFixed(2)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, padding: 16 },
  cycleText: { fontSize: 14, color: colors.textSecondary },
  statusBadge: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  amountsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  amountBox: { flex: 1, backgroundColor: colors.background, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  amountLabel: { fontSize: 11, color: colors.textSecondary },
  amountValue: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary, marginTop: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 24, marginBottom: 10 },
  lineRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
    marginBottom: 8,
  },
  lineItemName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  lineOrderNumber: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  lineTypeBadge: { fontSize: 10, fontWeight: "700", color: colors.success },
  lineTypeClawback: { color: colors.error },
  lineAmount: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginTop: 2 },
});
