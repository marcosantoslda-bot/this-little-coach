/**
 * Configuração de build (usada por `nest build` / `nest start` via nest-cli.json).
 *
 * Porquê webpack e não tsc puro? `@tlc/shared` e `@tlc/database` são pacotes
 * TypeScript em código-fonte (main -> src/index.ts). Com tsc, o output ficaria
 * espalhado por dist/apps/api e dist/packages/*, e o `require('@tlc/shared')`
 * emitido continuaria a apontar para .ts. Aqui empacotamos o código dos
 * workspaces num único dist/main.js e deixamos as dependências reais externas.
 *
 * A transpilação é feita com swc (unplugin-swc, já usado nos testes) em vez de
 * ts-loader, que não está instalado. A verificação de tipos continua a cargo do
 * ForkTsCheckerWebpackPlugin que o Nest CLI adiciona por defeito.
 */
const path = require('node:path');
const swc = require('unplugin-swc');

const WORKSPACE_PACKAGE = /^@tlc\//;
// Caminho relativo a dist/main.js — @prisma/client vive em packages/database/node_modules.
const PRISMA_CLIENT_FALLBACK = '../../../packages/database/node_modules/@prisma/client';

function resolvableFromApi(request) {
  try {
    require.resolve(request, { paths: [__dirname] });
    return true;
  } catch {
    return false;
  }
}

module.exports = (options) => ({
  ...options,
  module: { ...options.module, rules: [] },
  plugins: [
    ...options.plugins,
    swc.default.webpack({ tsconfigFile: path.join(__dirname, 'tsconfig.json'), module: { type: 'commonjs' } }),
  ],
  externals: [
    ({ request }, callback) => {
      if (!request || request.startsWith('.') || path.isAbsolute(request)) return callback();
      if (WORKSPACE_PACKAGE.test(request)) return callback(); // empacotar código dos workspaces
      if (resolvableFromApi(request)) return callback(null, `commonjs ${request}`);
      if (request === '@prisma/client' || request.startsWith('@prisma/client/')) {
        return callback(null, `commonjs ${PRISMA_CLIENT_FALLBACK}${request.slice('@prisma/client'.length)}`);
      }
      return callback();
    },
  ],
});
