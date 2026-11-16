/* 프런트컵 리그 형식(형식 A) 주최 도구 부분: tools/cup-host.cjs가 부른다.
   10팀 리그(짝마다 3연전, 팀당 27경기, 홈 어드밴티지 없음) → 와일드카드(4위 1승 안고 시작) → 준PO(5전) → PO(5전) → KS(7전).
   진행 규칙은 공용 모듈(src/core/cup.mjs cupLeagueRun)이 정하고, 여기서는 엔진 경기를 넘기고 날짜별 게시 묶음을 쓴다.
   out/day1      시드·전력표
   out/day2~4    리그 1/3씩: 순위표, 주간 MVP, 명경기 하나(중계·박스·줄 점수·게시글)
   out/day5      와일드카드 + 준PO 경기 글, out/day6 PO, out/day7 KS
   out/final     최종 결과, 개인 타이틀, 경기 다시 보기 번호 목록, 공개 결과(hall.json) */
const fs = require('node:fs'), path = require('node:path');
module.exports = function (H) {
  const { C, engine, entryOf, addEntry, playable, humans, lab, jo, ovrTxt, save, W, J, postOf, addStats, stripFaces, gameRecs, hallDeck, opt } = H;
  const DIR = () => H.DIR(), out = (...p) => path.join(DIR(), 'out', ...p);
  const ent = (S, h) => S.entries[h];
  const L = (S, h) => lab(ent(S, h));
  const pct = x => (x.w + x.l ? x.w / (x.w + x.l) : 0).toFixed(3).replace(/^0/, '');
  const aiKeys = S => Object.values(S.entries).filter(x => x.ai).map(x => x.h);
  const dvOf = (Core, p) => Core.dv(p.isP ? p.r.stf * .44 + p.r.ctl * .44 + p.r.sta * .12 : p.r.con * .3 + p.r.pow * .25 + p.r.eye * .15 + p.r.spd * .1 + p.r.def * .2);
  /* 공개 로스터: 타순(자리) + 선발 + 마무리 */
  function rosterOf(h) { const Core = C(), e = entryOf(h), P = new Map(e.P.map(p => [p.id, p])), dv = p => dvOf(Core, p);
    return [...e.ln.map(([id, pos]) => ({ pos, n: P.get(id).name, o: dv(P.get(id)) })), ...e.rot.map((id, i) => ({ pos: `선발${i + 1}`, n: P.get(id).name, o: dv(P.get(id)) })), ...(e.pen[0] ? [{ pos: '마무리', n: P.get(e.pen[0]).name, o: dv(P.get(e.pen[0])) }] : [])]; }
  const POS = { C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수', SS: '유격수', LF: '좌익수', CF: '중견수', RF: '우익수', DH: '지명타자' };
  function powerTable(S) {
    const lines = [`[${S.cfg.title} 참가팀 전력표]`, '', `참가 ${humans(S).length}팀${aiKeys(S).length ? ` + AI 구단 ${aiKeys(S).length}팀(리그 평균 전력, 타이틀·칭호 없음)` : ''} · OVR은 총|투수 타자입니다.`, ''];
    S.seeds.forEach((h, i) => { const x = ent(S, h), e = entryOf(h), R = rosterOf(h);
      lines.push(`${i + 1}. ${lab(x)}${x.ai ? ' (AI)' : ''} · OVR ${ovrTxt(x.ovr)}${e.mgr && e.mgr.name ? ` · 감독 ${e.mgr.name}` : ''}${e.res && !x.ai ? ` · 그해 ${e.res.rank ? e.res.rank + '위 ' : ''}${e.res.w}승 ${e.res.l}패${e.res.champ ? ' 우승' : ''}` : ''}`);
      lines.push('   타순: ' + R.filter(r => POS[r.pos]).map((r, k) => `${k + 1}.${r.n}(${r.pos} ${r.o})`).join(' '));
      lines.push('   선발: ' + R.filter(r => r.pos.startsWith('선발')).map(r => `${r.n} ${r.o}`).join(' · ') + (R.find(r => r.pos === '마무리') ? ` / 마무리 ${R.find(r => r.pos === '마무리').n}` : ''));
      lines.push(''); });
    return lines.join('\n');
  }
  function seedLeague(S) {
    if (S.league) { console.error('이미 경기를 치렀습니다. 시드를 바꾸지 않습니다.'); process.exit(1); }
    const Core = C(), N = S.cfg.teams || 10;
    for (const x of Object.values(S.entries)) if (x.ai) delete S.entries[x.h]; /* 다시 정하면 AI 채우기도 다시 */
    let H0 = Core.cupSeed(humans(S));
    if (H0.length > N) { console.log(`참가 ${H0.length}팀이 정원 ${N}팀을 넘습니다. 시드(OVR) 순으로 ${N}팀만 나갑니다: 뺄 팀은 drop으로 먼저 정하세요.`); H0 = H0.slice(0, N); }
    if (H0.length < N) { const ai = engine().cupAiEntries(N - H0.length, S.cfg.id); for (const e of ai) addEntry(S, e, 'AI'); console.log(`AI 구단 ${ai.length}팀으로 채웠습니다(리그 평균 전력, 개인 타이틀·칭호 없음).`); }
    const keep = new Set(H0.map(x => x.h)); const all = Core.cupSeed(playable(S).filter(x => x.ai || keep.has(x.h)));
    S.seeds = all.map(x => x.h); all.forEach((x, i) => { S.entries[x.h].seed = i + 1; }); S.bracket = null; save(S);
    console.log(`시드 확정: ${all.length}팀 리그`); all.forEach((x, i) => console.log(`${String(i + 1).padStart(3)} ${lab(x).padEnd(16)} ${ovrTxt(x.ovr)}${x.ai ? ' (AI)' : ''}`));
    const t = powerTable(S); W(out('day1', '전력표.txt'), t + '\n');
    const intro = [`[${S.cfg.title}] 참가팀과 진행 방식`, '', `${S.cfg.title}에 ${humans(S).length}팀이 참가했습니다.${aiKeys(S).length ? ` 빈자리 ${aiKeys(S).length}곳은 리그 평균 전력의 AI 구단이 채웁니다(AI는 개인 타이틀·칭호를 받지 않습니다).` : ''}`, '',
      '■ 진행', `- 정규리그: ${all.length}팀이 서로 3연전씩, 팀당 ${(all.length - 1) * (S.cfg.meet || 3)}경기. 모든 구장 같은 규격, 홈 어드밴티지 없음.`, '- 순위: 승률 → 동률 팀끼리 맞대결 → 득실차.',
      '- 가을야구: 와일드카드(4위 vs 5위, 4위가 1승을 안고 시작해 한 번 이기거나 비기면 진출) → 준플레이오프(3위, 5전3선승) → 플레이오프(2위, 5전3선승) → 한국시리즈(1위, 7전4선승).',
      '- 게시: 2~4일째 리그 1/3씩(순위·주간 MVP·명경기), 5일째 와일드카드·준PO, 6일째 PO, 7일째 한국시리즈.', '', t];
    W(out('day1', 'post.txt'), intro.join('\n') + '\n'); console.log('→ ' + out('day1'));
  }
  /* 한 경기 파일 묶음 */
  function gameFiles(dir, S, res, gi, info, note, labs) { const g = res.games[gi];
    W(path.join(dir, 'EventLog.txt'), g.log + '\n'); W(path.join(dir, 'EventLog_bat.txt'), g.bat + '\n'); W(path.join(dir, 'EventLog_pit.txt'), g.pit + '\n'); W(path.join(dir, 'LineScore.txt'), g.line + '\n');
    W(path.join(dir, 'post.txt'), postOf(S, info, res, g, gi, note, labs) + '\n'); }
  function standTxt(S, st) {
    const rows = ['순위  팀                경기  승  패  무  승률   승차  득  실  득실', ...st.map(x => `${String(x.rank).padStart(2)}    ${L(S, x.key).padEnd(16)} ${String(x.g).padStart(3)} ${String(x.w).padStart(3)} ${String(x.l).padStart(3)} ${String(x.t).padStart(3)}  ${pct(x)}  ${x.gb ? x.gb.toFixed(1).padStart(4) : '   -'} ${String(x.rs).padStart(3)} ${String(x.ra).padStart(3)} ${(x.diff > 0 ? '+' : '') + x.diff}${x.tb ? ` (${x.tb})` : ''}`)];
    return rows.join('\n');
  }
  function psNote(S, P, ser, gi) {
    const Core = C(), G = ser.games.slice(0, gi + 1), st = Core.cupSeriesState(P, G), A = L(S, ser.a), B = L(S, ser.b);
    const last = gi === ser.games.length - 1, nxt = Core.CUP_POST[Core.CUP_POST.findIndex(x => x.id === P.id) + 1];
    if (!last) return P.wc ? `4위 ${jo(A, '은/는')} 아직 1승을 안고 있습니다. 2차전에서 ${jo(A, '이/가')} 이기거나 비기면 ${nxt.short}에 오르고, ${jo(B, '이/가')} 이기면 ${jo(B, '이/가')} 오릅니다.` : `시리즈는 ${A} ${st.wa}승, ${B} ${st.wb}승입니다. 다음 경기가 이어집니다.`;
    const Wn = L(S, ser.win), score = P.wc ? '' : `${Math.max(st.wa, st.wb)}승 ${Math.min(st.wa, st.wb)}패로 `;
    if (P.id === 'KS') return `${jo(Wn, '이/가')} ${score}${S.cfg.title} 우승을 차지했습니다.`;
    return `${jo(Wn, '이/가')} ${score}${nxt.name}에 올랐습니다. 상대는 ${nxt.hi}위 ${L(S, (S.league || S._L).top[nxt.hi - 1])}입니다.`;
  }
  function runLeague(S) {
    if (S.league) return console.log('이미 모든 경기를 치렀습니다. 결과: node tools/cup-host.cjs results ' + DIR());
    if (!S.seeds || !S.seeds.length) { console.error('먼저 seed를 실행하세요.'); process.exit(1); }
    const Core = C(), keys = S.seeds, sched = Core.cupLeagueSched(keys.length, S.cfg.meet || 3), R = sched[sched.length - 1].r;
    S.stats = { L: { bat: {}, pit: {} }, P1: { bat: {}, pit: {} }, P2: { bat: {}, pit: {} }, P3: { bat: {}, pit: {} }, PS: { bat: {}, pit: {} } };
    const t0 = Date.now(); let n = 0;
    const R0 = Core.cupLeagueRun(keys, S.cfg, (a, b, o) => {
      const res = engine().cupMatch(entryOf(a), entryOf(b), o); if (!res.ok) { console.error('경기 실패: ' + JSON.stringify(res.errors || res)); process.exit(1); }
      const labs = { A: L(S, a), B: L(S, b) }; n += res.games.length;
      if (o.round[0] === 'L') { const part = Core.cupLeaguePart(+o.round.slice(1), R); addStats(S, res, S.stats.L, labs); addStats(S, res, S.stats['P' + part], labs); }
      else addStats(S, res, S.stats.PS, labs);
      gameRecs(`${S.cfg.id}-${o.match}`, o.round[0] === 'L' ? `리그 ${o.round.slice(1)}라운드` : (Core.CUP_POST.find(x => x.id === o.round) || {}).name || o.round, labs.A, labs.B, res);
      if (o.round[0] === 'L' && o.match.endsWith('-1')) process.stdout.write(`\r리그 ${o.round.slice(1)}/${R}라운드 · ${n}경기`);
      return res;
    });
    console.log(`\r리그·가을야구 ${n}경기 · ${Math.round((Date.now() - t0) / 1000)}초          `);
    S.league = { R, stand: R0.stand, top: R0.top, champ: R0.champ, runner: R0.runner, series: R0.series.map(s => { const x = Object.assign({}, s); delete x.res; return x; }) };
    S._L = S.league; writeDays(S, R0); delete S._L; save(S);
    resultsLeague(S);
  }
  function writeDays(S, R0) {
    const Core = C(), R = S.league.R, no = aiKeys(S), lg = R0.series.filter(s => s.kind === 'L');
    for (let part = 1; part <= 3; part++) {
      const ser = lg.filter(s => Core.cupLeaguePart(s.r, R) === part), upto = Math.max(...ser.map(s => s.r)), from = Math.min(...ser.map(s => s.r)), day = `day${part + 1}`;
      const games = lg.filter(s => s.r <= upto).flatMap(s => s.games.map(g => ({ a: s.a, b: s.b, sa: g.sa, sb: g.sb })));
      const st = Core.cupStandings(S.seeds, games), stT = standTxt(S, st);
      const T = S.stats['P' + part], mvp = Core.cupMvp(Object.values(T.bat), Object.values(T.pit), no);
      let best = null; for (const s of ser) s.games.forEach((g, gi) => { const d = Core.cupDrama(g); if (!best || d > best.d) best = { d, s, gi }; });
      const mg = best.s, mres = mg.res, g = mres.games[best.gi], labs = { A: L(S, mg.a), B: L(S, mg.b) };
      const why = [g.walk ? `${g.inn}회 끝내기` : '', g.inn > 9 && !g.walk ? `${g.inn}회 연장` : '', g.lc ? `역전 ${g.lc}번` : '', Math.abs(g.sa - g.sb) <= 1 ? (g.sa === g.sb ? '무승부' : '1점 차') : ''].filter(Boolean).join(' · ') || `${g.sa + g.sb}점 난타전`;
      gameFiles(out(day, '명경기'), S, mres, best.gi, { mid: mg.id, rname: `리그 ${mg.r}라운드`, ser: ` ${best.gi + 1}차전`, noteH: '■ 순위' }, `이 경기 뒤 순위는 오늘 글의 순위표를 보세요.`, labs);
      W(out(day, '순위.txt'), stT + '\n');
      const res = []; for (let r = from; r <= upto; r++) { res.push(`${r}라운드`); for (const s of ser.filter(x => x.r === r)) { const wa = s.games.filter(x => x.sa > x.sb).length, wb = s.games.filter(x => x.sb > x.sa).length, t = s.games.length - wa - wb; res.push(`  ${L(S, s.a)} ${wa}승 ${wb}패${t ? ` ${t}무` : ''} ${L(S, s.b)} (${s.games.map(x => x.sa + ':' + x.sb).join(', ')})`); } }
      const post = [`[${S.cfg.title} 정규리그 ${part}주차] ${from}~${upto}라운드`, '', '■ 결과', ...res, '', `■ 순위 (${upto}라운드까지, 팀당 ${upto * (S.cfg.meet || 3)}경기)`, stT, '',
        '■ 주간 MVP', mvp ? `${mvp.name}(${mvp.team}): ${mvp.txt}` : '-', '',
        '■ 이번 주 명경기', `${mg.r}라운드 ${best.gi + 1}차전 ${labs.A} ${g.sa}:${g.sb} ${labs.B} (${why})`, `중계·박스·줄 점수는 '명경기' 폴더에 있습니다. 경기 다시 보기 번호: ${S.cfg.id}-${mg.id} (${best.gi + 1}차전)`];
      if (part === 3) {
        const q = Core.cupQual((S.seeds.length - 1) * (S.cfg.meet || 3)), ti = Core.cupTitles(Object.values(S.stats.L.bat), Object.values(S.stats.L.pit), Object.assign({ no }, q));
        post.push('', '■ 가을야구 진출', ...st.slice(0, 5).map(x => `${x.rank}위 ${L(S, x.key)}`), '', `■ 정규리그 개인 1위 (타율·출루율 ${q.pa}타석, 평균자책점·WHIP·K/9 ${q.outs / 3}이닝 이상${no.length ? ', AI 구단 선수 제외' : ''})`, ...ti.map(t => `- ${t.k}: ${t.name}(${t.team}) ${t.v}`));
      }
      W(out(day, 'post.txt'), post.join('\n') + '\n');
    }
    /* 가을야구: 5일째 WC + 준PO, 6일째 PO, 7일째 KS */
    const dayOf = { WC: 'day5', SPO: 'day5', PO: 'day6', KS: 'day7' }, sum = {};
    for (const P of Core.CUP_POST) {
      const s = R0.series.find(x => x.id === P.id); if (!s) continue; const labs = { A: L(S, s.a), B: L(S, s.b) }, d = dayOf[P.id];
      s.res.games.forEach((g, gi) => gameFiles(out(d, P.id, 'g' + (gi + 1)), S, s.res, gi, { mid: P.id, rname: P.name, ser: ` ${gi + 1}차전`, noteH: '■ 시리즈' }, psNote(S, P, s, gi), labs));
      const st = Core.cupSeriesState(P, s.games);
      (sum[d] = sum[d] || []).push(`■ ${P.name}: ${P.hi}위 ${labs.A} vs ${typeof P.lo === 'number' ? P.lo + '위 ' : ''}${labs.B}`, ...s.games.map((g, gi) => `  ${gi + 1}차전 ${labs.A} ${g.sa}:${g.sb} ${labs.B}${g.walk ? ' (끝내기)' : g.inn > 9 ? ` (${g.inn}회)` : ''}`),
        `  → ${L(S, s.win)} ${P.wc ? (s.win === s.a ? '진출(1승 안고 시작)' : '진출(2연승)') : `${Math.max(st.wa, st.wb)}승 ${Math.min(st.wa, st.wb)}패로 ${P.id === 'KS' ? '우승' : '진출'}`} · 다시 보기 ${S.cfg.id}-${P.id}`, '');
    }
    for (const d of Object.keys(sum)) W(out(d, 'post.txt'), [`[${S.cfg.title} 가을야구] ${d === 'day5' ? '와일드카드 결정전 · 준플레이오프' : d === 'day6' ? '플레이오프' : '한국시리즈'}`, '', ...sum[d], '경기마다 차전 폴더(g1, g2…)에 중계·박스·줄 점수·게시글이 있습니다.'].join('\n') + '\n');
  }
  function statusLeague(S) {
    if (!S.seeds) return console.log('아직 시드를 정하지 않았습니다.');
    if (!S.league) { console.log('시드 확정, 경기 전입니다.'); S.seeds.forEach((h, i) => console.log(`${String(i + 1).padStart(3)} ${L(S, h)} ${ovrTxt(ent(S, h).ovr)}`)); return; }
    console.log(standTxt(S, S.league.stand)); for (const s of S.league.series.filter(x => x.kind !== 'L')) console.log(`${s.id} ${L(S, s.a)} vs ${L(S, s.b)} (${s.games.map(g => g.sa + ':' + g.sb).join(', ')}) → ${L(S, s.win)}`);
    if (S.league.champ) console.log('우승: ' + L(S, S.league.champ));
  }
  function resultsLeague(S) {
    if (!S.league) { console.error('아직 경기를 치르지 않았습니다(run).'); process.exit(1); }
    const Core = C(), Lg = S.league, no = aiKeys(S), q = Core.cupQual((S.seeds.length - 1) * (S.cfg.meet || 3));
    const titles = Core.cupTitles(Object.values(S.stats.L.bat), Object.values(S.stats.L.pit), Object.assign({ no }, q));
    const who = h => { const x = ent(S, h); return { name: x.name, year: x.year, ovr: x.ovr, seed: x.seed, ...(x.ai ? { ai: true } : {}), wh: !x.ai && x.wid ? Core.cupHashStr('wid:' + x.wid) : null }; };
    const post = Lg.series.filter(s => s.kind !== 'L').map(s => { const P = Core.CUP_POST.find(x => x.id === s.id), st = Core.cupSeriesState(P, s.games); return { id: s.id, name: P.name, a: L(S, s.a), b: L(S, s.b), w: [st.wa, st.wb], t: st.t, win: L(S, s.win), g: s.games.map(g => [g.sa, g.sb]) }; });
    const stand = Lg.stand.map(x => ({ rank: x.rank, name: L(S, x.key), ...(ent(S, x.key).ai ? { ai: true } : {}), w: x.w, l: x.l, t: x.t, pct: pct(x), gb: x.gb, diff: x.diff, ovr: ent(S, x.key).ovr }));
    const gTot = Lg.series.reduce((a, s) => a + s.games.length, 0);
    const res = { v: 1, id: S.cfg.id, title: S.cfg.title, format: 'league', date: new Date().toISOString().slice(0, 10), n: humans(S).length, ai: no.length, games: gTot, done: !!Lg.champ,
      champ: Object.assign(who(Lg.champ), { roster: rosterOf(Lg.champ), deck: hallDeck(Lg.champ) }), runner: Object.assign(who(Lg.runner), { roster: rosterOf(Lg.runner) }), stand, post, titles, q,
      codes: Lg.series.map(s => `${S.cfg.id}-${s.id}`) };
    W(out('results.json'), JSON.stringify(res, null, 1));
    /* 공개 결과(명예의 전당): 지난 회차를 이어 붙인 목록. 지난 hall.json은 CUP_HALL로 */
    let Hh = { v: 1, cups: [] }; if (process.env.CUP_HALL && fs.existsSync(process.env.CUP_HALL)) Hh = J(process.env.CUP_HALL);
    Hh.cups = Hh.cups.filter(c => c.id !== res.id).concat([{ id: res.id, title: res.title, format: 'league', date: res.date, n: res.n, ai: res.ai, champ: res.champ, runner: res.runner, stand, post: post.map(p => ({ id: p.id, name: p.name, a: p.a, b: p.b, w: p.w, win: p.win })), titles }]);
    W(out('hall.json'), JSON.stringify(Hh));
    const T = [`[${S.cfg.title} 최종 결과]`, '', `우승 ${L(S, Lg.champ)}${ent(S, Lg.champ).ai ? ' (AI)' : ''} · 정규리그 ${ent(S, Lg.champ) && Lg.stand.find(x => x.key === Lg.champ).rank}위 · OVR ${ovrTxt(ent(S, Lg.champ).ovr)}`, `준우승 ${L(S, Lg.runner)}`, '',
      '■ 우승 로스터', ...res.champ.roster.map(r => `- ${r.pos} ${r.n} ${r.o}`), '', '■ 가을야구', ...post.map(p => `- ${p.name}: ${p.a} vs ${p.b} (${p.g.map(g => g.join(':')).join(', ')}) → ${p.win}`), '',
      '■ 정규리그 최종 순위', standTxt(S, Lg.stand), '', `■ 개인 타이틀 (타율·출루율 ${q.pa}타석, 평균자책점·WHIP·K/9 ${q.outs / 3}이닝 이상${no.length ? ', AI 구단 선수 제외' : ''})`, ...titles.map(t => `- ${t.k}: ${t.name}(${t.team}) ${t.v}`), '',
      '■ 경기 다시 보기', `게임 › 구단 › 프런트컵 › 대회 경기 보기에 번호를 넣으면 그 경기의 중계·박스·줄 점수를 봅니다. 번호 목록: final/codes.txt (예: ${S.cfg.id}-KS, ${S.cfg.id}-L1-1)`,
      '■ 명예의 전당', '우승·준우승 로스터는 게임 처음 화면 › 프런트컵 명예의 전당, 설정 › 정보에서 누구나 볼 수 있습니다.'];
    W(out('results.txt'), T.join('\n') + '\n');
    W(out('final', 'post.txt'), T.join('\n') + '\n'); W(out('final', 'codes.txt'), res.codes.join('\n') + '\n');
    fs.copyFileSync(out('results.json'), out('final', 'results.json')); fs.copyFileSync(out('hall.json'), out('final', 'hall.json'));
    console.log(T.slice(0, 4).join('\n')); console.log('→ ' + out('final'));
  }
  return { seedLeague, runLeague, statusLeague, resultsLeague, rosterOf };
};
