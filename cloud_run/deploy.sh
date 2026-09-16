#!/usr/bin/env bash
set -e

PROJECT_ID="iceu-songpa03"
PROJECT_NUMBER="94943462326"
REGION="us-central1"
SERVICE_NAME="gemini-chatbot-run"
SECRET_NAME="GEMINI_API_KEY"

echo "=================================================================="
echo "🚀 Gemini Web Chatbot -> Google Cloud Run 배포 시작"
echo "📌 프로젝트: $PROJECT_ID | 리전: $REGION | 서비스: $SERVICE_NAME"
echo "=================================================================="

# 1. 활성 프로젝트 설정
gcloud config set project "$PROJECT_ID"

# 2. 필수 API 활성화
echo "[1/4] 필수 GCP API 활성화 확인..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project="$PROJECT_ID"

# 3. Secret Manager 권한 바인딩
echo "[2/4] Secret Manager IAM 권한 설정..."
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" || true

# 4. Cloud Run 소스 기반 빌드 및 배포
echo "[3/4] Cloud Run 소스 빌드 및 배포..."
cd "$(dirname "$0")"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=projects/${PROJECT_NUMBER}/secrets/${SECRET_NAME}:latest" \
  --port=8080 \
  --timeout=300s \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1

# 5. 배포 URL 취득
echo "[4/4] 배포 완료 URL 확인..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')

echo "=================================================================="
echo "🎉 Cloud Run 배포 완료!"
echo "🌐 접속 URL: $SERVICE_URL"
echo "=================================================================="
