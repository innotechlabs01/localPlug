# Team Board — LocalPlug

## TODO
(none)

## In Progress
- [ ] T-018: Cobrar el viaje on-demand antes de buscar conductor y reembolsar si no hay aceptación
  - Contrato: specs/018-paid-ride-dispatch/design.md

## Review
(none)

## Done
- [x] T-001: Quitar bypass hardcodeado de super_admin/admin; permisos 100% DB-driven + sincronizar rol a Clerk metadata — mergeado a develop (adb03e2)
  - lib/admin/permissions.ts: eliminado BUILTIN_SUPER_ADMINS / isSuperAdminEmail / isAdminEmail; requireSuperAdmin valida rol en BD; getUserPermissions consulta role_permissions sin bypass
  - app/api/webhooks/clerk/route.ts: nuevos usuarios siempre viewer; sin promoción por email
  - app/api/admin/permissions/route.ts: guardia auto-bloqueo super_admin
  - app/api/admin/team/route.ts: nuevo PUT para cambiar rol de cualquier usuario + syncClerkUserRole
  - app/api/admin/employees/route.ts: usa helper syncClerkUserRole (corrige mapeo incorrecto)
  - Tests: 172/172 pasando; lint 0 errores; tsc limpio
