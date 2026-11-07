# TQMS Checkpoint Mock API

NestJS API for local development of the TQMS checkpoint frontend. It uses seeded in-memory data; it does not connect to the production TQMS database. All in-memory changes reset when the backend restarts.

For the complete two-app setup and architecture, see the [project README](../README.md).

## Run locally

```bash
npm ci
npm run start:dev
```

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
- The session secret is a development placeholder in `src/main.ts`; replace it and configure secure cookies before any real deployment.
- This backend is a development mock, not a production database or production-ready service.
