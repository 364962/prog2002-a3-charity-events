# Good Together | Charity event registration

PROG2002 Assessment 3. Team: Lu Yu (24832520) and Zhuolin Han (24832119).
A3 builds on the existing Good Together A2 design and Git history.
Private repository: https://github.com/364962/prog2002-a3-charity-events

The application uses Node.js 20+, Express 5, MySQL 5.7+, HTML, CSS and plain
JavaScript with DOM updates and Promise-based API calls. Seed organisations,
events and attendees are fictional. Payments and authentication are outside this
teaching application's scope; do not use it to collect real customer data.

## Start locally

Use the repository checkout, or extract the three source archives into one
directory when the final packages are available. Keep `api`, `clientside` and
`adminside` as siblings. `app.js` is the application-root startup file.

1. Create a **new empty database** and import the supplied SQL once:

   ```sh
   mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE charityevents_a3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   mysql -h 127.0.0.1 -u root -p charityevents_a3 < api/database/charityevents_db.sql
   ```

2. Copy `api/.env.example` to `api/.env`. Set your database host, port, name,
   username and password. Set `PORT=3090` and `HOST=127.0.0.1` locally.
   Never commit or upload the real `.env` file as a deliverable.
3. Install and run:

   ```sh
   npm ci --prefix api
   npm run db:check --prefix api
   node app.js
   ```

4. Open http://127.0.0.1:3090/ for visitors and
   http://127.0.0.1:3090/admin/ for staff. Opening HTML files directly does not
   provide the API. The server serves the website and API at the same origin.

The SQL neither creates nor drops a database. It deliberately fails on an
already-imported schema instead of erasing records. Use a new database for
experiments. The supplied Mac already has separate A2 and A3 databases; to run
A3 while preserving its existing A2 `.env`, use:

```sh
DB_NAME=charityevents_a3 PORT=3090 node app.js
```

## Features

- Home and search show public current/upcoming events; date, suburb and category
  filters can be combined and are reflected in the URL.
- Event details include complete public registrations ordered by newest date,
  then ID, with name and ticket quantity. Contact data appears in the staff view.
- A dedicated registration page collects name, email, phone and 1-10 tickets.
  Price and registration time come from the server. A confirmation links back
  to the event. There is no online payment processing.
- Each normalised email can register once per event and for multiple events.
- Staff can list, add, edit, suspend and delete events, and inspect registrations.
  Deletion of an event with registrations is blocked in the API and database.
- Staff can create, update and delete categories; used categories are protected.
- Optional Open-Meteo forecasts use event coordinates and a 16-day window.
  Missing, distant or unavailable forecasts do not block registration.
- Mobile layouts, labelled forms, keyboard focus, errors, empty states and retry
  controls are included. Tables scroll within their containers on small screens.

## Structure

```text
app.js                     cPanel Passenger / local startup
api/
  app.js                   Express app, reads, middleware and errors
  management.js            registrations, staff CRUD and transactions
  validation.js            query and ID validation
  write-validation.js      strict event, category and registration bodies
  weather.js               Open-Meteo adapter, cache and fallback
  event_db.js              MySQL connection pool; local configuration
  database/charityevents_db.sql  complete schema, triggers and seed data
  requests.http            runnable API examples
  test/                    isolated MySQL integration tests
clientside/                public pages, images, shared CSS and JS
adminside/                 staff events, editor and categories pages
project/                   documentation, delivery plan and A3 evidence
report/                    historical A2 report and evidence (not A3 results)
tests/browser_test.py      A3 browser acceptance checks
```

## Data integrity

Two organisations host twelve events across six categories. Twelve initial
registrations reference nine of the events. The schema uses primary keys,
foreign keys, a unique `(event_id,email)` index and MySQL 5.7-compatible triggers.
Registration email is trimmed and lowercased. Email is the attendee identity for
this assessment; the system does not attempt to detect one person using different
email addresses. A separate user table is not required.

Registration locks its event row in a transaction before checking availability
and recording the server's price and time. Event deletion and updates take the
same row lock. Foreign keys provide a final deletion safeguard. Prices use
DECIMAL; registration `unit_price` is a snapshot so later edits do not change
existing reservations. Event fundraising totals are independent of unpaid
reservations.

Dates are Brisbane wall time (UTC+10). SQL compares them with
`UTC_TIMESTAMP() + INTERVAL 10 HOUR`; browsers format them in Australia/Brisbane.
Seed dates are relative to import day and then remain fixed. Past is calculated
from the end time; suspended is a stored publication choice.

## Verification

```sh
npm test --prefix api
python3 -m pip install -r tests/requirements.txt
python3 -m playwright install chromium webkit
npm run test:browser --prefix api
```

Both suites create uniquely named disposable databases and drop only those
fixtures afterwards. They require CREATE/DROP privileges; do not run them with
restricted production credentials. Browser tests mutate **their test database**.
Evidence from 7 October 2026: **71 backend tests and 46 browser checks passed**
in Chromium and WebKit, including registration/deletion concurrency,
case-insensitive duplicates, staff CRUD, form errors and 390/768/1440px layouts.
Weather unit tests use controlled responses; browser acceptance uses the
unavailable-weather fallback. These are not evidence of a live forecast or
cPanel deployment. Backend results are recorded in
`project/evidence/milestone-2-api-tests.txt`; the complete public/staff browser
results are in `project/evidence/milestone-3-browser-results.json`. Root startup
checks are recorded in `project/evidence/milestone-3-startup-smoke.json`: all
8 passed on an exported source snapshot with freshly installed production
dependencies. These are local startup checks, not hosted deployment results.

## Delivery

See `project/DEPLOYMENT.md` for hosting preparation and
`project/DELIVERY_PLAN.md` for milestone records. The current source includes
the public website, staff website, API and application-root startup entry.
Final project documentation, packaging and demonstration materials remain
local for the final delivery milestone.
Each student must deploy to their own cPanel destination. cPanel, cohort/Team ID,
marker repository access, SCU OneDrive sharing and confidential peer evaluations
remain pending external inputs. Local completion is not a claim of deployment.
No AngularJS bonus is claimed; this implementation follows the permitted DOM
and JavaScript route. Marks remain subject to the assessor's rubric.

Image sources and licensing are in `clientside/assets/CREDITS.md`.
