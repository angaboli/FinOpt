import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import { categoriesApi } from "@/infrastructure/api/categoriesApi";
import { transactionsApi } from "@/infrastructure/api/transactionsApi";

jest.mock("@/infrastructure/api/transactionsApi", () => ({
  transactionsApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));
jest.mock("@/infrastructure/api/categoriesApi", () => ({
  categoriesApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));
jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({ Navigator: ({ children }: any) => children, Screen: () => null }),
}));

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

import { AddTransactionScreen } from "@/presentation/screens/AddTransactionScreen";

const ACCOUNT = { id: "acc1", name: "Courant", accountType: "CURRENT" as const, balance: 1000, currency: "EUR", color: "#22C55E" };
const CATEGORY = { id: "cat1", userId: "u1", name: "Alimentation", color: "#22C55E" };
const TX = {
  id: "tx1",
  userId: "u1",
  accountId: "acc1",
  categoryId: "cat1",
  title: "Carrefour",
  amount: 35,
  transactionType: "EXPENSE" as const,
  date: "2025-01-15",
  note: null,
  isSubscription: false,
};

beforeEach(() => {
  useAccountsStore.setState({ accounts: [ACCOUNT], selectedAccountId: "acc1", isLoading: false, error: null });
  useCategoriesStore.setState({ categories: [CATEGORY], isLoading: false, error: null });
  useTransactionsStore.setState({ transactions: [], isLoading: false, error: null });
  jest.mocked(categoriesApi.list).mockResolvedValue([CATEGORY]);
  jest.clearAllMocks();
  jest.mocked(categoriesApi.list).mockResolvedValue([CATEGORY]);
});

test("renders account and category chips", () => {
  const navigation = { goBack: mockGoBack } as any;

  render(<AddTransactionScreen navigation={navigation} route={{} as any} />);

  expect(screen.getByText("Courant")).toBeTruthy();
  expect(screen.getByText("Alimentation")).toBeTruthy();
});

test("save button is disabled when title is empty", () => {
  const navigation = { goBack: mockGoBack } as any;

  render(<AddTransactionScreen navigation={navigation} route={{} as any} />);

  const button = screen.getByLabelText("Enregistrer la transaction");
  expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBeTruthy();
});

test("save button becomes enabled when title and amount are filled", async () => {
  const navigation = { goBack: mockGoBack } as any;

  render(<AddTransactionScreen navigation={navigation} route={{} as any} />);

  fireEvent.changeText(screen.getByLabelText("Libellé"), "Carrefour");
  fireEvent.changeText(screen.getByLabelText("Montant"), "35");

  await waitFor(() => {
    const button = screen.getByLabelText("Enregistrer la transaction");
    expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBeFalsy();
  });
});

test("creates transaction and navigates back on save", async () => {
  jest.mocked(transactionsApi.create).mockResolvedValue(TX);
  const navigation = { goBack: mockGoBack } as any;

  render(<AddTransactionScreen navigation={navigation} route={{} as any} />);

  fireEvent.changeText(screen.getByLabelText("Libellé"), "Carrefour");
  fireEvent.changeText(screen.getByLabelText("Montant"), "35");

  fireEvent.press(screen.getByLabelText("Enregistrer la transaction"));

  await waitFor(() => {
    expect(transactionsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Carrefour", amount: 35, accountId: "acc1", categoryId: "cat1" }),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });
});
