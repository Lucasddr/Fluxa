#!/bin/sh
set -eu

export PORT="${PORT:-10000}"
envsubst '${PORT}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
