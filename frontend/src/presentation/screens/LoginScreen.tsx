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
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate("SignUp")}>
        <Text
          style={{
            color: finoptTheme.colors.primary,
            fontWeight: "700",
            padding: 16,
            textAlign: "center",
          }}
        >
          Creer un compte
        </Text>
      </Pressable>
    </View>
  );
}
