import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { farmerService } from "./farmerService";
import { farmerPayoutService } from "./farmerPayoutService";
import type { FarmerStackParamList } from "@/navigation/FarmerStackNavigator";

type Navigation = NativeStackNavigationProp<FarmerStackParamList, "FarmerDashboard">;

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const FarmerDashboardScreen = () => {
  const navigation = useNavigation<Navigation>();

  const summaryQuery = useQuery({
    queryKey: ["farmer-dashboard-summary"],
    queryFn: farmerService.getDashboardSummary,
  });

  const pendingQuery = useQuery({
    queryKey: ["farmer-payouts-pending"],
    queryFn: farmerPayoutService.getPending,
  });

  if (summaryQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load your dashboard." onRetry={() => void summaryQuery.refetch()} />
      </View>
    );
  }

  const summary = summaryQuery.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statsGrid}>
        <StatCard label="Total Listings" value={summary.totalListings} />
        <StatCard label="Active Listings" value={summary.activeListings} />
        <StatCard label="Orders w/ Your Crops" value={summary.ordersContainingListings} />
        <StatCard label="Units Sold" value={summary.unitsSold} />
      </View>

      {pendingQuery.data && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingLabel}>Pending payout (accrued, not yet batched)</Text>
          <Text style={styles.pendingAmount}>₹{pendingQuery.data.netAmount.toFixed(2)}</Text>
          <Text style={styles.pendingMeta}>{pendingQuery.data.itemCount} item(s) delivered, awaiting the weekly batch</Text>
        </View>
      )}

      <Pressable style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("FarmerListings")}>
        <Text style={styles.navCardTitle}>My Crop Listings</Text>
        <Text style={styles.navCardSubtitle}>Manage your listings on the Crop Marketplace →</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("FarmerPayouts")}>
        <Text style={styles.navCardTitle}>Payout History</Text>
        <Text style={styles.navCardSubtitle}>View your batched, approved, and paid payouts →</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  pendingCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  pendingLabel: { fontSize: 12, color: colors.textSecondary },
  pendingAmount: { fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  pendingMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  navCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  navCardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  navCardSubtitle: { fontSize: 13, color: colors.primary, marginTop: 4, fontWeight: "600" },
});
