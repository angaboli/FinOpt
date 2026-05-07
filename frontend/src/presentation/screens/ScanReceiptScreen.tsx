import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/application/alert/alertStore";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useReceiptsStore } from "@/application/receipts/receiptsStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import { categoryIcon } from "@/domain/categories/categoryIcons";
import type { ReceiptItem } from "@/domain/receipts/types";
import { transactionsApi } from "@/infrastructure/api/transactionsApi";
import type { RootStackParamList } from "../../../App";
import { DatePickerButton } from "@/presentation/components/DatePickerButton";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ScanReceipt">;
type Step = "capture" | "review" | "done";

const t = finoptTheme;
const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function ScanReceiptScreen({ navigation }: Props) {
  const scan = useReceiptsStore((s) => s.scan);
  const save = useReceiptsStore((s) => s.save);
  const isScanning = useReceiptsStore((s) => s.isScanning);
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const categories = useCategoriesStore((s) => s.categories);
  const loadTransactions = useTransactionsStore((s) => s.loadTransactions);

  const [step, setStep] = useState<Step>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [accountId, setAccountId] = useState(selectedAccountId ?? accounts[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);

  const defaultCategoryId = categories[0]?.id ?? "";
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  async function pickImage(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert("Permission refusée", "Accès à la caméra/galerie requis.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, mediaTypes: ["images"] })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ["images"] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      showAlert("Erreur", "Impossible de lire l'image.");
      return;
    }
    setImageUri(asset.uri);
    try {
      const parsed = await scan(asset.base64, asset.mimeType ?? "image/jpeg");
      setMerchant(parsed.merchant ?? "");
      setDate(parsed.date ?? "");
      setItems(
        (parsed.items ?? []).map((i) => ({
          name: i.name,
          amount: i.amount,
          categoryId: defaultCategoryId,
        })),
      );
      setStep("review");
    } catch {
      showAlert("Analyse échouée", "Impossible d'analyser le ticket. Clé API non configurée ?");
    }
  }

  function updateItem(idx: number, field: keyof ReceiptItem, value: string | number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", amount: 0, categoryId: defaultCategoryId }]);
  }

  async function handleSave() {
    const validItems = items.filter((i) => (Number(i.amount) || 0) > 0 && i.name.trim());
    if (validItems.length === 0) {
      showAlert("Aucun article", "Ajoutez au moins un article avec un nom et un montant.");
      return;
    }
    if (!accountId) {
      showAlert("Compte requis", "Sélectionnez un compte à débiter.");
      return;
    }
    setIsSaving(true);
    const today = date || new Date().toISOString().slice(0, 10);
    let count = 0;
    const note = merchant ? `Ticket: ${merchant}` : null;

    for (const item of validItems) {
      try {
        await transactionsApi.create({
          accountId,
          categoryId: item.categoryId || defaultCategoryId,
          title: item.name.trim(),
          amount: Number(item.amount),
          transactionType: "EXPENSE",
          date: today,
          note,
        });
        count++;
      } catch {
        // continue other items
      }
    }

    try {
      await save(merchant || null, total || null, date || null, validItems, null);
    } catch {
      // receipt save is non-blocking
    }

    await Promise.all([loadTransactions(), loadAccounts()]);
    setSavedCount(count);
    setSavedTotal(validItems.reduce((s, i) => s + Number(i.amount), 0));
    setIsSaving(false);
    setStep("done");
  }

  if (step === "done") {
    return (
      <View style={styles.center}>
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={64} color={t.colors.primary} />
          <Text style={styles.doneTitle}>{savedCount} transaction{savedCount > 1 ? "s" : ""} enregistrée{savedCount > 1 ? "s" : ""}</Text>
          <Text style={styles.doneSub}>
            {fmt.format(savedTotal)} débité{savedCount > 1 ? "s" : ""}{selectedAccount ? ` de ${selectedAccount.name}` : ""}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === "capture") {
    return (
      <View style={styles.center}>
        {isScanning && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={t.colors.white} />
            <Text style={styles.overlayText}>Analyse en cours…</Text>
          </View>
        )}
        <View style={styles.captureCard}>
          <Text style={styles.sectionTitle}>Scanner un ticket de caisse</Text>
          <Text style={styles.hint}>Prenez une photo ou choisissez une image depuis la galerie.</Text>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => void pickImage(true)} disabled={isScanning}>
            <Ionicons name="camera-outline" size={20} color={t.colors.white} />
            <Text style={styles.btnText}>Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => void pickImage(false)} disabled={isScanning}>
            <Ionicons name="image-outline" size={20} color={t.colors.foreground} />
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />}

      {/* Account */}
      <Text style={styles.label}>Compte à débiter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {accounts.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.chip, accountId === a.id && styles.chipActive]}
            onPress={() => setAccountId(a.id)}
          >
            <View style={[styles.chipDot, { backgroundColor: a.color }]} />
            <Text style={[styles.chipText, accountId === a.id && styles.chipTextActive]}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Merchant + Date */}
      <View style={styles.merchantRow}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Marchand</Text>
          <TextInput style={styles.input} value={merchant} onChangeText={setMerchant} placeholder="Carrefour..." placeholderTextColor={t.colors.gray500} />
        </View>
      </View>
      <View>
        <Text style={styles.label}>Date</Text>
        <DatePickerButton value={date || new Date().toISOString().slice(0, 10)} onChange={setDate} />
      </View>

      {/* Items */}
      <View style={styles.itemsHeader}>
        <Text style={styles.sectionTitle}>Articles ({items.length})</Text>
        <Text style={styles.totalLabel}>Total : {fmt.format(total)}</Text>
      </View>

      {items.map((item, idx) => (
        <View key={idx} style={styles.itemCard}>
          <View style={styles.itemTop}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={item.name}
              onChangeText={(v) => updateItem(idx, "name", v)}
              placeholder="Nom de l'article"
              placeholderTextColor={t.colors.gray500}
            />
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={String(item.amount)}
              onChangeText={(v) => updateItem(idx, "amount", parseFloat(v.replace(",", ".")) || 0)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={t.colors.gray500}
            />
            <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={22} color={t.colors.danger} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, styles.chipSmall, item.categoryId === c.id && { backgroundColor: c.color, borderColor: c.color }]}
                onPress={() => updateItem(idx, "categoryId", c.id)}
              >
                <Ionicons
                  name={categoryIcon(c.name) as any}
                  size={11}
                  color={item.categoryId === c.id ? t.colors.white : c.color}
                />
                <Text style={[styles.chipText, styles.chipTextSmall, item.categoryId === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}

      <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
        <Ionicons name="add-circle-outline" size={20} color={t.colors.primary} />
        <Text style={styles.addItemText}>Ajouter un article</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, styles.saveBtn, isSaving && styles.btnDisabled]}
        onPress={() => void handleSave()}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={t.colors.white} />
        ) : (
          <>
            <Ionicons name="checkmark-done-outline" size={20} color={t.colors.white} />
            <Text style={styles.btnText}>Enregistrer {items.filter(i => i.amount > 0).length} transaction{items.filter(i => i.amount > 0).length > 1 ? "s" : ""}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnGhost} onPress={() => setStep("capture")}>
        <Ionicons name="arrow-back-outline" size={16} color={t.colors.gray500} />
        <Text style={styles.btnGhostText}>Reprendre une photo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: t.colors.background },
  scroll: { padding: t.spacing.lg, paddingBottom: 40, gap: t.spacing.md },
  center: { flex: 1, backgroundColor: t.colors.background, justifyContent: "center", alignItems: "center", padding: t.spacing.lg },
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  overlayText: { color: t.colors.white, marginTop: t.spacing.md, fontSize: 16 },
  captureCard: {
    backgroundColor: t.colors.card, borderRadius: t.radius.xl,
    padding: t.spacing.xl, width: "100%", gap: t.spacing.md, ...t.shadow.card,
  },
  preview: { width: "100%", height: 180, borderRadius: t.radius.lg },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: t.colors.foreground },
  hint: { fontSize: 13, color: t.colors.gray500 },
  label: { fontSize: 12, fontWeight: "600", color: t.colors.gray600, marginBottom: 4 },
  input: {
    backgroundColor: t.colors.card, borderRadius: t.radius.md, borderWidth: 1,
    borderColor: t.colors.border, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm,
    fontSize: 14, color: t.colors.foreground, minHeight: 42,
  },
  merchantRow: { flexDirection: "row", gap: t.spacing.md },
  flex1: { flex: 1 },
  chipRow: { flexDirection: "row" as any },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs,
    borderRadius: t.radius.xl, backgroundColor: t.colors.muted,
    marginRight: t.spacing.xs, borderWidth: 1, borderColor: "transparent",
  },
  chipSmall: { paddingHorizontal: t.spacing.sm, paddingVertical: 2 },
  chipActive: { backgroundColor: t.colors.primaryLight, borderColor: t.colors.primary },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, color: t.colors.foreground },
  chipTextSmall: { fontSize: 11 },
  chipTextActive: { color: t.colors.white, fontWeight: "700" },
  itemsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 15, fontWeight: "800", color: t.colors.primary },
  itemCard: {
    backgroundColor: t.colors.card, borderRadius: t.radius.lg, borderWidth: 1,
    borderColor: t.colors.border, padding: t.spacing.md, gap: t.spacing.sm, ...t.shadow.card,
  },
  itemTop: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
  amountInput: { width: 80 },
  removeBtn: { padding: 4 },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  addItemText: { color: t.colors.primary, fontWeight: "600", fontSize: 14 },
  btn: {
    alignItems: "center", borderRadius: t.radius.lg, flexDirection: "row",
    gap: t.spacing.sm, justifyContent: "center", paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
  },
  btnPrimary: { backgroundColor: t.colors.primary, ...t.shadow.action },
  btnSecondary: { backgroundColor: t.colors.muted },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: t.colors.white, fontWeight: "700", fontSize: 15 },
  btnTextSecondary: { color: t.colors.foreground },
  saveBtn: { marginTop: t.spacing.sm },
  btnGhost: { alignItems: "center", flexDirection: "row", gap: t.spacing.xs, justifyContent: "center" },
  btnGhostText: { color: t.colors.gray500, fontSize: 14 },
  doneCard: {
    backgroundColor: t.colors.card, borderRadius: t.radius.xl,
    padding: t.spacing.xxl, alignItems: "center", gap: t.spacing.md, ...t.shadow.card,
  },
  doneTitle: { fontSize: 20, fontWeight: "700", color: t.colors.primary, textAlign: "center" },
  doneSub: { fontSize: 14, color: t.colors.gray600, textAlign: "center" },
});
