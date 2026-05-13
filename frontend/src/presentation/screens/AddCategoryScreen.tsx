import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { showAlert } from "@/application/alert/alertStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { categoryIcon } from "@/domain/categories/categoryIcons";
import { finoptTheme as t } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddCategory">;

const PRESET_COLORS = [
  "#22C55E", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B",
  "#EC4899", "#F97316", "#06B6D4", "#10B981", "#6B7280",
  "#E11D48", "#7C3AED", "#0EA5E9", "#84CC16", "#FB923C",
];

export function AddCategoryScreen({ navigation, route }: Props) {
  const { categoryId } = route.params ?? {};
  const categories = useCategoriesStore((s) => s.categories);
  const isLoading = useCategoriesStore((s) => s.isLoading);
  const createCategory = useCategoriesStore((s) => s.createCategory);
  const updateCategory = useCategoriesStore((s) => s.updateCategory);

  const existing = categoryId ? categories.find((c) => c.id === categoryId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.color ?? PRESET_COLORS[0]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setColor(existing.color);
    }
  }, [existing]);

  const canSubmit = name.trim().length > 0;
  const icon = categoryIcon(name);

  async function handleSave() {
    if (!canSubmit) return;
    try {
      if (existing) {
        await updateCategory(existing.id, { name: name.trim(), color });
      } else {
        await createCategory({ name: name.trim(), color });
      }
      navigation.goBack();
    } catch {
      showAlert("Erreur", "Impossible d'enregistrer la catégorie.");
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{existing ? "Modifier la catégorie" : "Nouvelle catégorie"}</Text>
        <Text style={styles.subtitle}>
          {existing ? "Modifiez le nom ou la couleur." : "Créez une catégorie personnalisée."}
        </Text>

        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: color }]}>
            <Ionicons name={icon as any} size={28} color={t.colors.white} />
          </View>
          <Text style={[styles.previewName, { color }]}>
            {name.trim() || "Nom de la catégorie"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            accessibilityLabel="Nom de la catégorie"
            autoFocus
            onChangeText={setName}
            placeholder="Transport, Santé, Sport..."
            placeholderTextColor={t.colors.gray500}
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={14} color={t.colors.white} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!canSubmit || isLoading}
          onPress={() => void handleSave()}
          style={[styles.button, (!canSubmit || isLoading) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Enregistrement..." : existing ? "Mettre à jour" : "Créer la catégorie"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: t.colors.background,
    flexGrow: 1,
    gap: t.spacing.lg,
    padding: t.spacing.xl,
    paddingBottom: t.spacing.lg,
  },
  title: { color: t.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: t.colors.gray600, lineHeight: 21 },
  preview: {
    alignItems: "center",
    gap: t.spacing.sm,
    paddingVertical: t.spacing.md,
  },
  previewIcon: {
    alignItems: "center",
    borderRadius: t.radius.lg,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  previewName: { fontSize: 18, fontWeight: "800" },
  card: {
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    gap: t.spacing.md,
    padding: t.spacing.lg,
    ...t.shadow.card,
  },
  label: { color: t.colors.foreground, fontWeight: "800" },
  input: {
    backgroundColor: t.colors.muted,
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    color: t.colors.foreground,
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.sm,
  },
  colorDot: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  colorDotActive: {
    borderColor: t.colors.foreground,
    borderWidth: 2.5,
  },
  footer: {
    backgroundColor: t.colors.background,
    borderTopColor: t.colors.border,
    borderTopWidth: 1,
    padding: t.spacing.xl,
  },
  button: {
    alignItems: "center",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.lg,
    justifyContent: "center",
    minHeight: 54,
    ...t.shadow.action,
  },
  buttonDisabled: { backgroundColor: t.colors.gray400, elevation: 0, shadowOpacity: 0 },
  buttonText: { color: t.colors.white, fontWeight: "800" },
});
