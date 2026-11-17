/* 점검용 가짜 D1: 노드 내장 SQLite(node:sqlite, 노드 22.5+)에 D1의 prepare/bind/first/all/run/batch 모양을 씌운다.
   노드 20처럼 node:sqlite가 없으면 makeD1()이 null을 돌려준다(점검은 건너뛴다). meta.rows_read/rows_written은 대략값(읽은 줄 = 돌려준 줄). */
let Sqlite = null;
try { const w = process.emitWarning; process.emitWarning = () => {}; try { Sqlite = require('node:sqlite'); } finally { process.emitWarning = w; } } catch (e) { Sqlite = null; }
const READ = /^\s*(SELECT|WITH|PRAGMA)\b/i;
function makeD1() {
  if (!Sqlite) return null;
  const db = new Sqlite.DatabaseSync(':memory:');
  const exec1 = (sql, params) => {
    for (const p of params) if (p === undefined) throw new Error('D1_TYPE_ERROR: undefined 값은 bind할 수 없습니다: ' + sql);
    const st = db.prepare(sql), ps = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : p);
    if (READ.test(sql) || /\bRETURNING\b/i.test(sql)) { const results = st.all(...ps).map(r => Object.assign({}, r)); return { success: true, results, meta: { changes: 0, last_row_id: 0, rows_read: results.length, rows_written: 0 } }; }
    const r = st.run(...ps); return { success: true, results: [], meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid), rows_read: 0, rows_written: Number(r.changes) } };
  };
  const stmt = (sql, params) => ({
    _sql: sql, _params: params,
    bind: (...a) => stmt(sql, a),
    all: async () => exec1(sql, params),
    run: async () => exec1(sql, params),
    first: async c => { const r = exec1(sql, params).results[0]; return r == null ? null : c != null ? r[c] : r; },
    raw: async () => exec1(sql, params).results.map(r => Object.values(r)),
  });
  return {
    _sqlite: db,
    prepare: sql => stmt(sql, []),
    batch: async L => { db.exec('BEGIN'); try { const out = L.map(s => exec1(s._sql, s._params)); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } },
    exec: async sql => { db.exec(sql); return { count: 1 }; },
  };
}
module.exports = { makeD1, hasSqlite: !!Sqlite };
