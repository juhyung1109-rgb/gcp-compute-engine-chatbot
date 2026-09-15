# GCP Compute Engine & Local Web Chatbot (Gemini 3.8 & 3.7 Flash)

Google Cloud의 Compute Engine 환경 및 로컬 PC 웹 브라우저에서 실행 가능한 **Gemini 3.8 Flash** 및 **Gemini 3.7 Flash** 기반 웹 챗봇 서비스입니다.  
공식 Google Gemini 웹 UI 디자인(헤더 문구, 캡슐형 입력창, 도구 팝업 메뉴, 모델 전환 버튼, 단축키, 음성 인식 등)을 충실하게 재현하고 실시간 스트리밍 대화를 지원합니다.

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
- API 키를 하드코딩하지 않고, 시스템 환경변수 `GEMINI_API_KEY` (또는 `.env`)를 백엔드 서버에서 자동 로드하여 안전하게 관리합니다.

---

## 📁 프로젝트 구조

```
gcp-compute-engine-chatbot/
├── public/                     # 정적 웹 프론트엔드 리소스
│   ├── index.html              # Gemini UI 레이아웃 및 팝업 마크업
│   ├── style.css               # Google Gemini 스타일 시트 (글래스모피즘, 캡슐형 바 등)
│   └── app.js                  # SSE 파서, 모델 스위칭, STT/TTS, 파일 업로드 등
├── server.js                   # Node.js Express 백엔드 (SSE 스트리밍 & Gemini API 연동)
├── package.json                # 프로젝트 메타데이터 및 의존성
├── package-lock.json           # 의존성 락파일
└── README.md                   # 프로젝트 설명 및 실행 가이드 (항시 최신화)
```

---

## 🚀 빠른 시작 (Getting Started)

### 1. 환경 요구사항
- **Node.js**: v18.0.0 이상 권장 (현재 시스템: Node.js v24)
- **Gemini API 키**: Google AI Studio에서 발급받은 API 키

### 2. API 키 환경변수 설정
운영체제 환경변수에 `GEMINI_API_KEY`를 설정하거나 프로젝트 루트에 `.env` 파일을 생성합니다.

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY="AIzaSy..."
```

**Linux / macOS / Compute Engine:**
```bash
export GEMINI_API_KEY="AIzaSy..."
```

**또는 `.env` 파일 생성:**
```env
GEMINI_API_KEY=AIzaSy...
PORT=3000
```

### 3. 패키지 설치
```bash
npm install
```

### 4. 로컬 서버 실행
```bash
npm start
# 또는
node server.js
```

실행 후 웹 브라우저에서 **`http://localhost:3000`** 으로 접속합니다.

---

## ☁️ Google Cloud Compute Engine 배포 가이드

본 프로젝트는 GCP Compute Engine 인스턴스(Ubuntu/Debian)에 손쉽게 배포할 수 있습니다.

1. **Compute Engine VM 인스턴스 생성**:
   - 방화벽에서 `HTTP(80)` 및 필요한 포트(`3000` 등) 허용 설정.
2. **인스턴스 SSH 접속 후 환경 구성**:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm git
   ```
3. **저장소 클론 및 패키지 설치**:
   ```bash
   git clone <REPOSITORY_URL>
   cd gcp-compute-engine-chatbot
   npm install
   ```
4. **환경변수 설정 및 백그라운드 데몬(PM2) 실행**:
   ```bash
   export GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"
   sudo npm install -g pm2
   pm2 start server.js --name "gemini-chatbot"
   pm2 startup
   pm2 save
   ```
5. **VM 인스턴스의 외부 IP(`http://<EXTERNAL_IP>:3000`)로 접속하여 챗봇 이용.**

---

## 📌 작업 규칙 (Rule)
- **README 최신화 원칙**: 본 저장소 내에서 기능 추가, UI 수정, 패키지 변경 등 모든 작업이 완료된 후에는 반드시 `README.md` 파일을 최신 작업 내역에 맞춰 업데이트합니다.
