#!/usr/bin/env bash
set -e

python manage.py migrate
python manage.py createcachetable --verbosity 0 || true
python manage.py collectstatic --noinput

exec "$@"
