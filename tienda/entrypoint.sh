#!/bin/sh
set -e

echo "Corriendo migraciones..."
./node_modules/.bin/tsx src/db/run-migrate.ts

echo "Arrancando Next en modo servidor..."
exec ./node_modules/.bin/next start
