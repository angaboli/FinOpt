import { useBankImportsStore } from "@/application/bankImports/bankImportsStore";
import { bankImportsApi } from "@/infrastructure/api/bankImportsApi";

jest.mock("@/infrastructure/api/bankImportsApi", () => ({
  bankImportsApi: { import: jest.fn(), list: jest.fn() },
}));

const IMPORT = {
  id: "imp1", userId: "u1", accountId: "acc1",
  sourceName: "BNP Mai", rowCount: 3, importedCount: 3, createdAt: "2025-05-01T10:00:00Z",
};

const ROWS = [
  { date: "2025-05-01", title: "Carrefour", amount: 45, transactionType: "EXPENSE" as const, categoryId: "cat1", included: true },
];

beforeEach(() => {
  useBankImportsStore.setState({ imports: [], isLoading: false, error: null });
  jest.clearAllMocks();
});

test("loadImports stores results", async () => {
  jest.mocked(bankImportsApi.list).mockResolvedValue([IMPORT]);
  await useBankImportsStore.getState().loadImports();
  expect(useBankImportsStore.getState().imports).toHaveLength(1);
});

test("loadImports sets error on failure", async () => {
  jest.mocked(bankImportsApi.list).mockRejectedValue(new Error());
  await useBankImportsStore.getState().loadImports();
  expect(useBankImportsStore.getState().error).toBeTruthy();
});

test("importStatement prepends result and calls api", async () => {
  jest.mocked(bankImportsApi.import).mockResolvedValue(IMPORT);
  await useBankImportsStore.getState().importStatement("acc1", "BNP Mai", ROWS);
  expect(useBankImportsStore.getState().imports[0]).toEqual(IMPORT);
  expect(bankImportsApi.import).toHaveBeenCalledWith("acc1", "BNP Mai", ROWS);
});

test("importStatement throws and sets error on failure", async () => {
  jest.mocked(bankImportsApi.import).mockRejectedValue(new Error());
  await expect(
    useBankImportsStore.getState().importStatement("acc1", "BNP", ROWS)
  ).rejects.toThrow();
  expect(useBankImportsStore.getState().error).toBeTruthy();
});
