# Closing Bell GA — Deployment & Handover Notes

Website, CRM back office (`/cq/`), client portal (`/portal/`) and listings for
**closingbellga.com**.

> Internal project and namespace names still say `LivelyFencing` / `livelyfencing`.
> That is only the codebase's original name. It has no functional meaning, and you can
> rename it later if you like.

---

## Architecture

```
Browser ──► Cloudflare (DNS, Access, Tunnel) ──► cloudflared ──► ui (nginx + Angular)
                                                                   │  /api/* proxied
                                                                   ▼
                                                                  api (ASP.NET Core 8)
                                                                   ├─► postgres (pgvector/pg16)
                                                                   ├─► ollama (AI quote/assist models)
                                                                   └─► external services (below)
```

| Component | Source | Container | Port |
|---|---|---|---|
| UI | `src/LivelyFencing.UI` (Angular) | `docker/Dockerfile.ui` + `docker/nginx.conf` | 80 |
| API | `src/LivelyFencing.API` (.NET 8) | `docker/Dockerfile.api` | 8080 |
| Database | — | `pgvector/pgvector:pg16` | 5432 |
| AI models | — | `ollama/ollama` (`llama3.2`, `nomic-embed-text`) | 11434 |
| Ingress | — | `cloudflare/cloudflared` | — |

Kubernetes manifests are in `k8s/`. The site does not require Kubernetes. Any host that can
run the containers above, or the API and UI natively plus a Postgres with the
`vector` extension, will work.

> **Check before reuse:** the manifests are not consistent about the namespace.
> `nginx.conf` proxies to `api.closingbell.svc.cluster.local`, but most manifests say
> `livelyfencing`. Make them match your environment.

## Build

Build from the repository root:

```bash
docker build -f docker/Dockerfile.api -t <registry>/cb-api:<tag> .
docker build -f docker/Dockerfile.ui  -t <registry>/cb-ui:<tag>  .
```

## Configuration & secrets

No real secret values are stored in this repository. Templates are in
`k8s/*/secret.example.yaml`. Copy them to `secret.yaml`, which git ignores, and fill them in.

| Setting (env var) | Purpose |
|---|---|
| `ConnectionStrings__DefaultConnection` | Postgres connection |
| `Encryption__Key` | Key for `EncryptionService`. Current code doesn't call it, but carry the existing value over so any previously encrypted data stays readable. |
| `Cloudflare__TeamDomain`, `Cloudflare__Audience` | Validates Cloudflare Access logins for `/cq/` and `/portal/` |
| `SendGrid__ApiKey` (+ `SendGrid__FromEmail`, `SendGrid__FromName`) | Outbound email |
| `TC_WEBHOOK_SECRET` | Shared secret for the inbound transaction-email webhook (`TcEmailWebhookController`) |
| `Google__PlacesApiKey`, `Google__PlaceId` | Google reviews sync and address autocomplete |
| `Bridge__ServerToken`, `Bridge__DatasetId` | FMLS listings through the Bridge API. Without them the site shows placeholder listings. |
| `CloudflareImages__AccountId/ApiToken/AccountHash` | Image hosting |
| `App__PortalBaseUrl`, `AllowedOrigins__N` | Public URL and CORS origins |
| `ErrorReporting__Url` (API) / `bugReportUrl` (UI environment) | Optional endpoint for automatic error and bug reports. Leave empty to disable. |
| `TUNNEL_TOKEN` (cloudflared) | Cloudflare Tunnel credential |

## External accounts the site depends on

- **Cloudflare:** DNS, domain registration, Zero Trust Access (Google login), Tunnel, Images
- **Google Workspace:** email. Keep the MX, SPF, DKIM and DMARC records unchanged during any DNS move.
- **SendGrid:** outbound email. The sending domain must be verified with SendGrid's DNS records.
- **Bridge Interactive / FMLS:** listings data feed and license
- **Google Cloud:** Places API key

## Database

- On startup the API creates its tables from the EF model (`EnsureCreated`).
  Migration files are not used, so any new table on an existing database needs a manual
  `CREATE TABLE`.
- The `vector` extension must exist (`CREATE EXTENSION IF NOT EXISTS vector;`).
- To move the data, take a backup with `pg_dump -Fc` and restore it with `pg_restore`.

## Health check

`GET /health` returns `{"status":"healthy", ...}` once the API is up.
