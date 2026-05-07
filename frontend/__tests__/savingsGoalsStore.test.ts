import { savingsGoalsApi } from "@/infrastructure/api/savingsGoalsApi";
import { useSavingsGoalsStore } from "@/application/savingsGoals/savingsGoalsStore";

jest.mock("@/infrastructure/api/savingsGoalsApi");

const mockApi = savingsGoalsApi as jest.Mocked<typeof savingsGoalsApi>;

const goal1 = {
  id: "g1",
  userId: "u1",
  name: "Vacances",
  targetAmount: 2000,
  currentAmount: 500,
  deadline: null,
  progressRatio: 0.25,
  remainingAmount: 1500,
  createdAt: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  useSavingsGoalsStore.setState({ goals: [], advice: null, isLoading: false, isGenerating: false, error: null });
  jest.clearAllMocks();
});

test("loadGoals sets goals on success", async () => {
  mockApi.list.mockResolvedValue([goal1]);
  await useSavingsGoalsStore.getState().loadGoals();
  expect(useSavingsGoalsStore.getState().goals).toHaveLength(1);
  expect(useSavingsGoalsStore.getState().goals[0].name).toBe("Vacances");
});

test("loadGoals sets error on failure", async () => {
  mockApi.list.mockRejectedValue(new Error("network"));
  await useSavingsGoalsStore.getState().loadGoals();
  expect(useSavingsGoalsStore.getState().error).toBeTruthy();
  expect(useSavingsGoalsStore.getState().goals).toHaveLength(0);
});

test("createGoal appends to goals", async () => {
  mockApi.create.mockResolvedValue(goal1);
  await useSavingsGoalsStore.getState().createGoal("Vacances", 2000, 500, null);
  expect(useSavingsGoalsStore.getState().goals).toHaveLength(1);
});

test("deleteGoal removes from goals", async () => {
  useSavingsGoalsStore.setState({ goals: [goal1] });
  mockApi.delete.mockResolvedValue(undefined);
  await useSavingsGoalsStore.getState().deleteGoal("g1");
  expect(useSavingsGoalsStore.getState().goals).toHaveLength(0);
});

test("generateAdvice sets advice", async () => {
  const advice = { summary: "Bon mois", tips: ["tip1"], savingsAdvice: null, periodLabel: "Mai 2026" };
  mockApi.generateAdvice.mockResolvedValue(advice);
  await useSavingsGoalsStore.getState().generateAdvice(2026, 5);
  expect(useSavingsGoalsStore.getState().advice?.summary).toBe("Bon mois");
});
