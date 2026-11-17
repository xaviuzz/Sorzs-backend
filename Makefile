SERVER_NAME := sorzs-test-server
SERVER_IMAGE := sorzs-test-server
SERVER_KEY_DIR := $(or $(TMPDIR),/tmp)/sorzs-test-server-key
SERVER_KEY := $(SERVER_KEY_DIR)/id_ed25519
SERVER_SSH_PORT := 2222

FRONTEND_DIST ?= ../frontend/dist
DEPLOY_HOST ?= 127.0.0.1
DEPLOY_USER ?= root
DEPLOY_PORT ?= $(SERVER_SSH_PORT)
DEPLOY_KEY ?= $(SERVER_KEY)
APP_PORT ?= 3001
AUTH_SECRET ?= dev-secret
WIKIPEDIA_CONTACT ?= dev@example.org
SEED_USERS ?= xaviuzz:p1casso:admin,ana:pueblos

.PHONY: server-up server-down deploy

server-up:
	docker build -t $(SERVER_IMAGE) -f deploy/Dockerfile.server deploy
	mkdir -p $(SERVER_KEY_DIR)
	test -f $(SERVER_KEY) || ssh-keygen -q -t ed25519 -N '' -f $(SERVER_KEY)
	docker run -d --name $(SERVER_NAME) --network host --privileged --cgroupns=host \
		--tmpfs /run --tmpfs /run/lock $(SERVER_IMAGE)
	until docker exec $(SERVER_NAME) systemctl is-active --quiet ssh; do sleep 1; done
	docker cp $(SERVER_KEY).pub $(SERVER_NAME):/root/.ssh/authorized_keys
	docker exec $(SERVER_NAME) chown root:root /root/.ssh/authorized_keys
	docker exec $(SERVER_NAME) chmod 600 /root/.ssh/authorized_keys

server-down:
	-docker rm -f $(SERVER_NAME)
	rm -rf $(SERVER_KEY_DIR)

deploy:
	test -f $(FRONTEND_DIST)/index.html || { echo "deploy: build the frontend first, no $(FRONTEND_DIST)/index.html"; exit 1; }
	DEPLOY_HOST=$(DEPLOY_HOST) DEPLOY_USER=$(DEPLOY_USER) DEPLOY_PORT=$(DEPLOY_PORT) DEPLOY_KEY=$(DEPLOY_KEY) \
		APP_PORT=$(APP_PORT) AUTH_SECRET=$(AUTH_SECRET) WIKIPEDIA_CONTACT=$(WIKIPEDIA_CONTACT) SEED_USERS='$(SEED_USERS)' \
		deploy/deploy.sh $(FRONTEND_DIST)
