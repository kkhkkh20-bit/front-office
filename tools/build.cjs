const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');
const { loadManifest, validateManifest } = require('./lib/sources.cjs');
const { buildMatch3d } = require('./build-match3d.cjs');

function build({ root = path.resolve(__dirname, '..'), manifest = loadManifest(root), write = true, engineOut, embedded3d = true } = {}) {
  validateManifest(root, manifest);
  const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
  const concatenate = files => files.map(read).join('');
  const bundled = esbuild.buildSync({
    absWorkingDir: root, entryPoints: [manifest.coreEntry], bundle: true, write: false,
    format: 'iife', globalName: manifest.coreGlobal, platform: 'browser', target: 'es2020',
    charset: 'utf8', legalComments: 'none', metafile: true,
  });
  const actual = Object.keys(bundled.metafile.inputs).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...manifest.bundles.core].sort())) throw new Error('공용 번들의 실제 입력과 소스 목록이 다름');
  const core = bundled.outputFiles[0].text;
  const engine = "'use strict';\n" + core + concatenate(manifest.bundles.engine);
  const ui = concatenate([...manifest.bundles.graphics, ...manifest.bundles.ui]);
  new vm.Script(engine, { filename: 'dist/engine.js' });
  new vm.Script(ui, { filename: '화면 번들' });
  const vendor = manifest.vendor;
  const match3d = buildMatch3d(root, manifest, {embedded:embedded3d});
  /* 서드파티 라이선스 전문: 단일 HTML 배포판에도 함께 실리게 넣는다. 게임 크레딧의 '라이선스 전문 보기'가 읽는다 */
  const licenses = fs.readdirSync(path.join(root, 'docs/licenses')).filter(f => f.endsWith('.txt')).sort()
    .map(f => `===== ${f} =====\n\n` + read(`docs/licenses/${f}`)).join('\n\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = read(manifest.html.head) + concatenate(manifest.bundles.styles) + read(manifest.html.body)
    + '<template id="lic-text">' + licenses + '</template>\n'
    + '<script id="faces">\n'
    + '/* 선수 얼굴: faces.js (c) ZenGM, Apache License 2.0 — https://github.com/zengm-games/facesjs */\n'
    + read(vendor.faces) + '</script>\n<script id="lz">\n'
    + '/* 저장 압축: lz-string (c) 2013 pieroxy, MIT License — https://github.com/pieroxy/lz-string */\n'
    + read(vendor.lz) + '\n/* 저장 압축(deflate): fflate 0.8.2 (c) 2020 Arjun Barrett, MIT License — https://github.com/101arrowz/fflate */\n'
    + read(vendor.fflate) + '</script>\n<script id="match3d">\n'
    + '/* three.js MIT; Claudeball models / field look Copyright (c) 2026 Taylor Beeston, MIT. Full notices: assets/match3d/LICENSE.txt and docs/licenses/match3d.txt. */\n'
    + match3d + '</script>\n<script id="engine">\n'
    + engine + '</script>\n<script>\n' + ui + '</script>\n</body>\n</html>\n';
  new vm.Script([...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n'), { filename: 'index.html의 스크립트' });
  if (write) {
    const outputs = engineOut ? [[path.resolve(root, engineOut), engine]] : [[path.join(root, 'dist/engine.js'), engine], [path.join(root, 'index.html'), html]];
    for (const [file, text] of outputs) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temporary = `${file}.tmp-${process.pid}`;
      try { fs.writeFileSync(temporary, text); fs.renameSync(temporary, file); }
      finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    }
  }
  return { engine, html, core };
}
module.exports = { build };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const outputIndex = args.indexOf('--engine-out');
    if (!(args.length === 0 || (args.length === 1 && args[0] === '--check') || (args.length === 2 && args[0] === '--engine-out' && !args[1].startsWith('--')))) throw new Error('사용: node tools/build.cjs [--check | --engine-out 경로]');
    const result = build({ write: !args.includes('--check'), engineOut: outputIndex >= 0 ? args[outputIndex + 1] : undefined });
    console.log(args.includes('--check') ? '소스 목록·모듈·번들 검사 통과' : outputIndex >= 0 ? `엔진 생성: ${args[outputIndex + 1]}` : `index.html 생성: ${Buffer.byteLength(result.html)} bytes`);
  } catch (error) { console.error(`빌드 실패: ${error.message}`); process.exitCode = 1; }
}
