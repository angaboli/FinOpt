import { useIncomeSourcesStore } from "@/application/income_sources/incomeSourcesStore";
import { incomeSourcesApi } from "@/infrastructure/api/incomeSourcesApi";

jest.mock("@/infrastructure/api/incomeSourcesApi", () => ({
  incomeSourcesApi: {
    list: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
}));

beforeEach(() => {
  useIncomeSourcesStore.setState({ incomeSources: [], isLoading: false, error: null });
  jest.clearAllMocks();
});

test("loadIncomeSources fetches and stores income sources", async () => {
  jest.mocked(incomeSourcesApi.list).mockResolvedValue([
    { id: "1", userId: "u1", name: "Salaire", amount: 3200, frequency: "MONTHLY" },
  ]);

  await useIncomeSourcesStore.getState().loadIncomeSources();

  expect(useIncomeSourcesStore.getState().incomeSources).toHaveLength(1);
  expect(useIncomeSourcesStore.getState().incomeSources[0].name).toBe("Salaire");
});

test("loadIncomeSources sets error on failure", async () => {
  jest.mocked(incomeSourcesApi.list).mockRejectedValue(new Error("network"));

  await useIncomeSourcesStore.getState().loadIncomeSources();

  expect(useIncomeSourcesStore.getState().error).toBeTruthy();
  expect(useIncomeSourcesStore.getState().incomeSources).toHaveLength(0);
});

test("createIncomeSource appends the new source to state", async () => {
  jest.mocked(incomeSourcesApi.create).mockResolvedValue({
    id: "2",
    userId: "u1",
    name: "Freelance",
    amount: 1500,
    frequency: "QUARTERLY",
  });

  await useIncomeSourcesStore
    .getState()
    .createIncomeSource({ name: "Freelance", amount: 1500, frequency: "QUARTERLY" });

  expect(useIncomeSourcesStore.getState().incomeSources).toHaveLength(1);
  expect(useIncomeSourcesStore.getState().incomeSources[0].name).toBe("Freelance");
});

test("deleteIncomeSource removes the source from state", async () => {
  useIncomeSourcesStore.setState({
    incomeSources: [{ id: "1", userId: "u1", name: "Salaire", amount: 3200, frequency: "MONTHLY" }],
  });
  jest.mocked(incomeSourcesApi.remove).mockResolvedValue(undefined);

  await useIncomeSourcesStore.getState().deleteIncomeSource("1");

  expect(useIncomeSourcesStore.getState().incomeSources).toHaveLength(0);
});
