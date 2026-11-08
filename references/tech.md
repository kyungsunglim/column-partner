# 기술 요령 (실제로 해 보고 된 방법)

REPL `const` 이름은 호출마다 새로 짓는다. 한 호출은 120초 안에 끝나게 나눈다(드라이브 작업과 Claude 작업은 따로).

구글 문서·드라이브 주소의 `/u/${N}/`은 작업용 구글 계정 번호다(`references/locations.md`에 적는다). 번호 없이 열면 다른 계정의 보기 전용으로 열려 붙여넣기가 안 될 수 있다.

## 구글 문서 읽기
```js
const txt = await (await fetch(`https://docs.google.com/document/u/${N}/d/${id}/export?format=txt`)).text();
```
- 줄바꿈 표시 `\u000b`는 `\n`으로 바꿔 읽는다.
- 제목 단계(h1/h2/h4)나 색 표시를 볼 때는 `format=html`. 색은 `<style>` 안 class 정의에 `background-color:#fff2a8`(노랑), `#d9ead3`(초록)로 들어 있다.
- 이미지가 많은 큰 문서(90MB 안팎)는 `format=zip`(약 10초)을 받아 bash로 `unzip`. `images/`에 원본 크기 PNG, html 안 `<img>` 순서가 문서 순서다. 이미지 백업과 재사용에 쓴다.

## 새 문서 만들기 (폴더 안에)
```js
const doc = await openTab(`https://docs.google.com/document/u/${N}/create?usp=drive_web&folder=${folderId}`);
// snapshot에서 textbox "이름 바꾸기"(또는 "문서 이름")를 찾아 클릭 → Meta+A → 제목 타이핑 → Enter
```

## 붙여넣기 (서식 그대로)
```js
const pasteHtmlInto = async (pg, html) => pg.evaluate((h) => {
  const ifr = document.querySelector('iframe.docs-texteventtarget-iframe');
  const target = ifr.contentDocument.querySelector('[contenteditable="true"]') || ifr.contentDocument.body;
  const dt = new DataTransfer(); dt.setData('text/html', h); dt.setData('text/plain', ' ');
  target.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
}, html);
```
- 붙이기 전에 본문을 한 번 클릭한다: `await pg.mouse.click(800, 500)`.
- HTML은 `scripts/md2html.mjs`로 만든 파일을 `fs.readFile`로 읽어 넣는다.
- 문서 전체를 바꿀 때: 본문 클릭 → `Meta+a` → `Backspace` → 붙여넣기.
- 가운데 일부만 바꿀 때: 아래 "글자 찾아 선택"으로 선택한 뒤 붙여넣으면 선택한 부분이 바뀐다. 줄 안에 넣을 때는 `<span>`만, 문단을 넣을 때는 `<p>`/`<ul>`.

## 글자 찾아 선택 (커서 옮기기)
```js
const findSelect = async (pg, text) => {
  await pg.keyboard.press('Meta+f'); await sleep(700);
  await pg.keyboard.press('Meta+a'); await pg.keyboard.type(text); await sleep(600);
  await pg.keyboard.press('Enter'); await sleep(500);
  await pg.keyboard.press('Escape'); await sleep(500);   // 찾은 글자가 선택된 채로 남는다
};
```
- 선택 뒤 `ArrowRight`를 누르면 그 글자 바로 뒤로 커서가 간다(뒤에 줄 추가할 때 `Enter`).
- 화면 증거 사진을 찍을 때도 이 방법으로 원하는 곳까지 스크롤한다.

## 이미지 넣기 (표지 → 그림)
1. 완성본을 `md2html.mjs --mode final`로 만들면 이미지 자리에 `[[IMG01]]`…가 들어간다.
2. 자리마다: `findSelect(pg, '[[IMG01]]')` → 아래 HTML 붙여넣기(그 자리 그림 전부, 채팅 순서대로).
```js
let h = '';
for (const f of files) { const b64 = (await fs.readFile(f)).toString('base64');
  h += `<p style="margin-top:12pt;margin-bottom:12pt"><img src="data:image/png;base64,${b64}" width="602" height="401"></p>`; }
```
3. 그림 붙이기는 문서가 뒤에서 천천히 처리한다. 붙인 직후 txt를 받아 보면 표지가 아직 남아 있는 것처럼 보일 수 있다. 같은 자리에 다시 붙이지 말고 30~60초 기다린 뒤 html로 확인한다(그림 수, 자리별 장수, 너비 602, 남은 표지 0).

## 드라이브
- 파일 여러 개 고르기: `page.getByText(이름, { exact: true }).click()` 뒤 나머지는 `{ modifiers: ['Meta'] }`로 클릭 → 위 도구 막대 "이동" → 대화상자에서 폴더 칸 클릭 → "이동".
- 폴더 들어가기는 더블클릭이 잘 안 먹으니 폴더 주소로 연다.
- .md 파일 교체는 지우고 새로 올리지 않는다: 그 줄의 "추가 작업" → "파일 정보"에 마우스 → "버전 관리" → "새 버전 업로드". 링크가 그대로 남고 이전 버전도 남는다.

## Claude 프로젝트 파일 교체
컨텍스트 보기 → "선택" → 바꿀 파일 체크 → "선택된 항목 1개 삭제" → 확인창 "항목 삭제" → "추가" → "기기에서 업로드" → "파일" → 파일 고르기. 목록에 "지금"으로 바뀌었는지 확인한다.

## GPT 이미지 채팅 4개
- 먼저 `https://chatgpt.com/`에서 `fetch('/api/auth/session')`으로 이메일이 이미지 작업용 계정(`references/locations.md`)인지 확인한다. 다르면 멈추고 사용자에게 알린다.
- 보내기: 채팅 주소(`references/locations.md`)를 탭 4개로 열고, 입력창에 보낼 글 + 줄바꿈 + `내용 글 구조 분석 및 레퍼런스 디자인 참고 + 이미지 구조화`를 넣어 보낸다. 입력창과 보내기 버튼은 snapshot으로 찾는다.
- 시간: 그림 한 장에 보통 2~4분(중앙값 약 160초). 4개를 동시에 보내고 기다린다.
- 받기: 같은 탭에서
```js
const s = await (await fetch('/api/auth/session')).json();
const conv = await (await fetch(`/backend-api/conversation/${convId}`, { headers: { Authorization: 'Bearer ' + s.accessToken } })).json();
// 보낸 시각 이후 assistant 메시지의 content.parts 중 image_asset_pointer(sediment://file_...)를 모은다
const r = await (await fetch(`/backend-api/files/download/${fileId}?conversation_id=${convId}&inline=false`, { headers: { Authorization: 'Bearer ' + s.accessToken } })).json();
// r.download_url 을 같은 페이지에서 fetch → base64로 넘겨 tmp에 저장
```
- 파일 이름: `k{자리번호 2자리}_c{채팅 1~4}_{순번}.png`. 한 채팅이 여러 장 주면 전부 쓴다.
- 받을 때 한 번에 많이 하면 120초를 넘는다. 자리 몇 개씩 나눠 받는다.
- 맥 디스크가 꽉 차 멈춘 적이 있다. 시작 전 여유 공간을 보고, 문서에 다 붙이고 확인한 뒤 tmp 그림을 지운다(zip 백업은 사용자 확정까지 둔다).

## PDF·검색
- `pdftotext`, `pdfinfo`, `rg`는 Aside 런타임의 `bin/` 폴더에 있다.
- 대표님 자료에서 말 찾기: `rg -o ".{0,80}환경을 이길.{0,120}" references/sources` 처럼 앞뒤를 같이 뽑는다. 줄이 끊겨 안 나오면 짧은 낱말로 다시 찾는다.
