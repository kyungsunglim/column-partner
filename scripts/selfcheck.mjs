#!/usr/bin/env node
// 칼럼 초안(md) 자체 검토용 숫자·구조 점검.
// 사용: node selfcheck.mjs <초안.md> [--speaker "샘 오븐스"] [--external]
// 초안 형식: "# 제목", "## 장", "#### 소제목", "(이미지)" 한 줄, 문단은 빈 줄로 구분, 한 줄에 한 문장.
import fs from 'node:fs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--speaker'));
if (!file) { console.error('사용: node selfcheck.mjs <초안.md> [--speaker 이름] [--external]'); process.exit(1); }
const speakerIdx = args.indexOf('--speaker');
const speaker = speakerIdx >= 0 ? args[speakerIdx + 1] : null;
const external = args.includes('--external') || !!speaker;

const md = fs.readFileSync(file, 'utf8');
const all = md.split('\n');
// 출처 장 이후는 본문에서 뺀다
const srcAt = all.findIndex(l => /^##\s*출처/.test(l.trim()));
const lines = (srcAt >= 0 ? all.slice(0, srcAt) : all).map(l => l.trim());
const body = lines.filter(l => l && !/^#/.test(l) && !/^\(이미지/.test(l) && !/^https?:/.test(l));
const text = body.join('\n');
const k = text.length / 1000;
const per = (re) => +(((text.match(re) || []).length) / k).toFixed(1);

const spoken = /(장난이|삽질|미치|미칠|미친|죽을 뻔|죽는 줄|너무한|그냥 그렇게|짬밥|대박|엄청|드디어|외우십시오|이해가시죠|이해 가시죠|보여 드리겠습니다|이제 정말 중요한)/g;
const me = /(^|[\s'"(])(저는|제가|저도)/gm;
const because = /때문/g;
const conn = /(^|\s)(그래서|따라서|그러나|하지만|즉|결국|반대로|이처럼|그러므로)/g;
const avgLine = Math.round(body.reduce((a, l) => a + l.length, 0) / Math.max(1, body.length));

const rows = [
  ['구어·속어', per(spoken), [0, 0.5]],
  ['"저는/제가/저도"', per(me), external ? [0, 1.0] : [0.4, 1.0]],
  ['이유("때문")', per(because), [0.8, 1.6]],
  ['연결어', per(conn), [2.3, 3.1]],
  ['한 줄 평균(자)', avgLine, [26, 34]],
];
console.log(`# 자체 검토 숫자 (1천 자당, 본문 ${text.replace(/\s/g, '').length}자 공백 제외)`);
for (const [name, v, [lo, hi]] of rows) console.log(`- ${name}: ${v}  (기준 ${lo}~${hi})${v < lo || v > hi ? '  ← 범위 밖' : ''}`);

const spokenHits = [...new Set(text.match(spoken) || [])];
if (spokenHits.length) console.log(`- 구어 발견: ${spokenHits.join(', ')}`);

console.log('\n# 문장');
const two = body.filter(l => (l.match(/[다요]\.\s+\S/g) || []).length);
const long = body.filter(l => l.length > 60);
console.log(`- 한 줄에 두 문장: ${two.length}개`); two.forEach(l => console.log(`  · ${l}`));
console.log(`- 60자 넘는 줄: ${long.length}개`); long.forEach(l => console.log(`  · (${l.length}) ${l}`));
const says = (text.match(/말합니다/g) || []).length;
console.log(`- "말합니다": ${says}번${says > 8 ? '  ← 많음(주어·서술어를 나누거나 빼기)' : ''}`);
if (speaker) { const n = (text.match(new RegExp(speaker, 'g')) || []).length; console.log(`- "${speaker}": ${n}번${n > 12 ? '  ← 많음(문단 첫 문장만 이름, 나머지는 "그"나 생략)' : ''}`); }
const soNum = (text.match(/그래서/g) || []).length;
console.log(`- "그래서": ${soNum}번${soNum > 8 ? '  ← 많음' : ''}`);

console.log('\n# 구조');
const title = lines.find(l => /^# /.test(l));
console.log(`- 제목: ${title ? title.slice(2) : '(없음)'}`);
console.log('- 첫 세 줄(핵심 개념 정의가 있어야 함):');
body.slice(0, 3).forEach(l => console.log(`  · ${l}`));
console.log(`- 이미지 자리: ${(md.match(/^\(이미지\)$/gm) || []).length}곳`);
console.log('- 장 제목:');
lines.filter(l => /^## /.test(l)).forEach(l => console.log(`  · ${l.slice(3)}`));
console.log('- 소제목 (공백 제외 글자 수 / 첫 문장, 기준 300~800자, 1,000자 넘으면 나누기):');
const parts = md.split(/\n(?=#{2,4} )/);
for (const p of parts) {
  const ls = p.split('\n');
  if (!/^#### /.test(ls[0])) continue;
  const bodyLs = ls.slice(1).map(x => x.trim()).filter(x => x && !/^\(이미지/.test(x) && !/^#/.test(x));
  const n = bodyLs.join('').replace(/\s/g, '').length;
  const flag = n > 1000 ? '  ← 나누기' : n < 300 ? '  ← 짧음' : '';
  console.log(`  · ${ls[0].slice(5)} [${n}자]${flag}\n      첫 문장: ${bodyLs[0] || '(없음)'}`);
}
console.log('\n# 사람이 확인할 것 (스크립트가 판단 못 함)');
console.log('- 숫자·강도(아마/분명히)·누구의 말인지가 원문과 같은가');
console.log('- 소제목 제목과 내용이 맞는가, 문단 순서가 이어지는가');
console.log('- 마지막 장이 제목에 답하는가');
console.log('- 연결 문장이 대표님 말로 짧게 붙었는가(매뉴얼 6장)');
