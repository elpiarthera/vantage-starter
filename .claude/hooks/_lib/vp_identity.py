"""vp_identity -- read VantagePeers as an IDENTIFIED caller, from a hook process.

The deployment answers an anonymous query with RBAC_DENIED ("Missing scope ...
for org null"). A guard that reads task state must therefore present a bearer.
This module is the credential half of that, extracted so a sequencing guard can
share it. It mirrors `guard_identity()` / `store_is_answering()` of
`enforce-pi-authorization-before-prod-deploy.py`, which keeps its own copy and
is NOT modified by this module's introduction.

Credential order (variables NAMED here, never their values; nothing minted is
printed, logged or written to disk):
  1. VP_GUARD_CONVEX_TOKEN -- an already-minted bearer.
  2. CLERK_SECRET_KEY + CLERK_SERVICE_ACCOUNT_USER_ID (project-suffixed
     `_VANTAGE_PEERS` name first, bare name as fallback), read from the process
     environment or from the dotenv named by VP_GUARD_ENV_FILE (default: the
     repo-root `.env.local`, then ~/.config/vantage-peers/guard.env). A Clerk
     service-account session JWT is minted: sign-in ticket -> ticket redemption
     -> template-scoped session token.
"""
from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

CLERK_LIVE_FRONTEND = "https://clerk.vantagepeers.com"
CLERK_API = "https://api.clerk.com/v1"
CREDENTIAL_PROJECT_SUFFIX = "_VANTAGE_PEERS"
HTTP_TIMEOUT_SEC = 10

# Clerk sits behind a bot filter that answers urllib's default agent with a bare
# 403 (Cloudflare 1010), indistinguishable from a rejected credential.
GUARD_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/140.0.0.0 Safari/537.36 vantagepeers-hook-guard/1.0"
)

# The positive control: a query no unidentified caller can be served.
LIVENESS_PATH = os.environ.get("VP_GUARD_LIVENESS_PATH", "missions:list")
CONTROL_SERVED = "identified-and-served"
CONTROL_NOT_IDENTIFIED = "reached-but-not-identified"
CONTROL_NOT_REACHED = "not-reached"
RBAC_DENIED_MARKER = "RBAC_DENIED"


def post_json(url, payload, headers, *, form=None, timeout=HTTP_TIMEOUT_SEC):
    """POST and return the decoded JSON body. Raises on any failure."""
    data = form.encode("utf-8") if form is not None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url=url, data=data, headers={"User-Agent": GUARD_USER_AGENT, **headers}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 200:
            raise OSError(f"HTTP {response.status}")
        return json.loads(response.read().decode("utf-8"))


def get_json(url, headers, *, timeout=HTTP_TIMEOUT_SEC):
    """GET and return the decoded JSON body. Raises on any failure."""
    req = urllib.request.Request(
        url=url, headers={"User-Agent": GUARD_USER_AGENT, **headers}, method="GET"
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 200:
            raise OSError(f"HTTP {response.status}")
        return json.loads(response.read().decode("utf-8"))


def _frontend_domain(secret: str) -> str:
    """Clerk frontend to redeem the ticket against: CLERK_DOMAIN, else the one
    the key's own instance reports, else the live frontend. Never the dev one."""
    explicit = (os.environ.get("CLERK_DOMAIN") or "").strip()
    if explicit:
        return explicit
    try:
        body = get_json(f"{CLERK_API}/domains", {"Authorization": f"Bearer {secret}"})
        entries = body.get("data") if isinstance(body, dict) else body
        for entry in entries or []:
            url = (entry or {}).get("frontend_api_url")
            if url:
                return url if "://" in url else f"https://{url}"
    except Exception:
        pass
    return CLERK_LIVE_FRONTEND


def _dotenv_paths() -> list[str]:
    explicit = os.environ.get("VP_GUARD_ENV_FILE")
    if explicit:
        return [explicit]
    paths = [str(Path(__file__).resolve().parents[3] / ".env.local")]
    home = os.environ.get("HOME") or str(Path.home())
    paths.append(str(Path(home) / ".config" / "vantage-peers" / "guard.env"))
    return paths


def _dotenv_value(name: str) -> str | None:
    """Read ONE variable from the allowed dotenv files. The value is returned to
    the caller only -- never logged, printed or echoed."""
    for path in _dotenv_paths():
        try:
            with open(path, encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    if key.strip() != name:
                        continue
                    value = value.strip()
                    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                        value = value[1:-1]
                    if value:
                        return value
        except OSError:
            continue
    return None


def _credential(name: str) -> str | None:
    for candidate in (name + CREDENTIAL_PROJECT_SUFFIX, name):
        value = (os.environ.get(candidate) or "").strip() or _dotenv_value(candidate)
        if value:
            return value
    return None


def guard_identity() -> tuple[str | None, str]:
    """Return (token, "") on success, (None, <what was checked>) otherwise.
    The reason names VARIABLES, never values -- it is shown to the operator."""
    preminted = (os.environ.get("VP_GUARD_CONVEX_TOKEN") or "").strip()
    if preminted:
        return preminted, ""

    secret = _credential("CLERK_SECRET_KEY")
    user_id = _credential("CLERK_SERVICE_ACCOUNT_USER_ID")
    if not secret or not user_id:
        missing = [n for n, v in (
            ("CLERK_SECRET_KEY", secret),
            ("CLERK_SERVICE_ACCOUNT_USER_ID", user_id),
        ) if not v]
        return None, (
            "no credential is reachable from this hook process. Checked: "
            "VP_GUARD_CONVEX_TOKEN (unset), then "
            f"{' and '.join(missing)} in the environment and in the dotenv named "
            "by VP_GUARD_ENV_FILE (default: the repo-root .env.local)."
        )

    domain = _frontend_domain(secret)
    template = os.environ.get("CLERK_JWT_TEMPLATE") or "convex"
    try:
        ticket = post_json(
            f"{CLERK_API}/sign_in_tokens",
            {"user_id": user_id, "expires_in_seconds": 30},
            {"Authorization": f"Bearer {secret}", "Content-Type": "application/json"},
        ).get("token")
        if not ticket:
            return None, "Clerk issued no sign-in ticket for CLERK_SERVICE_ACCOUNT_USER_ID."
        session = (post_json(
            f"{domain}/v1/client/sign_ins",
            None,
            {"Content-Type": "application/x-www-form-urlencoded"},
            form=urllib.parse.urlencode({"strategy": "ticket", "ticket": ticket}),
        ).get("response") or {}).get("created_session_id")
        if not session:
            return None, "the Clerk sign-in ticket exchange returned no session."
        jwt = post_json(
            f"{CLERK_API}/sessions/{session}/tokens/{template}",
            {},
            {"Authorization": f"Bearer {secret}", "Content-Type": "application/json"},
        ).get("jwt")
        if not jwt:
            return None, f"Clerk minted no JWT for template {template!r}."
        return jwt, ""
    except Exception as exc:
        return None, f"minting the service identity failed ({type(exc).__name__}: {exc})."


def store_is_answering(vp_url: str, token: str) -> tuple[str, str]:
    """Was THIS caller, with THIS credential, served by the store just now?

    One of CONTROL_SERVED / CONTROL_NOT_IDENTIFIED / CONTROL_NOT_REACHED plus a
    detail. The refusal is recognised POSITIVELY by RBAC_DENIED in `errorData`,
    never inferred from an absence."""
    try:
        body = post_json(
            f"{vp_url}/api/query",
            {"path": LIVENESS_PATH, "args": {}, "format": "json"},
            {"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        )
    except Exception as exc:
        return CONTROL_NOT_REACHED, f"{type(exc).__name__}: {exc}"
    if body.get("status") == "success":
        return CONTROL_SERVED, ""
    if RBAC_DENIED_MARKER in json.dumps(body.get("errorData")):
        return CONTROL_NOT_IDENTIFIED, (
            f"the control {LIVENESS_PATH} refused this caller ({RBAC_DENIED_MARKER}) "
            "-- the credential presented was not accepted by the deployment"
        )
    return CONTROL_NOT_REACHED, (
        f"the control {LIVENESS_PATH} failed without a recognisable refusal "
        f"({str(body.get('errorMessage'))[:120]})"
    )
