const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Increase timeouts for WSL2
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set timeout to 5 minutes
      req.setTimeout(300000);
      res.setTimeout(300000);
      return middleware(req, res, next);
    };
  },
};

// Configure watchman for better performance on WSL2
config.watchFolders = [__dirname];
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts],
};

module.exports = config;
