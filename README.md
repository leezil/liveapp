Next.js 기반 라이브 스트리밍 웹 데모 프로젝트입니다.

## 구성 기능

- 휴대폰 브라우저에서 송출/시청 가능한 라이브 화면
- 관리자 페이지에서 라이브 상태 전환
- 사전 작성 채팅을 실시간처럼 흘려보내는 스크립트
- 서비스워커 기반 브라우저 알림(로컬 데모)

## 실행 방법

1) 의존성 설치

```bash
npm install
```

2) `.env.local` 파일 생성

```bash
NEXT_PUBLIC_AGORA_APP_ID=YOUR_AGORA_APP_ID
NEXT_PUBLIC_AGORA_TOKEN=YOUR_TEMP_TOKEN_OR_EMPTY
NEXT_PUBLIC_AGORA_CHANNEL=film-live-room
```

3) 개발 서버 실행

```bash
npm run dev
```

4) 브라우저에서 접속

- `http://localhost:3000` : 역할 선택 화면
- `/broadcast` : 송출 화면
- `/watch` : 시청 화면
- `/admin` : 연출/제어 화면

## 푸시 알림 참고

현재 구현은 서비스워커를 통한 로컬 알림 데모입니다.
실운영에서는 FCM(Web Push) + 서버 발송 API + VAPID 키 구성을 추가하세요.

## 배포

Vercel에 배포하면 모바일에서 URL 접속으로 바로 테스트할 수 있습니다.
