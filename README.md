# 📈 XStocks Funding Arbitrage Bot

> 실시간 토큰화 주식(xStocks) 펀딩비 차익거래 모니터링 시스템

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## ✨ 주요 기능

- 🔄 **실시간 모니터링**: Gate.io, Bitget 거래소에서 펀딩비 자동 수집
- 📊 **웹 대시보드**: 실시간 차트 및 데이터 시각화 (Chart.js)
- 💰 **차익거래 기회 자동 탐색**: 거래소 간 펀딩비 스프레드 분석
- 📈 **누적 데이터 추적**: 7일/30일 누적 펀딩비 계산 및 검증
- ⚡ **WebSocket 실시간 업데이트**: 새로운 데이터 즉시 전송
- 🎯 **13개 토큰 지원**: AAPL, AMZN, COIN, CRCL, GOOGL, HOOD, MCD, META, NVDA, TSLA, SPYX, QQQ, QQQX

## 🚀 빠른 시작

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

### 프로덕션 빌드 및 실행

```bash
npm run build
npm start
```

서버가 시작되면 브라우저에서 **http://localhost:3001** 로 접속하여 웹 대시보드를 확인하세요!

## 📱 웹 대시보드

실시간 웹 인터페이스에서 다음 정보를 확인할 수 있습니다:

- 📊 **실시간 펀딩 수수료**: 모든 토큰의 현재 펀딩비 (8시간 기준)
- 📈 **누적 펀딩비 차트**: 7일/30일 누적 데이터 시각화
- 🎯 **차익거래 기회**: 실시간 스프레드 분석 및 거래소 링크
- 🔍 **데이터 검증 탭**: 거래소별 상세 펀딩비 히스토리 (최대 100개 항목)

## ⚙️ 설정

`src/index.ts`에서 봇 파라미터를 조정할 수 있습니다:

```typescript
const bot = new FundingArbBot(
  5,        // 업데이트 주기 (분)
  0.00001   // 최소 스프레드 임계값 (0.001%)
);
```

## 🏗️ 아키텍처

```
├── src/
│   ├── index.ts                 # 메인 봇 로직
│   ├── exchangeClient.ts        # CCXT 거래소 API 클라이언트
│   ├── arbitrageCalculator.ts   # 차익거래 계산 엔진
│   ├── webServer.ts             # Express + WebSocket 서버
│   └── types.ts                 # TypeScript 타입 정의
├── public/
│   └── index.html               # 웹 대시보드 UI
└── package.json
```

## 📊 지원 거래소 & 토큰

### 거래소
- **Gate.io**: Perpetual Futures (X suffix, e.g., AAPLX)
- **Bitget**: USDT Perpetual Futures

### 토큰화 주식
AAPL, AMZN, COIN, CRCL, GOOGL, HOOD, MCD, META, NVDA, TSLA, SPYX, QQQ, QQQX

## ⚠️ 주의사항

- 이 봇은 **정보 제공 목적**이며, 실제 거래 실행 기능은 포함되어 있지 않습니다
- 펀딩비는 **8시간마다** 정산됩니다 (00:00, 08:00, 16:00 UTC)
- 거래소 API 레이트 리밋을 고려하여 업데이트 주기를 설정하세요 (권장: 5분 이상)
- 실제 거래 전 반드시 거래소별 수수료, 슬리피지, 리스크를 확인하세요

## 📝 라이센스

MIT License

## 🙏 기여

이슈 제보 및 풀 리퀘스트 환영합니다!

---

**⚡ Built with TypeScript, CCXT, Express, WebSocket, and Chart.js**
