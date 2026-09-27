import { useMutation, useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { cropDoctorService } from "./cropDoctorService";
import type { CropDoctorStackParamList } from "@/navigation/CropDoctorStackNavigator";

type DetailRoute = RouteProp<CropDoctorStackParamList, "ScanDetail">;

const healthColor: Record<string, string> = { HEALTHY: colors.success, DISEASED: colors.error, UNCERTAIN: colors.warning };

export const ScanDetailScreen = () => {
  const { params } = useRoute<DetailRoute>();

  const scanQuery = useQuery({
    queryKey: ["crop-doctor-scan-detail", params.scanId],
    queryFn: () => cropDoctorService.getScanDetail(params.scanId),
  });

  const reportMutation = useMutation({
    mutationFn: () => cropDoctorService.downloadReport(params.scanId, `crop-scan-${params.scanId}.pdf`),
  });

  if (scanQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (scanQuery.isError || !scanQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load this scan." onRetry={() => void scanQuery.refetch()} />
      </View>
    );
  }

  const scan = scanQuery.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {scan.imageUrls.length > 0 && <Image source={scan.imageUrls[0]} style={styles.image} contentFit="cover" />}
        <View style={styles.headerRow}>
          <Text style={styles.crop}>{scan.identifiedCrop}</Text>
          <Text style={[styles.status, { color: healthColor[scan.healthStatus] }]}>{scan.healthStatus}</Text>
        </View>
        {scan.problem && <Text style={styles.sectionHeading}>Problem: {scan.problem}</Text>}
        {scan.severity && <Text style={styles.metaText}>Severity: {scan.severity}</Text>}

        <ResultList heading="Symptoms" items={scan.symptoms} />
        <ResultList heading="What to do now" items={scan.actionsNow} />
        <ResultList heading="Prevention" items={scan.prevention} />

        <Text style={styles.limitationsText}>{scan.limitations}</Text>

        <Pressable
          style={[styles.reportButton, reportMutation.isPending && styles.disabledButton]}
          disabled={reportMutation.isPending}
          onPress={() => reportMutation.mutate()}
        >
          {reportMutation.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.reportButtonText}>Download / Share PDF Report</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};

const ResultList = ({ heading, items }: { heading: string; items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.bodyText}>
          • {item}
        </Text>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, padding: 16 },
  image: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12, backgroundColor: colors.grey100 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  crop: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  status: { fontSize: 13, fontWeight: "700" },
  sectionHeading: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginTop: 14, marginBottom: 4 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  bodyText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  limitationsText: { fontSize: 11, color: colors.textSecondary, marginTop: 16, fontStyle: "italic" },
  reportButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 20 },
  reportButtonText: { color: colors.primary, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
});
