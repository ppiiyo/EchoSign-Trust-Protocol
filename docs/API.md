# EchoSign Attest API (MVP v0.3)

Auth: `Authorization: Bearer <api_key>`  
`DEMO_MODE=1` allows open sign (header `X-EchoSign-Auth: demo-open`).

## Lifecycle

```text
POST /api/v1/keys → POST /api/v1/devices → POST /api/v1/attest/sign
 → GET /api/v1/attest/packages/:id/bundle → /verify/ or POST /api/v1/attest/verify
```

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | /health | product status |
| POST | /api/v1/keys | create API key |
| GET | /api/v1/keys | list |
| DELETE | /api/v1/keys/:id | revoke |
| POST | /api/v1/devices | register device |
| GET | /api/v1/devices | list |
| POST | /api/v1/attest/sign | multipart `file` |
| POST | /api/v1/attest/verify | JSON manifest+sig |
| GET | /api/v1/attest/jwks | public keys |
| GET | /api/v1/attest/packages | list |
| GET | /api/v1/attest/packages/:id | get |
| GET | /api/v1/attest/packages/:id/bundle | offline bundle |

See repo README and docs/MVP.md for smoke-test curl.
