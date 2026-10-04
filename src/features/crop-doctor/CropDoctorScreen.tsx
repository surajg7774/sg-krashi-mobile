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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { useAuth } from "@/context/AuthContext";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { SelectField } from "@/components/SelectField";
import { cropDoctorService } from "./cropDoctorService";
import { OTHER_CROP_VALUE, SUPPORTED_LANGUAGES, type CropScan, type CropScanSummary, type PickedImage } from "./types";
import type { CropDoctorStackParamList } from "@/navigation/CropDoctorStackNavigator";

const HISTORY_PAGE_SIZE = 12;

type Navigation = NativeStackNavigationProp<CropDoctorStackParamList, "CropDoctorHome">;

const confidenceLabel: Record<string, string> = { HIGH: "High confidence", MODERATE: "Moderate confidence", LOW: "Low confidence" };
const healthColor: Record<string, string> = { HEALTHY: colors.success, DISEASED: colors.error, UNCERTAIN: colors.warning };

const HistoryRow = ({ item, onPress }: { item: CropScanSummary; onPress: () => void }) => (
  <Pressable style={styles.historyRow} onPress={onPress}>
    <Image source={item.imageUrl} style={styles.historyThumb} contentFit="cover" />
    <View style={{ flex: 1 }}>
      <Text style={styles.historyCrop}>{item.identifiedCrop}</Text>
      <Text style={styles.historyProblem} numberOfLines={1}>
        {item.problem ?? "No issue detected"}
      </Text>
    </View>
    <Text style={[styles.historyStatus, { color: healthColor[item.healthStatus] }]}>{item.healthStatus}</Text>
  </Pressable>
);

export const CropDoctorScreen = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();

  const [images, setImages] = useState<PickedImage[]>([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [otherCropName, setOtherCropName] = useState("");
  const [language, setLanguage] = useState("en");
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["crop-doctor-history"] }),
  });

  const reportMutation = useMutation({
    mutationFn: (scan: CropScan) => cropDoctorService.downloadReport(scan.id!, `crop-scan-${scan.id}.pdf`),
  });

  const isOtherCrop = selectedCrop === OTHER_CROP_VALUE;
  const declaredCrop = isOtherCrop ? otherCropName.trim() : selectedCrop;

  const cropOptions = [
    ...(supportedCropsQuery.data ?? []).map((crop) => ({
      value: crop.cropName,
      label: crop.hasLimitedCoverage ? `${crop.cropName} (limited AI coverage)` : crop.cropName,
    })),
    { value: OTHER_CROP_VALUE, label: "Other / Not listed" },
  ];
  const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }));
  const selectedCropNote = supportedCropsQuery.data?.find((c) => c.cropName === selectedCrop)?.coverageNote;

  const handleReset = () => {
    setImages([]);
    setSelectedCrop("");
    setOtherCropName("");
    setLanguage("en");
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
      <Text style={styles.title}>AI Crop Doctor</Text>
      <Text style={styles.subtitle}>Photograph a crop or leaf and get an instant AI-powered health check.</Text>

      {analyzeMutation.isPending && (
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.helperText}>Analyzing your photo…</Text>
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
              <Text style={[styles.resultStatus, { color: healthColor[scan.healthStatus] }]}>{scan.healthStatus}</Text>
            </View>
            <Text style={styles.resultConfidence}>{confidenceLabel[scan.confidenceBand]}</Text>

            {scan.cropMismatch && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>
                  This photo doesn't look like the crop you selected — the analysis below may be less reliable.
                </Text>
              </View>
            )}
            {scan.isUncertain && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>
                  The AI wasn't fully confident in this result. Treat it as a starting point, not a diagnosis.
                </Text>
              </View>
            )}

            {scan.problem && <Text style={styles.sectionHeading}>Problem: {scan.problem}</Text>}
            {scan.pathogenScientificName && (
              <Text style={styles.metaText}>Pathogen: {scan.pathogenScientificName}</Text>
            )}
            {scan.severity && <Text style={styles.metaText}>Severity: {scan.severity}</Text>}

            <ResultList heading="Symptoms" items={scan.symptoms} />
            <ResultList heading="Possible causes" items={scan.possibleCauses} />
            <ResultList heading="Environmental factors" items={scan.environmentalFactors} />
            <ResultList heading="What to do now" items={scan.actionsNow} />
            <ResultList heading="Prevention" items={scan.prevention} />
            {scan.monitoringGuidance && (
              <>
                <Text style={styles.sectionHeading}>Monitoring guidance</Text>
                <Text style={styles.bodyText}>{scan.monitoringGuidance}</Text>
              </>
            )}
            <ResultList heading="Escalate if you see" items={scan.warningSignsToEscalate} />

            {scan.groundingSources.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>Sources</Text>
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
                style={[styles.secondaryButton, reportMutation.isPending && styles.disabledButton]}
                disabled={reportMutation.isPending}
                onPress={() => reportMutation.mutate(scan)}
              >
                {reportMutation.isPending ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.secondaryButtonText}>Download / Share PDF Report</Text>
                )}
              </Pressable>
            )}
          </View>

          {scan.id === null && (
            <View style={styles.guestPrompt}>
              <Text style={styles.guestPromptTitle}>Want to keep this result?</Text>
              <Text style={styles.guestPromptText}>Log in to save this scan to your history and download a PDF report.</Text>
            </View>
          )}

          <Pressable onPress={handleReset} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.linkText}>Scan another photo</Text>
          </Pressable>
        </View>
      )}

      {!analyzeMutation.isPending && !scan && (
        <View style={styles.card}>
          <View style={styles.row}>
            <SelectField label="What crop is this?" value={selectedCrop} options={cropOptions} onSelect={setSelectedCrop} />
            <View style={{ width: 12 }} />
            <SelectField label="Report language" value={language} options={languageOptions} onSelect={setLanguage} />
          </View>

          {isOtherCrop && (
            <TextInput
              style={styles.textInput}
              placeholder="Type the crop's name"
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
                  style={styles.removeImageButton}
                  onPress={() => removeImage(img.uri)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.removeImageButtonText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.pickButtonRow}>
            <Pressable style={styles.pickButton} onPress={pickFromCamera}>
              <Text style={styles.pickButtonText}>📷 Take Photo</Text>
            </Pressable>
            <Pressable style={styles.pickButton} onPress={pickFromGallery}>
              <Text style={styles.pickButtonText}>🖼️ Add from Gallery</Text>
            </Pressable>
          </View>

          {analyzeMutation.isError && (
            <Text style={styles.errorText}>
              {(analyzeMutation.error as { message?: string })?.message || "Something went wrong analyzing this photo."}
            </Text>
          )}

          <Pressable
            style={[styles.primaryButton, (images.length === 0 || !declaredCrop) && styles.disabledButton]}
            disabled={images.length === 0 || !declaredCrop}
            onPress={() => analyzeMutation.mutate()}
          >
            <Text style={styles.primaryButtonText}>Analyze</Text>
          </Pressable>
        </View>
      )}

      {isAuthenticated && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Scan History</Text>
          {historyQuery.isLoading && <ActivityIndicator color={colors.primary} />}
          {historyQuery.isError && (
            <ErrorState message="Could not load scan history." onRetry={() => void historyQuery.refetch()} />
          )}
          {!historyQuery.isLoading && scans.length === 0 && (
            <EmptyState icon="🌿" message="No scans yet — analyze your first photo above." />
          )}
          {scans.map((item) => (
            <HistoryRow key={item.id} item={item} onPress={() => navigation.navigate("ScanDetail", { scanId: item.id })} />
          ))}
          {scans.length > 0 && (
            <View style={styles.pagerRow}>
              <Pressable
                disabled={historyPage === 0}
                onPress={() => setHistoryPage((p) => p - 1)}
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
              >
                <Text style={[styles.pagerText, historyPage === 0 && styles.pagerTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={styles.pagerLabel}>
                Page {historyPage + 1} of {totalPages}
              </Text>
              <Pressable
                disabled={historyPage + 1 >= totalPages}
                onPress={() => setHistoryPage((p) => p + 1)}
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
              >
                <Text style={[styles.pagerText, historyPage + 1 >= totalPages && styles.pagerTextDisabled]}>Next</Text>
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
