import { useAuthStore } from "@/application/auth/authStore";
import { AuthForm } from "@/presentation/components/AuthForm";

export function SignUpScreen() {
  const signup = useAuthStore((state) => state.signup);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <AuthForm
      title="Inscription"
      submitLabel="Créer mon compte"
      error={error}
      isLoading={isLoading}
      showName
      onSubmit={signup}
    />
  );
}
