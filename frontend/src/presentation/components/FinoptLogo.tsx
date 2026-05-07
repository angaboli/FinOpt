import { Image, StyleSheet, View } from "react-native";

const logo = require("../../../assets/FinOptLogo.png") as number;

interface FinoptLogoProps {
  size?: "small" | "large";
}

export function FinoptLogo({ size = "large" }: FinoptLogoProps) {
  return (
    <View>
      <Image
        source={logo}
        style={size === "large" ? styles.large : styles.small}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  large: { width: 160, height: 56 },
  small: { width: 120, height: 40 },
});
