# Jeonghyun Lee — portfolio and writing

Jekyll site with Home, Work, Writing and About pages.

## 새 글 쓰기

1. `_drafts/new-post.md`를 복사해 `_posts/YYYY-MM-DD-짧은-영문-이름.md`로 저장합니다.
2. 맨 위의 `title`, `kind`, `description`, `tags`를 수정하고 본문을 Markdown으로 씁니다.
3. 이미지는 `img/글-이름/`에 넣고 `![설명](/img/글-이름/파일.png)`으로 연결합니다.
4. 미리보기를 확인한 뒤 main에 커밋하면 기존 GitHub Pages 설정에서 사이트를 빌드합니다.

파일명의 날짜는 발행일입니다. 미래 날짜의 글과 `_drafts/`의 파일은 기본 빌드에서 게시되지 않습니다.
글 주소는 기본적으로 `/writing/짧은-영문-이름/`입니다.
`permalink`를 지정하면 주소를 직접 고정할 수 있습니다.

제목, 날짜, 목록의 한 줄 요약과 태그, 홈의 최신 글은 자동으로 표시됩니다.
본문에는 제목을 다시 적지 말고 `## 소제목`부터 사용합니다.

```yaml
---
title: "논문 리뷰 제목"
kind: Paper review
description: "글 목록에 표시할 한 줄 요약"
tags: [Humanoid, Reinforcement Learning]
lang: ko
---
```

`date`와 `updated`는 필요한 경우 지정할 수 있습니다.
`where`, `experiment`, `stack`, `project_url`은 재현기에 선택적으로 추가합니다.
수식이나 추가 플러그인은 현재 설정에 포함되어 있지 않습니다.

## 로컬 미리보기

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 8766
```

초안까지 확인하려면 `--drafts`를 덧붙입니다.
게시할 파일은 `_posts/`로 옮기고 발행 날짜를 파일명에 넣습니다.

## 공통 파일

- `_layouts/default.html` — 상단 메뉴, 메타데이터, footer
- `_layouts/post.html` — 글 제목, 발행일, 선택 메타데이터, 본문
- `_posts/` — 게시 글의 Markdown 원본
- `_drafts/new-post.md` — 복사해서 쓰는 글 양식
- `writing/index.html` — 전체 글 목록
- `style.css` — 페이지와 글 스타일
- `main.js` — 테마 전환과 로봇 탐색 데모
- `newslog/` — 기존 앱 지원 및 개인정보 페이지


## 한국어와 영어 글 연결

같은 글의 두 Markdown 파일에 동일한 `translation_key`를 넣습니다.
한국어판은 `lang: ko`, 영어판은 `lang: en`으로 구분합니다.

- 한국어 양식은 `_drafts/new-post.md`, 영어 양식은 `_drafts/new-post-en.md`입니다.
- 양식을 `_posts/2026-11-22-my-paper-ko.md`와 `_posts/2026-11-22-my-paper.md`처럼 복사합니다.
- 두 파일의 `translation_key: my-paper`를 동일하게 설정합니다.
- 한국어 글 주소는 `permalink: /ko/writing/my-paper/`로 지정합니다.
- 영어 글 주소는 `permalink: /writing/my-paper/`로 지정합니다.
- 글 목록과 홈에는 현재 화면의 언어와 일치하는 글만 표시합니다.
- 번역본이 존재하면 상단 언어 전환 링크를 자동으로 표시합니다.
- 버튼으로 선택한 언어는 브라우저에 저장됩니다. 이후 홈에 접속하면 한국어 선택을 적용합니다.
- 페이지 주소를 직접 열면 해당 언어로 읽을 수 있습니다. 영어 글의 기존 주소를 유지합니다.

한국어 포트폴리오 페이지는 `ko/`에 있고, 공통 메뉴 번역은 `_data/ui.yml`에 있습니다.
앱의 실제 스크린샷과 PDF 이력서는 기존 원본 자료를 사용합니다.
