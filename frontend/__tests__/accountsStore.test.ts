import { useAccountsStore } from "@/application/accounts/accountsStore";
import { accountsApi } from "@/infrastructure/api/accountsApi";

jest.mock("@/infrastructure/api/accountsApi", () => ({
  accountsApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

beforeEach(() => {
  useAccountsStore.setState({
    accounts: [],
    selectedAccountId: null,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

test("loads existing accounts and selects the first one", async () => {
  jest.mocked(accountsApi.list).mockResolvedValue([
    {
      id: "account-id",
      name: "Compte Courant",
      accountType: "CURRENT",
      balance: 100,
      currency: "EUR",
      color: "#006D36",
    },
  ]);

  await useAccountsStore.getState().loadAccounts();

  expect(useAccountsStore.getState().accounts).toHaveLength(1);
  expect(useAccountsStore.getState().selectedAccountId).toBe("account-id");
});

test("seeds starter accounts when the API has none", async () => {
  jest
    .mocked(accountsApi.list)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        id: "seeded-account",
        name: "Compte Courant",
        accountType: "CURRENT",
        balance: 4250,
        currency: "EUR",
        color: "#76F2F8",
      },
    ]);
  jest.mocked(accountsApi.create).mockResolvedValue({
    id: "created",
    name: "Compte Courant",
    accountType: "CURRENT",
    balance: 4250,
    currency: "EUR",
    color: "#76F2F8",
  });

  await useAccountsStore.getState().loadAccounts();

  expect(accountsApi.create).toHaveBeenCalledTimes(3);
  expect(useAccountsStore.getState().selectedAccountId).toBe("seeded-account");
});
