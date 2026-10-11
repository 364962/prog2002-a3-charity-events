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

## Milestones and remaining submission work

| Target date | Scope | Verification before submission |
| --- | --- | --- |
| 6 October 2026 | Reuse A2 foundation; registration schema, seed data and constraints | Import into an isolated database; duplicate and deletion constraints |
| 7 October 2026 | Registration, event and category APIs; public registration flow and forecast | API integration tests, duplicate/deletion races and public browser workflows |
| 7 October 2026 (second round) | Staff event/category pages; complete browser verification; deployment startup preparation | Staff CRUD, deletion-dialog cancellation, responsive layouts and root-startup checks |
| 7 October 2026 (third round) | Technical report, local evidence, demonstration text and delivery packaging | PDF page review, archive contents, clean dependency install and extracted application smoke checks |
| 11 October 2026 | Both students' independent SCU deployments | 14 HTTPS checks and 9 browser checks per site; private configuration and source checksum verification |
| Before assessed submission | Remaining individual and external evidence | Cohort/Team ID, marker access, final explanations, OneDrive link, peer evaluation and Blackboard upload |

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

## First checkpoint - 6 October 2026 (historical)

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
- `drilinghan-stack`: commit `c4368f8` adds registration,
  confirmation, newest-first attendee lists, shared form styles and public browser
  checks. All 38 public browser checks passed in Chromium and WebKit on the
  exported submission, without the local staff pages.
- These account operations continue the authorised delegated test workflow.
  Commit identities and actual times identify the account used for each operation.
- cPanel access, cohort/Team ID, marker access and personal submission evidence
  remain pending as described above.

## Third milestone - 7 October 2026, second submission round

The user requested another round later on 7 October. The staff milestone therefore
uses its real submission date instead of the earlier 10 October target. Final
reporting/packaging remains a separate stage, and both SCU deployments still await
account availability. This round does not assert a successful hosted deployment.

- `drilinghan-stack`: commit `a086d5e`, staff event list, new/edit forms, registration/contact view,
  category CRUD, protected deletion feedback and repeatable cancel/Escape handling.
  All 46 checks passed in Chromium and WebKit on an isolated staged-source export,
  covering the public flows, staff pages and mobile layouts.
- `364962`: commit `f523a36`, application-root `app.js`, cPanel preparation instructions, the current
  runtime README and isolated startup verification. All 8 startup checks passed
  on an exported source snapshot with fresh production dependencies. The application directory must
  contain sibling `api`, `clientside` and `adminside` folders.
- Both submissions use the authorised account operation arrangement and actual
  timestamps. The remote commit history records the exact account and changes.

## Fourth milestone - 7 October 2026, third submission round

The user requested the next round on 7 October. Local documentation and packaging
therefore moved from the earlier 11 October target to this date. Live deployment
is a separate outstanding task because neither SCU account is available yet.

- `364962`: commit `cb59dd0`, technical documentation, the report builder and its
  dependency, six captured interface views and dated verification evidence.
  The updated seven-page PDF was rendered and visually checked page by page.
- `drilinghan-stack`: submission checklist, tracked-source packaging with checksums,
  English demo transcript/captions/metadata and final source handover instructions.
  The exact hash and timestamp of this submission are recorded in Git history.
- Local release verification: 7 archive-content/checksum checks and 8 extracted
  application startup checks passed with fresh production dependencies. The two
  student sets contain identical source; each separate SQL matches the API copy.
  The 379.148-second MP4 has 84 ordered subtitle cues and eight transcript chapters.
  The dated records and tested runtime checksums are under `project/evidence`.
- The source and local delivery materials are prepared. Git account attribution
  describes the authorised delegated operations; individual assessed explanations
  and peer evaluations still need to reflect each student's actual work.
- Both cPanel deployments, cohort/Team ID, marker repository access, final OneDrive
  sharing and personal submission evidence remain pending. No automatic push is scheduled.

## SCU hosting milestone - 11 October 2026

Lu Yu's supplied SCU account now hosts the public and staff websites at
https://24832520.it.scu.edu.au/ and https://24832520.it.scu.edu.au/admin/.
The available runtime is Node.js 18.20.8, so the compatibility declaration was
updated and all 71 backend tests passed on that exact version. The server uses
a dedicated application directory and database, preserving existing course data.
Fourteen live HTTPS checks passed; an external browser also verified search,
registration confirmation, refresh persistence, staff details and categories.
Temporary check records were removed and all 40 deployed source files matched
the local SHA-256 manifest. Evidence is in `project/evidence/scu-ylu35`.

This milestone concerns Lu Yu's account only. Han's hosting and the remaining
personal/Blackboard/OneDrive submission steps are still pending. Earlier pending
status statements above describe their dated checkpoints, not the current state.

## SCU hosting milestone - Zhuolin Han - 11 October 2026

Zhuolin Han's supplied SCU account now hosts https://24832119.it.scu.edu.au/
and https://24832119.it.scu.edu.au/admin/. The separate production application
uses Node.js 18.20.8, MySQL 5.7.44 and a new dedicated database. Existing course
files and both earlier databases were preserved.

Fourteen HTTPS checks passed at 08:40 UTC; nine external-browser checks verified
search, registration, refresh persistence and staff workflows. Browser registration
15 and API fixtures were removed, restoring the original seed counts. All 40
deployed source hashes match. Evidence is in `project/evidence/scu-zhan15`.
This hosting record uses the authorised `drilinghan-stack` account with actual
commit time. Both SCU deployments are complete; the remaining individual and
external submission steps are listed in `SUBMISSION_CHECKLIST.md`.

## Individual media and transcripts - 11 October 2026

Separate presentation materials now exist for both student IDs, with English,
Mandarin and bilingual-caption variants. Each recording has eight chapters and
48 timed captions; all six are below seven minutes. The source narration, plain
text scripts, SRTs, timing record and media checks are in `project/demo/final`.
Two bilingual Word documents and six MP4 files are local delivery artifacts.

The explanations map presentation topics to the existing Git record, with generic
system narration and explicitly dated local and hosted footage. They do not verify
personal authorship. Each student still needs to review their actual contribution
and the permitted narration format before assessed submission. All six MP4s passed
full decoding, audio-presence, caption-order and duration checks. Both seven-page
Word documents were rendered and visually checked. Packaging now supports including
both individual sets alongside the source and project documentation.

These materials have not been uploaded to SCU OneDrive or submitted to Blackboard.
The remaining administrative, access and personal steps in the checklist still apply.
