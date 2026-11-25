# Closing Bell GA

Website, CRM back office and client portal for The Closing Bell Real Estate Team —
[closingbellga.com](https://closingbellga.com).

- **Angular 19** front end, **ASP.NET Core 8** API, **PostgreSQL** (pgvector)
- **Cloudflare** for DNS, Access (login) and Tunnel; **SendGrid** for email; **Bridge/FMLS** for listings

## Docs

| File | What's in it |
|---|---|
| [AGENTS.md](AGENTS.md) | How the code is organized, its conventions and rules. Read this first, especially if you're using an AI assistant. |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hosting, build, configuration and secrets, and the outside accounts the site depends on |
| [docs/](docs/) | Feature proposals |

`CLAUDE.md` points Claude Code to `AGENTS.md`. Most other AI tools read `AGENTS.md` directly.
