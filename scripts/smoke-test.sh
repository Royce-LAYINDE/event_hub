#!/usr/bin/env bash
set -uo pipefail

EVENTS_URL=${EVENTS_URL:-http://localhost:3001}
PARTICIPANTS_URL=${PARTICIPANTS_URL:-http://localhost:3002}
REGISTRATIONS_URL=${REGISTRATIONS_URL:-http://localhost:3003}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:8080}
TENTATIVES=${TENTATIVES:-30}

echecs=0

attendre() {
  local nom=$1 url=$2 i=1
  while [ "$i" -le "$TENTATIVES" ]; do
    if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
      echo "  ok      $nom est pret"
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  echo "  ECHEC   $nom ne repond pas apres $((TENTATIVES * 2))s ($url)"
  echecs=$((echecs + 1))
  return 1
}

verifier() {
  local nom=$1 url=$2 code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url")
  if [ "$code" = "200" ]; then
    echo "  ok      $nom -> 200"
  else
    echo "  ECHEC   $nom -> $code (attendu 200)"
    echecs=$((echecs + 1))
  fi
}

echo "== Demarrage des services =="
attendre "events-service" "$EVENTS_URL/health"
attendre "participants-service" "$PARTICIPANTS_URL/health"
attendre "registrations-service" "$REGISTRATIONS_URL/health"
attendre "frontend" "$FRONTEND_URL/health"

echo
echo "== Endpoints REST =="
verifier "GET /api/events" "$EVENTS_URL/api/events"
verifier "GET /api/participants" "$PARTICIPANTS_URL/api/participants"
verifier "GET /api/registrations" "$REGISTRATIONS_URL/api/registrations"
verifier "GET /api/registrations/statistics" "$REGISTRATIONS_URL/api/registrations/statistics"

echo
echo "== Frontend et proxy nginx =="
verifier "GET /" "$FRONTEND_URL/"
verifier "GET /api/events via nginx" "$FRONTEND_URL/api/events"
verifier "GET /api/participants via nginx" "$FRONTEND_URL/api/participants"
verifier "GET /api/registrations via nginx" "$FRONTEND_URL/api/registrations"

echo
if [ "$echecs" -eq 0 ]; then
  echo "Smoke test reussi."
  exit 0
fi

echo "Smoke test echoue : $echecs verification(s) en erreur."
exit 1
