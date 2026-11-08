/* eslint-env jest */

// React Native Gesture Handler setup
try {
  require('react-native-gesture-handler/jestSetup');
} catch (e) {
  // gesture handler fallback
}

// React Native Reanimated setup
try {
  require('react-native-reanimated/jestSetup');
} catch (e) {
  // Reanimated jest setup optional
}

// Mock Modal for synchronous testing
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockModal = (props) => {
    if (!props.visible) return null;
    return React.createElement(
      View,
      { testID: props.testID || 'modal-container', ...props },
      props.children
    );
  };
  return {
    __esModule: true,
    default: MockModal,
    Modal: MockModal,
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockComponent = (name) => {
    return function MockSvgElement(props) {
      return React.createElement(View, { ...props, testID: name }, props.children);
    };
  };
  return {
    __esModule: true,
    default: createMockComponent('Svg'),
    Svg: createMockComponent('Svg'),
    Circle: createMockComponent('Circle'),
    G: createMockComponent('G'),
    Path: createMockComponent('Path'),
    Rect: createMockComponent('Rect'),
    Text: createMockComponent('Text'),
    TSpan: createMockComponent('TSpan'),
    Defs: createMockComponent('Defs'),
    LinearGradient: createMockComponent('LinearGradient'),
    RadialGradient: createMockComponent('RadialGradient'),
    Stop: createMockComponent('Stop'),
    Line: createMockComponent('Line'),
    Polyline: createMockComponent('Polyline'),
    Polygon: createMockComponent('Polygon'),
    Ellipse: createMockComponent('Ellipse'),
  };
});

// Self-contained AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () => {
  let storage = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((key, value) => {
        storage[key] = String(value);
        return Promise.resolve(null);
      }),
      getItem: jest.fn((key) => {
        return Promise.resolve(storage[key] !== undefined ? storage[key] : null);
      }),
      removeItem: jest.fn((key) => {
        delete storage[key];
        return Promise.resolve(null);
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve(null);
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((k) => [k, storage[k] !== undefined ? storage[k] : null]))
      ),
      multiSet: jest.fn((keyValuePairs) => {
        keyValuePairs.forEach(([k, v]) => {
          storage[k] = String(v);
        });
        return Promise.resolve(null);
      }),
      multiRemove: jest.fn((keys) => {
        keys.forEach((k) => delete storage[k]);
        return Promise.resolve(null);
      }),
    },
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// Mock react-native-config
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:3000/api/v1',
  SUPABASE_URL: 'https://dev.supabase.co',
  SUPABASE_ANON_KEY: 'test_anon_key',
  APP_ENV: 'test',
  ENABLE_MOCKS: 'false',
}));

// Mock react-native-bootsplash
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(true),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn().mockReturnValue({ container: {}, logo: {} }),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    SECURITY_LEVEL: {},
    ACCESSIBLE: {},
    ACCESS_CONTROL: {},
    AUTHENTICATION_TYPE: {},
    setGenericPassword: jest.fn(async (username, password, options) => {
      const service = options?.service || 'default';
      store.set(service, { username, password });
      return true;
    }),
    getGenericPassword: jest.fn(async (options) => {
      const service = options?.service || 'default';
      return store.get(service) || false;
    }),
    resetGenericPassword: jest.fn(async (options) => {
      const service = options?.service || 'default';
      store.delete(service);
      return true;
    }),
  };
});

// Mock @react-native-documents/picker
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn().mockResolvedValue([
    {
      uri: 'file:///path/to/resume.pdf',
      name: 'resume.pdf',
      type: 'application/pdf',
      size: 102400,
    },
  ]),
  types: {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    allFiles: '*/*',
  },
  errorCodes: {
    OPERATION_CANCELED: 'OPERATION_CANCELED',
    IN_PROGRESS: 'ASYNC_OP_IN_PROGRESS',
    UNABLE_TO_OPEN_FILE_TYPE: 'UNABLE_TO_OPEN_FILE_TYPE',
  },
  isErrorWithCode: jest.fn().mockReturnValue(false),
}));

// Mock react-native-blob-util
jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: '/data/user/0/com.latexai/files',
      CacheDir: '/data/user/0/com.latexai/cache',
      DownloadDir: '/data/user/0/com.latexai/downloads',
      MainBundleDir: '/data/user/0/com.latexai',
    },
    exists: jest.fn().mockResolvedValue(true),
    unlink: jest.fn().mockResolvedValue(true),
    mkdir: jest.fn().mockResolvedValue(true),
    stat: jest.fn().mockResolvedValue({ size: 1024, lastModified: Date.now() }),
    writeFile: jest.fn().mockResolvedValue(true),
    readFile: jest.fn().mockResolvedValue('test data'),
    cp: jest.fn().mockResolvedValue(true),
    mv: jest.fn().mockResolvedValue(true),
  },
  config: jest.fn(() => ({
    fetch: jest.fn().mockResolvedValue({
      info: () => ({ status: 200 }),
      path: () => '/data/user/0/com.latexai/cache/cached.pdf',
      respInfo: { status: 200 },
    }),
  })),
  fetch: jest.fn().mockResolvedValue({
    info: () => ({ status: 200 }),
    base64: jest.fn().mockResolvedValue('base64pdf...'),
  }),
}));

// Mock react-native-pdf
jest.mock('react-native-pdf', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: function MockPdf(props) {
      React.useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
          if (isMounted && props.onLoadComplete) {
            props.onLoadComplete(3, '/path/to/pdf', { width: 595, height: 842 });
          }
        }, 10);
        return () => {
          isMounted = false;
          clearTimeout(timer);
        };
      }, [props.source?.uri]);
      return React.createElement(View, { testID: props.testID || 'pdf-viewer-native', ...props });
    },
  };
});
