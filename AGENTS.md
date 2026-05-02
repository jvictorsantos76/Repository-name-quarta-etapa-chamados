# AGENTS.md

## Project Context

QUARTA-ETAPA-CHAMADOS is a SaaS for service-oriented IT operations, field service, service desk, and technical ticket management. The system replaces operational limitations in Bling for service and ticket control.

The most sensitive module is ticket handling: opening, status tracking, assignment, technical records, evidence and attachments, history, permissions, customer/store context, and operational dashboards.

Use ITIL 4 and GLPI as conceptual references, but do not copy GLPI directly. Prioritize practical service desk workflows, clear traceability, and measurable operational visibility.

## Technical Stack

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Vercel
- npm
- Windows local development

## Next.js Version Rule

This is NOT the Next.js you know.

This version has breaking changes. APIs, conventions, and file structure may differ from general training data. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

Current project scripts:

```powershell
npm run dev
npm run lint
npm run build
```

Before starting `npm run dev`, check whether port `3000` already has a running Next dev server.

## Engineering Rules

- Make one focused change at a time.
- Inspect the existing project structure before implementing.
- Preserve naming patterns, folder structure, Supabase client patterns, TypeScript style, and UI conventions.
- Do not introduce unrelated features, dependencies, routes, tables, policies, or business rules.
- Do not remove existing tables, migrations, policies, routes, components, or rules without a clear reason tied to the request.
- Prefer small, traceable, reversible changes.
- If a change affects visible behavior, update visible versioning and changelog when the project pattern requires it.
- Do not edit `.env.local` unless explicitly requested.

## Supabase, Auth, and RLS

- Treat `public.perfis` as the operational source of truth for authorization, roles, and active access.
- Authentication success and operational authorization are separate checks.
- Users without an active profile must be treated as awaiting approval, not as fully authorized internal users.
- Public registration must create a pending access request and must not automatically grant operational access unless explicitly requested.
- Respect RLS. Do not disable RLS to fix permission problems.
- Separate `anon`, `authenticated`, and service role permissions.
- Do not grant broad public access.
- Do not enable delete on sensitive operational tables unless explicitly requested.
- For database changes, create a new migration under `supabase/migrations`; do not edit old migrations that may already have been applied.
- Check existing tables, columns, policies, grants, functions, and Storage policies before inventing new ones.
- For evidence upload issues, remember the flow can involve Storage upload first and table insert second.
- For login redirects to awaiting approval, investigate active profile lookup and authorization routing before changing credentials or auth data.

## Security and LGPD

- Minimize exposure of personal data.
- Do not expose customer, user, technician, ticket, evidence, or attachment data without authorization.
- Administrative screens must require authentication and proper authorization.
- Sensitive actions should remain traceable through existing relationships and history tables.
- Do not include secrets, API keys, tokens, or personal data in documentation, logs, commits, or responses.

## UI and UX

- Use a clean, corporate, operational interface.
- Prioritize usability over decorative design.
- Avoid generic SaaS screens that do not help the operator.
- Keep important ticket information easy to identify: ticket number, customer, store/unit, requester, responsible technician, priority, status, SLA or due date, evidence, technical notes, and history.
- Use clear error messages that a non-developer can understand.
- When changing CSS, prefer reusable structure and design consistency over scattered visual fixes.
- Preserve Quarta Etapa branding on auth and access screens unless the request says otherwise.

## Validation

After code changes, run the relevant validations:

```powershell
npm run lint
npm run build
```

Run tests if the project adds a test script or the touched flow has a specific acceptance path. For UI or auth flows, also verify the relevant localhost path when feasible.

If validation fails, show the error clearly, identify the likely cause, and fix it if it is within scope. If it cannot be safely fixed, explain the blocker and the next best step.

## Response Format

At the end of each task, respond in Portuguese with:

1. Resumo da alteração
2. Arquivos modificados
3. Comandos de validação executados
4. Resultado da validação
5. Como testar no localhost
6. Riscos ou pendências
7. Próximo passo recomendado
