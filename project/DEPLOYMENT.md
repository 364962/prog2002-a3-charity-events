# Deploy Good Together to each student's SCU cPanel

Status on 11 October 2026: Lu Yu's SCU deployment is live and verified at
https://24832520.it.scu.edu.au/ (staff: https://24832520.it.scu.edu.au/admin/).
Zhuolin Han's deployment still awaits account access. Repeat the procedure for
that account separately; use the unit's tutorial if its environment differs.

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
3. Use the available Node.js application manager. Lu Yu's SCU account offers
   Node.js 18.20.8; all 71 backend tests also pass on that exact version.
   The package accepts Node.js 18.20.8 or newer. Use a supported newer runtime
   where available; the university controls the installed hosting versions.
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

## Hosting evidence

| Student | Public URL | Staff URL | Live check | Status |
| --- | --- | --- | --- | --- |
| Lu Yu / 24832520 | https://24832520.it.scu.edu.au/ | https://24832520.it.scu.edu.au/admin/ | 11 October 2026, 07:18 UTC | 14 HTTPS checks passed; browser registration verified |
| Zhuolin Han / 24832119 | Pending | Pending | Pending | cPanel not yet available |

Official startup and restart guidance:
https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/
Lu Yu's environment: cPanel 110.0.150, CloudLinux Node.js 18.20.8,
MySQL 5.7.44-cll-lve, Passenger production mode, private application directory
`/home/ylu35/good-together-a3`, root startup `app.js`. The dedicated database is
`ylu35_good_a3`; its credentials are stored only in the server's `api/.env`
with mode 600. Original course databases and the original public `.htaccess`
were preserved; its backup is inside the private application directory.

The hosted check record and browser evidence are in `project/evidence/scu-ylu35`.
The API checks use the public HTTPS hostname with certificate validation from
the hosting server. An external browser separately verified discovery, combined
search, registration/confirmation, refresh persistence, staff details and categories.
The hosting firewall can present a browser-verification page to external command
line clients; a 200 HTML challenge is not a successful JSON health check.
Sensitive paths return either the host's 403 or the application's 404.
Temporary test records were removed; 2 organisations, 6 categories, 12 events,
12 registrations and all 4 integrity triggers remain.

To restart, use **Setup Node.js App > good-together-a3 > Restart**, or touch
`/home/ylu35/good-together-a3/tmp/restart.txt`. The manager provides the command
`source /home/ylu35/nodevenv/good-together-a3/18/bin/activate` for its Node environment.
Install API dependencies with `npm ci --omit=dev --prefix api` from the app root.
Do not re-import the seed SQL into the live database during an ordinary update.
