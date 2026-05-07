import { useReceiptsStore } from "@/application/receipts/receiptsStore";
import { receiptsApi } from "@/infrastructure/api/receiptsApi";

jest.mock("@/infrastructure/api/receiptsApi", () => ({
  receiptsApi: { list: jest.fn(), scan: jest.fn(), save: jest.fn() },
}));

const RECEIPT = {
  id: "r1",
  userId: "u1",
  merchant: "Carrefour",
  total: 42.5,
  date: "2026-05-01",
  items: [{ name: "Pain", amount: 1.5 }],
  transactionId: null,
  createdAt: "2026-05-01T10:00:00Z",
};

const SCAN_RESULT = {
  merchant: "Lidl",
  total: 15.0,
  date: "2026-05-06",
  items: [{ name: "Lait", amount: 1.0 }],
};

beforeEach(() => {
  useReceiptsStore.setState({ receipts: [], isLoading: false, isScanning: false, error: null });
  jest.clearAllMocks();
});

test("loadReceipts stores receipts on success", async () => {
  jest.mocked(receiptsApi.list).mockResolvedValue([RECEIPT]);
  await useReceiptsStore.getState().loadReceipts();
  expect(useReceiptsStore.getState().receipts).toHaveLength(1);
  expect(useReceiptsStore.getState().isLoading).toBe(false);
});

test("loadReceipts sets error on failure", async () => {
  jest.mocked(receiptsApi.list).mockRejectedValue(new Error());
  await useReceiptsStore.getState().loadReceipts();
  expect(useReceiptsStore.getState().error).toBeTruthy();
});

test("scan returns parsed result and clears isScanning", async () => {
  jest.mocked(receiptsApi.scan).mockResolvedValue(SCAN_RESULT);
  const result = await useReceiptsStore.getState().scan("base64data");
  expect(result.merchant).toBe("Lidl");
  expect(useReceiptsStore.getState().isScanning).toBe(false);
});

test("save prepends receipt to list", async () => {
  jest.mocked(receiptsApi.save).mockResolvedValue(RECEIPT);
  await useReceiptsStore.getState().save("Carrefour", 42.5, "2026-05-01", [], null);
  expect(useReceiptsStore.getState().receipts[0].merchant).toBe("Carrefour");
});
