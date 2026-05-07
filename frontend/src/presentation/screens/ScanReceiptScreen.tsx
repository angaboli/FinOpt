import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useReceiptsStore } from "@/application/receipts/receiptsStore";
import type { ReceiptItem, ScanResult } from "@/domain/receipts/types";
import type { RootStackParamList } from "../../../App";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ScanReceipt">;

type Step = "capture" | "review" | "done";

const t = finoptTheme;

export function ScanReceiptScreen({ navigation }: Props) {
  const scan = useReceiptsStore((s) => s.scan);
  const save = useReceiptsStore((s) => s.save);
  const isScanning = useReceiptsStore((s) => s.isScanning);
  const isLoading = useReceiptsStore((s) => s.isLoading);

  const [step, setStep] = useState<Step>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [merchant, setMerchant] = useState("");
  const [total, setTotal] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);

  async function pickImage(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission refusée", "Accès à la caméra/galerie requis.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.7,
          mediaTypes: ["images"],
        })
      : await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.7,
          mediaTypes: ["images"],
        });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Erreur", "Impossible de lire l'image.");
      return;
    }

    setImageUri(asset.uri);
    const mimeType = asset.mimeType ?? "image/jpeg";
    try {
      const parsed = await scan(asset.base64, mimeType);
      setScanResult(parsed);
      setMerchant(parsed.merchant ?? "");
      setTotal(parsed.total != null ? String(parsed.total) : "");
      setDate(parsed.date ?? "");
      setItems(parsed.items);
      setStep("review");
    } catch {
      Alert.alert("Analyse échouée", "Impossible d'analyser le ticket. Clé API non configurée?");
    }
  }

  async function handleSave() {
    try {
      await save(
        merchant || null,
        total ? parseFloat(total) : null,
        date || null,
        items,
        null,
      );
      setStep("done");
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder le ticket.");
    }
  }

  if (step === "done") {
    return (
      <View style={styles.container}>
        <View style={styles.doneCard}>
          <Text style={styles.doneIcon}>✓</Text>
          <Text style={styles.doneTitle}>Ticket enregistré !</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === "capture") {
    return (
      <View style={styles.container}>
        {isScanning && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={t.colors.white} />
            <Text style={styles.overlayText}>Analyse en cours…</Text>
          </View>
        )}
        <View style={styles.captureCard}>
          <Text style={styles.sectionTitle}>Scanner un ticket de caisse</Text>
          <Text style={styles.hint}>
            Prenez une photo de votre ticket ou choisissez une image depuis la galerie.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnCamera]}
            onPress={() => pickImage(true)}
            disabled={isScanning}
          >
            <Text style={styles.btnText}>📷  Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => pickImage(false)}
            disabled={isScanning}
          >
            <Text style={[styles.btnText, styles.btnTextSecondary]}>🖼  Choisir depuis la galerie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}
      <Text style={styles.sectionTitle}>Vérifier les informations</Text>

      <Text style={styles.label}>Marchand</Text>
      <TextInput
        style={styles.input}
        value={merchant}
        onChangeText={setMerchant}
        placeholder="Nom du marchand"
        placeholderTextColor={t.colors.gray500}
      />

      <Text style={styles.label}>Total (€)</Text>
      <TextInput
        style={styles.input}
        value={total}
        onChangeText={setTotal}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={t.colors.gray500}
      />

      <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-05-06"
        placeholderTextColor={t.colors.gray500}
      />

      <Text style={styles.label}>Articles ({items.length})</Text>
      {items.map((item, idx) => (
        <View key={idx} style={styles.itemRow}>
          <TextInput
            style={[styles.input, styles.itemName]}
            value={item.name}
            onChangeText={(v) =>
              setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, name: v } : it)))
            }
          />
          <TextInput
            style={[styles.input, styles.itemAmount]}
            value={String(item.amount)}
            keyboardType="decimal-pad"
            onChangeText={(v) =>
              setItems((prev) =>
                prev.map((it, i) => (i === idx ? { ...it, amount: parseFloat(v) || 0 } : it)),
              )
            }
          />
          <TouchableOpacity
            onPress={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
          >
            <Text style={styles.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addItemBtn}
        onPress={() => setItems((prev) => [...prev, { name: "", amount: 0 }])}
      >
        <Text style={styles.addItemText}>+ Ajouter un article</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, isLoading && styles.btnDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={t.colors.white} />
        ) : (
          <Text style={styles.btnText}>Enregistrer</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnGhost} onPress={() => setStep("capture")}>
        <Text style={styles.btnGhostText}>← Reprendre une photo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: t.colors.background },
  container: { flex: 1, backgroundColor: t.colors.background, justifyContent: "center", alignItems: "center" },
  scroll: { padding: t.spacing.lg, paddingBottom: 40 },
  captureCard: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    padding: t.spacing.xl,
    width: "100%",
    gap: t.spacing.md,
    ...t.shadow.card,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  overlayText: { color: t.colors.white, marginTop: t.spacing.md, fontSize: 16 },
  preview: { width: "100%", height: 200, borderRadius: t.radius.lg, marginBottom: t.spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: t.colors.foreground, marginBottom: t.spacing.sm },
  hint: { fontSize: 14, color: t.colors.gray500, marginBottom: t.spacing.sm },
  label: { fontSize: 13, fontWeight: "600", color: t.colors.gray600, marginBottom: 4, marginTop: t.spacing.sm },
  input: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    fontSize: 15,
    color: t.colors.foreground,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm, marginBottom: t.spacing.sm },
  itemName: { flex: 1 },
  itemAmount: { width: 80 },
  removeBtn: { fontSize: 18, color: t.colors.danger, paddingHorizontal: 4 },
  addItemBtn: { marginVertical: t.spacing.sm },
  addItemText: { color: t.colors.primary, fontWeight: "600", fontSize: 14 },
  btn: {
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.lg,
    paddingVertical: t.spacing.md,
    alignItems: "center",
    marginTop: t.spacing.md,
  },
  btnCamera: { marginTop: 0 },
  btnSecondary: {
    backgroundColor: t.colors.muted,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: t.colors.white, fontWeight: "700", fontSize: 16 },
  btnTextSecondary: { color: t.colors.foreground },
  btnGhost: { alignItems: "center", marginTop: t.spacing.sm },
  btnGhostText: { color: t.colors.gray500, fontSize: 14 },
  doneCard: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    padding: t.spacing.xxl,
    alignItems: "center",
    gap: t.spacing.md,
    ...t.shadow.card,
  },
  doneIcon: { fontSize: 48 },
  doneTitle: { fontSize: 20, fontWeight: "700", color: t.colors.primary },
});
