#!/bin/sh
set -eu

# Ensure data dirs exist (volumes may start empty) and seed sample fixtures.
mkdir -p /app/data/users /app/data/births
node /app/scripts/seed-data.mjs || true

exec "$@"
