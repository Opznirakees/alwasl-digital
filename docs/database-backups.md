# Database Backups

This project stores production state in PostgreSQL. Production must run on DigitalOcean Managed PostgreSQL or an equivalent managed PostgreSQL service with automated backups enabled.

## Required Production Backup Controls

- Use a managed PostgreSQL database for `DATABASE_URL`; do not run production on an unmanaged container database.
- Keep automated cloud backups enabled for the production cluster.
- Keep point-in-time recovery available for the provider-supported retention window.
- Restrict database access to the application and trusted operator IPs only.
- Keep `bun run db:migrate` as the schema deployment path; never use `db:push` against production.
- Test a restore before launch and after major schema changes.

DigitalOcean Managed PostgreSQL currently provides daily automated backups and point-in-time restore within the previous seven days. DigitalOcean restores backups into a new primary node, so a restore must be followed by application connection-string rotation and a smoke test.

Sources:

- DigitalOcean PostgreSQL restore documentation: https://docs.digitalocean.com/products/databases/postgresql/how-to/restore-from-backups/
- DigitalOcean PostgreSQL feature documentation: https://docs.digitalocean.com/products/databases/postgresql/details/features/
- DigitalOcean `doctl databases backups` command: https://docs.digitalocean.com/reference/doctl/reference/databases/backups/

## Repo Evidence

The backup posture is represented in the repo by:

- This runbook: `docs/database-backups.md`
- The verification script: `scripts/verify-digitalocean-backups.ts`
- The package command: `bun run ops:check-backups`
- The required cluster identifier variable in `.env.example`: `DO_DATABASE_CLUSTER_ID`

These files do not create the managed database. They make the production requirement and verification procedure explicit, reviewable, and testable.

## Verification

Set the production database cluster ID locally or in the operations environment:

```bash
DO_DATABASE_CLUSTER_ID="your-digitalocean-database-cluster-id"
```

Then run:

```bash
bun run ops:check-backups
```

The command uses `doctl databases backups <cluster-id> --format Created --no-header` and fails if no backup is returned or if the latest backup is older than the allowed maximum age.

Optional override:

```bash
BACKUP_MAX_AGE_HOURS=36 bun run ops:check-backups
```

Default maximum age: `30` hours. This allows for a daily backup schedule with some delay while still catching stale or missing backups.

## Restore Drill

Run this before launch and at least after high-risk schema changes:

1. Open the production PostgreSQL cluster in DigitalOcean.
2. Use **Restore from backup** and restore to a new database node or cluster.
3. Apply application environment variables to point a staging app at the restored database.
4. Run:

```bash
bun run db:migrate
bun run build
bun run test:e2e
```

5. Verify a staff/admin login, product list, wallet page, order history, and admin summary.
6. Record the restore timestamp, restored cluster ID, backup timestamp, and smoke-test result in the operational log.

## Incident Restore Procedure

1. Freeze writes by disabling public traffic or putting the app in maintenance mode.
2. Restore the managed database backup to a new node/cluster.
3. Rotate `DATABASE_URL` to the restored database.
4. Run `bun run db:migrate`.
5. Start the app and run a smoke test.
6. Confirm recent orders, wallet transactions, manual deposits, and admin audit logs.
7. Re-enable traffic.
8. Keep the old cluster untouched until finance/order reconciliation is complete.
