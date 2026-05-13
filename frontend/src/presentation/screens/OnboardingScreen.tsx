import { useState } from "react";
import { Pressable, StyleSheet, Image, Text, View } from "react-native";

import { finoptTheme } from "@/presentation/theme/theme";

const logo = require("../../../assets/FinOptLogo.png") as number;

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Tous vos comptes, une seule app",
    description:
      "Consolidez vos comptes courants, epargnes et comptes partages dans une vue claire.",
  },
  {
    title: "Optimisation intelligente",
    description:
      "Recevez des conseils Finopt pour ajuster vos depenses et proteger votre epargne.",
  },
  {
    title: "Pret a commencer ?",
    description:
      "Connectez-vous et laissez Finopt structurer votre budget personnel.",
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  function handleNext() {
    if (currentStep === steps.length - 1) {
      onComplete();
      return;
    }
    setCurrentStep(currentStep + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        {/* <Text style={styles.brand}>Finopt</Text> */}
        <Image
          source={logo}
          style={{ width: 100, height: 32 }}
          resizeMode="contain"
        />
        <Pressable accessibilityRole="button" onPress={onComplete}>
          <Text style={styles.skip}>Passer</Text>
        </Pressable>
      </View>

      <View style={styles.visual}>
        <View style={styles.ringOuter}>
          <View style={styles.ringMiddle}>
            <View style={styles.walletBubble}>
              <Text style={styles.walletText}>€</Text>
              <View style={styles.cardBubble}>
                <Text style={styles.cardBubbleText}>CB</Text>
              </View>
              <View style={styles.savingBubble}>
                <Text style={styles.savingBubbleText}>+</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        <View style={styles.dots}>
          {steps.map((item) => (
            <View
              key={item.title}
              style={[
                styles.dot,
                item.title === step.title && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Pressable
          accessibilityLabel="Continuer"
          accessibilityRole="button"
          onPress={handleNext}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Continuer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: finoptTheme.colors.white,
    flex: 1,
    justifyContent: "space-between",
    padding: finoptTheme.spacing.xl,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: finoptTheme.spacing.lg,
  },
  brand: {
    color: finoptTheme.colors.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  skip: {
    color: finoptTheme.colors.gray700,
    fontSize: 14,
    fontWeight: "700",
  },
  visual: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.white,
    borderColor: finoptTheme.colors.border,
    borderRadius: 150,
    borderWidth: 1,
    height: 280,
    justifyContent: "center",
    width: 280,
    ...finoptTheme.shadow.card,
  },
  ringMiddle: {
    alignItems: "center",
    borderColor: finoptTheme.colors.primaryLight,
    borderRadius: 105,
    borderWidth: 1,
    height: 210,
    justifyContent: "center",
    width: 210,
  },
  walletBubble: {
    alignItems: "center",
    backgroundColor: "#50C878",
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    width: 96,
    ...finoptTheme.shadow.action,
  },
  walletText: {
    color: finoptTheme.colors.primaryDark,
    fontSize: 34,
    fontWeight: "800",
  },
  cardBubble: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.secondary,
    borderColor: finoptTheme.colors.white,
    borderRadius: 24,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: -24,
    top: -12,
    width: 48,
  },
  cardBubbleText: {
    color: finoptTheme.colors.secondaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  savingBubble: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.orange,
    borderColor: finoptTheme.colors.white,
    borderRadius: 20,
    borderWidth: 2,
    bottom: -8,
    height: 40,
    justifyContent: "center",
    left: -22,
    position: "absolute",
    width: 40,
  },
  savingBubbleText: {
    color: "#782B23",
    fontSize: 18,
    fontWeight: "800",
  },
  copy: {
    paddingBottom: finoptTheme.spacing.xl,
  },
  title: {
    color: finoptTheme.colors.foreground,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    textAlign: "center",
  },
  description: {
    color: finoptTheme.colors.gray700,
    fontSize: 16,
    lineHeight: 24,
    marginTop: finoptTheme.spacing.md,
    textAlign: "center",
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: finoptTheme.spacing.sm,
    justifyContent: "center",
    marginVertical: finoptTheme.spacing.xxl,
  },
  dot: {
    backgroundColor: finoptTheme.colors.border,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: finoptTheme.colors.primary,
    width: 32,
  },
  button: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    minHeight: 56,
    ...finoptTheme.shadow.action,
  },
  buttonPressed: {
    backgroundColor: finoptTheme.colors.primaryDark,
  },
  buttonText: {
    color: finoptTheme.colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
