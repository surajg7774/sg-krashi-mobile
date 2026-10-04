import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { colors } from "@/theme/colors";
import { useDebouncedValue } from "@/shared/useDebouncedValue";
import { ErrorState } from "@/components/ErrorState";
import { weatherService } from "./weatherService";
import { useWeatherLocation } from "./useWeatherLocation";
import { KHANDWA_SUGGESTION, type GeocodingResult } from "./types";

const MIN_SEARCH_LENGTH = 2;

export const WeatherScreen = () => {
  const {
    location,
    needsManualPrompt,
    isResolving,
    setManualLocation,
    useCurrentLocation,
    retryGeolocation,
  } = useWeatherLocation();
  const [searchInput, setSearchInput] = useState("");
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const search = useDebouncedValue(searchInput, 300);

  const searchQuery = useQuery({
    queryKey: ["weather-geocode", search],
    queryFn: () => weatherService.searchLocations(search),
    enabled: search.trim().length >= MIN_SEARCH_LENGTH,
  });

  const weatherQuery = useQuery({
    queryKey: ["weather-current", location?.latitude, location?.longitude],
    queryFn: () => weatherService.getCurrentWeather(location!.latitude, location!.longitude),
    enabled: location !== null,
  });

  const handleSelectLocation = (result: GeocodingResult) => {
    setManualLocation({ latitude: result.latitude, longitude: result.longitude, label: formatLabel(result) });
    setSearchInput("");
    setHasSearchedOnce(true);
  };

  const showKhandwaSuggestion = needsManualPrompt && !hasSearchedOnce && searchInput.trim().length === 0;
  const showResults = search.trim().length >= MIN_SEARCH_LENGTH;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Weather</Text>
      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search a city or place…"
          placeholderTextColor={colors.textSecondary}
          value={searchInput}
          onChangeText={(text) => {
            setSearchInput(text);
            setHasSearchedOnce(true);
          }}
        />
        <Pressable style={styles.currentLocationButton} onPress={() => void retryGeolocation()}>
          <Text style={styles.currentLocationButtonText}>📍</Text>
        </Pressable>
      </View>

      {showResults && searchQuery.isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}

      {showResults && searchQuery.data && searchQuery.data.length > 0 && (
        <View style={styles.resultsList}>
          {searchQuery.data.map((result, index) => (
            <Pressable
              key={`${result.latitude}-${result.longitude}-${index}`}
              style={styles.resultRow}
              onPress={() => handleSelectLocation(result)}
            >
              <Text style={styles.resultText}>{formatLabel(result)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {showResults && searchQuery.data && searchQuery.data.length === 0 && !searchQuery.isLoading && (
        <Text style={styles.emptyResultsText}>No places found.</Text>
      )}

      {showKhandwaSuggestion && (
        <Pressable
          style={styles.suggestionChip}
          onPress={() => handleSelectLocation(KHANDWA_SUGGESTION)}
          hitSlop={{ top: 7, bottom: 7 }}
        >
          <Text style={styles.suggestionChipText}>Try Khandwa, Madhya Pradesh</Text>
        </Pressable>
      )}

      {location && (
        <Pressable onPress={useCurrentLocation} hitSlop={{ top: 12, bottom: 12 }}>
          <Text style={styles.locationLabel}>
            {location.source === "geolocation" ? "📍 " : "📌 "}
            {location.label}
            {location.source === "manual" ? " · Use current location" : ""}
          </Text>
        </Pressable>
      )}

      <View style={styles.divider} />

      {isResolving && !location && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.helperText}>Finding your location…</Text>
        </View>
      )}

      {needsManualPrompt && !location && (
        <Text style={styles.helperText}>
          Couldn't access your location. Search for a city above to see its weather.
        </Text>
      )}

      {location && weatherQuery.isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {location && weatherQuery.isError && (
        <ErrorState message="Could not load weather for this location." onRetry={() => void weatherQuery.refetch()} />
      )}

      {location && weatherQuery.data && (
        <View style={styles.card}>
          <Text style={styles.temperature}>{Math.round(weatherQuery.data.temperatureCelsius)}°C</Text>
          <Text style={styles.forecastSummary}>{weatherQuery.data.forecastSummary}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statValue}>{Math.round(weatherQuery.data.humidityPercent)}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Recent rainfall</Text>
              <Text style={styles.statValue}>{weatherQuery.data.recentRainfallMm.toFixed(1)} mm</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tonight's low</Text>
              <Text style={styles.statValue}>{Math.round(weatherQuery.data.forecastMinTempCelsius)}°C</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Next 24h rain</Text>
              <Text style={styles.statValue}>{weatherQuery.data.forecastPrecipitationNext24hMm.toFixed(1)} mm</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const formatLabel = (result: GeocodingResult) =>
  [result.name, result.admin1, result.country].filter(Boolean).join(", ");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 20 },
  screenTitle: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  currentLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationButtonText: { fontSize: 18 },
  resultsList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  resultText: { fontSize: 14, color: colors.textPrimary },
  emptyResultsText: { marginTop: 8, color: colors.textSecondary, fontSize: 13 },
  suggestionChip: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  suggestionChipText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  locationLabel: { marginTop: 14, fontSize: 14, color: colors.textPrimary, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 16 },
  centered: { alignItems: "center", paddingVertical: 24 },
  helperText: { color: colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 20,
    alignItems: "center",
  },
  temperature: { fontSize: 42, fontWeight: "700", color: colors.textPrimary },
  forecastSummary: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
});
