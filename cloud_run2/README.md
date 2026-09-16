# Google Cloud Run 챗봇 (ADC 모드 - `cloud_run2/`)

Google Cloud의 공식 권장 보안 규격인 **애플리케이션 기본 사용자 인증 정보(ADC, Application Default Credentials)** 방식으로 동작하는 Gemini 웹 챗봇 모듈입니다.

---

## 🌟 ADC (Application Default Credentials) 방식의 핵심 장점

1. **완전한 키리스(Keyless) 보안 아키텍처**
   - API 키(`GEMINI_API_KEY`)를 코드, `.env`, Secret Manager 어디에도 저장하거나 주입할 필요가 없습니다.
   - 키 유출, 탈취 또는 만료로 인한 보안 사고 위험이 원천 차단됩니다.
2. **Google Cloud 공식 권장 (Recommended)**
   - Google AI 및 Vertex AI에서 권장하는 엔터프라이즈 표준 인증 방식입니다.
   - 환경의 기존 신원(Identity)을 자동으로 탐지하여 안전한 OAuth2 Bearer 토큰을 동적으로 발급받아 통신합니다.
3. **환경별 자격증명 자동 감지**
   - **Google Cloud Run 환경**: 컨테이너가 시작될 때 GCP 내부 메타데이터 서버를 통해 서비스 계정(`94943462326-compute@developer.gserviceaccount.com`)의 자격증명을 자동으로 감지하고 `roles/aiplatform.user` 권한으로 Vertex AI를 호출합니다.
   - **로컬 PC 개발 환경**: `gcloud auth application-default login` 명령으로 생성된 로컬 ADC 파일(`application_default_credentials.json`)을 자동으로 찾아 인증합니다.

---

## 📁 디렉토리 파일 구성

```
cloud_run2/
├── public/                      # 정적 웹 프론트엔드 리소스 (Gemini UI 레이아웃, 스타일, 앱)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js                    # ADC 토큰(GoogleAuth) 기반 Vertex AI 스트리밍 백엔드
├── package.json                 # google-auth-library 포함 의존성 설정
├── Dockerfile                   # node:20-slim 기반 경량 컨테이너 이미지 정의
├── .dockerignore                # 빌드 제외 설정
├── deploy_to_cloud_run.py       # 키리스 Cloud Run 자동 빌드 & 배포 파이썬 스크립트
├── deploy.sh                    # Linux / Cloud Shell용 배포 쉘 스크립트
└── README.md                    # ADC 모듈 상세 설명서
```

---

## 💻 로컬 개발 환경에서 실행하는 방법

로컬 PC에서는 API 키를 입력하는 대신, Google Cloud CLI의 ADC 로그인을 1회 수행합니다:

1. **ADC 로그인 실행 (1회만 수행)**:
   ```bash
   gcloud auth application-default login
   ```
   - 브라우저가 열리면 Google Cloud 계정(`songpa03@iceu.kr`)으로 로그인합니다.
   - 로컬 시스템에 ADC 인증 파일이 자동 생성됩니다.

2. **할당량 프로젝트 설정 (권장)**:
   ```bash
   gcloud auth application-default set-quota-project iceu-songpa03
   ```

3. **로컬 서버 시작**:
   ```bash
   cd cloud_run2
   npm install
   npm start
   ```
   브라우저에서 `http://localhost:8080` 접속

---

## ☁️ Google Cloud Run 서울 리전 원클릭 배포 (키리스)

Cloud Run 서울 리전(`asia-northeast3`)에 배포할 때는 Secret Manager 설정이나 API 키 전달 플래그가 전혀 필요 없습니다:

```bash
# cloud_run2 폴더에서 실행
cd cloud_run2
python deploy_to_cloud_run.py

# 또는 프로젝트 루트에서 실행
python cloud_run2/deploy_to_cloud_run.py
```

### 배포된 서울 리전 라이브 서비스
👉 🔒 **[`https://gemini-chatbot-adc-94943462326.asia-northeast3.run.app`](https://gemini-chatbot-adc-94943462326.asia-northeast3.run.app)**

배포 스크립트는 다음 과정을 자동으로 수행합니다:
1. `aiplatform.googleapis.com` 및 Cloud Run API 활성화 확인
2. Compute 기본 서비스 계정에 `roles/aiplatform.user` 권한 부여
3. Cloud Build를 통해 컨테이너 이미지 빌드 및 Artifact Registry 등록
4. `gcloud run deploy gemini-chatbot-adc --region=asia-northeast3` 실행 (키리스 배포)
5. 자동 발급된 서울 리전 보안 HTTPS URL 취득 및 E2E 헬스체크

---

## 📊 cloud_run (API Key/Secret) vs cloud_run2 (ADC) 비교

| 비교 항목 | cloud_run (기존 방식) | cloud_run2 (ADC 방식) |
| :--- | :--- | :--- |
| **인증 방식** | API Key (GCP Secret Manager) | **Application Default Credentials (ADC)** |
| **보안 메커니즘** | Secret Manager에서 키 주입 | **IAM 서비스 계정 OAuth2 Bearer 토큰 자동 취득** |
| **API 키 필요 여부** | 필요함 (`GEMINI_API_KEY`) | **전혀 불필요 (100% Keyless)** |
| **호출 엔드포인트** | Google AI Studio REST 엔드포인트 | **Google Cloud Vertex AI Model API** |
| **배포 명령어** | `--set-secrets=GEMINI_API_KEY=...` 필요 | **시크릿 플래그 불필요 (간결하고 안전)** |
| **구글 권장도** | 개인 개발 / 프로토타입 | **엔터프라이즈 및 프로덕션 공식 권장 (Recommended)** |
