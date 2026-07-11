# Agent Orchestration

## Default sequence

1. Orient with `AGENTS.md`, git status, graph architecture, and relevant project docs.
2. Trace the affected runtime path from server or browser input to visible output.
3. Assign independent, bounded audits only when parallel work is explicitly authorized.
4. Keep implementation ownership clear; avoid multiple agents editing the same file.
5. Integrate tests and docs with the code change.
6. Run every repository gate and inspect the built application in a browser.
7. Refresh the knowledge graph and report exact validation evidence.

## Useful parallel boundaries

- Server/API provenance and security
- Browser metric semantics and WebRTC behavior
- Responsive/accessibility UI review
- Test, CI, and documentation consistency

Audits should return findings, file paths, and proposed tests. The primary agent owns cross-cutting decisions and final integration.

## Stop conditions

Stop and ask for direction only when work needs new external authority, destructive operations, production credentials, or a product choice with materially different outcomes. Local reversible implementation and validation should continue autonomously.

## Completion definition

Completion requires passing typecheck, lint, coverage, production build, smoke, formatting, and dependency audit; verifying user-visible states at desktop and narrow widths; updating relevant docs; and identifying any Vercel-console work that cannot be proven from the repository.
