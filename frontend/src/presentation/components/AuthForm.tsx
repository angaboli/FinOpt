import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Credentials } from "@/domain/auth/types";
import { FinoptLogo } from "@/presentation/components/FinoptLogo";
import { finoptTheme } from "@/presentation/theme/theme";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  error: string | null;
  isLoading: boolean;
  showName?: boolean;
  onSubmit: (credentials: Credentials) => Promise<void>;
}

export function AuthForm({ title, submitLabel, error, isLoading, showName, onSubmit }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nameOk = !showName || name.trim().length >= 2;
  const canSubmit = nameOk && email.includes("@") && password.length >= 8 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.brand}>
        <FinoptLogo />
        <Text style={styles.tagline}>Votre assistant financier intelligent</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {showName && (
          <View style={styles.field}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              accessibilityLabel="Prénom"
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Votre prénom"
              placeholderTextColor={finoptTheme.colors.gray500}
              style={styles.input}
              value={name}
            />
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="vous@email.com"
            placeholderTextColor={finoptTheme.colors.gray500}
            style={styles.input}
            value={email}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            accessibilityLabel="Mot de passe"
            onChangeText={setPassword}
            placeholder="8 caracteres minimum"
            placeholderTextColor={finoptTheme.colors.gray500}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityLabel={submitLabel}
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={() => onSubmit({ email, password, name: showName ? name.trim() : undefined })}
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{isLoading ? "Patientez..." : submitLabel}</Text>
        </Pressable>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: finoptTheme.spacing.xl,
    backgroundColor: finoptTheme.colors.background,
  },
  brand: {
    alignItems: "center",
    marginBottom: 36,
  },
  tagline: {
    color: finoptTheme.colors.gray600,
    fontSize: 15,
    marginTop: finoptTheme.spacing.xs,
    textAlign: "center",
  },
  card: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.xl,
    ...finoptTheme.shadow.card,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: finoptTheme.colors.foreground,
  },
  field: {
    gap: finoptTheme.spacing.sm,
  },
  label: {
    color: finoptTheme.colors.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderColor: finoptTheme.colors.border,
    borderWidth: 1,
    borderRadius: finoptTheme.radius.sm,
    paddingHorizontal: 12,
    backgroundColor: finoptTheme.colors.muted,
    color: finoptTheme.colors.foreground,
  },
  error: {
    color: finoptTheme.colors.danger,
  },
  button: {
    minHeight: 52,
    borderRadius: finoptTheme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: finoptTheme.colors.primary,
    ...finoptTheme.shadow.action,
  },
  buttonDisabled: {
    backgroundColor: finoptTheme.colors.gray400,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    backgroundColor: finoptTheme.colors.primaryDark,
  },
  buttonText: {
    color: finoptTheme.colors.white,
    fontWeight: "700",
  },
});
