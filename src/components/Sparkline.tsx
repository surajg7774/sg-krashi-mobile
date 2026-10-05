import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { colors } from "@/theme/colors";
import { evenlySpaced, scaleLinear, toPolylinePoints } from "@/shared/chartMath";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

const PAD = 3;

/**
 * A bare trend line (no axes, labels or interaction) over `values`, scaled
 * to its own min..max so a small move still reads as a move. Needs 2+ values
 * — callers apply their own "enough data" guard before getting here.
 */
export const Sparkline = ({ values, width = 120, height = 40, color = colors.primary }: SparklineProps) => {
  if (values.length < 2) {
    return null;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const xs = evenlySpaced(values.length, width, PAD);
  const ys = values.map((v) => scaleLinear(v, min, max, height - PAD, PAD));

  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={width} height={height}>
        <Polyline
          points={toPolylinePoints(xs, ys)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
