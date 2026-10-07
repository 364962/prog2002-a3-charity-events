# Good Together - local demonstration transcript

## Discover a local cause

Good Together is a charity event website for the Gold Coast. This local demonstration covers event discovery, registration, and the staff management workflow. The home page retrieves events from a Node and Express API connected to MySQL. The cards show current and upcoming public events. Past and suspended events are excluded from this listing. Category shortcuts take visitors directly to a filtered search. The existing Assessment Two design has been extended with persistent registration and administration. All people and contact information in this demonstration are fictional. The final hosting checks will be carried out separately on each student's SCU account.

## Search, filters and validation

The search page combines a start date, suburb and category. Here the suburb Southport and the Fun run category narrow the results. The browser sends these choices in the query string, so the URL can be shared and browser history can restore the filters. On the server, the conditions are joined together and their values are bound as prepared statement parameters. Clearing filters resets both the form and the results. A suburb with no matches produces a useful empty state. Invalid dates and identifiers receive validation messages instead of a failed page. Loading, retry and error states are handled through DOM updates.

## A real event registration

The event page loads its details and all associated public registrations through the API. Registrations are ordered by registration time, newest first, with the identifier breaking ties. Names, ticket quantities and dates appear publicly; contact details are omitted from this list. Selecting three tickets updates the displayed total, and Register opens a dedicated page for this event. The page shows the event date, venue, organiser and price. The visitor enters a name, email address and contact phone. Required fields and contact formats are checked before submission. The server checks them again, obtains the ticket price and current time itself, and saves the registration.

## Confirmation and duplicate protection

The confirmation identifies the saved registration and the ticket total. No online payment is processed by this application. Returning to the event shows the new attendee at the top of the list. Refreshing still shows the registration because it is stored in MySQL. The same email address cannot register for this event a second time, even if the letter case changes. The same person may register for another event. An email and event pair is protected by a unique database index, rather than relying only on the browser. Events that have ended cannot receive new registrations, and suspended events are unavailable publicly.

## The staff events desk

The staff website has consistent navigation to Events, New event, Categories and the public site. Its list includes every event, including active, past and suspended records. Staff can use the status filter to focus on one group. Editing an event retrieves its existing values, together with the full registration list and contact details. Past is calculated from the end time, while suspended is a publication choice. The brief allows this teaching version to omit authentication, so it should use fictional data only. A production service would need staff authentication and access controls before collecting real personal information.

## Creating, updating and deleting

The new event form validates required descriptions, dates, amounts and category choices. Save sends a JSON request to the creation endpoint and returns the stored identifier. The same form then edits that record with a full update request. Suspending the event removes it from public discovery while retaining its records. Deleting an event asks for confirmation and calls the API. An event with registrations is refused with a clear explanation, so it can be suspended instead. An unused event can be deleted. The category screen also supports creation, editing and deletion, and prevents deletion of a category that is still used by an event.

## Database and API implementation

The database contains organisations, categories, events and registrations. Registrations reference events through a foreign key and store attendee details, ticket quantity, a unit price snapshot and registration time. Twelve fictional registrations are included in the initial SQL. The unique event and email index prevents duplicates. The restricted foreign key prevents orphaned registrations. The registration API starts a transaction and locks the event row before checking availability and inserting the record. Updates and deletion take the same lock. This coordinates concurrent changes. The integration tests exercise both duplicate submissions and registration against deletion, using a real isolated MySQL database.

## DOM, weather and verification

The client uses plain JavaScript modules, fetch and async functions. API responses are rendered using text content and DOM elements. The staff forms send JSON and show server validation errors. Weather is an optional server-side call to Open Meteo using event coordinates. The interface shows conditions and daily temperatures when available. Dates beyond the sixteen day forecast window, missing coordinates and network failures produce an explanation without blocking registration. Seventy-one backend tests and forty-six browser checks passed locally, including Chromium and WebKit at mobile, tablet and desktop widths. The source packages and deployment guide are prepared. Both SCU deployments, the final OneDrive share link and individual contribution explanations remain to be completed before assessment submission.
