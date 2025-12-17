# Mission: Protocol Fallout

팀 기반 방탈출 미션 임파서블 웹앱

## 게임 소개

여러 팀이 동시에 참여하여 핵폭탄을 해체하는 미션 임파서블 테마의 방탈출 게임입니다.

- **관리자(PC)**: 방 생성, 게임 시작/종료, 실시간 팀 현황 모니터링
- **요원(모바일)**: QR코드/링크로 접속, 팀 선택, 퍼즐 풀이

## 로컬 실행

**Prerequisites:** Node.js 18+

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에서 VITE_GEMINI_API_KEY 설정

# 개발 서버 실행
npm run dev
```

## Vercel 배포

### 1. GitHub 연동 배포 (권장)

1. GitHub에 이 프로젝트를 푸시
2. [Vercel](https://vercel.com)에서 "Import Project" 클릭
3. GitHub 저장소 선택
4. Framework Preset: **Vite** 선택
5. Root Directory: `mission-app` 설정 (필요시)
6. Environment Variables에 추가:
   - `VITE_GEMINI_API_KEY`: Gemini API 키

### 2. Vercel CLI 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `VITE_GEMINI_API_KEY` | Google Gemini API 키 (AI 힌트용) | 선택 |

> API 키 없이도 게임은 정상 작동합니다. 힌트 기능만 비활성화됩니다.

## 기술 스택

- React 19 + TypeScript
- Vite
- Tailwind CSS
- PeerJS (P2P 실시간 동기화)
- Google Gemini AI (힌트 시스템)

## 게임 플로우

1. 관리자가 PC에서 방 생성 (6자리 코드 생성)
2. 요원들이 모바일로 QR 스캔 또는 코드 입력
3. 관리자가 게임 시작
4. 청와대 → 샌프란시스코 → 파리 → 인천공항 순서로 퍼즐 해결
5. 최종 결과 순위 확인

## 라이선스

MIT
