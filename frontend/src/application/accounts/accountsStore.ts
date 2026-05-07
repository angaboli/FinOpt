import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { AccountFormValues, AccountSummary } from "@/domain/accounts/types";
import { accountsApi } from "@/infrastructure/api/accountsApi";
import { finoptTheme } from "@/presentation/theme/theme";

const DEFAULT_ACCOUNT_KEY = "finopt.defaultAccountId";

interface AccountsState {
  accounts: AccountSummary[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  createAccount: (values: AccountFormValues) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  selectAccount: (accountId: string) => void;
}

const starterAccounts: AccountFormValues[] = [
  {
    name: "Compte Courant",
    accountType: "CURRENT",
    balance: 4250,
    currency: "EUR",
    color: finoptTheme.colors.secondary,
  },
  {
    name: "Epargne",
    accountType: "SAVINGS",
    balance: 45000,
    currency: "EUR",
    color: finoptTheme.colors.primary,
  },
  {
    name: "Depenses communes",
    accountType: "JOINT",
    balance: 5200.75,
    currency: "EUR",
    color: finoptTheme.colors.orange,
  },
];

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  selectedAccountId: null,
  isLoading: false,
  error: null,

  async loadAccounts() {
    set({ isLoading: true, error: null });
    try {
      let accounts = await accountsApi.list();
      if (accounts.length === 0) {
        for (const starterAccount of starterAccounts) {
          await accountsApi.create(starterAccount);
        }
        accounts = await accountsApi.list();
      }
      const stored = await SecureStore.getItemAsync(DEFAULT_ACCOUNT_KEY);
      const validStored = stored && accounts.some((a) => a.id === stored) ? stored : null;
      set({
        accounts,
        selectedAccountId: validStored ?? get().selectedAccountId ?? accounts[0]?.id ?? null,
        isLoading: false,
      });
    } catch {
      set({ error: "Impossible de charger les comptes", isLoading: false });
    }
  },

  async createAccount(values) {
    set({ isLoading: true, error: null });
    try {
      const account = await accountsApi.create(values);
      set((state) => ({
        accounts: [...state.accounts, account],
        selectedAccountId: account.id,
        isLoading: false,
      }));
    } catch {
      set({ error: "Impossible de creer le compte", isLoading: false });
    }
  },

  async deleteAccount(accountId) {
    await accountsApi.remove(accountId);
    set((state) => {
      const accounts = state.accounts.filter((account) => account.id !== accountId);
      return {
        accounts,
        selectedAccountId:
          state.selectedAccountId === accountId
            ? accounts[0]?.id ?? null
            : state.selectedAccountId,
      };
    });
  },

  selectAccount(accountId) {
    set({ selectedAccountId: accountId });
    void SecureStore.setItemAsync(DEFAULT_ACCOUNT_KEY, accountId);
  },
}));
