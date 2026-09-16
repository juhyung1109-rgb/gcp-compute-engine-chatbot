#!/usr/bin/env python3
"""
Cloud Run ADC Chatbot Concurrent Session Stress Test
- Target URL: https://gemini-chatbot-adc-94943462326.asia-northeast3.run.app
- 2 Concurrent Sessions running in parallel threads
- Each session asks 5 sequential conversational questions (total 10 queries)
- Measures latency, HTTP status, token reception, and errors
"""

import sys
import time
import json
import urllib.request
import threading
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SERVICE_URL = "https://gemini-chatbot-adc-94943462326.asia-northeast3.run.app"
CHAT_ENDPOINT = f"{SERVICE_URL}/api/chat"

# Questions for Session 1 (Seoul Travel & Culture)
SESSION_1_QUESTIONS = [
    "대한민국의 수도는 어디인가요?",
    "그 도시의 대표적인 명소 3가지를 추천해줘.",
    "그 중 첫 번째 명소의 역사적 배경을 2문장으로 요약해줘.",
    "거기서 맛볼 수 있는 대표 음식 2가지를 알려줘.",
    "외국인 친구에게 추천할 당일치기 코스를 간략히 정리해줘."
]

# Questions for Session 2 (Cloud Run & AI Architecture)
SESSION_2_QUESTIONS = [
    "Google Cloud Run의 핵심 장점 3가지를 알려줘.",
    "Scale-to-Zero가 비용 절감에 어떻게 기여하는지 설명해줘.",
    "Cloud Run과 전통적인 가상머신(VM)의 차이점을 한 문장으로 정리해줘.",
    "Application Default Credentials(ADC)가 API Key보다 안전한 이유를 알려줘.",
    "Gemini 모델과 대화할 때 실시간 스트리밍(SSE)을 쓰는 이유는 뭐야?"
]

results = {
    "session_1": [],
    "session_2": []
}

def ask_streaming(session_id, question, history):
    history.append({"role": "user", "content": question})
    payload = json.dumps({
        "model": "gemini-2.5-flash",
        "messages": history,
        "useWebSearch": False
    }).encode("utf-8")

    req = urllib.request.Request(
        CHAT_ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    start_time = time.time()
    response_text = ""
    error_msg = None
    http_status = 200

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            http_status = resp.status
            for raw_line in resp:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data_json = json.loads(data_str)
                        if "text" in data_json:
                            response_text += data_json["text"]
                        if "error" in data_json:
                            error_msg = data_json["error"]
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        error_msg = str(e)
        http_status = getattr(e, "code", 500)

    elapsed = time.time() - start_time
    if response_text:
        history.append({"role": "assistant", "content": response_text})

    return {
        "session": session_id,
        "question": question,
        "http_status": http_status,
        "elapsed_sec": round(elapsed, 2),
        "response_preview": response_text.replace("\n", " ")[:80] + ("..." if len(response_text) > 80 else ""),
        "response_length": len(response_text),
        "error": error_msg
    }

def run_worker(session_id, questions):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚀 {session_id} 시작 (총 {len(questions)}개 연속 질문)")
    history = []
    for idx, q in enumerate(questions, 1):
        print(f"  [{session_id}] Q{idx}: {q}")
        res = ask_streaming(session_id, q, history)
        results[session_id.lower().replace(" ", "_")].append(res)
        status_icon = "✅" if res["http_status"] == 200 and not res["error"] else "❌"
        print(f"  [{session_id}] Q{idx} 완료 {status_icon} ({res['elapsed_sec']}초, HTTP {res['http_status']}, 응답길이: {res['response_length']}자)")
        if res["error"]:
            print(f"    ⚠️ 오류: {res['error']}")
        time.sleep(0.5)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🏁 {session_id} 모든 질문 완료!")

def main():
    print("=" * 65)
    print("⚡ Google Cloud Run 서울 리전 ADC 챗봇 동시 세션 부하 및 정합성 테스트")
    print(f"🌐 대상 URL: {SERVICE_URL}")
    print("👥 동시 실행 세션: 2개 (세션당 5개 연속 대화, 총 10회 스트리밍 질의)")
    print("=" * 65)

    t1 = threading.Thread(target=run_worker, args=("Session 1", SESSION_1_QUESTIONS))
    t2 = threading.Thread(target=run_worker, args=("Session 2", SESSION_2_QUESTIONS))

    overall_start = time.time()
    t1.start()
    t2.start()

    t1.join()
    t2.join()
    overall_elapsed = time.time() - overall_start

    print("\n" + "=" * 65)
    print(f"🎉 모든 세션 테스트 완료! (총 소요 시간: {overall_elapsed:.2f}초)")
    print("=" * 65)

    # Save results to json for analysis
    with open("concurrent_test_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "overall_elapsed_sec": round(overall_elapsed, 2),
            "results": results
        }, f, ensure_ascii=False, indent=2)

    print("📄 상세 결과가 'concurrent_test_results.json'에 저장되었습니다.")

if __name__ == "__main__":
    main()
