# 저장소 층(SaveStore) — 세이브 저장 위치를 바꿀 수 있게 하는 준비

Steam(Electron)·Android(Capacitor) 빌드에서 세이브를 파일로 두려면, 세이브가 브라우저 저장소에 닿는 곳을 한곳으로 모아야 합니다. 이 문서는 지금의 저장 흐름과, 그 흐름을 바꾸지 않고 끼워 넣은 얇은 저장소 층 `SaveStore`를 적습니다.

이번 작업은 준비만 합니다. 사용자에게 보이는 것, 저장 키, 저장 형식, 동기·비동기 동작, 오류 안내는 모두 예전과 같습니다. 옛 세이브는 그대로 열리고, 새 빌드로 저장한 세이브도 예전 빌드에서 그대로 열립니다.

## 1. 지금의 저장 흐름

### 저장 키

| 키 | 위치 | 내용 | 크기 | 방식 |
|---|---|---|---|---|
| `danjang-meta` (`META`) | localStorage | 슬롯 목록 JSON: `{active, slots:{n:{tid,name,date,y,at,rev,over,memo?,lock?,idb?,fail?}}, tele?}` | 수 KB | 동기 |
| `danjang-v4-s1` ~ `danjang-v4-s10` (`slotKey(n)`) | localStorage | 슬롯 본문. `'\u0001'`+deflate 15비트 문자열(`packJ`). 옛 LZ(`compressToUTF16`)·JSON(`{`) 형식도 읽습니다 | 한 슬롯 수백 KB~수 MB(`slotSize`는 글자 수×2로 셈) | 동기 |
| `danjang-v4` (`SAVE`) | localStorage | 슬롯 도입 전 구형 세이브. `load()`가 빈 슬롯으로 옮기고 지웁니다 | 본문과 같음 | 동기 |
| IndexedDB `danjang-saves` / 저장소 `slots` / 키 `n` | IndexedDB | localStorage가 가득 찼을 때의 슬롯 본문(같은 문자열). 목록 항목에 `idb:true` 표시 | 본문과 같음 | 비동기 |
| `danjang-ach` (`ACH_KEY`) | localStorage | 도전과제 누적 기록(모든 세이브 공용) | 수 KB | 동기 |

설정 값(세이브와 무관한 기기별 기본값)은 아래 키에 따로 둡니다: `danjang-help`, `danjang-rcols`, `danjang-rviewsU`, `fo_snd`, `fo_cam`, `fo-cast-lineups`, `fronttime-teamnames`(`TN_KEY`), `fronttime-patch-seen`(`PATCH_KEY`), `dsj_uid`(통계 익명 ID). 통계 동의(`tele`)는 `danjang-meta` 안에 있습니다.

구단 사진(`G.cimg`)과 로고는 세이브 본문(G) 안에 data URL로 들어가므로 따로 저장하지 않습니다.

### 쓰기

- `save()`: 0.7초 안의 요청을 묶어 `saveStoreAsync()`로 저장합니다. 압축만 비동기(`CompressionStream`)이고, 실제 쓰기(`writeSlot`)는 동기입니다.
- `saveNow()`/`saveStore()`: 바로 동기 압축·동기 쓰기. 성공 여부를 돌려줍니다. 슬롯 바꾸기·내보내기·처음 화면·`pagehide`/`visibilitychange`/`beforeunload`(`saveFlush`)에서 씁니다.
- `writeSlot(n,data,info,exp)`: 목록을 새로 읽어 판번호(`rev`) 확인 → 목록에 새 판번호를 먼저 기록(`setMeta`) → 본문 쓰기(`sbSet`) → 목록·본문을 다시 읽어 이 탭 것인지 확인. 본문 쓰기에 실패하면 목록을 되돌립니다.
- `sbSet(n,data)`: localStorage에 쓰고 되읽어 같으면 성공. 실패하면(공간 부족 예외 등) 메모리 사본(`SB`)에 두고 IndexedDB에 비동기로 씁니다. 끝나면 목록에 `idb` 표시를 붙이고 localStorage 본문을 지운 뒤, 진행 중이 아닌 다른 슬롯도 IndexedDB로 옮깁니다(`sbOffload`).
- `setMeta(m)`: 목록을 쓰고 되읽어 같은지로 성공을 판단합니다.

### 읽기

- `meta()`: 목록을 읽고 빠진 구조를 고칩니다. 읽지 못하면 빈 목록.
- `sbGet(n)`: 메모리 사본(`SB`)이 먼저, 없으면 localStorage. `slotHas`·`slotUsed`·`slotSize`·`contSlot`이 모두 이것을 씁니다.
- 부팅(`99_boot.js`): `idb` 표시 슬롯이 있으면 `sbRefresh()`로 IndexedDB 본문을 먼저 메모리에 읽어 온 뒤 `bootLoad()` → `load()`(동기). 응답이 없으면 정해진 시간 뒤 그냥 엽니다.
- 다른 탭: `storage` 이벤트로 표시 없는 슬롯의 메모리 사본을 버립니다.

### 가져오기·내보내기

- 내보내기(`A.expFile`): `LZString.compressToBase64(prepG())` 텍스트 파일(`danjang-연도.txt`). 저장소를 거치지 않습니다.
- 가져오기(`importText`): 파일·붙여넣기·기기 옮기기 코드를 풀어 G로 만든 뒤, 일반 저장(`saveNow` → `writeSlot`)으로 슬롯에 씁니다.
- itch 껍데기에서 옮겨 오기(`ftMigrateAccept`, `41_guard_boot.js`): `danjang-`로 시작하는 항목을 그대로 localStorage에 쓰고, 실패하면 이번에 쓴 항목만 지우고 목록을 되돌립니다.

### "저장 공간 부족" 처리

- `writeSlot`의 `full()`: 본문 쓰기·되읽기 실패 때 `SAVE_ERR`에 "브라우저 저장 공간이 가득 차 저장하지 못했습니다(지금 모든 슬롯 합계 약 …MB)…"를 넣고 `false`.
- `setMeta` 실패: "저장 목록을 기록하지 못했습니다. 저장 공간을 확인한 뒤 다시 저장하세요."
- IndexedDB까지 실패: 목록 항목에 `fail` 표시, "브라우저 저장 공간이 가득 차고 보조 저장소(IndexedDB)에도 쓰지 못했습니다…" 알림.
- 자동 저장 실패는 `saveStoreAsync`가 한 번만 알립니다. 슬롯 메모 실패(`slotMemo`), itch 옮기기 실패도 각자 안내합니다.
- 이 판단은 모두 "쓰기가 예외를 던지거나, 되읽은 값이 다르다"에 기대고 있습니다.

## 2. 저장소 층 `SaveStore` (`src/ui/runtime/00_core.js` 맨 앞)

```js
SaveStore.get(k)        // 동기. 없으면 null
SaveStore.set(k, v)     // 동기. 공간 부족 등은 예외를 그대로 던진다
SaveStore.remove(k)     // 동기. 예외를 그대로 던진다
SaveStore.keys()        // 동기. 키 배열
SaveStore.usage()       // 동기. 대략의 바이트(UTF-16 기준)
SaveStore.big.ok()      // 동기. 보조 저장소를 쓸 수 있는가
SaveStore.big.put(n, d) / read(n) / drop(n)   // Promise. 슬롯 본문 보조 저장소
SaveStore.use(impl)     // 구현 바꾸기(앞 구현을 돌려줌). 지금은 부르지 않음
SaveStore.web           // 기본 구현(localStorage + IndexedDB)
SaveStore.current()     // 지금 구현 이름('web')
```

기본 구현 `web`은 예전 코드를 옮겨 놓은 것입니다. 호출할 때마다 전역 `localStorage`·`indexedDB`를 그대로 부르고, 예외를 잡지 않습니다. 그래서 호출하는 쪽의 `try/catch`·되읽기 확인·오류 안내가 예전과 똑같이 동작하고, 점검 스크립트가 `Storage.prototype.setItem`이나 `window.indexedDB`를 바꿔 공간 부족을 흉내 내는 방식도 그대로 통합니다. IndexedDB 연결 캐시(예전 `SB_DB`)도 이 안으로 옮겼습니다.

### 바꾼 호출 지점

- `meta()`, `setMeta()` — 목록 읽기·쓰기
- `sbLsGet()`, `sbSet()`, `sbOffload()`, `sbRemove()` — 슬롯 본문 읽기·쓰기·지우기, IndexedDB로 옮기기
- `sbOk()`, `sbPut`/`sbRead`/`sbDrop` — 보조 저장소(이름은 그대로 두고 `SaveStore.big`을 부릅니다)
- `load()` — 구형 세이브(`danjang-v4`) 옮기기
- `ftMigrateAccept()` — itch 껍데기에서 옮겨 오기

이 밖의 세이브 접근(`slotHas`·`slotUsed`·`slotSize`·`writeSlot`·`slotDel`·`slotLoad`·가져오기·기기 옮기기·통계 동의)은 이미 위 함수들만 거치므로 그대로입니다.

### 그대로 둔 곳(다음 단계)

- 설정 값(`danjang-help`, `danjang-rcols`, `danjang-rviewsU`, `fo_snd`, `fo_cam`, `fo-cast-lineups`, `fronttime-teamnames`, `fronttime-patch-seen`, `dsj_uid`): 세이브가 아니고 기기별 기본값이라 웹뷰의 localStorage에 두어도 됩니다. 여러 화면 파일(`01_layout.js`, `36_roster_tab.js`, `21_cast.js`, `40_actions.js` 등)에 흩어져 있어, 화면 정리 작업과 겹치지 않게 이번에는 손대지 않았습니다. 옮길 때는 `localStorage.getItem/setItem`을 `SaveStore.get/set`으로 바꾸기만 하면 됩니다(모두 이미 `try/catch` 안입니다).
- 도전과제 기록(`danjang-ach`, `src/engine/career/69_ach.js`): 엔진 번들 안이고, 노드 점검(`check-logic`)은 localStorage 없이 이 코드를 돌립니다. Steam 도전과제와 맞출 때 엔진이 저장소를 받아 쓰는 방식으로 따로 옮깁니다.
- 부팅 순서(`99_boot.js`)와 `storage` 이벤트: 다른 탭 처리는 브라우저 전용이라 그대로 둡니다. 파일 구현에서는 탭이 하나뿐이므로 필요 없습니다.

## 3. 파일 저장 구현을 끼우는 방법(아직 만들지 않음)

새 구현은 `web`과 같은 모양의 객체를 만들어, 부팅(`99_boot.js`) 전에 `SaveStore.use(impl)`로 끼웁니다. 예를 들어 데스크톱 껍데기가 화면 번들 바로 뒤, 부팅 전에 작은 스크립트를 넣는 방식입니다. `use`는 필요한 함수가 빠졌으면 예외를 던집니다.

지켜야 할 점:

1. **동기 API를 유지합니다.** `writeSlot`·`setMeta`·`saveNow`는 쓰고 바로 되읽어 성공을 판단하고, `pagehide` 때도 동기로 끝나야 합니다.
   - Electron: preload에서 `ipcRenderer.sendSync`로 메인 프로세스의 `fs.writeFileSync`(임시 파일에 쓰고 이름 바꾸기)를 부르면 동기 그대로 됩니다.
   - Capacitor: `Preferences`·`Filesystem`은 비동기입니다. 부팅 전에 모든 키를 메모리로 읽어 두고, `get`은 메모리에서, `set`은 메모리에 바로 반영한 뒤 파일 쓰기를 뒤에서 이어 가는 방식(쓰기 실패는 다음 `set`에서 예외로 알림)이 필요합니다. 이때는 부팅을 그 읽기가 끝난 뒤로 미뤄야 하므로, `99_boot.js`에 기다리는 자리를 하나 더 둡니다.
2. **실패는 예외로 알립니다.** 공간 부족·쓰기 실패 때 `set`이 예외를 던져야 지금의 "저장 공간 부족" 안내와 목록 되돌리기가 그대로 동작합니다.
3. **값은 문자열 그대로 둡니다.** 본문은 0xD800 아래 글자만 쓰는 문자열이므로 UTF-8 파일에 그대로 쓸 수 있습니다. 키 이름도 바꾸지 않으면 내보내기·가져오기·기기 옮기기 형식은 손댈 필요가 없습니다.
4. **보조 저장소(`big`)**: 파일 구현은 공간이 넉넉하므로 `big.ok()`가 `false`를 돌려주면 IndexedDB로 옮기는 흐름이 꺼집니다. 다만 브라우저에서 이미 `idb` 표시가 붙은 세이브를 가져오는 경우를 위해, 첫 실행 때 브라우저 저장소에서 파일로 옮기는 단계는 따로 만듭니다.
5. **`usage()`**: 저장 화면의 용량 표시를 파일 크기로 바꿀 때 씁니다. 지금 화면은 아직 `slotSize` 합계를 씁니다.

## 4. 점검

- `bash build.sh && bash build.sh --engine-out dist/engine.js`, `node tools/check-static.js`
- `ONLY=저장`, `ONLY=슬롯`, `ONLY=불러오기` `node tools/check-logic.js`
- 브라우저: `check-site.cjs`, `check-save-transfer-ui.cjs`, `check-save.cjs`, `check-save-idb.cjs`, `check-save-import.cjs`, `check-save-slots.cjs`, `check-save-mobile.cjs`, `check-feedback-save-96125.cjs`
- 교차 확인: 같은 브라우저 프로필에서 이전 빌드로 저장 → 새 빌드로 불러오기, 새 빌드에서 공간 부족을 흉내 내 IndexedDB로 저장 → 이전 빌드로 불러오기, 그 반대, 공간이 돌아온 뒤 localStorage 복귀까지 구단·날짜·연도·선수 수·본문이 모두 같았습니다.
