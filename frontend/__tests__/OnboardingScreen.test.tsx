import { fireEvent, render, screen } from "@testing-library/react-native";

import { OnboardingScreen } from "@/presentation/screens/OnboardingScreen";

test("calls onComplete after the last onboarding step", () => {
  const onComplete = jest.fn();

  render(<OnboardingScreen onComplete={onComplete} />);

  fireEvent.press(screen.getByLabelText("Continuer"));
  fireEvent.press(screen.getByLabelText("Continuer"));
  fireEvent.press(screen.getByLabelText("Continuer"));

  expect(onComplete).toHaveBeenCalledTimes(1);
});
