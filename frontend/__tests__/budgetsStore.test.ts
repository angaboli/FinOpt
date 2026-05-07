import { useBudgetsStore } from "@/application/budgets/budgetsStore";
import { budgetsApi } from "@/infrastructure/api/budgetsApi";

jest.mock("@/infrastructure/api/budgetsApi", () => ({
  budgetsApi: { get: jest.fn(), set: jest.fn() },
}));

const BUDGET = {
  id: "b1",
  userId: "u1",
  year: 2025,
  month: 5,
  lines: [{ categoryId: "cat1", plannedAmount: 300 }],
  totalPlanned: 300,
};

beforeEach(() => {
  useBudgetsStore.setState({ budget: null, isLoading: false, error: null });
  jest.clearAllMocks();
});

test("loadBudget stores budget on success", async () => {
  jest.mocked(budgetsApi.get).mockResolvedValue(BUDGET);
  await useBudgetsStore.getState().loadBudget(2025, 5);
  expect(useBudgetsStore.getState().budget).toEqual(BUDGET);
  expect(useBudgetsStore.getState().isLoading).toBe(false);
});

test("loadBudget stores null when no budget exists", async () => {
  jest.mocked(budgetsApi.get).mockResolvedValue(null);
  await useBudgetsStore.getState().loadBudget(2025, 5);
  expect(useBudgetsStore.getState().budget).toBeNull();
});

test("loadBudget sets error on failure", async () => {
  jest.mocked(budgetsApi.get).mockRejectedValue(new Error("fail"));
  await useBudgetsStore.getState().loadBudget(2025, 5);
  expect(useBudgetsStore.getState().error).toBe("Impossible de charger le budget");
});

test("saveBudget updates store on success", async () => {
  jest.mocked(budgetsApi.set).mockResolvedValue(BUDGET);
  await useBudgetsStore.getState().saveBudget(2025, 5, [{ categoryId: "cat1", plannedAmount: 300 }]);
  expect(useBudgetsStore.getState().budget).toEqual(BUDGET);
  expect(budgetsApi.set).toHaveBeenCalledWith({
    year: 2025,
    month: 5,
    lines: [{ categoryId: "cat1", plannedAmount: 300 }],
  });
});
