# AGENTS.md — Guide for AI coding assistants

This file is for AI assistants (Claude Code, Copilot, Cursor, etc.) and for developers new
to the code. Read it before making changes. Hosting, secrets and outside accounts are
covered in `DEPLOYMENT.md`.

## What this is

The website and back office for **The Closing Bell Real Estate Team** (closingbellga.com),
a residential real estate team in Georgia. It has four parts:

- **Public site:** landing page, FMLS listings search and detail pages (`/listings`), and ad
  landing pages (`/lp/:slug`)
- **CRM back office** (`/cq/*`): clients, transactions, showings, open houses, email
  templates, leads, reviews, income and expenses, reports and analytics
- **Client portal** (`/portal/*`): pages for logged-in clients and listing approvers
- **API** (`api.closingbellga.com`, also proxied same-origin at `/api/` by nginx)

### Naming quirk
The codebase started as a contractor app called "LivelyFencing" and was adapted for real
estate. So:
- Project, namespace and folder names are `LivelyFencing.*`, the k8s namespace and DB name
  are `livelyfencing`, and the dark-mode localStorage key is `lf-dark`. **These are
  working names, not bugs.** Don't rename them as a side effect of other work.
- Some contractor-era code is still there: `Job`, `JobEmbedding`, `Budget`, the
  `FencingType` and `JobStatus` enums, and the `Sales/Accountant/FieldWorker` roles. Before
  deleting any of it, check whether real-estate features still use it.
- `TenantService` (UI) loads branding, contact details and the feature list from
  `public/assets/tenant.json`. Change business details there, not in components.

## Stack

| Layer | Tech |
|---|---|
| UI | Angular 19 standalone components, Angular Material (green/orange theme), served by nginx |
| API | ASP.NET Core 8, EF Core + Npgsql, QuestPDF (Community license) |
| DB | PostgreSQL 16 with `pgvector` |
| Auth | Cloudflare Zero Trust Access (Google login) → JWT validated in the API |
| Email | SendGrid (outbound); inbound transaction emails arrive via webhook |
| Listings | Bridge Interactive API (FMLS dataset), proxied by `ListingsController` |
| Hosting | Docker images; k8s manifests in `k8s/`; Cloudflare Tunnel ingress |

## Repository layout

```
docker/            Dockerfile.api, Dockerfile.ui, nginx.conf (SPA routing + /api proxy)
k8s/               api, ui, postgres, ollama, cloudflared manifests; secret.example.yaml templates
scripts/           seed_email_templates.py, setup-local-registry.sh
docs/              proposal-gamls-and-ad-links.md (GAMLS + ad link proposal)
src/LivelyFencing.API/
  Controllers/     One controller per resource; request/response DTO records at the bottom of each file
  Data/AppDbContext.cs
  Domain/Entities/Entities.cs   ALL entities in one file
  Domain/Enums/Enums.cs         ALL enums in one file
  Infrastructure/
    Auth/          CloudflareJwtMiddleware.cs, AuthorizationPolicies.cs
    Background/    TransactionAutoAdvanceService.cs (hosted service)
    Email/         SendGridEmailService.cs
    Google/        GoogleReviewsSyncService.cs
    EncryptionService.cs, ErrorReportingMiddleware.cs
  Program.cs
src/LivelyFencing.UI/src/app/
  app.component.ts  Shell: sidenav, nav links, dark mode, role impersonation, bug-report dialog
  app.routes.ts     All routes and their guards
  core/guards/auth.guard.ts
  core/interceptors/cf-jwt.interceptor.ts   Sends the CF_Authorization cookie as a Bearer token
  core/services/    api.service.ts (ALL HTTP calls), auth.service.ts, tenant.service.ts,
                    seo.service.ts, utm.service.ts, theme.service.ts
  features/         One folder per screen (transactions, showings, listings, lp, ...)
```

## Authentication & authorization

- Cloudflare Access protects `/cq/` and `/portal/` and sets the `CF_Authorization` cookie.
  The Angular interceptor forwards it as `Authorization: Bearer …`, and
  `CloudflareJwtMiddleware` validates it against Cloudflare's JWKS (keys cached for 1 hour).
- The user's record and role come from the `Users` table, matched on email.
- **Public (unauthenticated) API paths** are listed explicitly in `CloudflareJwtMiddleware.cs`:
  `/health*`, `/webhooks*`, `/swagger*`, `POST /contact`, `GET|POST /reviews`,
  `GET /site-settings/carousel`, `/listings*`.
  - Use **exact** path + method matches for new public endpoints. A broad `StartsWith`
    opens up every other method and sub-path under that prefix.
  - A public endpoint also needs `[AllowAnonymous]` (or no `[Authorize]`) on the action.
- **Roles** (`UserRole`): `Admin`, `Sales`, `Accountant`, `FieldWorker`, `Customer`, `FMLSApprover`.
- **Policies** (`AuthorizationPolicies.cs`): `Admin`, `AdminOrSales`, `AdminOrAccountant`,
  `Internal` (Admin/Sales/Accountant/FieldWorker), `AnyRole`.
- UI guard: `canActivate: [authGuard(['Admin', 'Sales'])]`. In templates use
  `auth.hasRole(...)`, `auth.isAdmin()` and `auth.isInternal()`. Admins can "view as" another
  role (impersonation); `auth.realIsAdmin` stays true while impersonating.

## Database rules (important)

- Tables are created with **`EnsureCreated()`, not migrations.** It only builds the schema
  on an empty database. **A new entity or column on an existing database needs a manual
  SQL statement** (`CREATE TABLE IF NOT EXISTS …` / `ALTER TABLE … ADD COLUMN IF NOT EXISTS …`).
  Do this every time you change `Entities.cs`, and record the SQL in the PR description.
- Several entities use soft delete (`IsDeleted`, `DeletedAt`, `DeletedByEmail`) with global
  query filters in `OnModelCreating`. Use `IgnoreQueryFilters()` only on purpose.
- `Infrastructure/EncryptionService.cs` (key: `Encryption:Key`) exists for encrypting fields
  at rest, but current code doesn't call it. If you start using it, keep the key stable,
  because changing it makes previously encrypted values unreadable.
- Store all times in UTC (`DateTime.UtcNow`). Apply `DateTime.SpecifyKind(…, Utc)` to incoming values.

## API conventions

- `[ApiController]`, `[Route("kebab-case-plural")]`, a class-level `[Authorize(Policy = …)]`,
  and tighter policies per action where needed.
- DTOs are `record` types at the bottom of the controller file.
- JSON: enums are serialized as strings; reference cycles are ignored.
- Listings: `ListingsController` proxies the Bridge OData API. It must keep the FMLS display
  rules already coded there, such as the `InternetEntireListingDisplayYN` filter
  (FMLS Rule 13.1(b)). Don't loosen these filters. If Bridge isn't configured, it returns
  placeholder listings.
- Inbound transaction emails: `TcEmailWebhookController` (under `/webhooks`) checks the
  `TC_WEBHOOK_SECRET` shared secret, and `TransactionsController` has
  `POST {id}/parse-tc-email`.
- `ErrorReportingMiddleware` logs unhandled exceptions. It posts them to
  `ErrorReporting:Url` only if that setting is filled in.

## UI conventions

- Standalone components only (no NgModules). Import Material modules in each component's
  `imports` array.
- Use `signal()` for local state.
- **All HTTP goes through `core/services/api.service.ts`.** Don't call `HttpClient` from
  components. Exceptions are the tenant and bug-report loaders in core and the app shell.
- The production `apiUrl` is `/api` (same-origin through nginx), so that requests work inside
  Facebook and Instagram in-app browsers. Keep it that way.
- New page checklist: create the component in `features/<name>/`, add the route with
  `authGuard` in `app.routes.ts`, add the nav link in `app.component.ts` behind `auth.hasRole(...)`,
  add the API methods in `api.service.ts`, and add any new public route to the nginx SPA
  `location` regex in `docker/nginx.conf`.
- SEO: use `SeoService` for titles and meta tags on public pages. `public/sitemap.xml` and
  `robots.txt` are maintained by hand.

## Build & run

```bash
# API (needs Postgres with the vector extension and the settings listed in DEPLOYMENT.md)
cd src/LivelyFencing.API && dotnet run

# UI (dev server; dev environment points at http://localhost:5000)
cd src/LivelyFencing.UI && npm ci && npx ng serve

# Container images (from repo root)
docker build -f docker/Dockerfile.api -t cb-api .
docker build -f docker/Dockerfile.ui  -t cb-ui  .
```

There is no automated test suite. Check changes by building both projects and testing the
affected pages by hand.

## Things not to do

- Don't commit real secrets. `k8s/**/secret.yaml` is gitignored; use the `secret.example.yaml` templates.
- Don't widen the public-path list in `CloudflareJwtMiddleware` with prefix matches.
- Don't rely on `EnsureCreated` to apply schema changes to the live database.
- Don't remove the FMLS display rules or listing attribution.
- Don't rename `LivelyFencing` projects or namespaces as part of an unrelated change.

## Known leftovers

- The `ollama` k8s manifests and the `Ollama:BaseUrl` setting are left over from the
  contractor app. Current code does not call Ollama, so that pod can probably be dropped.
- The k8s manifests disagree about the namespace: `nginx.conf` proxies to `api.closingbell…`
  while most manifests use `livelyfencing`. Make them match your hosting.
- `scripts/setup-local-registry.sh` was written for the previous self-hosted setup.
