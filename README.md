# 🔐 하이브리드 암호 학습소 (Hybrid Crypto Tutorial)

초보자 학습용 인터랙티브 웹 튜토리얼. WhatsApp / HTTPS가 실제로 쓰는 **하이브리드 암호 방식(RSA + AES)**을 브라우저 안에서 직접 클릭하며 5분 만에 이해할 수 있다.

## 핵심 학습 흐름 (4단계)

| 단계 | 설명 |
|:---:|:---|
| 1 | **키쌍 생성** — Alice가 자기 자물쇠(공개키)/열쇠(개인키)를 만든다 |
| 2 | **메시지 작성** — Bob이 보낼 평문을 입력한다 |
| 3 | **봉인 (하이브리드)** — Bob이 1회용 AES 세션키로 본문을 잠그고, 그 세션키를 Alice 공개키로 또 봉인 |
| 4 | **전송·복호화** — Alice가 개인키로 봉인을 풀어 세션키 복원 → 본문 복호화 |

## 기술 스택

- 백엔드 없음. **순수 정적 SPA** (HTML + CSS + ES Module JS)
- 암호 동작은 모두 브라우저 내장 **Web Crypto (`crypto.subtle`)** 사용
- 알고리즘: **RSA-OAEP (2048) + AES-GCM (256, IV 12바이트)**
- 빌드: Vite 6 / 테스트: Vitest / 검증: Playwright + axe-core + Lighthouse

## 시작하기

```bash
npm install
npm run dev     # 개발: http://127.0.0.1:5173
npm run build   # 빌드: dist/
npm run preview # 미리보기: http://127.0.0.1:4173
npm test        # 유닛 테스트
```

## 디렉토리

```
src/
├── index.html
├── main.js                 # App 오케스트레이션
├── styles/                 # 디자인 토큰 + 레이아웃 + 컴포넌트
└── lib/
    ├── crypto/             # KeyPairManager / SessionKeyManager / Envelope / Cipher
    ├── ui/                 # Stage / Visualizer / CodeView / EventBus
    └── util/encoding.js
```

## 디자인 원칙

- Swiss + Brutalism 톤 (8px 그리드, 60-30-10 색)
- 무작위 그라데이션 / 보라색 / 둥근 카드 금지
- 모든 버튼 ≥44px 터치 영역, 명시적 hover/focus 상태
- 색 대비 WCAG AA 통과, axe-core 위반 0개

## 출처 (Playwright로 직접 수집)

- MDN — Web Crypto API SubtleCrypto, RSA-OAEP, AES-GCM
- Wikipedia — Hybrid cryptosystem (KEM/DEM, Envelope Encryption)
- WhatsApp FAQ — End-to-end encryption
- Cloudflare Learning — TLS Handshake

## 라이선스

MIT
