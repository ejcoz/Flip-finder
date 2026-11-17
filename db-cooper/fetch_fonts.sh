#!/bin/sh
# Downloads the three OFL families (Latin subset) from Google Fonts into fonts/.
set -e
cd "$(dirname "$0")"; mkdir -p fonts
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
get() { # family-query file
  url=$(curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=$1&display=block" | awk '/\/\* latin \*\//{f=1} f&&/src:/{print; exit}' | sed -E 's/.*url\(([^)]+)\).*/\1/')
  curl -sS -o "fonts/$2" "$url"; echo "$2 <- $url"
}
get 'Alfa+Slab+One' alfa.woff2
get 'Archivo+Black' archivo.woff2
get 'JetBrains+Mono:wght@800' jbm.woff2
