import { fireEvent, render, screen } from "@testing-library/react-native";

import { IncomeSourceCard } from "@/presentation/components/IncomeSourceCard";

const source = {
  id: "1",
  userId: "u1",
  name: "Salaire",
  amount: 3200,
  frequency: "MONTHLY" as const,
};

test("renders the income source name, amount and frequency", () => {
  render(<IncomeSourceCard source={source} />);

  expect(screen.getByText("Salaire")).toBeTruthy();
  expect(screen.getByText("3 200,00 €")).toBeTruthy();
  expect(screen.getByText("Mensuel")).toBeTruthy();
});

test("calls onDelete when delete is pressed", () => {
  const onDelete = jest.fn();
  render(<IncomeSourceCard source={source} onDelete={onDelete} />);

  fireEvent.press(screen.getByLabelText("Supprimer Salaire"));
  expect(onDelete).toHaveBeenCalledWith("1");
});

test("does not render delete button when onDelete is not provided", () => {
  render(<IncomeSourceCard source={source} />);

  expect(screen.queryByLabelText("Supprimer Salaire")).toBeNull();
});
