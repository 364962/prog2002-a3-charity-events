# A3 submission checklist

The brief says “2 zip files” but names three archives. Supply all three named
components: clientside, adminside and API. Source packages are generated for
each known student ID. If Blackboard's `username` means a different SCU login,
rename the archive prefix to that login before upload.

## Prepared locally

- Public discovery, event detail and dedicated registration pages.
- Staff events list, create/edit/delete and category management.
- MySQL schema, keys, triggers and 12 fictional registrations in one SQL file.
- Node/Express API and optional weather integration.
- Automated backend and browser verification, technical documentation,
  deployment preparation, demo script and source archive packaging.
- English local walkthrough: 6 minutes 19 seconds with 84 subtitle cues.
  Transcript, captions and metadata are in `project/demo`; the MP4 is a local
  artifact copied to the shared delivery folder when explicitly included.

## Generate and check the local delivery

From a Git checkout, install the report dependency and build the report first:

```sh
python3 -m pip install -r project/requirements.txt
python3 project/build_documentation.py
python3 project/package_delivery.py --include-video
```

Omit `--include-video` on a fresh clone without the local recording. The script
then packages sources, report, transcript and captions only. It never substitutes
an empty or unrelated video. Source files must be tracked or explicitly staged;
untracked assessment files and notes are excluded. Review new files before staging.

Outputs are in `deliverables/A3`, with one directory per student ID and a shared
demonstration directory. `deliverables/A3-Local-Delivery.zip` collects the generated
files and their manifest. `MANIFEST.json` records UTC generation time, Git HEAD,
pending source changes, and SHA-256 values for source and delivery files. For a
final release, commit first and rebuild so `source_changes` is empty. Extract each
student's three source ZIPs into one folder, install production dependencies,
import into a new database, then verify startup, registration and protected deletion.
Rebuilding overwrites generated files; keep completed personal links separately.

## Completed SCU deployments

Both accounts were independently deployed and verified on 11 October 2026.
Each passed 14 HTTPS checks and 9 browser checks; all 40 source checksums matched.

- Lu Yu: https://24832520.it.scu.edu.au/ and https://24832520.it.scu.edu.au/admin/
- Zhuolin Han: https://24832119.it.scu.edu.au/ and https://24832119.it.scu.edu.au/admin/

## Still required before an assessed submission is complete

- Confirm both students are in the same cohort; supply Team ID for required
  administration and peer evaluation subjects. These are not runtime code inputs.
- Grant marker access to https://github.com/364962/prog2002-a3-charity-events;
  source milestones and their actual dates are recorded in `DELIVERY_PLAN.md`.
- Review and personalise individual contribution explanations. The maximum
  video length is 15 minutes. The demonstration should cover database/API design,
  DOM/API interaction, search validation, registration, staff CRUD and code.
- Upload the final demonstration to SCU OneDrive, create an appropriate share
  link and test that the marker can open it. Local media is not a OneDrive link.
- Download the official peer evaluation form from the Assessment 3 Blackboard
  folder. Each student completes it individually and confidentially and sends
  it directly to their tutor before the deadline. Do not share peer scores here.
  Required email subject: PROG2002_A3_[Team_ID]_[Member_name].
- Check any required GenAI statement against the brief and the reported teacher
  authorisation. Use an accurate account of permitted assistance and contributions;
  do not replace it with an invented “no tools used” declaration.
- Submit the three source ZIPs, GitHub link, video/link, single SQL and project
  documentation according to the Blackboard submission fields. Check the
  official deadline and time zone there (brief: 12 October 2026, 23:59).

The source packages omit credentials, node_modules, A2 report PDFs, browser
profiles, source assessment files and unrelated local media. Install from the
lockfile after extracting. The separate SQL is identical to the one in the API
archive. Both SCU deployments are complete; the personal and external submission
steps above remain pending. See `project/deployments.json` for the current URL record.
