import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { SelectField } from "@/components/SelectField";
import { ErrorState } from "@/components/ErrorState";
import { farmerService } from "./farmerService";
import type { FarmerStackParamList } from "@/navigation/FarmerStackNavigator";
import type { FarmerCropListingFormValues, MediaAsset } from "./types";

type Navigation = NativeStackNavigationProp<FarmerStackParamList, "FarmerListingForm">;
type FormRoute = RouteProp<FarmerStackParamList, "FarmerListingForm">;

const EMPTY_FORM: FarmerCropListingFormValues = {
  categoryId: null,
  name: "",
  slug: "",
  description: "",
  quantityAvailable: null,
  unitPrice: null,
  harvestDate: "",
  isOrganicCertified: false,
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseDate = (value: string): Date => {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const FarmerListingFormScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<FormRoute>();
  const queryClient = useQueryClient();

  // Starts from route.params.listingId (edit mode) or undefined (create
  // mode). On a successful create, this switches to the new id in place —
  // same "save first, then upload photos" flow the web app's
  // FarmerListingsPage uses (a listing must exist before media can be
  // attached to it).
  const [listingId, setListingId] = useState<number | undefined>(params.listingId);
  const [form, setForm] = useState<FarmerCropListingFormValues>(EMPTY_FORM);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["crop-categories"],
    queryFn: farmerService.getCropCategories,
  });

  const detailQuery = useQuery({
    queryKey: ["farmer-listing-detail", listingId],
    queryFn: () => farmerService.getOwnListingDetail(listingId!),
    enabled: listingId !== undefined,
  });

  useEffect(() => {
    if (detailQuery.data) {
      setForm({
        categoryId: detailQuery.data.category?.id ?? null,
        name: detailQuery.data.name,
        slug: detailQuery.data.slug,
        description: detailQuery.data.description,
        quantityAvailable: detailQuery.data.quantityAvailable,
        unitPrice: detailQuery.data.unitPrice,
        harvestDate: detailQuery.data.harvestDate,
        isOrganicCertified: detailQuery.data.isOrganicCertified,
      });
      setMedia([...detailQuery.data.media].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [detailQuery.data]);

  const invalidateListingLists = () => {
    void queryClient.invalidateQueries({ queryKey: ["farmer-listings"] });
    void queryClient.invalidateQueries({ queryKey: ["farmer-dashboard-summary"] });
  };

  const createMutation = useMutation({
    mutationFn: () => farmerService.createOwnListing(form),
    onSuccess: (detail) => {
      setFormError(null);
      setListingId(detail.id);
      setMedia(detail.media);
      invalidateListingLists();
    },
    onError: (err) => setFormError((err as { message?: string })?.message ?? "Could not save this listing."),
  });

  const updateMutation = useMutation({
    mutationFn: () => farmerService.updateOwnListing(listingId!, form),
    onSuccess: () => {
      setFormError(null);
      invalidateListingLists();
      void queryClient.invalidateQueries({ queryKey: ["farmer-listing-detail", listingId] });
      Alert.alert("Saved", "Your changes have been saved.");
    },
    onError: (err) => setFormError((err as { message?: string })?.message ?? "Could not save this listing."),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => farmerService.deactivateOwnListing(listingId!),
    onSuccess: () => {
      invalidateListingLists();
      navigation.goBack();
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: (image: { uri: string; name: string; type: string }) => farmerService.uploadListingMedia(listingId!, image),
    onSuccess: (asset) => setMedia((prev) => [...prev, asset]),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: number) => farmerService.deleteListingMedia(listingId!, mediaId),
  });

  const isEditing = listingId !== undefined;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const categoryOptions = (categoriesQuery.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));

  const handleSubmit = () => {
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate listing",
      `Are you sure you want to deactivate "${form.name}"? It will immediately disappear from the public Crop Marketplace.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: () => deactivateMutation.mutate() },
      ]
    );
  };

  const openDatePicker = () => {
    const currentDate = parseDate(form.harvestDate || formatDate(new Date()));
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: "date",
        onChange: (_event, date) => {
          if (date) setForm((f) => ({ ...f, harvestDate: formatDate(date) }));
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const pickAndUpload = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: true, selectionLimit: 5 });

    if (result.canceled) return;
    result.assets.forEach((asset) => {
      uploadMediaMutation.mutate({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
    });
  };

  const handleDeleteMedia = (mediaId: number) => {
    Alert.alert("Remove photo", "Remove this photo from the listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          deleteMediaMutation.mutate(mediaId);
          setMedia((prev) => prev.filter((m) => m.id !== mediaId));
        },
      },
    ]);
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= media.length || listingId === undefined) return;
    const current = media[index];
    const target = media[targetIndex];

    const reordered = [...media];
    reordered[index] = { ...target, sortOrder: current.sortOrder };
    reordered[targetIndex] = { ...current, sortOrder: target.sortOrder };
    reordered.sort((a, b) => a.sortOrder - b.sortOrder);
    setMedia(reordered);

    void farmerService.reorderListingMedia(listingId, current.id, target.sortOrder);
    void farmerService.reorderListingMedia(listingId, target.id, current.sortOrder);
  };

  if (params.listingId !== undefined && detailQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (params.listingId !== undefined && detailQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load this listing." onRetry={() => void detailQuery.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <SelectField
          label="Category"
          value={form.categoryId !== null ? String(form.categoryId) : ""}
          options={categoryOptions}
          onSelect={(value) => setForm((f) => ({ ...f, categoryId: Number(value) }))}
        />
      </View>

      <Text style={styles.fieldLabel}>Name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
        placeholder="e.g. Alphonso Mangoes"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.fieldLabel}>Slug (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.slug}
        onChangeText={(text) => setForm((f) => ({ ...f, slug: text }))}
        placeholder="Leave blank to auto-generate from name"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.description}
        onChangeText={(text) => setForm((f) => ({ ...f, description: text }))}
        multiline
        placeholder="Describe your crop…"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Unit Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={form.unitPrice !== null ? String(form.unitPrice) : ""}
            onChangeText={(text) => setForm((f) => ({ ...f, unitPrice: text ? Number(text) : null }))}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Quantity Available</Text>
          <TextInput
            style={styles.input}
            value={form.quantityAvailable !== null ? String(form.quantityAvailable) : ""}
            onChangeText={(text) => setForm((f) => ({ ...f, quantityAvailable: text ? Number(text) : null }))}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Harvest Date</Text>
      <Pressable style={({ pressed }) => [styles.input, pressed && { opacity: 0.6 }]} onPress={openDatePicker}>
        <Text style={{ color: form.harvestDate ? colors.textPrimary : colors.textSecondary }}>
          {form.harvestDate || "Select a date"}
        </Text>
      </Pressable>
      {Platform.OS === "ios" && showDatePicker && (
        <DateTimePicker
          value={parseDate(form.harvestDate || formatDate(new Date()))}
          mode="date"
          display="inline"
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) setForm((f) => ({ ...f, harvestDate: formatDate(date) }));
          }}
        />
      )}

      <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>Organic Certified</Text>
        <Switch
          value={form.isOrganicCertified}
          onValueChange={(value) => setForm((f) => ({ ...f, isOrganicCertified: value }))}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {formError && <Text style={styles.errorText}>{formError}</Text>}

      <Pressable style={({ pressed }) => [styles.primaryButton, isSaving && styles.disabledButton, pressed && { opacity: 0.6 }]} disabled={isSaving} onPress={handleSubmit}>
        {isSaving ? <ActivityIndicator color={colors.primaryContrastText} /> : <Text style={styles.primaryButtonText}>{isEditing ? "Save Changes" : "Create Listing"}</Text>}
      </Pressable>

      {isEditing && (
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {media.map((item, index) => (
            <View key={item.id} style={styles.mediaRow}>
              <Image source={item.url} style={styles.mediaThumb} contentFit="cover" />
              <View style={styles.mediaControls}>
                <Pressable
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                  disabled={index === 0}
                  onPress={() => moveMedia(index, -1)}
                  hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
                >
                  <Text style={[styles.mediaControlText, index === 0 && styles.mediaControlDisabled]}>▲</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                  disabled={index === media.length - 1}
                  onPress={() => moveMedia(index, 1)}
                  hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
                >
                  <Text style={[styles.mediaControlText, index === media.length - 1 && styles.mediaControlDisabled]}>▼</Text>
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [styles.mediaDeleteButton, pressed && { opacity: 0.6 }]}
                onPress={() => handleDeleteMedia(item.id)}
                hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
              >
                <Text style={styles.mediaDeleteText}>Remove</Text>
              </Pressable>
            </View>
          ))}

          {uploadMediaMutation.isPending && <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />}

          <View style={styles.pickButtonRow}>
            <Pressable style={({ pressed }) => [styles.pickButton, pressed && { opacity: 0.6 }]} onPress={() => void pickAndUpload(true)}>
              <Text style={styles.pickButtonText}>📷 Take Photo</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.pickButton, pressed && { opacity: 0.6 }]} onPress={() => void pickAndUpload(false)}>
              <Text style={styles.pickButtonText}>🖼️ Add from Gallery</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.deactivateButton, deactivateMutation.isPending && styles.disabledButton, pressed && { opacity: 0.6 }]}
            disabled={deactivateMutation.isPending}
            onPress={handleDeactivate}
          >
            <Text style={styles.deactivateButtonText}>Deactivate Listing</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  row: { flexDirection: "row", marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  errorText: { color: colors.error, marginBottom: 12, textAlign: "center" },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: colors.primaryContrastText, fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
  mediaSection: { marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 8,
    marginBottom: 8,
  },
  mediaThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.grey100 },
  mediaControls: { alignItems: "center", gap: 4 },
  mediaControlText: { fontSize: 16, color: colors.primary, fontWeight: "700" },
  mediaControlDisabled: { color: colors.grey300 },
  mediaDeleteButton: { marginLeft: "auto" },
  mediaDeleteText: { color: colors.error, fontWeight: "600", fontSize: 13 },
  pickButtonRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  pickButton: { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 12, minHeight: 44, alignItems: "center", justifyContent: "center" },
  pickButtonText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  deactivateButton: { borderWidth: 1, borderColor: colors.error, borderRadius: 8, paddingVertical: 12, minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 20 },
  deactivateButtonText: { color: colors.error, fontWeight: "600" },
});
