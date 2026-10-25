#!/usr/bin/env python3
"""
Dịch vụ Webhook nhận cảnh báo từ Grafana / Alertmanager
Sinh viên: Cấn Văn Thái - DTC245200867 - CNTT-K23C
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from datetime import datetime


class AlertSinkHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(raw_body)
        except Exception:
            payload = {"raw": raw_body}

        print(f"[{datetime.now().isoformat()}] [ALERT_SINK] Received Alert Webhook:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "received"}).encode("utf-8"))


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 5001), AlertSinkHandler)
    print("Alert Sink Webhook listening on port 5001...")
    server.serve_forever()
