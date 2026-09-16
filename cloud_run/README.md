# Google Cloud Run 챗봇 배포 모듈

Google Cloud의 완전 관리형 서버리스 컨테이너 플랫폼인 **Cloud Run** 환경에 **Gemini 3.8 Flash & 3.7 Flash** 웹 챗봇을 컨테이너화하여 배포하고 운영하기 위한 전용 모듈입니다.

---

## 🌟 Google Cloud Run 환경의 핵심 장점

1. **자동 HTTPS (무료 SSL/TLS 제공)**
   - Nginx 리버스 프록시나 Let's Encrypt 설정 없이, Google 관리형 인증서가 적용된 공식 보안 도메인(`https://<서비스>-<고유해시>-<리전>.run.app`)이 배포 즉시 자동 생성됩니다.
2. **비용 0원 최적화 (Scale-to-Zero)**
   - 트래픽이 없을 때는 컨테이너 인스턴스가 0개로 축소되어 유휴 컴퓨팅 요금이 전혀 발생하지 않습니다.
   - 요청이 들어오면 수 초 내에 컨테이너가 즉시 기동(Cold Start 최소화)되어 응답합니다.
3. **완전 관리형 자동 확장 (Auto Scaling)**
   - 대규모 트래픽 발생 시 최대 인스턴스 수(기본 설정: 10개)까지 자동으로 인스턴스가 수평 확장(Scale-out)됩니다.
4. **Secret Manager 네이티브 연동**
   - `--set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest` 플래그로 GCP Secret Manager에 저장된 API 키를 안전하게 컨테이너 환경변수로 직접 주입합니다.
5. **실시간 스트리밍 지원 (Server-Sent Events)**
   - HTTP/2 지원 및 버퍼링 없는 스트리밍 설정을 통해 Gemini 3.8/3.7 Flash 모델의 실시간 토큰 타이핑 응답을 지원합니다.

---

## 📁 디렉토리 파일 구성

```
cloud_run/
├── public/                     # Gemini 프론트엔드 리소스 (HTML, CSS, JS)
│   ├── index.html              # Gemini UI 레이아웃 (캡슐형 바, 도구 팝업 등)
│   ├── style.css               # 글래스모피즘 & 구글 Gemini 디자인 스타일시트
│   └── app.js                  # SSE 스트리밍, 모델 전환, 음성 인식/합성, 파일 첨부
├── server.js                   # Cloud Run 최적화 Node.js Express 백엔드 (PORT 8080, 0.0.0.0 바인딩)
├── Dockerfile                  # node:20-slim 기반 경량 프로덕션 컨테이너 이미지 정의
├── .dockerignore               # 빌드 컨텍스트 최적화 제외 설정
├── package.json                # 프로젝트 메타데이터 및 의존성
├── package-lock.json           # 의존성 락파일
├── deploy_to_cloud_run.py      # 크로스 플랫폼(Windows/Linux/Mac) 자동 배포 및 헬스체크 스크립트
├── deploy.sh                   # Cloud Shell / Linux 환경용 배포 쉘 스크립트
└── README.md                   # Cloud Run 모듈 상세 설명 문서
```

---

## 🚀 로컬 개발 및 테스트

### 1. 일반 Node.js 실행
```bash
cd cloud_run
npm install
npm start
```
- 브라우저에서 `http://localhost:8080` 접속 (또는 `.env`에 설정된 `PORT`)

### 2. 로컬 Docker 컨테이너 실행 (Docker 데스크톱 설치 시)
```bash
# 컨테이너 이미지 빌드
docker build -t gemini-chatbot:latest .

# 컨테이너 실행 (GEMINI_API_KEY 전달)
docker run -p 8080:8080 -e GEMINI_API_KEY="AIzaSy..." gemini-chatbot:latest
```
- 브라우저에서 `http://localhost:8080` 접속

---

## ☁️ Google Cloud Run 원클릭 자동 배포

### 방법 1: Python 배포 스크립트 (권장)
Windows PowerShell, macOS, Linux 등 모든 운영체제에서 동일하게 실행됩니다:

```bash
# 1. cloud_run 폴더에서 실행
cd cloud_run
python deploy_to_cloud_run.py

# 2. 또는 프로젝트 루트에서 실행
python cloud_run/deploy_to_cloud_run.py
```

### 방법 2: gcloud CLI 직접 배포 (소스 기반 빌드)
Google Cloud SDK의 최신 소스 빌드 기능을 활용하여 별도의 로컬 Docker 빌드 없이 원격 Cloud Build를 통해 즉시 배포할 수 있습니다:

```bash
cd cloud_run

gcloud run deploy gemini-chatbot-run \
  --source . \
  --project=iceu-songpa03 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=8080 \
  --timeout=300s \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1
```

배포가 완료되면 터미널에 표시되는 보안 HTTPS URL(예: `https://gemini-chatbot-run-xxxx-uc.a.run.app`)로 접속하여 챗봇을 즉시 이용하실 수 있습니다.

---

## 📊 Compute Engine vs Cloud Run 비교

| 비교 항목 | Compute Engine (`compute_engine/`) | Cloud Run (`cloud_run/`) |
| :--- | :--- | :--- |
| **인프라 유형** | 가상 머신 IaaS (Debian VM) | 완전 관리형 서버리스 CaaS (컨테이너) |
| **운영 체제 관리** | OS 업데이트, systemd, apt 직접 관리 | Google이 런타임 및 OS 패치 자동 관리 |
| **HTTPS 구성** | Nginx 설치, Let's Encrypt 인증서 발급 필요 | **자동 발급 & 기본 HTTPS 도메인 제공** |
| **비용 모델** | VM 실행 중 상시 과금 (월 ~$25+) | **요청 시에만 과금 (Scale-to-Zero, 유휴 시 0원)** |
| **배포 방식** | SSH / Startup Script / Tarball 압축 | **컨테이너 이미지 / Cloud Build 자동 빌드** |
| **스케일링** | 수동 확장 또는 인스턴스 그룹 구성 필요 | **0개부터 N개까지 초단위 자동 오토스케일링** |
