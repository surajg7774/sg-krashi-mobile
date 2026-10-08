import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { colors } from "@/theme/colors";
import { EMPTY_FILTERS, formatDay, fromIsoDay, toIsoDay, validateFilters, type CropFilters } from "./cropLogic";
import { useT } from "@/i18n/useT";

/** A harvest-date box: the phone's date picker on Android and iOS, plain typing in YYYY-MM-DD only where there is no picker (the web preview used for checks). */
const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (next: string) => void }) => {
  const { t, lang } = useT();
  const [iosOpen, setIosOpen] = useState(false);
  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: fromIsoDay(value), mode: "date", onChange: (_event, date) => date && onChange(toIsoDay(date)) });
    } else {
      setIosOpen((v) => !v);
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} accessibilityLabel={label} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.dateRow}>
        <Pressable
          style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.6 }]}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatDay(value, lang) : t("crops.filters.anyDate")}`}
        >
          <Text style={[styles.dateText, !value && { color: colors.textSecondary }]} numberOfLines={1}>
            {value ? formatDay(value, lang) : t("crops.filters.anyDate")}
          </Text>
        </Pressable>
        {value ? (
          <Pressable style={({ pressed }) => [styles.clearDate, pressed && { opacity: 0.6 }]} onPress={() => onChange("")} accessibilityRole="button" accessibilityLabel={`${t("crops.browse.clearFilters")}: ${label}`}>
            <Text style={styles.clearDateText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      {Platform.OS === "ios" && iosOpen && (
        <DateTimePicker
          value={fromIsoDay(value)}
          mode="date"
          display="inline"
          onChange={(_event, date) => {
            setIosOpen(false);
            if (date) onChange(toIsoDay(date));
          }}
        />
      )}
    </View>
  );
};

interface CropFilterSheetProps {
  visible: boolean;
  value: CropFilters;
  onApply: (next: CropFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

/** Bottom sheet with the filters that do not fit on the chip row: organic only, price range and harvest dates. Nothing is applied until "Show Results". */
export const CropFilterSheet = ({ visible, value, onApply, onClear, onClose }: CropFilterSheetProps) => {
  const { t } = useT();
  const [draft, setDraft] = useState<CropFilters>(value);
  const errors = validateFilters(draft);
  const invalid = Object.keys(errors).length > 0;
  const set = (patch: Partial<CropFilters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setDraft(value)}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityRole="button" accessibilityLabel={t("crops.filters.close")} />
        <View style={styles.sheet} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            <Text style={styles.title} accessibilityRole="header">
              {t("crops.browse.filters")}
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("crops.filters.organicOnly")}</Text>
              <Switch
                value={draft.organicOnly}
                onValueChange={(next) => set({ organicOnly: next })}
                trackColor={{ true: colors.primaryLight, false: colors.grey300 }}
                thumbColor={draft.organicOnly ? colors.primary : colors.surface}
                accessibilityLabel={t("crops.filters.organicOnly")}
              />
            </View>

            <Text style={styles.sectionLabel}>{t("crops.filters.priceRange")}</Text>
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t("crops.filters.minPrice")}</Text>
                <TextInput style={styles.input} value={draft.minPrice} onChangeText={(text) => set({ minPrice: text })} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textSecondary} accessibilityLabel={t("crops.filters.minPrice")} />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t("crops.filters.maxPrice")}</Text>
                <TextInput style={styles.input} value={draft.maxPrice} onChangeText={(text) => set({ maxPrice: text })} keyboardType="decimal-pad" placeholder="∞" placeholderTextColor={colors.textSecondary} accessibilityLabel={t("crops.filters.maxPrice")} />
              </View>
            </View>
            {errors.price && <Text style={styles.error}>{errors.price === "invalid" ? t("crops.filters.errors.priceInvalid") : t("crops.filters.errors.priceOrder")}</Text>}

            <Text style={styles.sectionLabel}>{t("crops.filters.harvestDate")}</Text>
            <View style={styles.pair}>
              <DateField label={t("crops.filters.from")} value={draft.harvestFrom} onChange={(next) => set({ harvestFrom: next })} />
              <View style={{ width: 12 }} />
              <DateField label={t("crops.filters.to")} value={draft.harvestTo} onChange={(next) => set({ harvestTo: next })} />
            </View>
            {errors.harvest && <Text style={styles.error}>{errors.harvest === "invalid" ? t("crops.filters.errors.harvestInvalid") : t("crops.filters.errors.harvestOrder")}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.6 }]}
              onPress={() => {
                setDraft(EMPTY_FILTERS);
                onClear();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>{t("crops.browse.clearFilters")}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, invalid && styles.primaryButtonDisabled, pressed && { opacity: 0.6 }]}
              disabled={invalid}
              onPress={() => onApply(draft)}
              accessibilityRole="button"
              accessibilityState={{ disabled: invalid }}
            >
              <Text style={styles.primaryButtonText}>{t("crops.browse.showResults")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  backdropTap: { flex: 1 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "85%" },
  sheetContent: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, marginBottom: 8 },
  switchLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, marginRight: 12 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: 12, marginBottom: 6 },
  pair: { flexDirection: "row" },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surface, minHeight: 44 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateButton: { flex: 1, borderWidth: 1, borderColor: colors.divider, borderRadius: 8, paddingHorizontal: 12, minHeight: 44, justifyContent: "center", backgroundColor: colors.surface },
  dateText: { fontSize: 15, color: colors.textPrimary },
  clearDate: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearDateText: { fontSize: 16, color: colors.textSecondary },
  error: { color: colors.error, fontSize: 12, marginTop: 6 },
  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  secondaryButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: colors.primary, fontWeight: "600" },
  primaryButton: { flex: 1, minHeight: 44, backgroundColor: colors.primary, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: colors.primaryContrastText, fontWeight: "600" },
});
