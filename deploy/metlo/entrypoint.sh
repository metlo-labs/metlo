#!/usr/bin/env bash
set -Eeo pipefail

validate-env
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf