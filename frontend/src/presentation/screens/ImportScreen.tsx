import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useBankImportsStore } from "@/application/bankImports/bankImportsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import type { ParsedRow } from "@/domain/bankImports/types";
import { parseAmount, parseCSV, parseDate } from "@/infrastructure/csv/csvParser";
import type { RootStackParamList } from "../../../App";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Import">;

type Step = "paste" | "map" | "preview" | "done";

const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function ImportScreen({ navigation }: Props) {
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);
  const importStatement = useBankImportsStore((s) => s.importStatement);
  const isLoading = useBankImportsStore((s) => s.isLoading);
  const loadTransactions = useTransactionsStore((s) => s.loadTransactions);

  const [step, setStep] = useState<Step>("paste");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [titleCol, setTitleCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [accountId, setAccountId] = useState(selectedAccountId ?? accounts[0]?.id ?? "");
  const [sourceName, setSourceName] = useState("Relevé bancaire");

  const defaultCategoryId = categories[0]?.id ?? "";

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function handleAnalyse() {
    if (!csvText.trim()) return;
    const { headers: h } = parseCSV(csvText);
    if (h.length === 0) {
      Alert.alert("Erreur", "Impossible de détecter les colonnes. Vérifiez le format CSV.");
      return;
    }
    setHeaders(h);
    // Auto-detect common column names
    const lc = h.map((x) => x.toLowerCase());
    setDateCol(h[lc.findIndex((x) => x.includes("date"))] ?? h[0]);
    setTitleCol(h[lc.findIndex((x) => x.includes("libel") || x.includes("desc") || x.includes("label"))] ?? h[1] ?? h[0]);
    setAmountCol(h[lc.findIndex((x) => x.includes("mont") || x.includes("amount") || x.includes("débit") || x.includes("credit"))] ?? h[2] ?? h[0]);
    setStep("map");
  }

  function handleBuildPreview() {
    const { rows: rawRows } = parseCSV(csvText);
    const parsed: ParsedRow[] = [];
    for (const raw of rawRows) {
      const dateStr = parseDate(raw[dateCol] ?? "");
      const amount = parseAmount(raw[amountCol] ?? "");
      const title = (raw[titleCol] ?? "").trim();
      if (!dateStr || amount === null || !title) continue;
      parsed.push({
        date: dateStr,
        title,
        amount: Math.abs(amount),
        transactionType: amount < 0 ? "EXPENSE" : "INCOME",
        categoryId: defaultCategoryId,
        included: true,
      });
    }
    if (parsed.length === 0) {
      Alert.alert("Erreur", "Aucune ligne valide détectée avec ces colonnes.");
      return;
    }
    setRows(parsed);
    setStep("preview");
  }

  async function handleConfirm() {
    const included = rows.filter((r) => r.included);
    if (included.length === 0) {
      Alert.alert("Erreur", "Sélectionnez au moins une ligne.");
      return;
    }
    try {
      await importStatement(accountId, sourceName, rows);
      await loadTransactions();
      setStep("done");
    } catch {
      Alert.alert("Erreur", "L'import a échoué. Vérifiez les données.");
    }
  }

  function toggleRow(idx: number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, included: !r.included } : r)));
  }

  function setRowCategory(idx: number, categoryId: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, categoryId } : r)));
  }

  if (step === "done") {
    const count = rows.filter((r) => r.included).length;
    return (
      <View style={styles.center}>
        <Text style={styles.doneIcon}>✓</Text>
        <Text style={styles.doneTitle}>{count} transaction{count > 1 ? "s" : ""} importée{count > 1 ? "s" : ""}</Text>
        <Text style={styles.doneSubtitle}>Le solde du compte a été mis à jour.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Step 1 — Paste CSV */}
      {step === "paste" && (
        <>
          <Text style={styles.stepLabel}>Étape 1 / 3 — Coller le relevé</Text>
          <Text style={styles.hint}>
            Exportez votre relevé en CSV depuis votre banque, copiez le contenu et collez-le ici.
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Compte cible</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, accountId === a.id && styles.chipActive]}
                  onPress={() => setAccountId(a.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: a.color }]} />
                  <Text style={[styles.chipText, accountId === a.id && styles.chipTextActive]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Nom de la source</Text>
            <TextInput
              style={styles.input}
              value={sourceName}
              onChangeText={setSourceName}
              placeholder="ex: BNP Paribas Mai 2025"
            />
          </View>
          <TextInput
            style={styles.csvInput}
            multiline
            value={csvText}
            onChangeText={setCsvText}
            placeholder={"Date;Libellé;Montant\n01/05/2025;Carrefour;-45,20\n..."}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.primaryButton, !csvText.trim() && styles.disabled]}
            onPress={handleAnalyse}
            disabled={!csvText.trim()}
          >
            <Text style={styles.primaryButtonText}>Analyser →</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Step 2 — Map columns */}
      {step === "map" && (
        <>
          <Text style={styles.stepLabel}>Étape 2 / 3 — Mapper les colonnes</Text>
          <Text style={styles.hint}>
            Colonnes détectées : {headers.join(", ")}
          </Text>
          {[
            { label: "Colonne date", value: dateCol, set: setDateCol },
            { label: "Colonne libellé", value: titleCol, set: setTitleCol },
            { label: "Colonne montant", value: amountCol, set: setAmountCol },
          ].map(({ label, value, set }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {headers.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.chip, value === h && styles.chipActive]}
                    onPress={() => set(h)}
                  >
                    <Text style={[styles.chipText, value === h && styles.chipTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep("paste")}>
              <Text style={styles.secondaryButtonText}>← Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBuildPreview}>
              <Text style={styles.primaryButtonText}>Aperçu →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Step 3 — Preview + category assignment */}
      {step === "preview" && (
        <>
          <Text style={styles.stepLabel}>Étape 3 / 3 — Vérifier et importer</Text>
          <Text style={styles.hint}>
            {rows.filter((r) => r.included).length} / {rows.length} lignes sélectionnées
          </Text>
          {rows.map((row, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.rowCard, !row.included && styles.rowCardExcluded]}
              onPress={() => toggleRow(idx)}
              activeOpacity={0.8}
            >
              <View style={styles.rowCardHeader}>
                <Text style={styles.rowDate}>{row.date}</Text>
                <Text style={[styles.rowAmount, row.transactionType === "INCOME" ? styles.income : styles.expense]}>
                  {row.transactionType === "INCOME" ? "+" : "-"}{currencyFormatter.format(row.amount)}
                </Text>
              </View>
              <Text style={styles.rowTitle} numberOfLines={1}>{row.title}</Text>
              {row.included && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, styles.chipSmall, row.categoryId === c.id && styles.chipActive]}
                      onPress={() => setRowCategory(idx, c.id)}
                    >
                      <View style={[styles.chipDot, { backgroundColor: c.color }]} />
                      <Text style={[styles.chipText, styles.chipTextSmall, row.categoryId === c.id && styles.chipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </TouchableOpacity>
          ))}
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep("map")}>
              <Text style={styles.secondaryButtonText}>← Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabled]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Importer ✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: finoptTheme.colors.background },
  content: { padding: finoptTheme.spacing.lg, gap: finoptTheme.spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: finoptTheme.spacing.lg, padding: finoptTheme.spacing.xl },
  stepLabel: { fontSize: 13, fontWeight: "700", color: finoptTheme.colors.primary },
  hint: { fontSize: 13, color: finoptTheme.colors.gray600, lineHeight: 20 },
  field: { gap: finoptTheme.spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: finoptTheme.colors.foreground },
  input: {
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.md,
    borderWidth: 1,
    borderColor: finoptTheme.colors.border,
    padding: finoptTheme.spacing.md,
    fontSize: 14,
    color: finoptTheme.colors.foreground,
  },
  csvInput: {
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.md,
    borderWidth: 1,
    borderColor: finoptTheme.colors.border,
    padding: finoptTheme.spacing.md,
    fontSize: 12,
    color: finoptTheme.colors.foreground,
    minHeight: 200,
    fontFamily: "monospace",
  },
  chipRow: { flexDirection: "row" as any },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: finoptTheme.spacing.md,
    paddingVertical: finoptTheme.spacing.xs,
    borderRadius: finoptTheme.radius.xl,
    backgroundColor: finoptTheme.colors.muted,
    marginRight: finoptTheme.spacing.xs,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSmall: { paddingHorizontal: finoptTheme.spacing.sm, paddingVertical: 2 },
  chipActive: { backgroundColor: finoptTheme.colors.primaryLight, borderColor: finoptTheme.colors.primary },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, color: finoptTheme.colors.foreground },
  chipTextSmall: { fontSize: 11 },
  chipTextActive: { color: finoptTheme.colors.primary, fontWeight: "700" },
  primaryButton: {
    flex: 1,
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.xl,
    paddingVertical: finoptTheme.spacing.lg,
    alignItems: "center",
    ...finoptTheme.shadow.action,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondaryButton: {
    flex: 1,
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.xl,
    paddingVertical: finoptTheme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: finoptTheme.colors.border,
  },
  secondaryButtonText: { color: finoptTheme.colors.foreground, fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", gap: finoptTheme.spacing.md },
  rowCard: {
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.lg,
    padding: finoptTheme.spacing.md,
    gap: finoptTheme.spacing.xs,
    borderWidth: 1,
    borderColor: finoptTheme.colors.border,
    ...finoptTheme.shadow.card,
  },
  rowCardExcluded: { opacity: 0.4 },
  rowCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowDate: { fontSize: 12, color: finoptTheme.colors.gray500 },
  rowTitle: { fontSize: 13, fontWeight: "600", color: finoptTheme.colors.foreground },
  rowAmount: { fontSize: 14, fontWeight: "800" },
  income: { color: finoptTheme.colors.primary },
  expense: { color: finoptTheme.colors.danger },
  doneIcon: { fontSize: 64, color: finoptTheme.colors.primary },
  doneTitle: { fontSize: 22, fontWeight: "800", color: finoptTheme.colors.foreground, textAlign: "center" },
  doneSubtitle: { fontSize: 14, color: finoptTheme.colors.gray600, textAlign: "center" },
});
