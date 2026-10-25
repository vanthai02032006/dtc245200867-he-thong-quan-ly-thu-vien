#!/usr/bin/env bash
# Script tự động tạo chứng chỉ SSL tự ký (Self-signed Certificate) cho Nginx HTTPS
set -e

CERT_DIR="$(dirname "$0")/ssl"
mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/thuvien.key" \
  -out "$CERT_DIR/thuvien.crt" \
  -subj "/C=VN/ST=ThaiNguyen/L=ThaiNguyen/O=ICTU_CNTTK23C/OU=DTC245200867/CN=localhost"

echo "[OK] Đã khởi tạo chứng chỉ SSL tại $CERT_DIR/thuvien.crt và $CERT_DIR/thuvien.key"
