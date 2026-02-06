const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

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

// Configure for monorepo
// Only watch specific directories to avoid Python venv and other build artifacts
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'packages/shared'),
];

// Configure resolver for monorepo
config.resolver = {
  ...config.resolver,
  // Look for node_modules in both project and workspace root
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  // Add extraNodeModules to map @finopt/shared to the actual package
  extraNodeModules: {
    '@finopt/shared': path.resolve(workspaceRoot, 'packages/shared'),
  },
  sourceExts: [...config.resolver.sourceExts],
  // Explicitly ignore these directories
  blockList: [
    // Python virtual environments
    /.*\/venv\/.*/,
    /.*\/\.venv\/.*/,
    /.*\/__pycache__\/.*/,
    // Build outputs (exclude node_modules build dirs which packages need)
    /apps\/mobile\/dist\/.*/,
    /packages\/shared\/dist\/.*/,
    // API directory (Python backend)
    /.*\/apps\/api\/.*/,
  ],
};

module.exports = config;
