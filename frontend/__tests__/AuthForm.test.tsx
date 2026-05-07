import { fireEvent, render, screen } from "@testing-library/react-native";

import { AuthForm } from "@/presentation/components/AuthForm";

test("keeps submit disabled until credentials are valid", () => {
  const onSubmit = jest.fn();

  render(
    <AuthForm title="Connexion" submitLabel="Se connecter" error={null} isLoading={false} onSubmit={onSubmit} />,
  );

  fireEvent.press(screen.getByLabelText("Se connecter"));
  expect(onSubmit).not.toHaveBeenCalled();

  fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
  fireEvent.changeText(screen.getByLabelText("Mot de passe"), "password1");
  fireEvent.press(screen.getByLabelText("Se connecter"));

  expect(onSubmit).toHaveBeenCalledWith({ email: "user@example.com", password: "password1" });
});
