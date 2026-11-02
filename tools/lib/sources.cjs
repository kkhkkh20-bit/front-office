const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const GROUPS = { engine: ['src/engine', '.js'], graphics: ['src/gfx', '.js'], ui: ['src/ui', '.js'], styles: ['src/css', '.css'], core: ['src/core', '.mjs'] };

function checkedPath(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || path.posix.normalize(relative) !== relative || relative.startsWith('../') || path.isAbsolute(relative)) {
    throw new Error(`안전하지 않은 소스 경로: ${relative}`);
  }
  const absolute = path.resolve(root, relative);
  const realRoot = fs.realpathSync(root);
  const realFile = fs.realpathSync(absolute);
  if (!realFile.startsWith(realRoot + path.sep) || !fs.statSync(realFile).isFile()) throw new Error(`소스 경로가 저장소 밖이거나 파일이 아님: ${relative}`);
  return absolute;
}
function discover(root, directory, extension) {
  const found = [];
  for (const item of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.posix.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`소스 경로에 심볼릭 링크를 사용할 수 없음: ${relative}`);
    if (item.isDirectory()) found.push(...discover(root, relative, extension));
    else if ([extension, '.js', '.mjs', '.cjs', '.css'].some(ext => item.name.endsWith(ext))) found.push(relative);
  }
  return found.sort();
}
function loadManifest(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'src/modules.json'), 'utf8'));
}
function validateCoreGraph(root, files, entry) {
  const registered = new Set(files);
  const imports = new Map();
  for (const file of files) {
    const source = fs.readFileSync(checkedPath(root, file), 'utf8');
    const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
    const dependencies = [];
    for (const node of ast.body) {
      if (!node.source) continue;
      const specifier = node.source.value;
      if (typeof specifier !== 'string' || !(specifier.startsWith('./') || specifier.startsWith('../'))) throw new Error(`공용 모듈 경계 밖 참조: ${file} → ${specifier}`);
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      if (!registered.has(target)) throw new Error(`등록되지 않은 공용 모듈 참조: ${file} → ${target}`);
      dependencies.push(target);
    }
    walk.simple(ast, { ImportExpression() { throw new Error(`공용 모듈은 정적 참조만 허용: ${file}`); } });
    imports.set(file, dependencies);
  }
  const seen = new Set(), active = new Set();
  function visit(file) {
    if (active.has(file)) throw new Error(`공용 모듈 순환 참조: ${[...active, file].join(' → ')}`);
    if (seen.has(file)) return;
    if (!imports.has(file)) throw new Error(`공용 진입점이 등록되지 않음: ${file}`);
    active.add(file);
    for (const dependency of imports.get(file)) visit(dependency);
    active.delete(file);
    seen.add(file);
  }
  visit(entry);
  const unused = files.filter(file => !seen.has(file));
  if (unused.length) throw new Error(`진입점에서 도달하지 않는 미사용 모듈: ${unused.join(', ')}`);
  return imports;
}
function validateManifest(root, manifest) {
  if (manifest.version !== 1) throw new Error('지원하지 않는 소스 목록 버전');
  const seen = new Set();
  for (const [group, [directory, extension]] of Object.entries(GROUPS)) {
    const files = manifest.bundles && manifest.bundles[group];
    if (!Array.isArray(files) || !files.length) throw new Error(`소스 묶음이 비어 있음: ${group}`);
    for (const file of files) {
      checkedPath(root, file);
      if (!file.startsWith(directory + '/') || !file.endsWith(extension)) throw new Error(`소스 경로의 묶음이 다름: ${group} → ${file}`);
      if (seen.has(file)) throw new Error(`중복 소스: ${file}`);
      seen.add(file);
    }
    const missing = discover(root, directory, extension).filter(file => !seen.has(file));
    if (missing.length) throw new Error(`소스 목록 누락: ${missing.join(', ')}`);
  }
  for (const file of [...Object.values(manifest.html || {}), ...Object.values(manifest.vendor || {})]) checkedPath(root, file);
  if (!manifest.html?.head || !manifest.html?.body || !manifest.vendor?.faces || !manifest.vendor?.lz || !manifest.vendor?.fflate) throw new Error('HTML·라이브러리 소스 목록 누락');
  const ui = manifest.bundles.ui, boot = manifest.boot || {};
  const actions = ui.indexOf(boot.actions), guards = ui.indexOf(boot.guards), entry = ui.indexOf(boot.entry);
  if (actions < 0 || guards <= actions || entry !== ui.length - 1 || entry <= guards) throw new Error('동작·결재·부팅 순서가 올바르지 않음');
  if (manifest.coreGlobal !== 'FrontOfficeCore') throw new Error('공용 모듈 전역 이름이 올바르지 않음');
  validateCoreGraph(root, manifest.bundles.core, manifest.coreEntry);
  return manifest;
}
function sourceFile(root, group, basename) {
  const files = loadManifest(root).bundles[group].filter(file => path.posix.basename(file) === basename);
  if (files.length !== 1) throw new Error(`소스를 하나로 찾을 수 없음: ${group}/${basename}`);
  return path.join(root, files[0]);
}
module.exports = { loadManifest, validateManifest, validateCoreGraph, sourceFile };
