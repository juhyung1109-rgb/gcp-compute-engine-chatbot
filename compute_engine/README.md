# Compute Engine 챗봇 배포 모듈

Google Cloud Compute Engine 환경에 Gemini 3.8 / 3.7 Flash 챗봇 웹 서비스를 배포하고 운영하기 위한 전용 모듈입니다.

---

## 📁 디렉토리 파일 구성

- **`server.js`**: Express 기반 백엔드 서버 (Server-Sent Events 실시간 스트리밍, Gemini API 프록시, Google Search Grounding 지원)
- **`public/`**: 프론트엔드 정적 웹 애플리케이션 (Gemini 공식 UI 디자인, 캡슐형 입력창, 마이크 음성 입력, 마크다운 렌더링)
- **`package.json` / `package-lock.json`**: Node.js 의존성 관리 설정
- **`deploy_to_compute_engine.py`**: GCP Compute Engine 인스턴스 자동 생성 및 원클릭 배포 자동화 파이썬 스크립트
- **`startup-script.sh`**: Compute Engine VM 부팅 시 Node.js 설치, 의존성 구성 및 systemd 서비스 데몬 자동 등록 스크립트
- **`setup_https.sh`**: Nginx 리버스 프록시 및 Let's Encrypt 무료 SSL 인증서 자동 구성 스크립트
- **`compute_engine_example.ipynb`**: Compute Engine 인스턴스 생성 및 Google Cloud Ops Agent 모니터링 실습 노트북
- **`deployment.log`**: Compute Engine 배포 및 검증 실행 로그 기록

---

## 💻 로컬 환경 실행

1. **의존성 설치**:
   ```bash
   npm install
   ```

2. **환경변수 설정 (`.env` 생성 또는 터미널 export)**:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

3. **서버 시작**:
   ```bash
   npm start
   # 또는
   node server.js
   ```
   브라우저에서 `http://localhost:3000` 접속

---

## ☁️ Google Cloud Compute Engine 자동 배포

```bash
python deploy_to_compute_engine.py
```

- 스크립트 위치 기준 절대 경로(`BASE_DIR`)로 동작하므로 `compute_engine` 폴더 내부는 물론 상위 루트 디렉토리에서 실행해도 정상 작동합니다.
- `server.js`, `public/`, `package.json`을 자동으로 압축하여 VM 내부의 `/opt/chatbot`에 해제 및 systemd 서비스로 등록합니다.
