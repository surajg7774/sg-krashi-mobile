import { useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import type { MessageKey } from "@/i18n";
import { scriptLineHeight } from "@/i18n/layout";
import { useT } from "@/i18n/useT";

export interface OnboardingScreenProps {
  onDone: () => void;
}

interface Slide {
  id: string;
  emoji: string;
  title: MessageKey;
  description: MessageKey;
}

// Describes the app's real, working features only — confirmed against
// TabNavigator.tsx/HomeScreen.tsx's actual nav destinations. The Crop
// Marketplace is a real screen now (Home tile and the Store shortcut), so it
// has its own slide. Farmer tools (listings/payouts) aren't given their own slide since
// they're role-gated and only relevant post-registration, not to every
// first-time opener.
const SLIDES: Slide[] = [
  { id: "welcome", emoji: "🌱", title: "onboarding.welcomeTitle", description: "onboarding.welcomeBody" },
  { id: "store", emoji: "🏪", title: "onboarding.storeTitle", description: "onboarding.storeBody" },
  { id: "crops", emoji: "🌾", title: "onboarding.cropsTitle", description: "onboarding.cropsBody" },
  { id: "doctor", emoji: "🌿", title: "onboarding.doctorTitle", description: "onboarding.doctorBody" },
  { id: "weather", emoji: "☀️", title: "onboarding.weatherTitle", description: "onboarding.weatherBody" },
];

const { width } = Dimensions.get("window");

/**
 * Shown once per install, before Login — RootNavigator gates this behind
 * useOnboardingStatus()'s AsyncStorage flag. Plain horizontal ScrollView +
 * pagingEnabled, not a carousel library — no such dependency exists in
 * this app and a 4-slide intro doesn't need one.
 */
export const OnboardingScreen = ({ onDone }: OnboardingScreenProps) => {
  const insets = useSafeAreaInsets();
  const { t, lang } = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const goToNext = () => {
    if (isLastSlide) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
  };

  return (
    <View style={styles.container}>
      {!isLastSlide && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={onDone}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{t(slide.title)}</Text>
            <Text style={[styles.description, { lineHeight: scriptLineHeight(lang, 15, 22) }]}>{t(slide.description)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, index) => (
            <View key={slide.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
          <Text style={styles.nextButtonText}>{isLastSlide ? t("onboarding.getStarted") : t("common.next")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grey300,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextButtonText: {
    color: colors.primaryContrastText,
    fontSize: 16,
    fontWeight: "600",
  },
});
