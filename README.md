# TQMS Checkpoint Mock API

NestJS API for the TQMS checkpoint frontend. Without `DATABASE_URL`, it uses seeded in-memory demo data. With `DATABASE_URL`, it loads and persists application collections in Neon PostgreSQL.

For the complete two-app setup and architecture, see the [project README](../README.md).

## Run locally

```bash
npm ci
npm run start:dev
```

To use Neon locally, copy `.env.example` to `.env` and set `DATABASE_URL` to the
pooled connection string from Neon. Keep `.env` private; it is ignored by Git.
On deployment, set `DATABASE_URL` in the backend host's environment settings.
The app creates the `tqms_app_state` table automatically. It seeds each
collection on first use and then loads existing collection data from Neon.
Successful POST, PUT, PATCH and DELETE requests are saved before their response
is returned. This currently stores each application collection as a JSONB
document; it does not create normalized relational tables.

For uploads, also set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` in the backend environment (Render for deployment).
Owner files, bank cheque files, and vehicle documents/permits are uploaded by
the backend to Cloudinary; their secure delivery URLs are stored with the Neon
records. These are standard Cloudinary delivery URLs, so use private/authenticated
delivery for files that must not be publicly accessible.

The API listens at `http://localhost:4000/api` by default. Set `PORT` to change the port. The frontend should use `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`.

## Local demo account

- Email: `checkpoint@tqms.local`
- Password: `password123`

These credentials are for this seeded local mock only. Do not use production credentials in documentation or source control.

## Commands

```bash
npm run build
npm run start:dev
npm run start:prod
```

The backend package has no automated test script configured at this time.

## API modules

Routes are under `/api`; protected routes require the `tqms_sid` session cookie.

- Auth, dashboard, lookups, checkpoint users and narration.
- Queue create/list/detail, check-in, end-journey, receipt and pending approval/removal.
- Vehicle create/list/detail/update, tare weight, audit log and CRUD for vehicle detail sub-resources.
- Vehicle owner create/list/detail/update and bank create/list/update.
- Other Vehicle create/list.
- Checkpoint and detail reports; QR payload.

See the [frontend API contract](../tqms-frontend/docs/API_CONTRACT.md) for request and response shapes. Some CRUD operations are not implemented yet; see the root README's known limitations.

## Implementation notes

- Global response handling wraps ordinary successful values in `{ data }`, returns paginated `{ data, meta }` responses, and formats exceptions as `{ message, errors? }`.
- `DATABASE_URL` is required when `NODE_ENV=production`; local development falls back to in-memory seed data when it is absent.
- The session secret is a development placeholder in `src/main.ts`; replace it before deployment.
- Database sessions are not persisted; configure a production session store before relying on long-lived sessions across restarts.
