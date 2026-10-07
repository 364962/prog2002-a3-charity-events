# A3 delivery plan

Good Together builds on Lu Yu's Assessment 2 repository and its original history.
Repository: https://github.com/364962/prog2002-a3-charity-events (private).

## Team details

- Lu Yu (鲁彧), 24832520; GitHub: `364962`.
- Zhuolin Han (韩卓林), 24832119; GitHub: `drilinghan-stack`.
- Cohort and Team ID: awaiting the students' confirmation.

These identify the intended team. They are not evidence that either member has
completed or reviewed a particular feature. Both members must record their actual
work, review decisions and individual explanation of the implementation.

## Proposed milestones

| Target date | Scope | Verification before submission |
| --- | --- | --- |
| 6 October 2026 | Reuse A2 foundation; registration schema, seed data and constraints | Import into an isolated database; duplicate and deletion constraints |
| 7 October 2026 | Registration, event and category APIs; public registration flow and forecast | API integration tests, duplicate/deletion races and public browser workflows |
| 10 October 2026 | Staff event and category pages; full staff browser verification | Create/edit/delete, deletion-dialog cancellation, responsive layouts and error states |
| 11 October 2026 | Deployment checks, documentation and delivery packaging | Both students' cPanel sites, archive smoke checks and live demonstration |

These are target dates, not claims of completed work. Commits use their actual
timestamps. Later milestones may be prepared locally before they are reviewed
and committed. This plan does not schedule automatic future pushes.

## Suggested division for the students to agree and carry out

Lu Yu can focus on database constraints, API behaviour and backend verification.
Zhuolin Han can focus on the registration/admin workflows and browser verification.
Both should review each other's changes, deploy to their own cPanel accounts and
explain their own contributions. This is a proposal, not a completed contribution log.

## Scope decisions

- Plain HTML, CSS and JavaScript continue the existing A2 design.
- Email, trimmed and lowercased, identifies an attendee within an event.
- A registration may contain 1–10 tickets. The same email may register for another event.
- Database foreign keys block deletion of events with registrations.
- Public registration lists show names, quantities and dates, not contact details.
- A separate staff view includes registration contact details.
- Category management is included to cover the broad requirement on page 2.
- Payments, user accounts and authentication are outside the assessment's required scope.
- All seed people and contact details are fictional. The application is a teaching demo.

## Submission conditions and evidence still required

The assessment permits limited GenAI uses and prohibits copying generated code or
report text into the assessed submission. AI-assisted implementation or material
must not be represented as independent student work or as automatically compliant
with that restriction. Students should resolve permitted use with their assessor
before submitting it. Tool use and actual individual contributions must be described
accurately; no member's identity or commit timestamps will be fabricated.

Still required from the students: cohort confirmation, both cPanel destinations,
individual deployment validation, tutor access to the repository, an individual
explanation of contributions, SCU OneDrive video sharing, and confidential peer
evaluation forms completed by each member. No peer scores or claimed student work
will be invented. The repository invitation has been accepted by `drilinghan-stack`.

## Current checkpoint - 6 October 2026

- First milestone pushed: `6a0a39d` under `364962` (schema, seed data and integrity checks), followed by `99e73dc` under `drilinghan-stack` (visitor/staff workflow and acceptance plan).
- Local later-stage implementation: registration API/page, staff CRUD, categories
  and optional forecast; 71 backend tests and 46 browser checks passed.
- Owner `364962` and collaborator `drilinghan-stack` have authorised CLI access.
  Active CLI and repository-local Git identity: `drilinghan-stack` / Zhuolin Han.
  This records the delegated test account in use, not independent human authorship.
- User reports teacher authorisation for the test scenario. The exact assessed
  declaration should reflect the applicable authorisation and actual assistance.
- Planned later commits have not been backdated or pushed early. Later-stage
  files remain local until their respective real milestone submissions.

Before each future commit, verify the active GitHub login and the commit's Git
identity, review only the intended module diff and run the relevant tests.
For owner API work use `gh auth switch --user 364962`; for the collaborator UI
stage use `gh auth switch --user drilinghan-stack`. Authentication and commit
identity are separate settings and both must match the intended operation.

## Second milestone - 7 October 2026

The user requested the next submissions on 7 October, so this milestone moved
from its earlier 8 October target to the actual submission date. It includes
the public registration flow as well as the APIs. Staff pages and final delivery
materials remain for subsequent milestones; there is no automatic push schedule.

- `364962`: commit `e1b27e3`, registration and staff CRUD APIs, write validation,
  ordered registration data, weather service, API examples and backend tests.
  All 71 backend tests passed on an export of the staged source.
- `drilinghan-stack`: the accompanying public-interface commit adds registration,
  confirmation, newest-first attendee lists, shared form styles and public browser
  checks. All 38 public browser checks passed in Chromium and WebKit on the
  exported submission, without the local staff pages.
- These account operations continue the authorised delegated test workflow.
  Commit identities and actual times identify the account used for each operation.
- cPanel access, cohort/Team ID, marker access and personal submission evidence
  remain pending as described above.
