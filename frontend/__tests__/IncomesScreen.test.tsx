import { render, screen, waitFor } from "@testing-library/react-native";

import { useIncomeSourcesStore } from "@/application/income_sources/incomeSourcesStore";
import { incomeSourcesApi } from "@/infrastructure/api/incomeSourcesApi";

jest.mock("@/infrastructure/api/incomeSourcesApi", () => ({
  incomeSourcesApi: { list: jest.fn(), create: jest.fn(), remove: jest.fn() },
}));

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({ Navigator: ({ children }: any) => children, Screen: () => null }),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

import { IncomesScreen } from "@/presentation/screens/IncomesScreen";

beforeEach(() => {
  useIncomeSourcesStore.setState({ incomeSources: [], isLoading: false, error: null });
  jest.clearAllMocks();
});

test("shows empty state when there are no income sources", async () => {
  jest.mocked(incomeSourcesApi.list).mockResolvedValue([]);
  const navigation = { navigate: mockNavigate } as any;

  render(<IncomesScreen navigation={navigation} route={{} as any} />);

  await waitFor(() => {
    expect(screen.getByText("Aucun revenu déclaré")).toBeTruthy();
  });
});

test("displays income sources from the store", async () => {
  jest.mocked(incomeSourcesApi.list).mockResolvedValue([
    { id: "1", userId: "u1", name: "Salaire", amount: 3200, frequency: "MONTHLY" },
  ]);
  const navigation = { navigate: mockNavigate } as any;

  render(<IncomesScreen navigation={navigation} route={{} as any} />);

  await waitFor(() => {
    expect(screen.getByText("Salaire")).toBeTruthy();
  });
});
