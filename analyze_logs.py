import subprocess
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

cmd = [
    "gcloud", "logging", "read",
    'resource.type="cloud_run_revision" AND resource.labels.service_name="gemini-chatbot-adc" AND resource.labels.location="asia-northeast3"',
    "--project=iceu-songpa03",
    "--limit=100",
    "--format=json"
]

output = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='replace')
logs = json.loads(output)

print("=" * 70)
print(f"🔍 서울 리전 Cloud Run (gemini-chatbot-adc) 전체 HTTP 요청 및 로그 내역")
print("=" * 70)

http_logs = [l for l in logs if 'httpRequest' in l]
app_logs = [l for l in logs if 'textPayload' in l]

print(f"총 수집된 로그: {len(logs)}건 (HTTP 요청 로그: {len(http_logs)}건, 앱 stdout/stderr: {len(app_logs)}건)")

print("\n[최근 HTTP 요청 기록]")
for l in http_logs[:15]:
    req = l.get('httpRequest', {})
    ts = l.get('timestamp', '')[11:19]
    status = req.get('status')
    method = req.get('requestMethod')
    url = req.get('requestUrl')
    latency = req.get('latency')
    print(f"  [{ts}] {method} {status} ({latency}) -> {url}")

print("\n[최근 애플리케이션 표준 출력 (stdout)]")
for l in app_logs[:10]:
    ts = l.get('timestamp', '')[11:19]
    text = l.get('textPayload', '').strip()
    if text:
        print(f"  [{ts}] {text}")

print("=" * 70)
