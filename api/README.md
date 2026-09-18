# Charity events API

This milestone provides read-only event discovery using Express and MySQL.
The client pages are a separate milestone. The API can be tested without them.

## Start

Import `database/charityevents_db.sql` into a fresh MySQL database, then run these
commands from this directory:

```sh
cp .env.example .env
# Set your local database credentials in .env.
npm ci
npm run db:check
npm start
```

The default address is `http://127.0.0.1:3088`. Check `/api/health` to confirm the
database connection. The SQL import does not remove existing tables.

## Resources

| GET endpoint | Result |
| --- | --- |
| `/api/events` | Active current/upcoming events with category and organisation details |
| `/api/events?location=Southport&category=1` | Events matching both optional filters |
| `/api/events?date=YYYY-MM-DD` | Events starting on that local date; can be combined with the other filters |
| `/api/categories` | Category IDs, names and descriptions |
| `/api/events/1` | Full details for one active event |
| `/api/health` | Database connectivity |

Locations use case-insensitive literal substring matching. Dates use Gold Coast
time (Australia/Brisbane, UTC+10). A past detail link remains readable, while a
suspended event is excluded from both lists and details.

Invalid filters return 400; missing or suspended events return 404; write methods
return 405; and an unavailable database returns 503 without exposing SQL details.
No matching records is a successful 200 response with an empty `data` array.
`requests.http` contains manual examples.

## Tests

```sh
npm test
```

The suite creates a uniquely named temporary MySQL database and removes it after
the checks. The configured user needs CREATE/DROP privileges for that test
database. The suite does not modify the application's `charityevents_db` data.

The 32 checks cover sample data, combinations of filters, invalid inputs, literal
SQL injection strings, visibility rules, date boundaries, foreign keys, validation
triggers and database-error responses.
