# 개인용 도구 연동 상태 · 2026-10-07

GitHub·Notion·Slack OAuth 시작/콜백, 브라우저별 암호화 HttpOnly 쿠키, 활동 조회 및 연결 해제, 업무 기록에 선택 반영 UI 구현. 토큰을 localStorage·백업·클라이언트 응답에 넣지 않는다. 회사 승인 없이 연결 가능. 실제 도구 로그인·조회 검증은 아직 미완료.

Vercel에는 NOTION_CLIENT_ID/SECRET, SLACK_CLIENT_ID/SECRET 및 기존 REDIRECT_URI가 존재한다. Production과 Preview에 저장돼 있으나 Secret은 다시 읽을 수 없어 로컬로 복사하지 않았다. GitHub 인증 설정은 확인된 목록에 없다. Vercel 값 변경·배포·Git push는 하지 않았다.

## 운영자가 준비할 설정
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET: GitHub OAuth 앱. 현재 구현은 기본 공개 활동 권한만 요청하며 private repo 전체 접근 권한은 요청하지 않는다.
- 기존 NOTION_CLIENT_ID, NOTION_CLIENT_SECRET 및 SLACK_CLIENT_ID, SLACK_CLIENT_SECRET 재사용.
- PERSONAL_CONNECTION_SECRET: 별도 암호화 키를 사용하려면 32바이트 hex(64자리)를 설정한다. 미설정 시 기존 서버 전용 연동 앱 secret에서 도메인 구분 SHA-256 키를 파생한다. 앱 secret 변경 시 기존 개인 연결 쿠키가 무효화되어 재연결해야 한다.
- PERSONAL_APP_URL: 선택적 명시 origin. 프로덕션 미설정 시 기존 NOTION/SLACK_REDIRECT_URI의 origin 또는 VERCEL_PROJECT_PRODUCTION_URL을 사용한다.

최신 구현은 기존 NOTION_REDIRECT_URI·SLACK_REDIRECT_URI가 서비스 origin과 같으면 해당 주소를 재사용한다. 기존 콜백은 암호화된 개인 연결 state를 확인해 새 개인용 콜백 처리로 분기한다. 따라서 동일한 운영 도메인의 Notion·Slack 앱은 콜백을 추가 등록하지 않아도 된다. GitHub 또는 기존 주소가 없는 환경에만 아래 신규 콜백을 등록한다:
```
https://the-workation-app.vercel.app/api/personal/tools/github/callback
https://the-workation-app.vercel.app/api/personal/tools/notion/callback
https://the-workation-app.vercel.app/api/personal/tools/slack/callback
```
로컬 검증은 위 주소의 origin을 http://localhost:3110으로 바꿔 앱에 별도 등록해야 한다. 기존 회사용 callback 설정을 삭제하지 않는다. GitHub 앱은 지원하는 콜백 정책에 따라 개발용 앱을 별도로 등록한다.

Notion 읽기 권한과 사용자가 연결 시 선택한 문서 접근, Slack User Token search:read 필요. 앱 등록/권한 설정은 로그인 후 사용자가 검토한다. 비밀 키는 채팅이나 Git에 넣지 않고 로컬 .env.local/Vercel 설정에 직접 등록한다.

## 활동의 의미
최근 24시간, 최대 최근 100개 후보만 조회하며 잘린 경우 표시한다. 5분 자동 갱신은 사용자가 켤 수 있다. Slack 본문은 반환하지 않는다. Notion은 공유 페이지의 최신 수정 표시로 본인 수정 여부를 구분한다. GitHub 이벤트는 반영 지연이 있을 수 있다. 어느 활동도 시간이나 생산성 점수로 환산하지 않는다.

연결 해제는 쿠키만 삭제한다. 실제 앱 권한은 제공자 설정에서 철회해야 한다. 토큰 갱신 자동화는 미구현이며 쿠키·토큰 만료 시 재연결한다.
