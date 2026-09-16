# Google Cloud Gemini Web Chatbot (Compute Engine & Cloud Run)

Google Cloud의 **Compute Engine (가상 머신 IaaS)** 및 **Cloud Run (완전 관리형 서버리스 컨테이너)** 환경 모두에서 유연하게 실행 가능한 **Gemini 3.8 Flash** 및 **Gemini 3.7 Flash** 기반 엔터프라이즈급 웹 챗봇 서비스입니다.  
공식 Google Gemini 웹 UI 디자인(헤더 문구, 캡슐형 입력창, 도구 팝업 메뉴, 모델 전환 버튼, 단축키, 음성 인식 등)을 충실하게 재현하고 실시간 스트리밍 대화 및 Google Search Grounding을 지원합니다.

---

## 🌟 주요 기능 및 특징

### 1. 차세대 AI 모델 선택 및 실시간 스트리밍
- **Gemini 3.8 Flash (기본값)**: 최신 차세대 플래그십 플래시 모델로 높은 지능과 빠른 응답 속도를 제공합니다.
- **Gemini 3.7 Flash (선택 가능)**: 검증된 고속 멀티모달 플래시 모델로 언제든지 전환 가능합니다.
- **Server-Sent Events (SSE) 스트리밍**: 텍스트가 타이핑되는 실시간 생성 효과를 지원합니다.
- **마크다운 & 코드 구문 강조**: Markdown 문법(제목, 표, 목록 등)과 Highlight.js 기반 코드 하이라이트 및 원클릭 코드 복사 버튼을 제공합니다.
- **음성 읽기 (TTS)**: AI 응답 메시지를 브라우저 음성으로 들을 수 있습니다.

### 2. Google Gemini 공식 UI 디자인 완벽 재현
- **헤더 타이틀**: `"살펴보고자 하는 새로운 아이디어가 있나요?"` 및 4가지 빠른 시작 추천 프롬프트 칩.
- **스마트 플로팅 캡슐형 입력바 (Pill Input Bar)**:
  - **스마트 배치**: 홈 화면에서는 스크린샷과 동일하게 타이틀 바로 아래 중앙에 배치되어 팝업 메뉴가 시원하게 표시되며, 대화 시작 시 화면 하단에 넉넉한 여백과 함께 자연스럽게 안착합니다.
  - **스마트 메뉴 방향 제어**: `+` 버튼 클릭 시 화면 아래쪽 잔여 공간을 실시간 계산하여, 공간이 충분할 때는 아래로, 화면 하단일 때는 위쪽(`open-upwards`)으로 펼쳐져 메뉴 항목이 화면 밖으로 잘리는 현상을 완벽 방지합니다.
  - 플레이스홀더 `"Gemini에게 물어보기"`
  - 좌측 `+` 버튼 클릭 시 팝업 도구 메뉴 오픈 (토글 시 `X` 아이콘 변환)
  - 우측 `Flash ⌵` 모델 선택 버튼 + 호버 시 스마트 툴팁 `"모델 변경 (^⇧M)"`
  - **단축키**: `Ctrl + Shift + M` (Mac: `Cmd + Shift + M`)으로 언제든지 모델 선택 메뉴 토글
  - 음성 인식 마이크 버튼: Web Speech API 기반 한국어 음성 입력 (녹음 중 붉은 펄스 애니메이션)
- **확장 팝업 도구 메뉴 (`+` 버튼)**:
  - 📎 **파일 업로드**: 이미지, 텍스트, 코드, PDF 등 로컬 파일 선택 및 썸네일 미리보기
  - 🌐 **Drive에서 파일 추가**
  - ⋯ **업로드 더보기**
  - 구분선 (Divider)
  - 🎨 **이미지 만들기**: 고화질 일러스트/사진 프롬프트 자동 삽입
  - 📹 **동영상 만들기**: 숏폼/영상 기획 프롬프트 자동 삽입
  - 🎵 **음악 만들기**: 작곡 컨셉/가사 프롬프트 자동 삽입
  - 📄 **Canvas**: 슬라이드형 편집 캔버스 패널
  - ⋯ **도구 더보기**

### 3. 실시간 구글 인터넷 검색 (Google Search Grounding)
- **최신 실시간 웹 정보 반영**: 오늘 날씨, 최신 뉴스 헤드라인, 실시간 환율, 최근 스포츠/주식 등 실시간 인터넷 검색 결과를 분석하여 답변에 즉시 반영합니다.
- **원클릭 검색 토글 버튼**: 캡슐형 입력창 우측의 지구본(`🌐`) 아이콘 또는 `+` 확장 메뉴에서 실시간 웹 검색을 언제든 켜고 끌 수 있습니다.
- **투명한 출처(Grounding Sources) 카드**: AI 답변에 반영된 검색 쿼리(`🌐 웹 검색: "..."`)와 실제 참고한 웹사이트 링크를 하단 출처 카드로 함께 제공하여 클릭 시 원문 사이트로 바로 이동할 수 있습니다.

### 4. 멀티모달 & 세션 관리
- **멀티모달 이미지 첨부**: 사용자가 업로드한 이미지를 Base64 인라인 데이터로 변환하여 Gemini 모델에 전송 후 분석.
- **대화 세션 히스토리**: 브라우저 `localStorage`를 통해 이전 대화 내용이 안전하게 유지되며, 사이드바에서 "새 대화" 생성 및 과거 대화 열람 가능.

### 5. 보안 및 환경변수 연동
- API 키를 하드코딩하지 않고, GCP Secret Manager 또는 시스템 환경변수 `GEMINI_API_KEY`를 백엔드 서버에서 자동 로드하여 안전하게 관리합니다.

---

## 📁 프로젝트 구조

```
gcp-compute-engine-chatbot/
├── compute_engine/                  # Google Cloud Compute Engine 배포 및 챗봇 애플리케이션 모듈
│   ├── public/                      # 정적 웹 프론트엔드 리소스 (Gemini UI)
│   │   ├── index.html               # Gemini UI 레이아웃 및 팝업 마크업
│   │   ├── style.css                # Google Gemini 스타일 시트 (글래스모피즘, 캡슐형 바)
│   │   └── app.js                   # SSE 스트리밍, 모델 스위칭, Web Speech API STT/TTS
│   ├── server.js                    # Node.js Express 백엔드 (SSE 스트리밍 & Gemini API 연동)
│   ├── package.json                 # 프로젝트 메타데이터 및 의존성 설정
│   ├── package-lock.json            # 의존성 락파일
│   ├── deploy_to_compute_engine.py  # Compute Engine 자동화 원클릭 배포 스크립트 (경로 독립적 실행)
│   ├── startup-script.sh            # VM 부팅 시 Node.js 설치 및 systemd 데몬 자동 등록 스크립트
│   ├── setup_https.sh               # Nginx 리버스 프록시 및 Let's Encrypt HTTPS 설정 스크립트
│   ├── compute_engine_example.ipynb # GCP VM 생성 및 Ops Agent 설정 주피터 노트북
│   ├── deployment.log               # 배포 및 HTTPS 검증 로그
│   └── README.md                    # Compute Engine 모듈 상세 안내
│
├── cloud_run/                       # Google Cloud Run 서버리스 컨테이너 배포 모듈 (API Key/Secret Manager)
│   ├── public/                      # 정적 웹 프론트엔드 리소스 (HTML/CSS/JS)
│   ├── server.js                    # Cloud Run 최적화 Node.js 백엔드 (PORT 8080, 0.0.0.0 바인딩)
│   ├── Dockerfile                   # node:20-slim 경량 컨테이너 이미지 정의
│   ├── .dockerignore                # 빌드 컨텍스트 최적화 제외 설정
│   ├── package.json                 # 의존성 설정
│   ├── package-lock.json            # 의존성 락파일
│   ├── deploy_to_cloud_run.py       # Cloud Run 자동 소스 빌드 & 배포 파이썬 스크립트
│   ├── deploy.sh                    # Linux / Cloud Shell용 배포 쉘 스크립트
│   └── README.md                    # Cloud Run 모듈 상세 안내
│
├── cloud_run2/                      # [NEW] Google Cloud Run ADC(Application Default Credentials) 모듈
│   ├── public/                      # 정적 웹 프론트엔드 리소스 (Gemini UI)
│   ├── server.js                    # 완전 키리스 ADC 토큰 기반 Vertex AI 스트리밍 백엔드
│   ├── package.json                 # google-auth-library 포함 의존성 설정
│   ├── Dockerfile                   # Cloud Run ADC 최적화 컨테이너 이미지 정의
│   ├── .dockerignore                # 빌드 컨텍스트 제외 설정
│   ├── deploy_to_cloud_run.py       # ADC 모드 키리스 자동 배포 파이썬 스크립트
│   ├── deploy.sh                    # Linux / Cloud Shell용 배포 쉘 스크립트
│   └── README.md                    # ADC 모듈 상세 안내 문서
│
├── .gitignore                       # Git 추적 제외 설정
└── README.md                        # 전체 프로젝트 종합 안내 (항시 최신화)
```

---

## 🚀 빠른 시작 (Getting Started)

### 1. 환경 요구사항
- **Node.js**: v18.0.0 이상 권장 (현재 시스템: Node.js v24)
- **Python**: 3.9 이상 (GCP 배포 자동화 스크립트용)
- **Docker**: (선택 사항) 로컬 컨테이너 이미지 빌드/테스트 시 필요
- **인증**:
  - `compute_engine/` 및 `cloud_run/`: Gemini API 키 (Secret Manager 또는 `.env`)
  - `cloud_run2/`: **Google Cloud ADC (키리스 인증: `gcloud auth application-default login`)**

### 2. 로컬 서버 실행

#### Option A. Cloud Run 2 (ADC 모드 - Google 공식 권장 Keyless)
```bash
# 1회 ADC 로그인
gcloud auth application-default login

# 서버 실행
cd cloud_run2
npm install
npm start
```
브라우저에서 **`http://localhost:8080`** 접속 (API 키 입력 불필요!)

#### Option B. Cloud Run (API Key / Secret Manager 모드)
```bash
cd cloud_run
npm install
npm start
```
브라우저에서 **`http://localhost:8080`** 접속 (`.env`의 `GEMINI_API_KEY` 사용)

#### Option C. Compute Engine 모듈 실행
```bash
cd compute_engine
npm install
npm start
```
브라우저에서 **`http://localhost:3000`** 접속

---

## ☁️ Google Cloud Run 원클릭 서버리스 배포 (추천)

Google Cloud Run은 완전 관리형 서버리스 컨테이너 플랫폼으로, 인프라 관리 없이 컨테이너를 배포할 수 있으며 **무료 자동 HTTPS 도메인**과 **유휴 시 0원(Scale to Zero)** 자동 스케일링을 제공합니다.

### 🌐 배포된 라이브 서비스 접속 (Live)

| 리전 | 서비스 URL | 인증 방식 | 배포 상태 | 특징 |
| :--- | :--- | :--- | :---: | :--- |
| **🇰🇷 서울 리전 (`asia-northeast3`)** ⭐ | 🔒 **[`https://gemini-chatbot-adc-94943462326.asia-northeast3.run.app`](https://gemini-chatbot-adc-94943462326.asia-northeast3.run.app)** | **ADC (Keyless, 권장)** | ✅ 정상 가동 | **국내 최저 지연시간 & 100% 완전 키리스** |
| **🇺🇸 미국 리전 (`us-central1`)** | 🔒 **[`https://gemini-chatbot-run-94943462326.us-central1.run.app`](https://gemini-chatbot-run-94943462326.us-central1.run.app)** | API Key (Secret Manager) | ✅ 정상 가동 | 글로벌 표준 리전 |
| **🇺🇸 미국 리전 (`us-central1`)** | 🔒 **[`https://gemini-chatbot-adc-94943462326.us-central1.run.app`](https://gemini-chatbot-adc-94943462326.us-central1.run.app)** | **ADC (Keyless)** | ✅ 정상 가동 | ADC 미국 리전 엔드포인트 |

### gcloud CLI로 cloud_run2 (ADC 모드)를 서울 리전에 배포하는 명령어
```bash
gcloud run deploy gemini-chatbot-adc \
  --image=us-central1-docker.pkg.dev/iceu-songpa03/chatbot-repo/gemini-chatbot-adc:v2 \
  --project=iceu-songpa03 \
  --region=asia-northeast3 \
  --platform=managed \
  --allow-unauthenticated \
  --service-account=94943462326-compute@developer.gserviceaccount.com \
  --set-env-vars="VERTEX_LOCATION=us-central1" \
  --port=8080 \
  --timeout=300s \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1
```

### 배포 실행 방법
```bash
# cloud_run 폴더에서 실행
cd cloud_run
python deploy_to_cloud_run.py

# 또는 프로젝트 루트에서 직접 실행
python cloud_run/deploy_to_cloud_run.py
```

### 단계별 빌드 및 배포 워크플로우
1. **Artifact Registry 저장소 생성**: `chatbot-repo` Docker 저장소 생성
2. **컨테이너 이미지 빌드**: `gcloud builds submit --tag us-central1-docker.pkg.dev/iceu-songpa03/chatbot-repo/gemini-chatbot:v1 cloud_run`
3. **Cloud Run 서비스 배포**: `gcloud run deploy gemini-chatbot-run --image=us-central1-docker.pkg.dev/iceu-songpa03/chatbot-repo/gemini-chatbot:v1 ...`
4. **Secret Manager 자동 바인딩**: `projects/94943462326/secrets/GEMINI_API_KEY` 환경변수 주입
5. **라이브 헬스체크 및 실시간 SSE 스트리밍 E2E 검증 완료**

---

## 📊 GCP Compute Engine vs Cloud Run 비교

| 비교 항목 | Compute Engine (`compute_engine/`) | Cloud Run (`cloud_run/`) |
| :--- | :--- | :--- |
| **인프라 아키텍처** | 가상 머신 IaaS (Debian VM) | **완전 관리형 서버리스 컨테이너 (CaaS)** |
| **서버 관리 부담** | OS 패치, 패키지 설치, Nginx 설정 필요 | **서버 관리 제로 (Google 완전 관리)** |
| **HTTPS 구성** | Nginx 리버스 프록시 + Let's Encrypt 설정 | **Google 관리형 SSL 자동 발급 (영구 무료)** |
| **비용 모델** | VM 실행 시간 동안 고정 비용 발생 (월 ~$25) | **요청 시에만 과금 (Scale-to-Zero, 유휴 시 0원)** |
| **스케일링** | 수동 확장 또는 인스턴스 그룹 구성 필요 | **0개부터 수백 개까지 초단위 자동 오토스케일링** |
| **적합한 용도** | OS 수준 제어가 필요한 장기 실행 작업 | **웹 서비스, API, 챗봇, 마이크로서비스** |

---

## ☁️ Google Cloud Compute Engine 원클릭 배포

`deploy_to_compute_engine.py`는 스크립트 위치(`BASE_DIR`) 기준 절대 경로를 처리하도록 고도화되어 있어, 루트 디렉토리나 `compute_engine/` 서브폴더 어느 위치에서 실행해도 소스코드 패키징과 VM 배포가 완벽하게 동작합니다.

```bash
# 1. compute_engine 폴더 내에서 실행 시
cd compute_engine
python deploy_to_compute_engine.py

# 2. 또는 프로젝트 루트에서 직접 실행 시
python compute_engine/deploy_to_compute_engine.py
```

배포 스크립트는 다음 과정을 자동으로 수행합니다:
1. `gcloud` 프로젝트 및 인증 설정 검증 (`iceu-songpa03`)
2. Secret Manager `GEMINI_API_KEY` 권한 확인 및 Compute Engine 기본 서비스 계정에 IAM 바인딩
3. 인바운드 방화벽 규칙 확인 (`allow-chatbot-service`, tcp:3000, tcp:80)
4. `server.js`, `public/`, `package.json` 소스 패키징 (Base64 인코딩 tarball)
5. `startup-script.sh` 동적 생성 및 Compute Engine VM 인스턴스(`gemini-chatbot-vm`, e2-medium) 프로비저닝
6. 외부 공인 IP 할당 및 웹 서비스 헬스체크 (`/api/config` 폴링)

---

## ☁️ Google Cloud Compute Engine 배포 현황 (Live)

Jupyter Notebook([compute_engine_example.ipynb](compute_engine/compute_engine_example.ipynb)) 분석 결과를 바탕으로 비용 효율이 가장 우수한 `us-central1-a` 리전에 Compute Engine VM을 생성하고 챗봇 서비스를 배포하였습니다.

### 1. 배포 인스턴스 구성 정보 (검증 완료 및 자원 정리)
> [!NOTE]
> 본 인스턴스는 배포, HTTPS 보안 전환 및 E2E 실시간 스트리밍 검증을 완벽하게 마친 후, 불필요한 과금을 방지하기 위해 **모든 인스턴스 및 디스크 자원이 안전하게 삭제(Torn Down)** 되었습니다. 재배포가 필요한 경우 `cd compute_engine && python deploy_to_compute_engine.py` 명령으로 언제든 1분 내에 동일 환경으로 재기동할 수 있습니다.

| 항목 | 사양 / 설정값 |
| :--- | :--- |
| **인스턴스 이름** | `gemini-chatbot-vm` (검증 후 삭제 완료) |
| **리전 / 영역** | `us-central1-a` (월 최저 $25.46 티어) |
| **머신 유형** | `e2-medium` (vCPU 2개, 4GB RAM) |
| **부팅 디스크** | 10GB pd-balanced (Debian 12 Bookworm, 삭제 완료) |
| **기존 공인 IP** | `104.197.160.233` (반납 완료) |
| **기존 HTTPS 주소** | 🔒 `https://104.197.160.233.sslip.io` (검증 성공) |
| **웹 서버 / 프록시** | Nginx (Let's Encrypt SSL 종료, SSE 실시간 스트리밍 버퍼링 해제 최적화) |
| **백엔드 데몬** | Systemd 서비스 (`chatbot.service`, 내부 3001번 포트 격리 구동) |
| **방화벽 규칙** | `allow-chatbot-service` (자원 정리 시 삭제 완료) |

### 2. HTTPS (SSL/TLS) 보안 연결 요약
- **SSL 인증서**: 글로벌 공인 인증기관 **Let's Encrypt**에서 `104.197.160.233.sslip.io` 도메인에 대한 공식 인증서를 자동 발급받아 적용하였습니다.
- **브라우저 호환성**: Chrome, Edge, Safari 등 모든 모던 웹 브라우저에서 '안전하지 않음' 경고 없이 안전한 자물쇠(🔒) 아이콘과 함께 작동하며, 브라우저 마이크 음성 인식(STT) 등의 Web API도 완벽하게 지원되었습니다.
- **자동 갱신**: Certbot systemd 타이머(`certbot.timer`)가 백그라운드에서 만료 전 자동 갱신을 수행하도록 구성되었습니다.

### 3. GCP Secret Manager 안전 연동
- **Secret 리소스**: `projects/94943462326/secrets/GEMINI_API_KEY`
- **IAM 권한**: Compute Engine 기본 서비스 계정(`94943462326-compute@developer.gserviceaccount.com`)에 `roles/secretmanager.secretAccessor` 역할을 부여하여, 인스턴스 내부에서 안전하게 API 키를 동적으로 취득합니다.
- **주입 방식**: VM 부팅 시 `startup-script.sh`에서 gcloud CLI를 통해 Secret Manager의 최신 비밀값을 획득하여 서비스 구동 환경으로 자동 주입합니다.

### 4. 배포 자동화 도구 및 상세 로그
- **`compute_engine/deploy_to_compute_engine.py`**: 코드 자동 패키징(Base64 tarball), startup-script 생성, VM 프로비저닝, 헬스체크 및 실시간 스트리밍 테스트를 수행하는 원클릭 배포 스크립트.
- **`compute_engine/setup_https.sh`**: Nginx 리버스 프록시, Let's Encrypt SSL 연동, 포트 443/3000 HTTPS 및 자동 리다이렉트를 구성하는 스크립트.
- **`compute_engine/deployment.log`**: 방화벽 확인, IAM 권한 부여, VM 생성, IP 할당, 헬스체크 응답, HTTPS SSL 인증서 발급 등 배포 전 과정의 상세 실행 로그가 타임스탬프와 함께 완벽히 기록된 파일.
- **`compute_engine/startup-script.sh`**: 인스턴스 최초 부팅 시 Node.js 20 설치, 코드 압축 해제, Secret Manager 키 다운로드, systemd 데몬 등록을 수행하는 초기화 스크립트.


### 5. Compute Engine 인스턴스 관리 안내 (비용 절약)
사용하지 않을 때는 인스턴스를 중지하여 불필요한 컴퓨팅 비용 청구를 방지할 수 있습니다:
```bash
# 인스턴스 중지 (컴퓨트 비용 발생 중지)
gcloud compute instances stop gemini-chatbot-vm --zone=us-central1-a --project=iceu-songpa03

# 인스턴스 재시작
gcloud compute instances start gemini-chatbot-vm --zone=us-central1-a --project=iceu-songpa03

# 인스턴스 완전 삭제
gcloud compute instances delete gemini-chatbot-vm --zone=us-central1-a --project=iceu-songpa03 --quiet
```

---

## 🔒 HTTP vs HTTPS 비교 및 프로토콜 전환 기술 분석

초기 배포 단계에서는 Compute Engine 공인 IP 기반의 일반 **HTTP (포트 80/3000)** 로 서비스를 시작하였으나, 브라우저 보안 경고 해소 및 안전한 통신 환경을 구축하기 위해 **HTTPS (포트 443/3000 SSL)** 로 전환하였습니다.

### 1. HTTP와 HTTPS의 2가지 프로토콜 핵심 차이점

| 비교 항목 | HTTP (HyperText Transfer Protocol) | HTTPS (HTTP Secure, SSL/TLS) |
| :--- | :--- | :--- |
| **보안 / 암호화** | **평문(Plaintext) 전송**<br>- 패킷 스니핑, 중간자 공격(MITM)에 취약<br>- 전송 데이터(대화 내용, 토큰 등) 탈취 위험 | **SSL/TLS 기반 종단 간 전송 암호화**<br>- 공개키/대칭키 암호화로 데이터 기밀성 보장<br>- 데이터 무결성 검증으로 위변조 방지 |
| **신뢰도 및 브라우저 표시** | ❌ 브라우저 주소창에 **`▲ 안전하지 않음`** 경고 문구 상시 노출 | 🔒 브라우저 주소창에 **안전한 연결 자물쇠 아이콘** 표시, 사용자 신뢰 확보 |
| **기본 포트** | TCP **`80`** (또는 사용자 지정 `3000`) | TCP **`443`** (암호화 핸드셰이크 후 통신) |
| **웹 표준 보안 API 지원 (Secure Context)** | ❌ **강제 차단**<br>- 브라우저 마이크 음성 인식(Web Speech API)<br>- 클립보드 복사(Clipboard API), 푸시 알림 등 사용 불가 | ✅ **완벽 지원**<br>- 보안 컨텍스트(Secure Context) 조건을 충족하여 마이크 음성 입력(STT) 및 모든 Web API 정상 구동 |
| **검색 엔진 최적화 (SEO)** | 검색 엔진 랭킹 산정 시 불이익 | 구글 등 주요 검색 엔진의 가산점 및 신뢰성 부여 |

---

### 2. HTTPS 프로토콜 전환을 위해 도입된 핵심 기술 스택

Compute Engine 환경에서 추가 비용 없이 신뢰할 수 있는 HTTPS 환경을 구성하기 위해 다음과 같은 기술을 통합 적용하였습니다:

```
[클라이언트 웹 브라우저]
       │
       ▼ (HTTPS : 443 / : 3000) - Let's Encrypt 공인 SSL 암호화
┌─────────────────────────────────────────────────────────────┐
│ Google Cloud Compute Engine (gemini-chatbot-vm)             │
│                                                             │
│  [GCP 방화벽] ─────────▶ TCP 80, 443, 3000 포트 허용        │
│                                                             │
│  [Nginx 리버스 프록시]                                      │
│    ├─ 포트 80 (HTTP) ──────▶ HTTPS로 301 자동 리다이렉트     │
│    ├─ 포트 3000 (HTTP 평문) ─▶ error_page 497 -> HTTPS 전환  │
│    └─ 포트 443 / 3000 (SSL) ─▶ SSL Termination (복호화)     │
│                                │                            │
│                                ▼ (내부 프록시: 무버퍼링 SSE)│
│  [Node.js Express 백엔드] (127.0.0.1:3001)                  │
│    └─ Secret Manager 연동: GEMINI_API_KEY 취득               │
│    └─ Google Gemini 3.8 & 3.7 Flash 실시간 SSE 스트리밍     │
└─────────────────────────────────────────────────────────────┘
```

#### ① Let's Encrypt (공인 인증기관, CA)
- **역할**: 전 세계 모든 브라우저 및 운영체제에 루트 인증서가 탑재된 글로벌 공인 인증기관(CA).
- **효과**: 자체 서명(Self-signed) 인증서 사용 시 발생하는 빨간색 "연결이 비공개로 설정되어 있지 않습니다" 경고 화면을 원천 배제하고, 신뢰할 수 있는 공식 인증서(`fullchain.pem`, `privkey.pem`)를 무료로 발급받아 적용.

#### ② sslip.io (Wildcard IP DNS 매핑 기술)
- **역할**: IP 주소(`104.197.160.233`)를 별도의 유료 도메인 구매나 네임서버 등록 없이 유효한 FQDN(`104.197.160.233.sslip.io`)으로 자동 변환해 주는 공용 DNS 매핑 서비스.
- **도입 이유**: Let's Encrypt는 보안 정책상 원시 공인 IP 주소에 직접 무료 인증서를 발급하지 않으므로, `sslip.io`를 통해 정식 도메인 자격을 부여하여 공인 SSL 발급 요건을 충족.

#### ③ Certbot (ACME 프로토콜 자동화 클라이언트)
- **역할**: Let's Encrypt의 ACME(Automated Certificate Management Environment) 프로토콜을 수행하는 자동화 에이전트.
- **기능**: 도메인 소유권 검증(HTTP-01 Challenge)을 거쳐 인증서를 자동 획득하고, Linux `certbot.timer` 데몬을 통해 90일 주기의 만료일 전에 백그라운드 무중단 자동 갱신 수행.

#### ④ Nginx (고성능 리버스 프록시 & SSL 오프로딩)
- **SSL Termination**: TLS 암호화/복호화 연산을 Nginx 웹 서버 레벨에서 고속 처리하여 백엔드(Node.js) 프로세스의 부하를 제거.
- **포트 통합 및 자동 리다이렉트**: 
  - `포트 80` 및 `포트 3000`에 평문 HTTP로 접근하더라도 `301 Moved Permanently` (및 Nginx `error_page 497`)를 통해 안전한 HTTPS 주소로 강제 전환.
- **SSE(Server-Sent Events) 실시간 스트리밍 최적화**: 
  - `proxy_buffering off`, `proxy_cache off`, `chunked_transfer_encoding on`을 적용하여 Nginx가 Gemini AI의 스트리밍 토큰을 버퍼에 모으지 않고 사용자 화면으로 즉시 흘려보내도록 설정.

#### ⑤ Google Cloud VPC 방화벽 (Firewall Rule) & 태그
- **역할**: GCP 네트워크 가상 사설망(VPC) 차원에서 인스턴스로 유입되는 인바운드 트래픽 제어.
- **구성**: 방화벽 규칙 `allow-chatbot-service`에 `tcp:443` 포트를 허용 규칙으로 추가하고, 인스턴스에 `https-server` 태그를 부여하여 전 세계 사용자로부터의 암호화 웹 트래픽 수신을 완벽 보장.


---

## 📌 작업 규칙 (Rule)
- **README 최신화 원칙**: 본 저장소 내에서 기능 추가, UI 수정, 패키지 변경, 클라우드 배포 등 모든 작업이 완료된 후에는 반드시 `README.md` 파일을 최신 작업 내역에 맞춰 업데이트합니다.

