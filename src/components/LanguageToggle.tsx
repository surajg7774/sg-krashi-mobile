import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Lang, MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";
import { colors } from "@/theme/colors";

// Each language is named in its own script ("English", "हिन्दी"), whatever the current language, so someone who
// cannot read the other one still finds theirs.
const OPTIONS: { lang: Lang; label: MessageKey }[] = [
  { lang: "en", label: "language.english" },
  { lang: "hi", label: "language.hindi" },
];

interface Props {
  /** Smaller pills for the Login screen's corner; the Profile screen uses the full-width version. */
  compact?: boolean;
}

/** Two-option switch (a radio group for screen readers). The choice is saved and survives restarts and logout. */
export const LanguageToggle = ({ compact = false }: Props) => {
  const { t, lang, setLanguage } = useT();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t("language.switchTo")}
      style={[styles.group, compact ? styles.groupCompact : styles.groupFull]}
    >
      {OPTIONS.map((option) => {
        const selected = option.lang === lang;
        return (
          <TouchableOpacity
            key={option.lang}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            accessibilityLabel={t(option.label)}
            onPress={() => {
              if (!selected) void setLanguage(option.lang);
            }}
            hitSlop={compact ? { top: 6, bottom: 6, left: 4, right: 4 } : undefined}
            style={[styles.option, compact ? styles.optionCompact : styles.optionFull, selected && styles.optionSelected]}
          >
            <Text style={[styles.label, compact && styles.labelCompact, selected && styles.labelSelected]}>{t(option.label)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  groupFull: {
    alignSelf: "stretch",
  },
  groupCompact: {
    alignSelf: "flex-end",
  },
  option: {
    alignItems: "center",
    justifyContent: "center",
  },
  optionFull: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionCompact: {
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  labelCompact: {
    fontSize: 13,
  },
  labelSelected: {
    color: colors.primaryContrastText,
  },
});
