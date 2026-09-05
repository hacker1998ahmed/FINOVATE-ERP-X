#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
API_ENDPOINT="${FINOVATE_API_ENDPOINT:-REPLACE_WITH_APPS_SCRIPT_URL}"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"
cp -r "$ROOT_DIR/css" "$DIST_DIR/"
cp -r "$ROOT_DIR/js" "$DIST_DIR/"
cp -r "$ROOT_DIR/locales" "$DIST_DIR/"
cp -r "$ROOT_DIR/tests" "$DIST_DIR/"
cp "$ROOT_DIR"/*.html "$ROOT_DIR/manifest.json" "$ROOT_DIR/sw.js" "$DIST_DIR/"

cat > "$DIST_DIR/config.js" <<EOF
window.FINOVATE_CONFIG = {
  apiEndpoint: '$API_ENDPOINT',
  environment: 'production',
  database: 'FINOVATE_DB'
};
EOF

cat > "$DIST_DIR/_headers" <<'EOF'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.html
  Cache-Control: no-cache, no-store, must-revalidate

/config.js
  Cache-Control: no-cache, no-store, must-revalidate

/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
EOF

cat > "$DIST_DIR/_redirects" <<'EOF'
/ /login.html 302
/app /index.html 200
EOF

required=(index.html login.html config.js manifest.json sw.js _headers _redirects css/core.css js/app.js js/auth.js js/api.js js/backup.js js/budgeting.js)
for file in "${required[@]}"; do
  test -f "$DIST_DIR/$file" || { echo "Missing: $file" >&2; exit 1; }
done

echo "FINOVATE build complete: $DIST_DIR"
echo "API endpoint: $API_ENDPOINT"
