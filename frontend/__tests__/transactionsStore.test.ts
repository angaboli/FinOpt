import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import { transactionsApi } from "@/infrastructure/api/transactionsApi";

jest.mock("@/infrastructure/api/transactionsApi", () => ({
  transactionsApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const TX = {
  id: "tx1",
  userId: "u1",
  accountId: "acc1",
  categoryId: "cat1",
  title: "Courses",
  amount: 50,
  transactionType: "EXPENSE" as const,
  date: "2025-01-15",
  note: null,
};

beforeEach(() => {
  useTransactionsStore.setState({ transactions: [], isLoading: false, error: null });
  jest.clearAllMocks();
});

test("loadTransactions fetches and stores transactions", async () => {
  jest.mocked(transactionsApi.list).mockResolvedValue([TX]);

  await useTransactionsStore.getState().loadTransactions();

  expect(useTransactionsStore.getState().transactions).toHaveLength(1);
  expect(useTransactionsStore.getState().transactions[0].title).toBe("Courses");
});

test("loadTransactions sets error on failure", async () => {
  jest.mocked(transactionsApi.list).mockRejectedValue(new Error("network"));

  await useTransactionsStore.getState().loadTransactions();

  expect(useTransactionsStore.getState().error).toBeTruthy();
  expect(useTransactionsStore.getState().transactions).toHaveLength(0);
});

test("createTransaction prepends the new transaction to state", async () => {
  jest.mocked(transactionsApi.create).mockResolvedValue(TX);

  await useTransactionsStore.getState().createTransaction({
    accountId: "acc1",
    categoryId: "cat1",
    title: "Courses",
    amount: 50,
    transactionType: "EXPENSE",
    date: "2025-01-15",
    note: null,
  });

  expect(useTransactionsStore.getState().transactions).toHaveLength(1);
  expect(useTransactionsStore.getState().transactions[0].id).toBe("tx1");
});

test("deleteTransaction removes the transaction from state", async () => {
  useTransactionsStore.setState({ transactions: [TX] });
  jest.mocked(transactionsApi.remove).mockResolvedValue(undefined);

  await useTransactionsStore.getState().deleteTransaction("tx1");

  expect(useTransactionsStore.getState().transactions).toHaveLength(0);
});
