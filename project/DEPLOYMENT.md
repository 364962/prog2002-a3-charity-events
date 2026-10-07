# Deploy Good Together to each student's SCU cPanel

Status: accounts not yet available. These are preparation instructions, not a
record of deployment. Repeat the procedure separately for each student; each
person signs into their own account. Use the unit's SCU hosting tutorial when
its settings differ from this general cPanel/Passenger preparation.

1. Upload the source checkout, or extract the three final archives into one
   application directory under your hosting home directory. It must contain `app.js`, `api/`, `clientside/`, `adminside/`.
   Do not put `.env`, SQL, tests or project documentation in a public document
   root. Express exposes only the designated public/static directories.
2. In cPanel create a new MySQL database and user, assign that user privileges
   on that database, and record the full cPanel-prefixed names. Import
   `api/database/charityevents_db.sql` into the selected empty database using
   phpMyAdmin. Verify 2 organisations, 6 categories, 12 events, 12 registrations.
   The SQL includes triggers. If trigger creation is forbidden, contact the
   tutor/hosting administrator rather than silently omitting integrity rules.
3. Configure Node.js 20 or newer through the available application manager.
   Set the application root to the directory containing root `app.js`; use
   `app.js` as the startup file. Do not use `api/app.js`, which exports a factory.
   Install dependencies with `npm ci --omit=dev --prefix api` in the host's
   Node.js environment.
4. Configure DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD and NODE_ENV=production
   using the application manager's environment settings, or a private api/.env.
   Use the hosting provider's port/binding instructions. Passenger controls the
   externally served port; do not expose local port 3090 as the public URL.
5. This build uses root-relative links, e.g. `/api/events` and `/admin/`.
   Map it to the root `/` of its assigned domain/subdomain. If SCU only supports
   a path prefix, adapt and retest the base path before claiming deployment.
   Do not assume a `/~username/` URL behaves like a domain root.
6. Start/restart through the manager. On a Passenger installation, touching
   `tmp/restart.txt` under the application root requests a restart. Enable HTTPS
   through the provided domain controls and use the HTTPS URL for the video.
7. Check public Home/Search/Event, real registration and confirmation, the staff
   all-status list, create/edit, protected delete, eligible delete and categories.
   Use fictional test contacts. Check /api/health and the forecast fallback.
   Verify /.env, /api/.env and /api/database/charityevents_db.sql do not expose
   files. Record the public URL, staff URL, UTC check time and actual outcome.

Do not run disposable-database tests on shared hosting unless the host explicitly
provides a test account with database creation/deletion privileges. Run the
full automated suite locally, then perform the live acceptance checks above.

## Evidence to complete after hosting becomes available

| Student | Public URL | Staff URL | Live check | Status |
| --- | --- | --- | --- | --- |
| Lu Yu / 24832520 | Pending | Pending | Pending | cPanel not yet available |
| Zhuolin Han / 24832119 | Pending | Pending | Pending | cPanel not yet available |

Official startup and restart guidance:
https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/
The exact SCU product/version and enabled features have not yet been inspected.
