# GEM Implementation Roadmap

## Done
- Phase 1: Finish GEM rebrand & install-as-app (build passing)
- Phase 2: Roles system (`app_role` enum, `user_roles`, `private.has_role`, RLS). `tawfiqm857@gmail.com` seeded as admin.
- Phase 3: Dual-Entity Project Transparency Engine (`projects`, `project_milestones`, `project_photos`, `/projects`, `/projects/:id`)
- Phase 4: Revenue Synchronization & Public Transparency Hub (`revenue_logs`, `transparency_documents`, `/transparency`, `revenue-webhook` edge function)
- Phase 5: Governance Showcase & Community Services Portal (`leadership`, `service_requests`, `/governance`, `/services`, `/admin/services`)
- Phase 6: Marketplace (`marketplace_listings`, `/marketplace`)
- Phase 7: Navigation & routing polish (all civic/social routes registered)
- Security linter clean (moved SECURITY DEFINER helpers to `private` schema, enabled leaked-password protection)

- Private-bucket images now load via signed URLs (`src/lib/storage.ts`); project photos and marketplace images store object paths.

## Pending
- Admin password change for `tawfiqm857@gmail.com` blocked: leaked-password protection rejected "AdminUser" as weak. Awaiting a stronger password (or explicit instruction to disable the protection).
