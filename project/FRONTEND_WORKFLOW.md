# Visitor and staff workflow plan

This document defines the A3 interface scope and acceptance scenarios for the
registration and staff milestone. The shared project continues the Good Together
A2 design with plain HTML, CSS, JavaScript modules and API-driven DOM updates.

## Visitor journey

1. Home and search continue to retrieve current/upcoming public events.
2. Event details load the event and its complete public registration list in one
   API response. Display names, quantities and registration dates, newest first.
3. Register opens a dedicated page with the event ID and selected ticket quantity
   in the URL. Reload event information from the API rather than trusting URL prices.
4. Collect full name, email, phone and 1-10 tickets. Show the selected event, price
   and total. Validate inputs in the browser and display server-side validation.
5. Disable submission while saving. On success show the saved registration ID,
   quantity and total, then provide a link back to the updated event list.
6. Duplicate registrations, closed events and unavailable services need readable
   feedback. No online payment is collected.

## Staff journey

- Use a shared menu for Events, New event, Categories and Public site.
- List all event statuses. A filter may narrow the list, but its default is all.
- New and edit forms share labels and validation rules. Edit also retrieves the
  complete registration list with contact information for the staff view.
- Save invokes POST for creation and PUT for updates. Publication can be active
  or suspended; past is derived from the event's dates.
- Delete opens a confirmation dialog. Cancelling, including Escape, must not
  send a deletion request. Display the API's refusal when registrations exist.
- Category management supports add, edit and delete with an in-use safeguard.

## Browser acceptance scenarios

| Area | Required check |
| --- | --- |
| Discovery | Combined filters, clear, empty result, browser history and recovery |
| Registration | Valid booking, required fields, phone/email, quantity and confirmation |
| Persistence | Reload keeps registration; newest-first list reflects the inserted row |
| Duplicate | Same email in different letter case is rejected for that event |
| Availability | Past, suspended, missing and invalid IDs cannot be registered |
| Staff events | All statuses, create, edit, suspend, eligible delete and protected delete |
| Categories | Create, update, delete and refusal when a category is used |
| Dialogs | Confirm, cancel, Escape and repeated opens do not reuse a stale decision |
| Layout | 390, 768 and 1440 pixels; tables scroll without widening the page |
| Resilience | Weather failure does not block registration; no uncaught script errors |

Run acceptance scenarios in Chromium and WebKit against an isolated test
database. Keep fictional test contacts separate from the reusable seed data.
Screenshots, API results and test logs should be retained with the corresponding
milestone. Record actual live deployment results separately for each SCU account.
