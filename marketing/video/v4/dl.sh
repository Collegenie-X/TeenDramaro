#!/bin/bash
# 사용: dl.sh 디렉터리/접두 확장자 "번호 결과URL" ...
B=https://d8j0ntlcm91z4.cloudfront.net/user_3K6N5tvFoOndrhqejm65syzaiby
pre=$1; ext=$2; shift 2
for p in "$@"; do set -- $p; curl -s -o "$pre$1.$ext" "$B/$2" & done; wait
