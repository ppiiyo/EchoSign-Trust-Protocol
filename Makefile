.PHONY: install dev test smoke lint build crypto-demo mvp clean

install:
	npm install --no-audit --no-fund

dev:
	DEMO_MODE=1 npm run dev

test:
	DEMO_MODE=1 npm test

lint:
	npm run lint

build:
	DEMO_MODE=1 npm run build

crypto-demo:
	node scripts/demo-sign-verify.mjs
	node scripts/verify-independent.mjs tmp-demo/manifest.json tmp-demo/signature.b64u tmp-demo/public.pem

smoke:
	node scripts/smoke-mvp.mjs

mvp: install test crypto-demo
	@echo "Start: make dev  then  make smoke"

clean:
	rm -rf dist data tmp-demo coverage
