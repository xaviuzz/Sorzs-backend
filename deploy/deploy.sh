#!/usr/bin/env bash
set -euo pipefail

readonly REQUIRED_VARIABLES=(
	DEPLOY_HOST DEPLOY_USER DEPLOY_PORT DEPLOY_KEY APP_PORT
	AUTH_SECRET WIKIPEDIA_CONTACT SEED_USERS
)
readonly HEALTH_SECONDS=30
readonly KEPT_RELEASES=3

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$DEPLOY_DIR")"
BUN_VERSION="$(tr -d '[:space:]' <"$BACKEND_DIR/.bun-version")"
readonly DEPLOY_DIR BACKEND_DIR BUN_VERSION

fail() {
	echo "deploy: $*" >&2
	exit 1
}

remote() {
	ssh -i "$DEPLOY_KEY" -p "$DEPLOY_PORT" \
		-o BatchMode=yes \
		-o StrictHostKeyChecking=accept-new \
		-o UserKnownHostsFile="$DEPLOY_KEY.known_hosts" \
		"$DEPLOY_USER@$DEPLOY_HOST" "$@"
}

require_variables() {
	local missing=()
	local name
	for name in "${REQUIRED_VARIABLES[@]}"; do
		[[ -n "${!name:-}" ]] || missing+=("$name")
	done
	((${#missing[@]} == 0)) || fail "missing: ${missing[*]}"
}

require_frontend() {
	local frontend_dist="${1:-}"
	[[ -n "$frontend_dist" ]] || fail "usage: deploy.sh <frontend dist folder>"
	[[ -f "$frontend_dist/index.html" ]] || fail "no index.html in $frontend_dist"
}

provision() {
	remote bash -s -- "$BUN_VERSION" <<'REMOTE'
set -euo pipefail
bun_version="$1"

if ! command -v curl >/dev/null || ! command -v unzip >/dev/null; then
	apt-get update -qq
	DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl unzip ca-certificates
fi

installed="$(/usr/local/bin/bun --version 2>/dev/null || true)"
if [[ "$installed" != "$bun_version" ]]; then
	case "$(uname -m)" in
	x86_64) bun_arch=x64 ;;
	aarch64) bun_arch=aarch64 ;;
	*) echo "unsupported architecture $(uname -m)" >&2; exit 1 ;;
	esac
	workdir="$(mktemp -d)"
	curl -fsSL -o "$workdir/bun.zip" \
		"https://github.com/oven-sh/bun/releases/download/bun-v${bun_version}/bun-linux-${bun_arch}.zip"
	unzip -q -o "$workdir/bun.zip" -d "$workdir"
	install -m 755 "$workdir"/bun-linux-*/bun /usr/local/bin/bun
	rm -rf "$workdir"
fi

id sorzs >/dev/null 2>&1 || useradd --system --home-dir /opt/sorzs --shell /usr/sbin/nologin sorzs
install -d -m 755 /opt/sorzs /opt/sorzs/releases /etc/sorzs
install -d -m 750 -o sorzs -g sorzs /var/lib/sorzs

cat >/etc/systemd/system/sorzs.service <<'UNIT'
[Unit]
Description=Sorzs
After=network.target

[Service]
User=sorzs
WorkingDirectory=/opt/sorzs/current
EnvironmentFile=/etc/sorzs/sorzs.env
ExecStart=/usr/local/bin/bun src/main.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable sorzs >/dev/null 2>&1
REMOTE
}

write_environment() {
	remote 'umask 077 && cat >/etc/sorzs/sorzs.env' <<ENVIRONMENT
PORT="$APP_PORT"
DATA_DIR="/var/lib/sorzs"
STATIC_DIR="/opt/sorzs/current/public"
AUTH_SECRET="$AUTH_SECRET"
WIKIPEDIA_CONTACT="$WIKIPEDIA_CONTACT"
SEED_USERS="$SEED_USERS"
ENVIRONMENT
}

stage_package() {
	local frontend_dist="$1"
	local stage="$2"
	mkdir -p "$stage/public"
	cp -r "$BACKEND_DIR/src" "$stage/src"
	cp "$BACKEND_DIR/package.json" "$BACKEND_DIR/bun.lock" "$stage/"
	cp -r "$frontend_dist/." "$stage/public/"
	(cd "$stage" && bun install --production --frozen-lockfile >/dev/null)
}

upload_package() {
	local stage="$1"
	local release="$2"
	remote "mkdir -p /opt/sorzs/releases/$release"
	chmod 755 "$stage"
	tar -C "$stage" --owner=0 --group=0 -cz . | remote "tar -xz -C /opt/sorzs/releases/$release"
}

point_current_to() {
	local release="$1"
	remote "ln -sfn /opt/sorzs/releases/$release /opt/sorzs/current.next \
		&& mv -T /opt/sorzs/current.next /opt/sorzs/current \
		&& systemctl restart sorzs"
}

previous_release() {
	remote "readlink /opt/sorzs/current 2>/dev/null | xargs -r basename || true"
}

wait_for_health() {
	local waited=0
	while ((waited < HEALTH_SECONDS)); do
		if remote "curl -fsS -X POST -d '{\"header\":{\"callId\":\"deploy\"}}' http://127.0.0.1:$APP_PORT/health.check" >/dev/null 2>&1; then
			return 0
		fi
		sleep 1
		waited=$((waited + 1))
	done
	return 1
}

keep_last_releases() {
	remote "cd /opt/sorzs/releases && ls -1 | sort -r | tail -n +$((KEPT_RELEASES + 1)) | xargs -r rm -rf"
}

main() {
	local frontend_dist="${1:-}"
	require_variables
	require_frontend "$frontend_dist"

	local release previous stage
	release="$(date +%Y%m%d%H%M%S)"
	stage="$(mktemp -d)"
	trap 'rm -rf "'"$stage"'"' EXIT

	provision
	write_environment
	stage_package "$frontend_dist" "$stage"
	upload_package "$stage" "$release"
	previous="$(previous_release)"
	point_current_to "$release"

	if wait_for_health; then
		keep_last_releases
		echo "deployed $release"
		return 0
	fi

	if [[ -n "$previous" ]]; then
		point_current_to "$previous"
		fail "release $release did not answer health.check, rolled back to $previous"
	fi
	fail "release $release did not answer health.check and there is no previous release"
}

main "$@"
