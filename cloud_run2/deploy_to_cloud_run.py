#!/usr/bin/env python3
"""
Google Cloud Run Automated Deployment Script for Gemini Web Chatbot (ADC Mode)
- Project: iceu-songpa03
- Region: us-central1
- Service: gemini-chatbot-adc
- Authentication: Application Default Credentials (ADC) - No API Key, No Secret Manager!
- Cross-platform compatible (Windows / Linux / macOS)
"""

import os
import sys
import time
import json
import subprocess
import urllib.request
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "cloud_run2_deployment.log")

PROJECT_ID = "iceu-songpa03"
PROJECT_NUMBER = "94943462326"
REGION = "asia-northeast3"  # Seoul Region
SERVICE_NAME = "gemini-chatbot-adc"
REPOSITORY_NAME = "chatbot-repo"
IMAGE_TAG = f"us-central1-docker.pkg.dev/{PROJECT_ID}/{REPOSITORY_NAME}/{SERVICE_NAME}:v2"

def log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] [{level}] {msg}"
    print(log_line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line + "\n")

def run_cmd(cmd, cwd=None, check=True):
    log(f"명령어 실행: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=cwd)
    if res.stdout.strip():
        for line in res.stdout.strip().split("\n"):
            log(f"  [STDOUT] {line}")
    if res.stderr.strip():
        for line in res.stderr.strip().split("\n"):
            log(f"  [STDERR] {line}", level="WARN" if res.returncode == 0 else "ERROR")
    if check and res.returncode != 0:
        raise RuntimeError(f"명령어 실패 (code {res.returncode}): {cmd}\n{res.stderr}")
    return res

def main():
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== Google Cloud Run ADC Mode Deployment Log ===\n")

    log("==================================================================")
    log("🚀 Gemini Web Chatbot (ADC 모드) -> Cloud Run 배포 시작")
    log(f"📌 대상 프로젝트: {PROJECT_ID}")
    log(f"📌 대상 리전: {REGION}")
    log(f"📌 서비스 명칭: {SERVICE_NAME}")
    log(f"🔒 인증 방식: Application Default Credentials (ADC, Keyless)")
    log(f"📌 이미지 태그: {IMAGE_TAG}")
    log("==================================================================")

    # ----------------------------------------------------
    # Step 1: GCP 인증 및 프로젝트 확인
    # ----------------------------------------------------
    log("\n[Step 1/5] GCP 인증 상태 및 활성 프로젝트 확인")
    res = run_cmd("gcloud config get-value project")
    current_proj = res.stdout.strip()
    log(f"현재 설정된 GCP 프로젝트: {current_proj}")
    if current_proj != PROJECT_ID:
        log(f"프로젝트를 {PROJECT_ID}로 전환합니다...")
        run_cmd(f"gcloud config set project {PROJECT_ID}")

    # ----------------------------------------------------
    # Step 2: 필수 API 활성화 및 IAM 권한 확인
    # ----------------------------------------------------
    log("\n[Step 2/5] 필수 API 활성화 및 서비스 계정 Vertex AI IAM 권한 확인")
    run_cmd(f"gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com --project={PROJECT_ID}", check=False)
    
    sa_email = f"{PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    log(f"서비스 계정({sa_email})에 roles/aiplatform.user 바인딩...")
    run_cmd(f"gcloud projects add-iam-policy-binding {PROJECT_ID} --member=\"serviceAccount:{sa_email}\" --role=\"roles/aiplatform.user\"", check=False)

    # ----------------------------------------------------
    # Step 3: Cloud Build를 통한 컨테이너 이미지 빌드 & Artifact Registry 등록
    # ----------------------------------------------------
    log("\n[Step 3/5] Cloud Build 컨테이너 빌드 및 Artifact Registry 푸시")
    build_cmd = f"gcloud builds submit . --tag {IMAGE_TAG} --project={PROJECT_ID}"
    run_cmd(build_cmd, cwd=BASE_DIR)

    # ----------------------------------------------------
    # Step 4: Cloud Run 키리스 배포 (No --set-secrets)
    # ----------------------------------------------------
    log("\n[Step 4/5] Google Cloud Run 서비스 배포 (ADC Keyless 모드)")
    deploy_cmd = (
        f"gcloud run deploy {SERVICE_NAME} "
        f"--image={IMAGE_TAG} "
        f"--project={PROJECT_ID} "
        f"--region={REGION} "
        f"--platform=managed "
        f"--allow-unauthenticated "
        f"--service-account={sa_email} "
        f"--set-env-vars=VERTEX_LOCATION=us-central1 "
        f"--port=8080 "
        f"--timeout=300s "
        f"--min-instances=0 "
        f"--max-instances=10 "
        f"--memory=512Mi "
        f"--cpu=1 "
        f"--format=json"
    )

    deploy_res = run_cmd(deploy_cmd)
    
    service_url = None
    try:
        deploy_json = json.loads(deploy_res.stdout)
        service_url = deploy_json.get("status", {}).get("url")
    except Exception:
        pass

    if not service_url:
        desc_res = run_cmd(f"gcloud run services describe {SERVICE_NAME} --project={PROJECT_ID} --region={REGION} --format=\"value(status.url)\"")
        service_url = desc_res.stdout.strip()

    log(f"Cloud Run ADC 서비스 배포 성공! 배포된 HTTPS URL: {service_url}")

    # ----------------------------------------------------
    # Step 5: 헬스체크 및 서비스 검증
    # ----------------------------------------------------
    log("\n[Step 5/5] 서비스 헬스체크 및 ADC 인증 상태 확인")
    if service_url:
        health_url = f"{service_url}/api/config"
        log(f"헬스체크 요청: {health_url}")
        
        for attempt in range(1, 10):
            time.sleep(3)
            try:
                req = urllib.request.Request(health_url)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 200:
                        body = json.loads(resp.read().decode("utf-8"))
                        log(f"🎉 Cloud Run ADC 헬스체크 응답 성공 (시도 {attempt}): {body}")
                        break
            except Exception as e:
                log(f"  대기 중... ({attempt * 3}초 경과): {e}")

        log("\n" + "=" * 65)
        log("✅ Google Cloud Run ADC 모드 배포가 성공적으로 완료되었습니다!")
        log(f"🌐 Cloud Run ADC HTTPS 웹 접속 주소: {service_url}")
        log("=" * 65)
        log(f"상세 로그가 '{LOG_FILE}'에 기록되었습니다.")
    else:
        log("⚠️ 서비스 URL을 확인할 수 없습니다. gcloud run services list 명령을 확인하세요.", level="WARN")

if __name__ == "__main__":
    main()
