# 칼럼 파트너 (column-partner)

강의 원문(대표님 강의 녹취나 외부 강의 자막)을 대표님이 직접 다듬은 칼럼과 같은 강의안 칼럼으로 쓰고, 검토용 문서와 자체 검토를 거쳐 GPT 도식 이미지까지 넣는 Aside 스킬입니다.

## 흐름
원문 문서("[원문] 주제") → 원문 확인 → 목차 (확인 ①) → 쓰기 → 자체 검토 → 검토용 문서 (확인 ②) → 완성 문서 → 이미지로 보낼 글 (확인 ③) → GPT 이미지 채팅 4개 → 문서에 붙이기 → 원문 이름을 "[완료]"로

## 구성
| 파일 | 내용 |
| --- | --- |
| `SKILL.md` | 일하는 방식, 작업 순서, 하지 않는 것 |
| `references/manual.md` | 강의안 칼럼 글쓰기 매뉴얼 사본 (기준은 구글 문서 원본) |
| `references/tech.md` | 구글 문서 읽기·붙여넣기, 이미지 넣기, 드라이브·Claude 파일 교체, GPT 채팅 요령 |
| `references/examples.md` | 견본 문장과 보고 형식 |
| `references/locations.example.md` | 폴더·문서·채팅 ID를 적는 틀 |
| `scripts/selfcheck.mjs` | 자체 검토 숫자·문장·구조 점검 |
| `scripts/md2html.mjs` | 초안을 구글 문서용 HTML로 (검토용/완성용) |

## 설치
1. 이 폴더를 Aside 계정의 `skills/user/column-partner/`에 넣습니다.
2. `references/locations.example.md`를 `references/locations.md`로 복사해 자기 값으로 채웁니다.
3. `references/sources/`에 대표님 전자책, 칼럼, 강의 녹취 텍스트를 넣습니다. 이 저장소에는 들어 있지 않습니다.
4. 새 작업에서 "칼럼 파트너로 1주차 원문 작업 시작해 줘"처럼 부릅니다.

## 점검 도구 예시
```bash
node scripts/selfcheck.mjs 초안.md --speaker "샘 오븐스"
node scripts/md2html.mjs 초안.md --mode review --yellow y.txt --green g.txt --out review.html
node scripts/md2html.mjs 초안.md --mode final --out final.html
```
