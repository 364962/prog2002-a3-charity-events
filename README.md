# Good Together | Charity events

PROG2002 Assessment 3. Team: Lu Yu (24832520) and Zhuolin Han (24832119).
Private repository: https://github.com/364962/prog2002-a3-charity-events

This milestone adds persistent registration and write APIs to the existing A2
site. The public registration interface is included; staff pages, deployment
records and final packaging are reserved for later milestones. The complete
local version may contain those later files before they are committed.

## Run this milestone

Requires Node.js 20+ and MySQL 5.7+. Create a new empty database, then import:

```sh
mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE charityevents_a3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -h 127.0.0.1 -u root -p charityevents_a3 < api/database/charityevents_db.sql
```

Copy `api/.env.example` to `api/.env`, enter your local database credentials and
set PORT=3090. Never commit the real `.env` file. Install and start:

```sh
npm ci --prefix api
npm run db:check --prefix api
npm start --prefix api
```

Open http://127.0.0.1:3090/. Express serves both the public website and API.
Do not open HTML files directly. The SQL neither creates nor drops a database;
import once into a new database rather than overwriting existing data.

## Included behaviour

- Home/search retrieve current and upcoming public events, with combined date,
  suburb and category filters and shareable URLs.
- Details retrieve the event and every public registration, newest first.
  Public attendee rows omit email and phone; the staff API includes them.
- Register opens a dedicated page with event context, name, email, phone and
  1-10 tickets. Client validation precedes server validation. Confirmation links
  to the saved attendee list; no online payment is collected.
- Email is normalised and uniquely paired with event ID. The same email cannot
  book an event twice but can book other events. Past and suspended events close
  registration. Price and registration time are controlled by the server.
- Event/category management APIs support create, read, update and deletion.
  Event row locks coordinate registrations, updates and deletion. Registrations
  prevent event deletion; referenced categories also cannot be deleted.
- Optional weather uses event coordinates and a 16-day forecast window. Missing
  or unavailable forecasts do not interrupt registration.

All seed organisations, people and contacts are fictional. Authentication is
outside the brief's required teaching scope; the staff API is not protected by
login. Use fictional data only. Staff UI files will follow in the next milestone.

## Data and APIs

The portable SQL contains 2 organisations, 6 categories, 12 events and 12 initial
registrations. Seed dates are relative to import day and remain fixed afterwards.
Brisbane wall time (UTC+10) is used consistently. `unit_price` records the price
at registration, preserving earlier bookings when event prices change.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/health | Database connectivity |
| GET | /api/categories | Public category choices |
| GET | /api/events | Public events, with optional date/location/category |
| GET | /api/events/:id | Details and public registrations |
| POST | /api/events/:id/registrations | Create registration |
| GET | /api/events/:id/weather | Forecast or fallback explanation |
| GET / POST | /api/admin/events | All-status list / create |
| GET / PUT / DELETE | /api/admin/events/:id | Staff details / update / protected delete |
| GET / POST | /api/admin/categories | Category counts / create |
| PUT / DELETE | /api/admin/categories/:id | Update / protected delete |
| GET | /api/admin/organisations | Organisation choices |

Examples are in `api/requests.http`. Write bodies use JSON, with a 32 KB limit.
Responses use a `data` wrapper or an `error` message. Creation returns 201;
deletion 204; validation 400; missing/hidden resources 404; unsupported methods
405; duplicates/protected changes 409; large bodies 413; wrong types 415; and
temporary database failures 503. Statements bind parameters separately from SQL;
browser text is assigned through textContent.

## Verification

```sh
npm test --prefix api
python3 -m pip install -r tests/requirements.txt
python3 -m playwright install chromium webkit
npm run test:browser --prefix api
```

Tests create and remove their own uniquely named disposable MySQL databases.
They need CREATE/DROP privileges and do not change the local demonstration
database. The browser command starts its own test server, uses fictional
attendees and checks Chromium and WebKit. Weather is controlled in automated
tests so external availability does not decide the test result.

Backend checks cover filtering, database constraints, registrations, duplicates,
concurrent registration/deletion, event/category CRUD and weather behaviour.
This milestone's browser suite covers discovery, registration, confirmation,
duplicate feedback, invalid/closed events and 390/768/1440px layouts.
Verification on 7 October 2026: 71 backend tests and 38 public browser checks
passed on isolated exports of the staged source. Results are recorded in
`project/evidence/milestone-2-api-tests.txt` and
`project/evidence/milestone-2-browser-results.json`. Historical A2 evidence under
`report/` is separate from A3 verification.

## Progress and remaining work

See `project/DELIVERY_PLAN.md` for real milestone dates and
`project/FRONTEND_WORKFLOW.md` for the interface acceptance plan. GitHub account
operations follow the authorised delegated test arrangement. Actual individual
contributions and explanations must be recorded separately.

The next milestone adds staff pages and their browser coverage. Individual SCU
cPanel deployments, cohort/Team ID, marker access, final OneDrive sharing and
confidential peer evaluations still require completion. No deployment or final
assessment completion is claimed by this intermediate source milestone.

Image sources: `clientside/assets/CREDITS.md`.
