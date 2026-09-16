#!/usr/bin/env python3
"""
Google Cloud Run Automated Deployment Script for Gemini Web Chatbot
- Project: iceu-songpa03
- Region: us-central1
- Service: gemini-chatbot-run
- Secret: GEMINI_API_KEY (from GCP Secret Manager)
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
LOG_FILE = os.path.join(BASE_DIR, "cloud_run_deployment.log")

PROJECT_ID = "iceu-songpa03"
PROJECT_NUMBER = "94943462326"
REGION = "us-central1"
SERVICE_NAME = "gemini-chatbot-run"
SECRET_NAME = "GEMINI_API_KEY"
SECRET_RESOURCE_NAME = f"projects/{PROJECT_NUMBER}/secrets/{SECRET_NAME}"

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
        f.write("=== Google Cloud Run Automated Deployment Log ===\n")

    log("==================================================================")
    log("🚀 Gemini Web Chatbot -> Google Cloud Run 배포 시작")
    log(f"📌 대상 프로젝트: {PROJECT_ID}")
    log(f"📌 대상 리전: {REGION}")
    log(f"📌 서비스 명칭: {SERVICE_NAME}")
    log(f"📌 Secret Manager Secret: {SECRET_NAME}")
    log(f"📌 소스 디렉토리: {BASE_DIR}")
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
    # Step 2: 필수 GCP API 활성화 확인
    # ----------------------------------------------------
    log("\n[Step 2/5] 필수 API 활성화 상태 점검 (run, cloudbuild, artifactregistry, secretmanager)")
    apis = [
        "run.googleapis.com",
        "cloudbuild.googleapis.com",
        "artifactregistry.googleapis.com",
        "secretmanager.googleapis.com"
    ]
    api_cmd = f"gcloud services enable {' '.join(apis)} --project={PROJECT_ID}"
    run_cmd(api_cmd, check=False)

    # ----------------------------------------------------
    # Step 3: Secret Manager 및 IAM 권한 확인
    # ----------------------------------------------------
    log("\n[Step 3/5] Secret Manager GEMINI_API_KEY 접근 권한 설정")
    # Cloud Run 기본 서비스 계정 및 Compute 기본 서비스 계정에 권한 부여
    sa_emails = [
        f"{PROJECT_NUMBER}-compute@developer.gserviceaccount.com",
        f"{PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
    ]
    for sa in sa_emails:
        log(f"서비스 계정({sa})에 Secret Accessor 바인딩 확인...")
        run_cmd(
            f'gcloud secrets add-iam-policy-binding {SECRET_NAME} --project={PROJECT_ID} '
            f'--member="serviceAccount:{sa}" --role="roles/secretmanager.secretAccessor"',
            check=False
        )

    # ----------------------------------------------------
    # Step 4: Cloud Run 소스 기반 배포 (gcloud run deploy --source .)
    # ----------------------------------------------------
    log("\n[Step 4/5] Google Cloud Run 소스 빌드 및 컨테이너 배포 실행")
    log("Cloud Build를 통해 컨테이너 이미지를 자동 빌드하고 Cloud Run에 배포합니다 (약 1~2분 소요)...")

    deploy_cmd = (
        f"gcloud run deploy {SERVICE_NAME} "
        f"--source . "
        f"--project={PROJECT_ID} "
        f"--region={REGION} "
        f"--platform=managed "
        f"--allow-unauthenticated "
        f"--set-secrets=GEMINI_API_KEY={SECRET_RESOURCE_NAME}:latest "
        f"--port=8080 "
        f"--timeout=300s "
        f"--min-instances=0 "
        f"--max-instances=10 "
        f"--memory=512Mi "
        f"--cpu=1 "
        f"--format=json"
    )

    # Execute inside BASE_DIR where Dockerfile & source code reside
    deploy_res = run_cmd(deploy_cmd, cwd=BASE_DIR)
    
    service_url = None
    try:
        deploy_json = json.loads(deploy_res.stdout)
        service_url = deploy_json.get("status", {}).get("url")
    except Exception:
        # Fallback to direct URL describe
        pass

    if not service_url:
        desc_res = run_cmd(f"gcloud run services describe {SERVICE_NAME} --project={PROJECT_ID} --region={REGION} --format=\"value(status.url)\"")
        service_url = desc_res.stdout.strip()

    log(f"Cloud Run 서비스 배포 성공! 배포된 HTTPS URL: {service_url}")

    # ----------------------------------------------------
    # Step 5: 헬스체크 및 서비스 검증
    # ----------------------------------------------------
    log("\n[Step 5/5] 서비스 헬스체크 및 API 상태 확인")
    if service_url:
        health_url = f"{service_url}/api/config"
        log(f"헬스체크 요청: {health_url}")
        
        health_ok = False
        for attempt in range(1, 10):
            time.sleep(3)
            try:
                req = urllib.request.Request(health_url)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 200:
                        body = json.loads(resp.read().decode("utf-8"))
                        log(f"🎉 Cloud Run 헬스체크 응답 성공 (시도 {attempt}): {body}")
                        health_ok = True
                        break
            except Exception as e:
                log(f"  대기 중... ({attempt * 3}초 경과): {e}")

        log("\n" + "=" * 65)
        log("✅ Google Cloud Run 배포가 성공적으로 완료되었습니다!")
        log(f"🌐 Cloud Run HTTPS 웹 접속 주소: {service_url}")
        log("=" * 65)
        log(f"상세 로그가 '{LOG_FILE}'에 기록되었습니다.")
    else:
        log("⚠️ 서비스 URL을 확인할 수 없습니다. gcloud run services list 명령을 확인하세요.", level="WARN")

if __name__ == "__main__":
    main()
