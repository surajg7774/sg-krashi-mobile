import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { addressService, ADDRESSES_QUERY_KEY } from "./addressService";
import type { Address, AddressPayload } from "./types";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";

type Navigation = NativeStackNavigationProp<MainStackParamList, "AddressSelect">;

const AddressCard = ({ address, selected, onSelect }: { address: Address; selected: boolean; onSelect: () => void }) => (
  <Pressable style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && { opacity: 0.6 }]} onPress={onSelect}>
    <Text style={styles.cardLine}>{address.line1}</Text>
    {address.line2 && <Text style={styles.cardLine}>{address.line2}</Text>}
    <Text style={styles.cardLine}>
      {address.city}, {address.state} - {address.pincode}
    </Text>
    {address.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
  </Pressable>
);

const EMPTY_FORM: AddressPayload = { line1: "", line2: "", city: "", state: "", pincode: "" };

export const AddressSelectScreen = () => {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressPayload>(EMPTY_FORM);

  const addressesQuery = useQuery({ queryKey: ADDRESSES_QUERY_KEY, queryFn: addressService.listAddresses });

  const createMutation = useMutation({
    mutationFn: addressService.createAddress,
    onSuccess: (newAddress) => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      setSelectedId(newAddress.id);
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const isFormValid = form.line1.trim() && form.city.trim() && form.state.trim() && form.pincode.trim();

  if (addressesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (addressesQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load your addresses." onRetry={() => void addressesQuery.refetch()} />
      </View>
    );
  }

  const addresses = addressesQuery.data ?? [];

  return (
    <View style={styles.container}>
      {addresses.length > 0 && !showForm && (
        <FlatList
          data={addresses}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => (
            <AddressCard address={item} selected={selectedId === item.id} onSelect={() => setSelectedId(item.id)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {addresses.length === 0 && !showForm && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>You don't have any saved addresses yet.</Text>
        </View>
      )}

      {!showForm && (
        <Pressable style={({ pressed }) => [styles.addLink, pressed && { opacity: 0.6 }]} onPress={() => setShowForm(true)}>
          <Text style={styles.addLinkText}>+ Add a new address</Text>
        </Pressable>
      )}

      {showForm && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.input}
            placeholder="Address line 1"
            placeholderTextColor={colors.textSecondary}
            value={form.line1}
            onChangeText={(v) => setForm((f) => ({ ...f, line1: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Address line 2 (optional)"
            placeholderTextColor={colors.textSecondary}
            value={form.line2 ?? ""}
            onChangeText={(v) => setForm((f) => ({ ...f, line2: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            value={form.city}
            onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor={colors.textSecondary}
            value={form.state}
            onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Pincode"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            value={form.pincode}
            onChangeText={(v) => setForm((f) => ({ ...f, pincode: v }))}
          />

          {createMutation.isError && <Text style={styles.errorText}>Could not save this address. Please try again.</Text>}

          <View style={styles.formButtonRow}>
            <Pressable style={({ pressed }) => [styles.formCancelButton, pressed && { opacity: 0.6 }]} onPress={() => setShowForm(false)}>
              <Text style={styles.formCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.formSaveButton, (!isFormValid || createMutation.isPending) && styles.disabledButton, pressed && { opacity: 0.6 }]}
              disabled={!isFormValid || createMutation.isPending}
              onPress={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color={colors.primaryContrastText} />
              ) : (
                <Text style={styles.formSaveText}>Save Address</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}

      {!showForm && (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.continueButton, !selectedId && styles.disabledButton, pressed && { opacity: 0.6 }]}
            disabled={!selectedId}
            onPress={() => navigation.navigate("Checkout", { addressId: selectedId! })}
          >
            <Text style={styles.continueButtonText}>Continue to Review</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  list: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  cardSelected: { borderColor: colors.primary, borderWidth: 2 },
  cardLine: { fontSize: 14, color: colors.textPrimary },
  defaultBadge: { fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: "600" },
  addLink: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, justifyContent: "center" },
  addLinkText: { color: colors.primary, fontWeight: "600" },
  formContainer: { flex: 1, paddingHorizontal: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  errorText: { color: colors.error, marginBottom: 10 },
  formButtonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 24 },
  formCancelButton: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44, justifyContent: "center" },
  formCancelText: { color: colors.textSecondary },
  formSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    justifyContent: "center",
  },
  formSaveText: { color: colors.primaryContrastText, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueButtonText: { color: colors.primaryContrastText, fontSize: 16, fontWeight: "600" },
});
