// Metro num monorepo pnpm: observa a raiz (para @tlc/shared em TypeScript puro)
// e resolve módulos tanto no node_modules da app como no da raiz.
// Os symlinks do pnpm já são seguidos por defeito no Metro do Expo SDK 57.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
