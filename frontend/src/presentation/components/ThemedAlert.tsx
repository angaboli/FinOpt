import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAlertStore } from "@/application/alert/alertStore";
import { finoptTheme } from "@/presentation/theme/theme";

const t = finoptTheme;

export function ThemedAlert() {
  const { visible, title, message, buttons, hide } = useAlertStore();

  function handlePress(onPress?: () => void) {
    hide();
    onPress?.();
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={hide} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable style={styles.box} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={[styles.buttons, buttons.length > 2 && styles.buttonsColumn]}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                onPress={() => handlePress(btn.onPress)}
                style={({ pressed }) => [
                  styles.btn,
                  buttons.length <= 2 && { flex: 1 },
                  btn.style === "cancel" && styles.btnCancel,
                  btn.style === "destructive" && styles.btnDestructive,
                  btn.style !== "cancel" && btn.style !== "destructive" && styles.btnDefault,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    btn.style === "cancel" && styles.btnTextCancel,
                    btn.style === "destructive" && styles.btnTextDestructive,
                  ]}
                >
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: t.spacing.xl,
  },
  box: {
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    gap: t.spacing.md,
    padding: t.spacing.xl,
    width: "100%",
    maxWidth: 360,
    ...t.shadow.card,
  },
  title: {
    color: t.colors.foreground,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: t.colors.gray600,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: t.spacing.sm,
    marginTop: t.spacing.xs,
  },
  buttonsColumn: {
    flexDirection: "column",
  },
  btn: {
    alignItems: "center",
    borderRadius: t.radius.lg,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: t.spacing.md,
  },
  btnDefault: {
    backgroundColor: t.colors.primary,
    ...t.shadow.action,
  },
  btnCancel: {
    backgroundColor: t.colors.muted,
    borderColor: t.colors.border,
    borderWidth: 1,
  },
  btnDestructive: {
    backgroundColor: "#FEE2E2",
    borderColor: t.colors.danger,
    borderWidth: 1,
  },
  btnPressed: { opacity: 0.75 },
  btnText: {
    color: t.colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
  btnTextCancel: { color: t.colors.gray700 },
  btnTextDestructive: { color: t.colors.danger },
});
