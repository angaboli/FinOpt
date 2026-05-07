import "@testing-library/react-native/extend-expect";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// react-native@0.76 NativeEventEmitter requires a non-null native module;
// in the jest environment some modules resolve to null, so we provide a no-op class.
jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter", () => {
  class MockNativeEventEmitter {
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
    emit() {}
  }
  return MockNativeEventEmitter;
});
