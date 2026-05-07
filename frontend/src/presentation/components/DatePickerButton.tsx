import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { finoptTheme } from "@/presentation/theme/theme";

const t = finoptTheme;

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

function parseDate(iso: string): Date {
  const d = new Date(iso + "T12:00:00");
  return isNaN(d.getTime()) ? new Date() : d;
}

function toIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplay(iso: string): string {
  return parseDate(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function DatePickerButton({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parseDate(value));

  function open() {
    setTempDate(parseDate(value));
    setShow(true);
  }

  function handleAndroid(_: DateTimePickerEvent, selected?: Date) {
    setShow(false);
    if (selected) onChange(toIso(selected));
  }

  function handleIos(_: DateTimePickerEvent, selected?: Date) {
    if (selected) setTempDate(selected);
  }

  return (
    <>
      <Pressable style={styles.button} onPress={open}>
        <Ionicons name="calendar-outline" size={18} color={t.colors.primary} />
        <Text style={styles.text}>{formatDisplay(value)}</Text>
      </Pressable>

      {show && Platform.OS === "android" && (
        <DateTimePicker value={parseDate(value)} mode="date" display="calendar" onChange={handleAndroid} />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="fade">
          <Pressable style={styles.backdrop} onPress={() => setShow(false)}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={handleIos}
                style={styles.picker}
                locale="fr-FR"
              />
              <Pressable
                style={styles.confirmBtn}
                onPress={() => { setShow(false); onChange(toIso(tempDate)); }}
              >
                <Text style={styles.confirmText}>Confirmer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: t.colors.muted,
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: t.spacing.sm,
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
  },
  text: { color: t.colors.foreground, fontSize: 14 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: t.spacing.xl,
  },
  modalCard: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    overflow: "hidden",
    width: "100%",
  },
  picker: { width: "100%" },
  confirmBtn: {
    alignItems: "center",
    backgroundColor: t.colors.primary,
    paddingVertical: t.spacing.md,
  },
  confirmText: { color: t.colors.white, fontWeight: "700", fontSize: 15 },
});
