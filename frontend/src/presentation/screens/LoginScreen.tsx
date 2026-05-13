import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAuthStore } from "@/application/auth/authStore";
import { AuthForm } from "@/presentation/components/AuthForm";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <View style={{ flex: 1 }}>
      <AuthForm
        title="Connexion"
        submitLabel="Se connecter"
        error={error}
        isLoading={isLoading}
        onSubmit={login}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("SignUp")}
      >
        <Text
          style={{
            color: finoptTheme.colors.white,
            fontWeight: "700",
            padding: 18,
            backgroundColor: finoptTheme.colors.primary,
            marginBottom: 48,
            textAlign: "center",
            borderRadius: 8,
            width: "80%",
            alignSelf: "center",
            boxShadow: `0 2px 4px ${finoptTheme.colors.primary}80`,
          }}
        >
          Creer un compte
        </Text>
      </Pressable>
    </View>
  );
}
