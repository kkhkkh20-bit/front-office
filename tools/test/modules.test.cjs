const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const { loadManifest, validateManifest, validateCoreGraph } = require('../lib/sources.cjs');
const { build } = require('../build.cjs');
const copy = value => JSON.parse(JSON.stringify(value));

test('소스 목록은 중복·누락·경로 이탈·부팅 순서 변경을 거절한다', () => {
  const manifest = loadManifest(root);
  assert.doesNotThrow(() => validateManifest(root, manifest));
  const duplicate = copy(manifest);
  duplicate.bundles.engine.push(duplicate.bundles.engine[0]);
  assert.throws(() => validateManifest(root, duplicate), /중복/);
  const missing = copy(manifest);
  missing.bundles.engine.splice(1, 1);
  assert.throws(() => validateManifest(root, missing), /누락/);
  const outside = copy(manifest);
  outside.bundles.engine[0] = '../outside.js';
  assert.throws(() => validateManifest(root, outside), /경로/);
  const wrongBoot = copy(manifest);
  wrongBoot.bundles.ui.reverse();
  assert.throws(() => validateManifest(root, wrongBoot), /부팅|순서/);
});

test('공용 모듈은 순환 참조·외부 영역 참조·사용하지 않는 등록을 거절한다', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'front-office-modules-'));
  try {
    fs.mkdirSync(path.join(fixture, 'src/core'), { recursive: true });
    const put = (name, source) => fs.writeFileSync(path.join(fixture, 'src/core', name), source);
    const files = ['src/core/a.mjs', 'src/core/b.mjs'];
    put('a.mjs', "import './b.mjs'; export const a = 1;");
    put('b.mjs', "import './a.mjs'; export const b = 2;");
    assert.throws(() => validateCoreGraph(fixture, files, files[0]), /순환/);
    put('b.mjs', "import '../engine/private.js'; export const b = 2;");
    assert.throws(() => validateCoreGraph(fixture, files, files[0]), /경계|등록/);
    put('a.mjs', 'export const a = 1;');
    put('b.mjs', 'export const b = 2;');
    assert.throws(() => validateCoreGraph(fixture, files, files[0]), /미사용|도달/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('빌드는 결정적이며 실패 시 기존 결과물을 변경하지 않는다', () => {
  const first = build({ root, write: false });
  const second = build({ root, write: false });
  assert.equal(first.engine, second.engine);
  assert.equal(first.html, second.html);
  assert.equal(first.html.split('<script id="engine">').length, 2);
  assert.ok(first.html.includes(first.engine));
  assert.doesNotThrow(() => new Function(first.engine));
  assert.doesNotThrow(() => new Function([...first.html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]).join('\n')));
  const paths = ['index.html', 'dist/engine.js'];
  const before = paths.map(file => fs.readFileSync(path.join(root, file)));
  const invalid = loadManifest(root);
  invalid.bundles.engine.push(invalid.bundles.engine[0]);
  assert.throws(() => build({ root, manifest: invalid }), /중복/);
  paths.forEach((file, i) => assert.deepEqual(fs.readFileSync(path.join(root, file)), before[i]));
});

test('공용 계산 모듈은 브라우저나 게임 상태 없이 같은 값을 계산한다', async () => {
  const core = await import(pathToFileURL(path.join(root, 'src/core/index.mjs')));
  assert.equal(core.sum([1, 2, 3]), 6);
  assert.equal(core.avg([]), 0);
  assert.equal(core.clamp(12, 1, 10), 10);
  assert.equal(core.r5(12), 10);
  assert.equal(core.dv(51), 63);
  assert.equal(core.dv(65), 84);
  assert.equal(core.dv(-100), 30);
  assert.equal(core.dv(100), 100);
  assert.equal(core.dvSd(51, 2), 2);
  const random = core.createRandom(() => 0.25);
  assert.equal(random.ri(1, 8), 3);
  assert.equal(random.pick(['가', '나', '다', '라']), '나');
  assert.equal(random.rr(2.2), 2);
  assert.equal(random.rr(2.5), 3);
  assert.ok(Math.abs(random.N(5, 3) - 5) < 1e-12);
  const day = core.dnum(2026, 1, 1);
  assert.equal(day - core.dnum(2025, 12, 31), 1);
  assert.deepEqual(core.dobj(day), { y: 2026, m: 1, d: 1, w: 4 });
  assert.equal(core.dstr(day), '2026년 1월 1일 목요일');
  assert.equal(core.dmd(day), '1월 1일');
  assert.equal(core.dsh(day), '1/1');
  assert.equal(core.onOrAfter(2026, 3, 25, 6), core.dnum(2026, 3, 28));
});

test('새 파일과 다른 확장자의 소스도 누락을 감지하며 저장소 밖 링크를 거절한다', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'front-office-inventory-'));
  const fixture = path.join(parent, 'project');
  const manifest = {
    version: 1, coreEntry: 'src/core/index.mjs', coreGlobal: 'FrontOfficeCore',
    bundles: {
      core: ['src/core/index.mjs'], engine: ['src/engine/start.js'], graphics: ['src/gfx/draw.js'],
      ui: ['src/ui/actions.js', 'src/ui/guards.js', 'src/ui/boot.js'], styles: ['src/css/base.css'],
    },
    html: { head: 'src/html/head.html', body: 'src/html/body.html' },
    vendor: { faces: 'vendor/faces.js', lz: 'vendor/lz.js', fflate: 'vendor/fflate.js' },
    boot: { actions: 'src/ui/actions.js', guards: 'src/ui/guards.js', entry: 'src/ui/boot.js' },
  };
  try {
    const files = [...Object.values(manifest.bundles).flat(), ...Object.values(manifest.html), ...Object.values(manifest.vendor)];
    for (const file of files) {
      const target = path.join(fixture, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file === manifest.coreEntry ? 'export const value = 1;' : '');
    }
    assert.doesNotThrow(() => validateManifest(fixture, manifest));
    const unlisted = path.join(fixture, 'src/core/unlisted.js');
    fs.writeFileSync(unlisted, 'export const missing = 1;');
    assert.throws(() => validateManifest(fixture, manifest), /누락/);
    fs.unlinkSync(unlisted);
    const outside = path.join(parent, 'outside.js');
    fs.writeFileSync(outside, '');
    const source = path.join(fixture, manifest.bundles.engine[0]);
    fs.unlinkSync(source);
    fs.symlinkSync(outside, source);
    assert.throws(() => validateManifest(fixture, manifest), /경로/);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('화면 검사 서버는 포트 충돌 없이 HTML 하나만 제공하고 직접 종료한다', async () => {
  const { startHtmlServer } = require('../lib/ui-server.cjs');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'front-office-ui-server-'));
  const file = path.join(fixture, 'game.html');
  fs.writeFileSync(file, '<!doctype html><title>검사</title>');
  let first, second;
  try {
    first = await startHtmlServer(file);
    second = await startHtmlServer(file);
    assert.notEqual(first.url, second.url);
    const response = await fetch(first.url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(await response.text(), '<!doctype html><title>검사</title>');
    assert.equal((await fetch(new URL('/other-file', first.url))).status, 404);
    await first.close();
    await assert.rejects(fetch(first.url));
    first = null;
    assert.equal((await fetch(second.url)).status, 200);
  } finally {
    if (first) await first.close();
    if (second) await second.close();
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
