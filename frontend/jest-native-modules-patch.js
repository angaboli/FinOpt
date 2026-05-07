'use strict';

// expo@54 uses TurboModuleRegistry exclusively (new arch, no legacy NativeModules fallback).
// Provide a minimal __turboModuleProxy so getEnforcing('SourceCode') doesn't throw.
global.__turboModuleProxy = (name) => {
  const modules = {
    SourceCode: { getConstants: () => ({ scriptURL: null }) },
    Timing: { createTimer: jest.fn(), deleteTimer: jest.fn() },
    PlatformConstants: {
      getConstants: () => ({
        forceTouchAvailable: false,
        interfaceIdiom: 'phone',
        isTesting: true,
        osVersion: '14.0',
        reactNativeVersion: { major: 0, minor: 76, patch: 0 },
        systemName: 'iOS',
        Version: 0,
      }),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: { fontScale: 2, height: 1334, scale: 2, width: 750 },
          screen: { fontScale: 2, height: 1334, scale: 2, width: 750 },
        },
        isIPhoneX_deprecated: false,
      }),
    },
    DevSettings: {
      reload: jest.fn(),
      onFastRefresh: jest.fn(),
      setHotLoadingEnabled: jest.fn(),
      setIsDebuggingRemotely: jest.fn(),
      setProfilingEnabled: jest.fn(),
      toggleElementInspector: jest.fn(),
      addMenuItem: jest.fn(),
    },
    StatusBarManager: {
      getHeight: jest.fn(),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
      setNetworkActivityIndicatorVisible: jest.fn(),
      HEIGHT: 0,
      getConstants: () => ({ HEIGHT: 42 }),
    },
    KeyboardObserver: { getConstants: () => ({}) },
    AppState: { getConstants: () => ({ initialAppState: 'active' }) },
    Networking: {
      sendRequest: jest.fn(),
      abortRequest: jest.fn(),
      clearCookies: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
  };
  return modules[name] || null;
};

// jest-expo@54 does `require('react-native/Libraries/BatchedBridge/NativeModules').default`
// but react-native@0.76 mocks NativeModules as a plain CJS object (no .default).
// This patch re-registers the mock with .default so jest-expo's setup.js can call
// Object.defineProperty on it without throwing.
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => {
  const m = {
    AlertManager: { alertWithArgs: jest.fn() },
    AsyncLocalStorage: {
      multiGet: jest.fn((keys, cb) => process.nextTick(() => cb(null, []))),
      multiSet: jest.fn((entries, cb) => process.nextTick(() => cb(null))),
      multiRemove: jest.fn((keys, cb) => process.nextTick(() => cb(null))),
      multiMerge: jest.fn((entries, cb) => process.nextTick(() => cb(null))),
      clear: jest.fn((cb) => process.nextTick(() => cb(null))),
      getAllKeys: jest.fn((cb) => process.nextTick(() => cb(null, []))),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: { fontScale: 2, height: 1334, scale: 2, width: 750 },
          screen: { fontScale: 2, height: 1334, scale: 2, width: 750 },
        },
        isIPhoneX_deprecated: false,
      }),
    },
    Linking: {
      canOpenURL: jest.fn(),
      openURL: jest.fn(),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
      addEventListener: jest.fn(),
    },
    PlatformConstants: {
      getConstants: () => ({
        forceTouchAvailable: false,
        interfaceIdiom: 'phone',
        isTesting: true,
        osVersion: '14.0',
        reactNativeVersion: { major: 0, minor: 76, patch: 0 },
        systemName: 'iOS',
        Version: 0,
      }),
    },
    SettingsManager: { settings: {}, setValues: jest.fn(), deleteValues: jest.fn() },
    StatusBarManager: {
      getHeight: jest.fn(),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
      setNetworkActivityIndicatorVisible: jest.fn(),
      HEIGHT: 0,
    },
    SourceCode: {
      getConstants: () => ({ scriptURL: null }),
    },
    UIManager: {
      measure: jest.fn(),
      measureInWindow: jest.fn(),
      measureLayout: jest.fn(),
      dispatchViewManagerCommand: jest.fn(),
      setJSResponder: jest.fn(),
      clearJSResponder: jest.fn(),
      configureNextLayoutAnimation: jest.fn(),
      setLayoutAnimationEnabledExperimental: jest.fn(),
      getConstants: () => ({}),
    },
    Timing: {
      createTimer: jest.fn(),
      deleteTimer: jest.fn(),
    },
  };
  // jest-expo@54 accesses .default — add self-reference so Object.defineProperty works
  m.default = m;
  return m;
});

// expo-modules-core@3.x removed src/Refs; jest-expo@54 still tries to mock it.
// virtual: true tells jest not to require the file to exist on disk.
jest.mock('expo-modules-core/src/Refs', () => ({
  createSnapshotFriendlyRef: () => {
    const ref = { current: null };
    Object.defineProperty(ref, 'toJSON', { value: () => '[React.ref]' });
    return ref;
  },
}), { virtual: true });
