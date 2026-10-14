#!/usr/bin/env node
/*
  build.mjs — junta todos os módulos de js/ em UM arquivo comum: dist/app.js

  POR QUE ISSO EXISTE
  Navegadores bloqueiam módulos ES (<script type="module">) quando a página é aberta direto do
  disco (file://). Como o TaskFlow não usa servidor, o index.html carrega dist/app.js, que é um
  script comum e funciona com duplo clique.

  VOCÊ EDITA os arquivos em js/ (módulos organizados). Depois roda:
      node build.mjs            → gera dist/app.js uma vez
      node build.mjs --watch    → gera de novo toda vez que você salvar um arquivo

  Não precisa instalar nada além do Node.js. Sem Node, não dá para regerar o dist/app.js,
  mas o projeto já vem com ele pronto.

  COMO FUNCIONA
  Cada módulo vira uma função que devolve seus "exports"; os "imports" viram leituras desses
  resultados. Os módulos são emitidos na ordem das dependências. Suporta o que o projeto usa:
  `import { a, b as c } from './x.js'` e `export function/const/let/class`.
*/
import { readFileSync, writeFileSync, mkdirSync, watch } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'js');
const ENTRY = join(SRC, 'main.js');
const OUT = join(ROOT, 'dist', 'app.js');

const IMPORT_RE = /^import\s+([\s\S]*?)\s+from\s+'([^']+)';?[ \t]*$/gm;
const EXPORT_RE = /^export\s+(async\s+function|function|const|let|class)\s+([\w$]+)/gm;

const idOf = (file) => relative(SRC, file).split('\\').join('/');

/** Lê um módulo e devolve { code, deps, exports } já sem as palavras import/export. */
function parseModule(file) {
  const source = readFileSync(file, 'utf8');
  const deps = [];

  let code = source.replace(IMPORT_RE, (_, clause, specifier) => {
    const target = resolve(dirname(file), specifier);
    deps.push(target);

    const named = clause.match(/^\{([\s\S]*)\}$/);
    if (!named) throw new Error(`${idOf(file)}: só "import { ... } from" é suportado (encontrado: import ${clause})`);

    const bindings = named[1]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [original, alias] = part.split(/\s+as\s+/);
        return alias ? `${original}: ${alias}` : original;
      });
    return `const { ${bindings.join(', ')} } = __modules[${JSON.stringify(idOf(target))}];`;
  });

  const exports = [];
  code = code.replace(EXPORT_RE, (_, kind, name) => {
    exports.push(name);
    return `${kind} ${name}`;
  });

  if (/^export\s/m.test(code)) throw new Error(`${idOf(file)}: forma de "export" não suportada pelo build.`);
  return { code, deps, exports };
}

/** Percorre as dependências a partir da entrada e devolve os módulos na ordem de execução. */
function collect(entry) {
  const ordered = [];
  const state = new Map(); // arquivo → 'visiting' | 'done'

  function visit(file, trail) {
    if (state.get(file) === 'done') return;
    if (state.get(file) === 'visiting') {
      throw new Error(`Importação circular: ${[...trail, file].map(idOf).join(' → ')}`);
    }
    state.set(file, 'visiting');
    const module = parseModule(file);
    module.deps.forEach((dep) => visit(dep, [...trail, file]));
    state.set(file, 'done');
    ordered.push({ file, ...module });
  }

  visit(entry, []);
  return ordered;
}

function build() {
  const modules = collect(ENTRY);

  const body = modules
    .map(({ file, code, exports }) => `
/* ===== ${idOf(file)} ===== */
__modules[${JSON.stringify(idOf(file))}] = (function () {
${code.trim()}
return { ${exports.join(', ')} };
})();`)
    .join('\n');

  const output = `/*
  ARQUIVO GERADO por build.mjs — NÃO EDITE AQUI.
  Edite os módulos em js/ e rode:  node build.mjs
*/
(function () {
'use strict';
const __modules = {};
${body}
})();
`;

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, output);
  console.log(`✔ dist/app.js gerado (${modules.length} módulos, ${(output.length / 1024).toFixed(1)} KB)`);
}

function run() {
  try {
    build();
  } catch (error) {
    console.error(`✖ Erro no build: ${error.message}`);
    if (!process.argv.includes('--watch')) process.exit(1);
  }
}

run();

if (process.argv.includes('--watch')) {
  console.log('Observando js/ ... (Ctrl+C para sair)');
  let timer;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(run, 100);
  });
}
