import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { showAlert } from "@/application/alert/alertStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { categoryIcon } from "@/domain/categories/categoryIcons";
import { finoptTheme as t } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Categories">;

export function CategoriesScreen({ navigation }: Props) {
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);
  const deleteCategory = useCategoriesStore((s) => s.deleteCategory);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function handleDelete(id: string, name: string) {
    showAlert(
      "Supprimer la catégorie",
      `Supprimer « ${name} » ? Les transactions existantes conserveront cette catégorie.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => void deleteCategory(id),
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroTop}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.title}>Catégories</Text>
            <Text style={styles.subtitle}>Personnalisez vos catégories de dépenses.</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("AddCategory", {})}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.addBtnText}>+ Ajouter</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: cat.color }]}>
                <Ionicons
                  name={categoryIcon(cat.name) as any}
                  size={18}
                  color={t.colors.white}
                />
              </View>
              <Text style={styles.name}>{cat.name}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => navigation.navigate("AddCategory", { categoryId: cat.id })}
                  style={styles.actionBtn}
                >
                  <Ionicons name="pencil-outline" size={18} color={t.colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(cat.id, cat.name)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={t.colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: t.colors.background, flex: 1 },
  content: { gap: t.spacing.lg, padding: t.spacing.xl, paddingBottom: t.spacing.xxl },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroTextBlock: { flex: 1, paddingRight: t.spacing.md },
  title: { color: t.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: t.colors.gray600, lineHeight: 21 },
  addBtn: {
    alignItems: "center",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.lg,
    justifyContent: "center",
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
    ...t.shadow.action,
  },
  addBtnText: { color: t.colors.white, fontWeight: "800", fontSize: 13 },
  list: {
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...t.shadow.card,
  },
  row: {
    alignItems: "center",
    borderBottomColor: t.colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: t.radius.md,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  name: { color: t.colors.foreground, flex: 1, fontWeight: "700" },
  actions: { flexDirection: "row", gap: t.spacing.sm },
  actionBtn: { padding: t.spacing.xs },
});
