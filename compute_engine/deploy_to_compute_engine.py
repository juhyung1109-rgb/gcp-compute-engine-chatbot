#!/usr/bin/env python3
"""
GCP Compute Engine Automated Deployment Script for Gemini Web Chatbot
- References: compute_engine_example.ipynb
- Project: iceu-songpa03 (Project Number: 94943462326)
- Zone: us-central1-a
- Secret: projects/94943462326/secrets/GEMINI_API_KEY
- Logs all operations to deployment.log
"""

import os
import sys
import time
import json
import base64
import tarfile
import io
import urllib.request
import subprocess
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

LOG_FILE = "deployment.log"
PROJECT_ID = "iceu-songpa03"
PROJECT_NUMBER = "94943462326"
ZONE = "us-central1-a"
INSTANCE_NAME = "gemini-chatbot-vm"
SECRET_NAME = f"projects/{PROJECT_NUMBER}/secrets/GEMINI_API_KEY"

def log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] [{level}] {msg}"
    print(log_line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line + "\n")

def run_cmd(cmd, check=True):
    log(f"명령어 실행: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
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
    # Initialize log file
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== Google Cloud Compute Engine Deployment Log ===\n")
    
    log("==================================================================")
    log("🚀 Gemini Web Chatbot -> GCP Compute Engine 배포 시작")
    log(f"📌 대상 프로젝트: {PROJECT_ID} (Project Number: {PROJECT_NUMBER})")
    log(f"📌 대상 리전/영역: {ZONE}")
    log(f"📌 인스턴스 명칭: {INSTANCE_NAME}")
    log(f"📌 Secret Manager Secret: {SECRET_NAME}")
    log("==================================================================")

    # ----------------------------------------------------
    # Step 1: 인증 및 프로젝트 설정 확인
    # ----------------------------------------------------
    log("\n[Step 1/7] GCP 인증 상태 및 기본 프로젝트 검증")
    res = run_cmd("gcloud config get-value project")
    current_proj = res.stdout.strip()
    log(f"현재 설정된 GCP 프로젝트: {current_proj}")
    if current_proj != PROJECT_ID:
        log(f"프로젝트를 {PROJECT_ID}로 설정합니다...")
        run_cmd(f"gcloud config set project {PROJECT_ID}")

    # ----------------------------------------------------
    # Step 2: Secret Manager 키 확인 및 IAM 권한 검증
    # ----------------------------------------------------
    log("\n[Step 2/7] GCP Secret Manager GEMINI_API_KEY 검증 및 권한 확인")
    try:
        sec_res = run_cmd(f"gcloud secrets versions access latest --secret=GEMINI_API_KEY --project={PROJECT_NUMBER}")
        key_preview = sec_res.stdout.strip()[:6] + "..." if sec_res.stdout.strip() else "EMPTY"
        log(f"Secret Manager 키 로드 성공 확인 (미리보기: {key_preview})")
    except Exception as e:
        log(f"Secret Manager 조회 경고: {e}", level="WARN")

    # Compute Engine 기본 SA에 Secret Accessor 권한 부여
    sa_email = f"{PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    log(f"Compute Engine 서비스 계정({sa_email})의 Secret Manager 권한 바인딩 확인...")
    run_cmd(
        f'gcloud secrets add-iam-policy-binding GEMINI_API_KEY --project={PROJECT_NUMBER} '
        f'--member="serviceAccount:{sa_email}" --role="roles/secretmanager.secretAccessor"',
        check=False
    )

    # ----------------------------------------------------
    # Step 3: 방화벽 규칙 확인 및 생성 (3000, 80 포트)
    # ----------------------------------------------------
    log("\n[Step 3/7] 방화벽 규칙 (allow-chatbot-service) 확인")
    fw_check = run_cmd("gcloud compute firewall-rules list --filter=\"name=allow-chatbot-service\" --format=json", check=False)
    if "allow-chatbot-service" not in fw_check.stdout:
        log("방화벽 규칙 생성 중 (tcp:3000, tcp:80 허용)...")
        run_cmd(
            f'gcloud compute firewall-rules create allow-chatbot-service '
            f'--project={PROJECT_ID} --allow="tcp:3000,tcp:80" --target-tags=chatbot-server '
            f'--description="Allow incoming traffic for Gemini Chatbot Web Service"'
        )
    else:
        log("방화벽 규칙(allow-chatbot-service)이 이미 존재합니다.")

    # ----------------------------------------------------
    # Step 4: 챗봇 소스 코드 패키징 (Base64 Tarball 생성)
    # ----------------------------------------------------
    log("\n[Step 4/7] 챗봇 애플리케이션 소스 패키징 (server.js, public/, package.json)")
    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode="w:gz") as tar:
        for item in ["package.json", "server.js", "public"]:
            if os.path.exists(item):
                tar.add(item)
                log(f"  + 아카이브 추가: {item}")
    
    tar_bytes = tar_stream.getvalue()
    tar_b64 = base64.b64encode(tar_bytes).decode("utf-8")
    log(f"소스 아카이브 패키징 완료 (압축 크기: {len(tar_bytes)} bytes, Base64 크기: {len(tar_b64)} chars)")

    # ----------------------------------------------------
    # Step 5: Startup Script 생성
    # ----------------------------------------------------
    log("\n[Step 5/7] Compute Engine VM 시작 스크립트 (startup-script.sh) 생성")
    startup_script_content = f"""#!/bin/bash
set -ex

exec > >(tee -a /var/log/chatbot-startup.log) 2>&1
echo "=== [$(date)] 챗봇 VM 초기 구성 시작 ==="

# 1. 시스템 업데이트 및 Node.js 20 설치
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git iptables

if ! command -v node > /dev/null 2>&1; then
    echo "Node.js 20 LTS 설치 진행 중..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js 버전: $(node -v)"
echo "NPM 버전: $(npm -v)"

# 2. 애플리케이션 디렉토리 준비
mkdir -p /opt/chatbot
cd /opt/chatbot

# 3. 소스코드 압축 해제
cat << 'EOF_TAR' | base64 -d | tar -xz -C /opt/chatbot
{tar_b64}
EOF_TAR

# 4. GCP Secret Manager에서 GEMINI_API_KEY 로드
echo "GCP Secret Manager({SECRET_NAME})에서 API 키를 가져옵니다..."
GEMINI_KEY=$(gcloud secrets versions access latest --secret=GEMINI_API_KEY --project={PROJECT_NUMBER} || true)

if [ -n "$GEMINI_KEY" ]; then
    echo "Secret Manager 키 로드 성공!"
    echo "GEMINI_API_KEY=$GEMINI_KEY" > /opt/chatbot/.env
    echo "PORT=3000" >> /opt/chatbot/.env
else
    echo "WARN: gcloud로 키를 가져오지 못했습니다. 메타데이터 또는 기존 설정 확인 필요."
fi

# 5. 의존성 패키지 설치
echo "NPM 의존성 설치 중..."
npm install --omit=dev

# 6. Systemd 서비스 등록 및 자동 시작 설정
echo "Systemd chatbot.service 등록..."
cat << 'EOF_SVC' > /etc/systemd/system/chatbot.service
[Unit]
Description=Gemini Web Chatbot Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/chatbot
EnvironmentFile=/opt/chatbot/.env
ExecStart=/usr/bin/node /opt/chatbot/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF_SVC

systemctl daemon-reload
systemctl enable chatbot.service
systemctl restart chatbot.service

# 7. 포트 80 트래픽을 3000으로 리다이렉트 (편의성)
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 || true

echo "=== [$(date)] 챗봇 VM 초기 구성 완료! 서비스 실행 상태 ==="
systemctl status chatbot.service --no-pager
"""

    with open("startup-script.sh", "w", encoding="utf-8", newline="\n") as f:
        f.write(startup_script_content)
    log("startup-script.sh 저장 완료.")

    # ----------------------------------------------------
    # Step 6: Compute Engine 인스턴스 생성
    # ----------------------------------------------------
    log("\n[Step 6/7] Compute Engine VM 인스턴스 생성 및 부팅")
    
    # 기존에 동일한 이름의 인스턴스가 있는지 확인
    check_inst = run_cmd(f'gcloud compute instances list --filter="name={INSTANCE_NAME}" --format=json', check=False)
    if INSTANCE_NAME in check_inst.stdout:
        log(f"기존 인스턴스({INSTANCE_NAME})가 이미 존재합니다. 상태 확인 중...")
    else:
        log(f"새로운 인스턴스({INSTANCE_NAME})를 생성합니다 (e2-medium, {ZONE})...")
        create_cmd = (
            f"gcloud compute instances create {INSTANCE_NAME} "
            f"--project={PROJECT_ID} "
            f"--zone={ZONE} "
            f"--machine-type=e2-medium "
            f"--network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default "
            f"--tags=chatbot-server,http-server "
            f"--metadata-from-file=startup-script=startup-script.sh "
            f"--service-account={sa_email} "
            f"--scopes=https://www.googleapis.com/auth/cloud-platform "
            f"--create-disk=auto-delete=yes,boot=yes,image=projects/debian-cloud/global/images/debian-12-bookworm-v20260908,size=10,type=pd-balanced "
            f"--labels=app=gemini-chatbot,managed-by=antigravity"
        )
        run_cmd(create_cmd)
        log("Compute Engine VM 인스턴스 생성 명령 완료!")

    # ----------------------------------------------------
    # Step 7: 외부 IP 확인 및 서비스 헬스체크
    # ----------------------------------------------------
    log("\n[Step 7/7] 인스턴스 외부 IP 확인 및 웹 서비스 기동 대기 (Health Check)")
    desc_cmd = f"gcloud compute instances describe {INSTANCE_NAME} --zone={ZONE} --project={PROJECT_ID} --format=json"
    desc_res = run_cmd(desc_cmd)
    vm_info = json.loads(desc_res.stdout)
    
    # 외부 IP 추출
    external_ip = None
    network_interfaces = vm_info.get("networkInterfaces", [])
    if network_interfaces:
        access_configs = network_interfaces[0].get("accessConfigs", [])
        if access_configs:
            external_ip = access_configs[0].get("natIP")

    log(f"인스턴스 외부 IP (Public IP): {external_ip}")
    
    if not external_ip:
        log("외부 IP를 가져올 수 없습니다. 네트워크 설정을 확인하세요.", level="ERROR")
        return

    service_url_3000 = f"http://{external_ip}:3000"
    service_url_80 = f"http://{external_ip}"

    log("=" * 65)
    log(f"🌐 접속 URL (포트 3000): {service_url_3000}")
    log(f"🌐 접속 URL (기본 포트 80): {service_url_80}")
    log("=" * 65)

    # 헬스체크 폴링 (최대 3분)
    log("스타트업 스크립트 실행 및 Node.js 서버 기동 대기 중 (약 30~60초 소요)...")
    max_retries = 36
    health_ok = False

    for attempt in range(1, max_retries + 1):
        time.sleep(5)
        try:
            req = urllib.request.Request(f"{service_url_3000}/api/config")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    log(f"🎉 서비스 응답 성공! (시도 {attempt}/{max_retries}): {resp_data}")
                    health_ok = True
                    break
        except Exception as e:
            if attempt % 4 == 0:
                log(f"  대기 중... ({attempt * 5}초 경과, 응답 대기)")

    if health_ok:
        log("\n✅ 배포 및 헬스체크가 성공적으로 완료되었습니다!")
        log(f"웹 브라우저에서 아래 주소로 접속하여 챗봇을 즉시 사용하실 수 있습니다:")
        log(f"👉 {service_url_3000}")
    else:
        log("\n⚠️ 헬스체크 제한 시간 초과 (VM 내부에서 패키지 설치가 아직 진행 중일 수 있습니다).")
        log(f"잠시 후 브라우저에서 {service_url_3000} 로 직접 접속을 시도해보세요.")
        log("VM 내부 시작 로그 확인 명령어: gcloud compute ssh " + INSTANCE_NAME + f" --zone={ZONE} --command='sudo cat /var/log/chatbot-startup.log'")

    log("\n==================================================================")
    log(f"📄 전체 배포 과정이 '{LOG_FILE}'에 기록되었습니다.")
    log("==================================================================")

if __name__ == "__main__":
    main()
