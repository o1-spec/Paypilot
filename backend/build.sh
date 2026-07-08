#!/usr/bin/env bash
# Render build script — runs once on every deploy
set -o errexit   # Exit on error

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate

python manage.py seed_data
