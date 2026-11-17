/* 래더 기기 쪽 공용 함수 점검(외부 검수 11-17 ⑤): 저장 공간 실패 때 결과 줄 · 플레이어 동시 만들기 · 레전드 우승 목표 · CSV 식 주입 · 시즌별 이름 기록 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const mem = (quota) => { const m = new Map(); return { m, getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => { if (quota && quota(k)) throw new Error('QuotaExceededError'); m.set(k, String(v)); }, removeItem: k => m.delete(k) }; };

test('#46 저장 공간이 모자라면 결과는 메모리 줄에 남고 memOnly로 알린다(빈 줄인데 queued라고 하지 않음)', async () => {
  const { netCreate, NET_QUEUE } = await import(path.join(root, 'src/core/net.mjs')); let full = true;
  const S = mem(k => full && k === NET_QUEUE); S.setItem('fo-net-v1-token', 'ft1.x');
  const N = netCreate({ storage: S, fetch: async () => { throw new TypeError('offline'); }, sleep: async () => {} });
  assert.equal(N.enqueue({ key: 'mem-1', rank: 1, teams: 10, w: 1, l: 0, d: 0 }), false, '쓰기 실패를 알림');
  assert.equal(N.storeFail, true); assert.deepEqual(N.queue().map(x => x.key), ['mem-1'], '메모리 줄');
  const r = await N.result({ key: 'mem-2', rank: 2, teams: 10, w: 1, l: 0, d: 0 }); assert.equal(r.queued, true); assert.equal(r.memOnly, true); assert.deepEqual(N.queue().map(x => x.key), ['mem-1', 'mem-2']);
  full = false; N.enqueue({ key: 'mem-3', rank: 3, teams: 10, w: 1, l: 0, d: 0 }); assert.equal(N.storeFail, false); assert.deepEqual(JSON.parse(S.getItem(NET_QUEUE)).map(x => x.key), ['mem-1', 'mem-2', 'mem-3'], '공간이 생기면 기기에 다시 씀');
});
test('#45 ensurePlayer를 동시에 불러도 플레이어는 하나', async () => {
  const { netCreate } = await import(path.join(root, 'src/core/net.mjs')); let posts = 0;
  const fetch = async (u, o) => { if (u.endsWith('/player') && o.method === 'POST') { posts++; await new Promise(r => setTimeout(r, 20)); return new Response(JSON.stringify({ token: 'ft1.t' + posts, player: { id: 'p' + posts, nickname: '단장' } }), { status: 201 }); } return new Response('{}', { status: 404 }); };
  const N = netCreate({ storage: mem(), fetch, sleep: async () => {} });
  const [a, b, c] = await Promise.all([N.ensurePlayer('단장'), N.ensurePlayer('단장'), N.ensurePlayer('단장')]);
  assert.equal(posts, 1); assert.ok(a.ok && b.ok && c.ok); assert.equal(N.player().id, 'p1');
  assert.equal((await N.ensurePlayer('단장')).ok, true); assert.equal(posts, 1, '토큰이 있으면 다시 만들지 않음');
});
test('#41 레전드 리그 우승 목표는 레전드에서 1위 한 리그만 센다', async () => {
  const { ulMissions } = await import(path.join(root, 'src/core/uladder.mjs'));
  const seas = { id: 5, n: 2, win: 1, up: 1, top: 470, best: 4 }, H = [{ s: 5, tier: 3, rank: 1, move: 'up' }, { s: 5, tier: 4, rank: 4 }];
  assert.equal(ulMissions(seas, H, 5, 4).find(m => m.k === 'up').done, false, '챔피언스 1위로는 안 참');
  assert.equal(ulMissions(seas, H.concat([{ s: 5, tier: 4, rank: 1 }]), 5, 4).find(m => m.k === 'up').done, true);
});
test('#42 CSV: =·+·-·@·탭으로 시작하는 글은 앞에 \' 를 붙이고 숫자(음수 득실)는 그대로', async () => {
  const { ulCsv } = await import(path.join(root, 'src/core/uladder.mjs'));
  const csv = ulCsv([{ a: '=SUM(A1)', b: -12, c: '+1', d: '@x', e: '\tq', f: '-3', g: '-공격' }], [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D'], ['e', 'E'], ['f', 'F'], ['g', 'G']]).split('\r\n')[1];
  assert.equal(csv, "'=SUM(A1),-12,+1,'@x,'\tq,-3,'-공격");
});
test('#48·#51 시즌·단계 칸에 그때 이름·포지션을 남기고, 표 줄은 시즌·단계별 나눔(tsplits)을 준다', async () => {
  const { ulPsAdd, ulPsRows } = await import(path.join(root, 'src/core/uladder.mjs')); const ps = {};
  const bat = { id: 7, g: 27, pa: 100, ab: 90, h: 30 };
  ulPsAdd(ps, { sid: 'S3', tier: 0, lid: 1, P: [{ id: 7, name: '김옛날', pos: 'SS', age: 24 }], bat: [bat] });
  ulPsAdd(ps, { sid: 'S4', tier: 1, lid: 2, P: [{ id: 7, name: '김새이름', pos: '2B', age: 25 }], bat: [bat] });
  const r = ulPsRows(ps, 'b', {})[0]; assert.equal(r.name, '김새이름'); assert.deepEqual(r.splits.map(s => [s.sid, s.name, s.pos]), [['S4', '김새이름', '2B'], ['S3', '김옛날', 'SS']]);
  assert.deepEqual(r.tsplits.map(s => [s.sid, s.tier]), [['S4', 1], ['S3', 0]]);
});
