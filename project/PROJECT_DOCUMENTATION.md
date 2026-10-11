# Good Together - A3 project documentation

Prepared 11 October 2026. Team: Lu Yu (24832520); Zhuolin Han (24832119).
Repository: https://github.com/364962/prog2002-a3-charity-events (private).
Cohort and Team ID: awaiting confirmation. Hosting status: local verification
complete; both students' independent SCU sites deployed and verified.

## 1. Scope and architecture

The project extends the A2 event discovery site with persistent registrations
and a separate staff website. Existing branding, photography, event content,
search behaviour and Git history are reused. Public pages live in `clientside`;
staff pages live in `adminside`; Express serves them and the JSON API from one
origin. The browser uses fetch, async/await and DOM updates. Node.js uses a
MySQL promise connection pool with parameterised statements.

A visitor follows Home -> Search -> Event -> Registration -> Confirmation ->
Event registration list. Staff follow Events -> New/Edit -> Save -> Events.
The Categories screen supports an additional small CRUD workflow. All staff
pages have Events, New event, Categories and Public site navigation.

## 2. Database design

| Table | Purpose | Relationships and constraints |
| --- | --- | --- |
| organisations | Charity identity and contact details | Primary key id; one organisation hosts many events |
| categories | Search and management taxonomy | Primary key id; unique name; one category classifies many events |
| events | Description, schedule, venue, prices and publication | Foreign keys to organisation/category; valid dates and amounts; optional paired coordinates |
| registrations | Attendee, contact, ticket quantity, price snapshot and time | Foreign key to event; unique event/email pair; 1-10 tickets; nonempty contact fields |

The complete SQL includes two organisations, six categories, twelve events and
twelve fictional registrations. The same fictional attendee appears at two
events. Events 8, 9 and 10 start without registrations, so deletion can be
exercised without damaging the other examples. Seed dates are relative to the
import date and are stored as fixed values afterwards.

Email, trimmed and lowercased, is the chosen attendee identifier. The unique
index prevents a duplicate even when two requests arrive simultaneously. An
attendee can book another event because event_id is part of that key. No user
table is needed. The event foreign key uses ON DELETE RESTRICT. Deletion is
also checked in the application to provide useful feedback.

A registration transaction locks the event, checks that it is public and not
ended, reads its ticket price, and inserts a record using server time. Event
updates and deletion use the same lock. This prevents a registration from racing
with deletion or a price/publication change. Stored unit prices preserve the
historical reservation total. A reservation does not imply a completed payment.

## 3. REST API

| Method | Route | Result |
| --- | --- | --- |
| GET | /api/health | Database connectivity |
| GET | /api/categories | Public categories |
| GET | /api/events | Current/upcoming public events and optional date/location/category filters |
| GET | /api/events/:id | Event plus public registrations, newest first |
| POST | /api/events/:id/registrations | Validate and save one registration; 201 confirmation |
| GET | /api/events/:id/weather | Forecast or an explicit unavailable explanation |
| GET / POST | /api/admin/events | All-status listing / create event |
| GET / PUT / DELETE | /api/admin/events/:id | Full staff details / update / protected deletion |
| GET / POST | /api/admin/categories | Counts and categories / create category |
| PUT / DELETE | /api/admin/categories/:id | Update / delete an unused category |
| GET | /api/admin/organisations | Choices for the event editor |

Successful reads and mutations return a data wrapper; errors return an error
message. Creation uses 201 and applicable Location headers; deletion uses 204.
Validation uses 400; absent or hidden resources 404; unsupported methods 405;
duplicate or protected changes 409; oversized bodies 413; wrong content types
415; temporary database failures 503. The API accepts JSON up to 32 KB and
rejects unknown write fields. Browser forms validate first and then display
server feedback. They never substitute browser-only checks for database rules.

Public registration lists omit email and phone. Staff lists include them.
Authentication is omitted as the brief permits, so the public/private field
split is presentation separation, not access control. Only fictional data is
appropriate for this demonstration. A production application would need staff
authentication, authorisation, request throttling and stronger privacy controls.

## 4. Interface behaviour

The dedicated registration page reloads event details through the API, carries
the selected ticket count in the URL and shows the amount before submission.
It validates required fields, email syntax, contact phone and ticket range.
The submit button is disabled while saving. The server assigns the final price
and registration time. Confirmation identifies the saved registration and links
to the event's updated list. Past and suspended events cannot accept bookings.

The staff desk starts with every event, including past and suspended records.
Optional filters are applied to that complete list. The editor retrieves all
existing values and associated registrations. Save calls POST for a new event
and PUT for an existing one. Delete requires a confirmation dialog and displays
the server's refusal if registrations exist. Suspending retains registrations
while removing public visibility. Used categories cannot be deleted.

Text from the database is written with textContent; event image paths are
restricted to supplied local images. Same-origin requests and a Content Security
Policy limit unrelated content. Form controls have labels, focus indicators,
accessible status messages and consistent navigation. Layouts were checked at
390, 768 and 1440 pixels; wide tables scroll within their panels.

## 5. Optional forecast

Event coordinates are sent by the server to the fixed Open-Meteo forecast URL.
Daily weather code, minimum and maximum temperature are requested in Brisbane
time. WMO codes are converted to readable labels. The service uses a six-second
timeout and a 30-minute cache. It requests a maximum 16-day forecast and explains
why an event is outside that window instead of displaying unrelated dates.
Missing coordinates, incomplete data and network failures leave the registration
flow usable. Unit tests control forecast responses and browser tests exercise
fallback behaviour; live availability depends on the external service. A separate live request on
6 October returned a valid forecast for event 1; the response is retained in
project/evidence/live-weather.json.
Reference: https://open-meteo.com/en/docs

## 6. Verification and limits

On 7 October 2026, 71 backend tests and 46 browser checks passed on isolated
exports of the source staged for their respective milestones. Backend tests
import the real schema into isolated MySQL databases. They verify filters,
constraints, CRUD, duplicates, invalid fields, malformed JSON, contact-field
separation, concurrent duplicate submissions, registration/deletion races and
weather behaviour. Browser checks run real submissions in disposable databases
with Chromium and WebKit, verify persistence and check responsive layouts.

The backend log is milestone-2-api-tests.txt; full browser results are in
milestone-3-browser-results.json under project/evidence. Eight startup checks
also passed on 7 October with fresh production dependencies; see
milestone-3-startup-smoke.json. The evidence index records the actual dates of
each run, including the 6 October baseline archive checks and live forecast.
Historical A2 results in report/ are separate. On 11 October, all 71 backend
tests also passed on Node.js 18.20.8, the runtime supplied by SCU. Fourteen
HTTPS checks and nine external-browser checks passed on each student's deployed
site; see project/evidence/scu-ylu35 and project/evidence/scu-zhan15. Archive
contents and checksums are verified when packaging each release.
A synthetic local walkthrough may help rehearse; the assessed explanation must
also cover each student's actual contribution and deployed destinations.

## 7. Deployment and submission status

Lu Yu's public site is https://24832520.it.scu.edu.au/ and its staff site is
https://24832520.it.scu.edu.au/admin/. Zhuolin Han's public site is
https://24832119.it.scu.edu.au/ and staff site is
https://24832119.it.scu.edu.au/admin/. Both were verified on 11 October 2026:
Lu at 07:18 UTC and Han at 08:40 UTC. Each uses Node.js 18.20.8, MySQL 5.7.44
and Passenger production mode, a private application directory and app.js.
Each dedicated database holds the complete schema and four integrity triggers.
Credentials stay on the corresponding server with owner-only file permissions.

HTTPS checks covered pages/assets, database health, search, contacts, event and
category mutations, registration persistence, duplicate protection, protected
and eligible deletion, forecast fallback and blocked private paths. An external
browser also completed a registration and confirmed persistence after refresh.
All 40 deployed source files on each account matched the local checksums.
Temporary test records were removed on both sites, leaving each with the original
2 organisations, 6 categories, 12 events and 12 registrations. Existing course
files and databases were preserved.

Both hosting deployments are complete; account-specific maintenance instructions
are in project/DEPLOYMENT.md. Cohort/Team ID, marker access to the private
repository, final SCU OneDrive sharing, individual confidential peer evaluations
and Blackboard submission remain pending. Separate presentation sets were prepared
for both students on 11 October, with hosted evidence, English and Mandarin scripts,
and English, Chinese and bilingual captions. These use generic synthetic narration;
each student must review their actual contribution and the permitted narration format.

The four source milestones are recorded in project/DELIVERY_PLAN.md and the
remote Git history. Account attribution records authorised delegated operations;
individual contribution statements must match the work actually performed.

This report is built from project/PROJECT_DOCUMENTATION.md and the supplied
project/figures images. Install project/requirements.txt with Python's pip, then
run python3 project/build_documentation.py from the checkout. The generated PDF
is output/pdf/Good-Together-A3-Documentation.pdf. Source archives and the local
video are assembled separately; project/SUBMISSION_CHECKLIST.md identifies the
files and external steps required before upload.
