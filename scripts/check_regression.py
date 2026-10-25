#!/usr/bin/env python3
"""
Script kiểm tra hồi quy toàn diện Hệ thống Quản lý Thư viện
Sinh viên: Cấn Văn Thái - DTC245200867 - CNTT-K23C
"""
import urllib.request
import json
import sys

BASE_URL = "http://localhost:3000"


def check_endpoint(path, expected_status=200):
    url = f"{BASE_URL}{path}"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            status = response.getcode()
            body = response.read().decode("utf-8")
            print(f"[PASS] GET {path} -> HTTP {status}")
            return status == expected_status, body
    except urllib.error.HTTPError as e:
        if e.code == expected_status:
            print(f"[PASS] GET {path} -> Expected HTTP {e.code}")
            return True, ""
        print(f"[FAIL] GET {path} -> HTTP {e.code} (Expected {expected_status})")
        return False, ""
    except Exception as e:
        print(f"[FAIL] GET {path} -> {e}")
        return False, ""


def main():
    print("=== CHẠY KIỂM TRA HỒI QUY HỆ THỐNG QUẢN LÝ THƯ VIỆN ===")
    checks = [
        ("/health", 200),
        ("/metrics", 200),
        ("/api/stats", 200),
        ("/api/books", 200),
        ("/api/readers", 200),
        ("/api/loans", 200),
        ("/test-error", 500),
    ]
    all_passed = True
    for path, expected in checks:
        ok, _ = check_endpoint(path, expected)
        if not ok:
            all_passed = False

    if not all_passed:
        sys.exit(1)
    print("=== TẤT CẢ KIỂM TRA HỒI QUY ĐỀU THÀNH CÔNG! ===")


if __name__ == "__main__":
    main()
