# Good Together client

Place this `clientside` directory next to the `api` directory from the API archive.
Follow the root README to import MySQL data and start the server. Open
http://127.0.0.1:3088 rather than opening the HTML files directly.

All event information is fetched from the same-origin Express API. The client uses
plain HTML, CSS, JavaScript modules, fetch promises and DOM template cloning. There
is no build step, framework or external CDN. Image sources are in assets/CREDITS.md.
