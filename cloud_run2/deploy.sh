#!/usr/bin/env bash
set -e

PROJECT_ID="iceu-songpa03"
PROJECT_NUMBER="94943462326"
REGION="asia-northeast3"
SERVICE_NAME="gemini-chatbot-adc"
REPOSITORY_NAME="chatbot-repo"
IMAGE_TAG="us-central1-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY_NAME}/${SERVICE_NAME}:v2"

echo "=================================================================="
echo "🚀 Gemini Web Chatbot (ADC 모드) -> Google Cloud Run 서울 리전 배포"
echo "📌 프로젝트: $PROJECT_ID | 리전: $REGION | 서비스: $SERVICE_NAME"
echo "🔒 인증 방식: Application Default Credentials (ADC, Keyless)"
echo "=================================================================="

# 1. 활성 프로젝트 설정
gcloud config set project "$PROJECT_ID"

# 2. 필수 API 및 서비스 계정 권한 확인
echo "[1/4] 필수 API 및 Vertex AI 권한 점검..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com --project="$PROJECT_ID"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user" || true

# 3. Cloud Build 컨테이너 빌드 & 레지스트리 등록
echo "[2/4] Cloud Build 컨테이너 빌드 및 Artifact Registry 푸시..."
cd "$(dirname "$0")"
gcloud builds submit . --tag "$IMAGE_TAG" --project="$PROJECT_ID"

# 4. Cloud Run 키리스 배포 (Secret Manager 불필요, 서울 리전)
echo "[3/4] Cloud Run 서비스 배포 (ADC 모드, 서울 리전)..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE_TAG" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --service-account="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --set-env-vars="VERTEX_LOCATION=us-central1" \
  --port=8080 \
  --timeout=300s \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1

# 5. 배포 완료 URL 확인
echo "[4/4] 배포 완료 URL 확인..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')

echo "=================================================================="
echo "🎉 Cloud Run ADC 챗봇 배포 완료!"
echo "🌐 접속 URL: $SERVICE_URL"
echo "=================================================================="
