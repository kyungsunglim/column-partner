#!/usr/bin/env node
// 칼럼 초안(md)을 구글 문서에 붙여 넣을 HTML로 바꾼다.
// 사용:
//   node md2html.mjs <초안.md> --mode review --out review.html [--yellow y.txt] [--green g.txt] [--note "회색 안내"] [--footer "판단이 필요한 것: ..."]
//   node md2html.mjs <초안.md> --mode final  --out final.html
// review: 노랑(해석해 넣은 문장)·초록(대표님 자료에서 가져온 문장) 표시, 이미지 자리는 파란 "(이미지 N)".
// final : 색 표시 없음, 이미지 자리는 [[IMG01]] 표지(이미지 붙일 때 찾기용).
// y.txt / g.txt: 한 줄에 한 문장, 초안의 줄과 글자가 똑같아야 표시된다.
import fs from 'node:fs';

const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const file = a[0];
const mode = opt('--mode') || 'review';
const out = opt('--out');
if (!file || !out) { console.error('사용: node md2html.mjs <초안.md> --mode review|final --out <파일.html>'); process.exit(1); }
const readList = (p) => p ? new Set(fs.readFileSync(p, 'utf8').split('\n').map(s => s.trim()).filter(Boolean)) : new Set();
const yellow = mode === 'review' ? readList(opt('--yellow')) : new Set();
const green = mode === 'review' ? readList(opt('--green')) : new Set();
const note = opt('--note');
const footer = opt('--footer');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const F = 'font-family:Arial;color:#000000;';
const SP = (t, b) => `margin-top:${t}pt;margin-bottom:${b}pt;line-height:1.15;`;

let html = '';
if (note) html += `<p><span style="font-family:Arial;font-size:9pt;color:#888888">${esc(note)}</span></p>`;
let n = 0; const used = { y: 0, g: 0 };
for (const g of fs.readFileSync(file, 'utf8').split(/\n\s*\n/)) {
  const ls = g.split('\n').map(x => x.trimEnd()).filter(x => x.trim());
  if (!ls.length) continue;
  const one = ls.length === 1 ? ls[0].trim() : null;
  if (one && /^# /.test(one)) { html += `<h1 style="${SP(24, 6)}"><span style="${F}font-size:23pt;font-weight:700">${esc(one.slice(2))}</span></h1>`; continue; }
  if (one && /^## /.test(one)) { html += `<h2 style="${SP(18, 4)}"><span style="${F}font-size:17pt;font-weight:700">${esc(one.slice(3))}</span></h2>`; continue; }
  if (one && /^#### /.test(one)) { html += `<h4 style="${SP(12, 2)}"><span style="${F}font-size:11pt;font-weight:700">${esc(one.slice(5))}</span></h4>`; continue; }
  if (one === '(이미지)') {
    n++;
    html += mode === 'review'
      ? `<p style="${SP(12, 12)}"><span style="font-family:Arial;font-size:10pt;color:#1a73e8;font-weight:700">(이미지 ${n})</span></p>`
      : `<p style="${SP(12, 12)}"><span style="${F}font-size:11pt">[[IMG${String(n).padStart(2, '0')}]]</span></p>`;
    continue;
  }
  html += `<p style="${SP(12, 12)}">` + ls.map(l => {
    const t = l.trim();
    let bg = '';
    if (green.has(t)) { bg = 'background-color:#d9ead3;'; used.g++; }
    else if (yellow.has(t)) { bg = 'background-color:#fff2a8;'; used.y++; }
    return `<span style="${F}font-size:11pt;font-weight:400;${bg}">${esc(l)}</span>`;
  }).join('<br>') + '</p>';
}
if (footer) html += `<p style="${SP(18, 2)}"><span style="font-family:Arial;font-size:9pt;color:#666666">${esc(footer)}</span></p>`;
fs.writeFileSync(out, html);
const miss = (set, cnt, name) => { if (set.size && cnt < set.size) console.log(`주의: ${name} ${set.size}줄 중 ${cnt}줄만 초안에서 찾음 (글자가 똑같은지 확인)`); };
miss(yellow, used.y, '노랑'); miss(green, used.g, '초록');
console.log(`완료: ${out} (이미지 자리 ${n}곳, 노랑 ${used.y}줄, 초록 ${used.g}줄, ${html.length}자)`);
