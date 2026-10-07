import { useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line, Polyline, Rect } from "react-native-svg";
import { colors } from "@/theme/colors";
import { columnCenters, scaleLinear, toPolylinePoints } from "@/shared/chartMath";
import type { DailyForecastPoint } from "./types";
import type { Lang } from "@/i18n";
import { weekdayShort } from "@/i18n/format";
import { useT } from "@/i18n/useT";

const CHART_HEIGHT = 150;
const PLOT_PAD = 8;

// "YYYY-MM-DD" is the location's own calendar day — built as a local date so
// it never shifts a day in the viewer's timezone (new Date("2026-10-05") is UTC).
const weekdayOf = (isoDate: string, lang: Lang): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return weekdayShort(new Date(year, month - 1, day).getDay(), lang);
};

interface WeatherForecastChartProps {
  daily: DailyForecastPoint[];
}

/**
 * Max/min temperature (lines) and rain (bars) over the 7-day forecast,
 * drawn with react-native-svg from the server's real `daily` array — same
 * encoding and colors as the web app's WeatherForecastTrend. No tooltips on
 * touch, so each day's high/low are printed under its weekday instead.
 */
export const WeatherForecastChart = ({ daily }: WeatherForecastChartProps) => {
  const [width, setWidth] = useState(0);
  const { t, lang } = useT();
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.floor(event.nativeEvent.layout.width));

  const highs = daily.map((d) => d.tempMaxC);
  const lows = daily.map((d) => d.tempMinC);
  const rains = daily.map((d) => d.rainMm);
  const summary = t("weather.chart.summary", {
    days: daily.length,
    highMin: Math.round(Math.min(...highs)),
    highMax: Math.round(Math.max(...highs)),
    lowMin: Math.round(Math.min(...lows)),
    lowMax: Math.round(Math.max(...lows)),
    rainMax: Math.max(...rains).toFixed(1),
  });

  const tempMin = Math.min(...lows) - 2;
  const tempMax = Math.max(...highs) + 2;
  // Rain bars are squeezed into the bottom third (axis max = 3x the data, at
  // least 10 mm) so they never sit on top of the temperature lines.
  const rainAxisMax = Math.max(Math.max(...rains) * 3, 10);
  const plotHeight = CHART_HEIGHT - 2 * PLOT_PAD;

  const xs = columnCenters(daily.length, width);
  const yFor = (temp: number) => scaleLinear(temp, tempMin, tempMax, CHART_HEIGHT - PLOT_PAD, PLOT_PAD);
  const highYs = highs.map(yFor);
  const lowYs = lows.map(yFor);
  const barWidth = Math.min(18, (width / daily.length) * 0.5);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <View style={styles.plot} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line x1={0} y1={CHART_HEIGHT - 0.5} x2={width} y2={CHART_HEIGHT - 0.5} stroke={colors.divider} strokeWidth={1} />
            {rains.map((rain, i) => {
              const barHeight = scaleLinear(rain, 0, rainAxisMax, 0, plotHeight);
              return (
                <Rect
                  key={`rain-${i}`}
                  x={xs[i] - barWidth / 2}
                  y={CHART_HEIGHT - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill={colors.primary}
                  fillOpacity={0.4}
                />
              );
            })}
            <Polyline points={toPolylinePoints(xs, highYs)} fill="none" stroke={colors.warning} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <Polyline points={toPolylinePoints(xs, lowYs)} fill="none" stroke={colors.info} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {xs.map((x, i) => (
              <Circle key={`hi-${i}`} cx={x} cy={highYs[i]} r={3} fill={colors.surface} stroke={colors.warning} strokeWidth={1.5} />
            ))}
            {xs.map((x, i) => (
              <Circle key={`lo-${i}`} cx={x} cy={lowYs[i]} r={3} fill={colors.surface} stroke={colors.info} strokeWidth={1.5} />
            ))}
          </Svg>
        )}
      </View>

      <View style={styles.labelRow}>
        {daily.map((d) => (
          <View key={d.date} style={styles.labelCell}>
            <Text style={styles.weekday}>{weekdayOf(d.date, lang)}</Text>
            <Text style={[styles.temp, { color: colors.warning }]}>{Math.round(d.tempMaxC)}°</Text>
            <Text style={[styles.temp, { color: colors.info }]}>{Math.round(d.tempMinC)}°</Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.warning} label={t("weather.chart.high")} shape="line" />
        <LegendItem color={colors.info} label={t("weather.chart.low")} shape="line" />
        <LegendItem color={colors.primary} label={t("weather.chart.rain")} shape="bar" />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label, shape }: { color: string; label: string; shape: "line" | "bar" }) => (
  <View style={styles.legendItem}>
    <View
      style={
        shape === "line"
          ? { width: 16, height: 3, borderRadius: 2, backgroundColor: color }
          : { width: 10, height: 10, borderRadius: 2, backgroundColor: color, opacity: 0.55 }
      }
    />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  plot: { height: CHART_HEIGHT, width: "100%" },
  labelRow: { flexDirection: "row", marginTop: 6 },
  labelCell: { flex: 1, alignItems: "center" },
  weekday: { fontSize: 11, color: colors.textSecondary },
  temp: { fontSize: 11, fontWeight: "700", marginTop: 1 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 11, color: colors.textSecondary },
});
