import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { useAuth } from "@/context/AuthContext";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { SelectField } from "@/components/SelectField";
import { cropDoctorService } from "./cropDoctorService";
import { OTHER_CROP_VALUE, SUPPORTED_LANGUAGES, type CropScan, type CropScanSummary, type PickedImage } from "./types";
import type { CropDoctorStackParamList } from "@/navigation/CropDoctorStackNavigator";
import { CONFIDENCE_KEY, HEALTH_KEY } from "./labels";
import { useT } from "@/i18n/useT";

const HISTORY_PAGE_SIZE = 12;

type Navigation = NativeStackNavigationProp<CropDoctorStackParamList, "CropDoctorHome">;


const healthColor: Record<string, string> = { HEALTHY: colors.success, DISEASED: colors.error, UNCERTAIN: colors.warning };

const HistoryRow = ({ item, onPress }: { item: CropScanSummary; onPress: () => void }) => {
  const { t } = useT();
  const healthKey = HEALTH_KEY[item.healthStatus];
  return (
    <Pressable style={({ pressed }) => [styles.historyRow, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <Image source={item.imageUrl} style={styles.historyThumb} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.historyCrop}>{item.identifiedCrop}</Text>
        <Text style={styles.historyProblem} numberOfLines={1}>
          {item.problem ?? t("cropDoctor.noIssue")}
        </Text>
      </View>
      <Text style={[styles.historyStatus, { color: healthColor[item.healthStatus] }]}>{healthKey ? t(healthKey) : item.healthStatus}</Text>
    </Pressable>
  );
};

export const CropDoctorScreen = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { t, lang, errorText } = useT();
  // The AI report starts in the app's language when that is Hindi (the person can still pick another); English
  // keeps its old default. See docs/I18N_DECISIONS.md, D15.
  const defaultReportLanguage = lang === "hi" ? "hi" : "en";

  const [images, setImages] = useState<PickedImage[]>([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [otherCropName, setOtherCropName] = useState("");
  const [language, setLanguage] = useState(defaultReportLanguage);
  const [historyPage, setHistoryPage] = useState(0);

  const supportedCropsQuery = useQuery({
    queryKey: ["crop-doctor-supported-crops"],
    queryFn: cropDoctorService.getSupportedCrops,
  });

  const historyQuery = useQuery({
    queryKey: ["crop-doctor-history", historyPage],
    queryFn: () => cropDoctorService.getScans(historyPage, HISTORY_PAGE_SIZE),
    enabled: isAuthenticated,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => cropDoctorService.analyze(images, declaredCrop, language),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crop-doctor-history"] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const reportMutation = useMutation({
    mutationFn: (scan: CropScan) => cropDoctorService.downloadReport(scan.id!, `crop-scan-${scan.id}.pdf`),
  });

  const isOtherCrop = selectedCrop === OTHER_CROP_VALUE;
  const declaredCrop = isOtherCrop ? otherCropName.trim() : selectedCrop;

  const cropOptions = [
    ...(supportedCropsQuery.data ?? []).map((crop) => ({
      value: crop.cropName,
      label: crop.hasLimitedCoverage ? t("cropDoctor.limitedCoverage", { crop: crop.cropName }) : crop.cropName,
    })),
    { value: OTHER_CROP_VALUE, label: t("cropDoctor.otherCrop") },
  ];
  const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }));
  const selectedCropNote = supportedCropsQuery.data?.find((c) => c.cropName === selectedCrop)?.coverageNote;

  const handleReset = () => {
    setImages([]);
    setSelectedCrop("");
    setOtherCropName("");
    setLanguage(defaultReportLanguage);
    analyzeMutation.reset();
    reportMutation.reset();
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      appendImage(result.assets[0]);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      result.assets.forEach(appendImage);
    }
  };

  const appendImage = (asset: ImagePicker.ImagePickerAsset) => {
    setImages((prev) => [
      ...prev,
      { uri: asset.uri, name: asset.fileName ?? `photo-${Date.now()}.jpg`, type: asset.mimeType ?? "image/jpeg" },
    ]);
  };

  const removeImage = (uri: string) => setImages((prev) => prev.filter((img) => img.uri !== uri));

  const scans = historyQuery.data?.items ?? [];
  const totalPages = historyQuery.data?.totalPages ?? 1;
  const scan = analyzeMutation.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("cropDoctor.title")}</Text>
      <Text style={styles.subtitle}>{t("cropDoctor.subtitle")}</Text>

      {analyzeMutation.isPending && (
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.helperText}>{t("cropDoctor.analyzing")}</Text>
        </View>
      )}

      {!analyzeMutation.isPending && scan && (
        <View style={styles.resultWrap}>
          <View style={styles.card}>
            {scan.imageUrls.length > 0 && (
              <Image source={scan.imageUrls[0]} style={styles.resultImage} contentFit="cover" />
            )}
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultCrop}>{scan.identifiedCrop}</Text>
              <Text style={[styles.resultStatus, { color: healthColor[scan.healthStatus] }]}>
                {HEALTH_KEY[scan.healthStatus] ? t(HEALTH_KEY[scan.healthStatus]!) : scan.healthStatus}
              </Text>
            </View>
            <Text style={styles.resultConfidence}>{CONFIDENCE_KEY[scan.confidenceBand] ? t(CONFIDENCE_KEY[scan.confidenceBand]!) : ""}</Text>

            {scan.cropMismatch && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>{t("cropDoctor.cropMismatch")}</Text>
              </View>
            )}
            {scan.isUncertain && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>{t("cropDoctor.uncertain")}</Text>
              </View>
            )}

            {scan.problem && <Text style={styles.sectionHeading}>{t("cropDoctor.problem", { value: scan.problem })}</Text>}
            {scan.pathogenScientificName && (
              <Text style={styles.metaText}>{t("cropDoctor.pathogen", { value: scan.pathogenScientificName })}</Text>
            )}
            {scan.severity && <Text style={styles.metaText}>{t("cropDoctor.severity", { value: scan.severity })}</Text>}

            <ResultList heading={t("cropDoctor.symptoms")} items={scan.symptoms} />
            <ResultList heading={t("cropDoctor.possibleCauses")} items={scan.possibleCauses} />
            <ResultList heading={t("cropDoctor.environmentalFactors")} items={scan.environmentalFactors} />
            <ResultList heading={t("cropDoctor.actionsNow")} items={scan.actionsNow} />
            <ResultList heading={t("cropDoctor.prevention")} items={scan.prevention} />
            {scan.monitoringGuidance && (
              <>
                <Text style={styles.sectionHeading}>{t("cropDoctor.monitoring")}</Text>
                <Text style={styles.bodyText}>{scan.monitoringGuidance}</Text>
              </>
            )}
            <ResultList heading={t("cropDoctor.escalate")} items={scan.warningSignsToEscalate} />

            {scan.groundingSources.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>{t("cropDoctor.sources")}</Text>
                {scan.groundingSources.map((source, i) => (
                  <Text key={i} style={styles.sourceText}>
                    • {source.title} ({source.crop})
                  </Text>
                ))}
              </>
            )}

            <Text style={styles.limitationsText}>{scan.limitations}</Text>

            {scan.id !== null && (
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, reportMutation.isPending && styles.disabledButton, pressed && { opacity: 0.6 }]}
                disabled={reportMutation.isPending}
                onPress={() => reportMutation.mutate(scan)}
              >
                {reportMutation.isPending ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.secondaryButtonText}>{t("cropDoctor.downloadReport")}</Text>
                )}
              </Pressable>
            )}
          </View>

          {scan.id === null && (
            <View style={styles.guestPrompt}>
              <Text style={styles.guestPromptTitle}>{t("cropDoctor.guestTitle")}</Text>
              <Text style={styles.guestPromptText}>{t("cropDoctor.guestBody")}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => pressed && { opacity: 0.6 }}
            onPress={handleReset}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text style={styles.linkText}>{t("cropDoctor.scanAnother")}</Text>
          </Pressable>
        </View>
      )}

      {!analyzeMutation.isPending && !scan && (
        <View style={styles.card}>
          <View style={styles.row}>
            <SelectField label={t("cropDoctor.whatCrop")} value={selectedCrop} options={cropOptions} onSelect={setSelectedCrop} />
            <View style={{ width: 12 }} />
            <SelectField label={t("cropDoctor.reportLanguage")} value={language} options={languageOptions} onSelect={setLanguage} />
          </View>

          {isOtherCrop && (
            <TextInput
              style={styles.textInput}
              placeholder={t("cropDoctor.otherCropPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={otherCropName}
              onChangeText={setOtherCropName}
            />
          )}

          {selectedCropNote && <Text style={styles.noteText}>{selectedCropNote}</Text>}

          <View style={styles.imageRow}>
            {images.map((img) => (
              <View key={img.uri} style={styles.imageThumbWrap}>
                <Image source={img.uri} style={styles.imageThumb} contentFit="cover" />
                <Pressable
                  style={({ pressed }) => [styles.removeImageButton, pressed && { opacity: 0.6 }]}
                  onPress={() => removeImage(img.uri)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.removeImageButtonText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.pickButtonRow}>
            <Pressable style={({ pressed }) => [styles.pickButton, pressed && { opacity: 0.6 }]} onPress={pickFromCamera}>
              <Text style={styles.pickButtonText}>{t("common.takePhoto")}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.pickButton, pressed && { opacity: 0.6 }]} onPress={pickFromGallery}>
              <Text style={styles.pickButtonText}>{t("common.addFromGallery")}</Text>
            </Pressable>
          </View>

          {analyzeMutation.isError && (
            <Text style={styles.errorText}>
              {errorText(analyzeMutation.error, t("cropDoctor.analyzeError"), { details: false })}
            </Text>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, (images.length === 0 || !declaredCrop) && styles.disabledButton, pressed && { opacity: 0.6 }]}
            disabled={images.length === 0 || !declaredCrop}
            onPress={() => analyzeMutation.mutate()}
          >
            <Text style={styles.primaryButtonText}>{t("cropDoctor.analyze")}</Text>
          </Pressable>
        </View>
      )}

      {isAuthenticated && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{t("cropDoctor.history")}</Text>
          {historyQuery.isLoading && (
            <ListRowSkeletonList count={3} thumbnailSize={48} lines={2} trailing />
          )}
          {historyQuery.isError && (
            <ErrorState message={t("cropDoctor.historyError")} onRetry={() => void historyQuery.refetch()} />
          )}
          {!historyQuery.isLoading && scans.length === 0 && (
            <EmptyState icon="🌿" message={t("cropDoctor.historyEmpty")} />
          )}
          {scans.map((item) => (
            <HistoryRow key={item.id} item={item} onPress={() => navigation.navigate("ScanDetail", { scanId: item.id })} />
          ))}
          {scans.length > 0 && (
            <View style={styles.pagerRow}>
              <Pressable
                style={({ pressed }) => pressed && { opacity: 0.6 }}
                disabled={historyPage === 0}
                onPress={() => setHistoryPage((p) => p - 1)}
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
              >
                <Text style={[styles.pagerText, historyPage === 0 && styles.pagerTextDisabled]}>{t("common.previous")}</Text>
              </Pressable>
              <Text style={styles.pagerLabel}>{t("cropDoctor.pageOf", { page: historyPage + 1, total: totalPages })}</Text>
              <Pressable
                style={({ pressed }) => pressed && { opacity: 0.6 }}
                disabled={historyPage + 1 >= totalPages}
                onPress={() => setHistoryPage((p) => p + 1)}
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
              >
                <Text style={[styles.pagerText, historyPage + 1 >= totalPages && styles.pagerTextDisabled]}>{t("common.next")}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
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
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  helperText: { textAlign: "center", color: colors.textSecondary, marginTop: 10 },
  row: { flexDirection: "row" },
  textInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  noteText: { fontSize: 12, color: colors.info, marginTop: 10 },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  imageThumbWrap: { width: 80, height: 80, borderRadius: 8, overflow: "hidden" },
  imageThumb: { width: "100%", height: "100%" },
  removeImageButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageButtonText: { color: "#fff", fontSize: 14, lineHeight: 16 },
  pickButtonRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  pickButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pickButtonText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  primaryButtonText: { color: colors.primaryContrastText, fontSize: 16, fontWeight: "600" },
  secondaryButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 12, minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 16 },
  secondaryButtonText: { color: colors.primary, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
  errorText: { color: colors.error, marginTop: 12, textAlign: "center" },
  resultWrap: { gap: 12 },
  resultImage: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12, backgroundColor: colors.grey100 },
  resultHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultCrop: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  resultStatus: { fontSize: 13, fontWeight: "700" },
  resultConfidence: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  warningBanner: { backgroundColor: colors.grey100, borderRadius: 8, padding: 10, marginTop: 12 },
  warningBannerText: { color: colors.textPrimary, fontSize: 13 },
  sectionHeading: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginTop: 14, marginBottom: 4 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  bodyText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  sourceText: { fontSize: 12, color: colors.textSecondary },
  limitationsText: { fontSize: 11, color: colors.textSecondary, marginTop: 16, fontStyle: "italic" },
  guestPrompt: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.info, borderRadius: 12, padding: 14 },
  guestPromptTitle: { fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  guestPromptText: { fontSize: 13, color: colors.textSecondary },
  linkText: { color: colors.primary, fontWeight: "600", textAlign: "center", paddingVertical: 8 },
  historySection: { marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 10,
    marginBottom: 8,
  },
  historyThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.grey100 },
  historyCrop: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  historyProblem: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  historyStatus: { fontSize: 11, fontWeight: "700" },
  pagerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 8 },
  pagerText: { color: colors.primary, fontWeight: "600" },
  pagerTextDisabled: { color: colors.grey300 },
  pagerLabel: { fontSize: 12, color: colors.textSecondary },
});
