#!/usr/bin/env bash
set -euo pipefail

fail=0
say() { printf '%s\n' "$*"; }

say '== Security audit =='

# 1) Strong secret signatures in tracked files. Build sensitive prefixes at runtime so
# the scanner does not match its own source text.
riseup_prefix='riseup''_pat_'
gh_prefix='gh''[pousr]_'
google_prefix='AI''za'
aws_prefix='AK''IA'
secret_regex="(${riseup_prefix}[A-Za-z0-9_-]{8,}|${gh_prefix}[A-Za-z0-9]{20,}|${google_prefix}[0-9A-Za-z_-]{30,}|${aws_prefix}[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)"

mapfile -t tracked < <(git ls-files | grep -Ev '^(scripts/security-audit\.sh|SECURITY\.md)$' || true)
if ((${#tracked[@]})); then
  if git grep -nEI "$secret_regex" -- "${tracked[@]}"; then
    say 'FAIL: possible committed secret detected.'
    fail=1
  else
    say 'PASS: no strong secret signature found in tracked files.'
  fi
fi

# 2) No persisted RiseUp token-reference metadata in active Apps Script source.
if grep -Fq 'X-Riseup-Token-Ref' src/Code.gs || grep -Fq 'x.tokenRef' src/Code.gs; then
  say 'FAIL: token-reference metadata is still persisted by active source.'
  fail=1
else
  say 'PASS: token-reference metadata is not persisted by active source.'
fi

# 3) External sheet text must be escaped before setValues().
for needle in \
  "sheetSafeText_(tx.transactionId" \
  "sheetSafeText_(tx.businessName" \
  "sheetSafeText_(tx.categoryLabel" \
  "sheetSafeText_(tx.accountNickname" \
  "sheetSafeText_(env.id" \
  "sheetSafeText_(env.type"; do
  if ! grep -Fq "$needle" src/Code.gs; then
    say "FAIL: missing external-text hardening: $needle"
    fail=1
  fi
done
if grep -Fq "function sheetSafeText_(value)" src/Code.gs; then
  say 'PASS: formula-injection escaping is present.'
else
  say 'FAIL: sheetSafeText_ helper missing.'
  fail=1
fi

# 4) Outbound RiseUp calls stay inside the expected relative namespace.
if grep -Fq "path.startsWith('/api/external/')" src/Code.gs && grep -Fq "path.includes('://')" src/Code.gs; then
  say 'PASS: RiseUp path guard is present.'
else
  say 'FAIL: RiseUp path guard missing.'
  fail=1
fi

# 5) A newly exposed Apps Script web endpoint requires explicit review.
if grep -R -nE 'function[[:space:]]+do(Get|Post)[[:space:]]*\(' src --include='*.gs' >/tmp/web-endpoints.txt 2>/dev/null; then
  cat /tmp/web-endpoints.txt
  if [[ ! -f security/web-endpoints.allow ]]; then
    say 'FAIL: Apps Script web endpoint found without security/web-endpoints.allow review record.'
    fail=1
  else
    say 'PASS: web endpoint has an explicit review record.'
  fi
else
  say 'PASS: no Apps Script doGet/doPost endpoint is exposed.'
fi

# 6) Version-controlled Apps Script manifest baseline.
python3 - <<'PY' || fail=1
import json
from pathlib import Path
p = Path('src/appsscript.json')
if not p.exists():
    raise SystemExit('FAIL: src/appsscript.json missing')
data = json.loads(p.read_text(encoding='utf-8'))
expected = {
    'timeZone': 'Asia/Jerusalem',
    'exceptionLogging': 'STACKDRIVER',
    'runtimeVersion': 'V8',
}
for key, value in expected.items():
    if data.get(key) != value:
        raise SystemExit(f'FAIL: appsscript manifest {key}={data.get(key)!r}, expected {value!r}')
print('PASS: Apps Script manifest baseline is valid.')
PY

# 7) Permanent workflows should not carry write permission by default.
while IFS= read -r wf; do
  [[ "$wf" == '.github/workflows/dev-security-hardening-patch.yml' ]] && continue
  if grep -Eq '^[[:space:]]*contents:[[:space:]]*write[[:space:]]*$' "$wf"; then
    say "FAIL: long-lived workflow has contents: write: $wf"
    fail=1
  fi
done < <(git ls-files '.github/workflows/*.yml' '.github/workflows/*.yaml')

if ((fail)); then
  say 'SECURITY AUDIT: FAIL'
  exit 1
fi
say 'SECURITY AUDIT: PASS'
