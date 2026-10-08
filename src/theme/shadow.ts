import { Platform } from "react-native";
import { colors } from "./colors";

/** One consistent card elevation (iOS shadow / Android elevation) — no card in this app had any shadow at all before, just a flat border. */
export const cardShadow = Platform.select({
  ios: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  android: {
    elevation: 3,
  },
  default: {},
});
