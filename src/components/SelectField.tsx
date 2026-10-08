import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { useT } from "@/i18n/useT";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

// A button that opens a modal list — extracted from the original AI Crop
// Doctor screen (crop/language pickers) since the Farmer listing form needs
// the same "select" interaction for category. Avoids pulling in a picker
// dependency for what's a handful of options in each use.
export const SelectField = ({ label, value, options, onSelect, placeholder }: SelectFieldProps) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? t("common.select");

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={({ pressed }) => [styles.selectButton, pressed && { opacity: 0.6 }]} onPress={() => setOpen(true)}>
        <Text style={styles.selectButtonText} numberOfLines={1}>
          {selectedLabel}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={({ pressed }) => [styles.modalBackdrop, pressed && { opacity: 0.6 }]} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.modalOption, pressed && { opacity: 0.6 }]}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  selectButtonText: { color: colors.textPrimary, fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 12, maxHeight: 400, overflow: "hidden" },
  modalOption: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  modalOptionText: { fontSize: 15, color: colors.textPrimary },
});
