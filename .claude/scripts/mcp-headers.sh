#!/usr/bin/env bash
# headersHelper relay: this station reads its MCP credentials from Infisical through the shared helper.
# Rollback: the previous file-based helper is kept beside this file as mcp-headers.sh.files-helper.
exec python3 /opt/vantage-secrets/mcp_headers_vault.py --role tau --config /opt/vantage-secrets/infisical-hosts.json
