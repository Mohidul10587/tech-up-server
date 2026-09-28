# GSM Tech API

Minimal NestJS API for the initial authentication foundation.

## Configuration

Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`,
`ADMIN_PHONE`, and `ADMIN_PASSWORD`. The password is only used during seeding;
the database stores its bcrypt hash.

## Database

The migration only creates the `Role` enum and `User` table; it does not reset
or delete existing data.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

`prisma:seed` is idempotent: it creates the configured admin user or updates
that user's password hash and `ADMIN` role.
