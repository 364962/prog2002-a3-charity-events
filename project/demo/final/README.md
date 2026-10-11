# Individual A3 presentations

Separate presentation materials were prepared for Lu Yu (24832520) and Zhuolin
Han (24832119) on 11 October 2026. The presentation topics follow the changes
recorded under each project account. Account attribution is not an independent
attestation of personal authorship; each student should review the explanation
against their own contribution and understanding before assessed submission.

Lu Yu's explanation emphasises the schema, API, transactions, verification and
hosting. Zhuolin Han's explanation emphasises registration, staff workflows,
DOM updates, browser behaviour and independent hosting. Both cover architecture,
API-to-DOM flow and working features, with source excerpts and deployment evidence.

Each student's local output directory contains:

- English narration with English captions.
- Mandarin narration with Chinese captions.
- The English narration with bilingual English and Chinese captions.
- Separate SRT files, one exact English transcript and one exact Chinese transcript.
- A bilingual Word document containing the explanation, Git mapping and scripts.
- A separate bilingual personal explanation in plain text.

The repository retains the narration source, exact text, captions, timing record,
media metadata and verification summary. MP4 and DOCX binaries are local artifacts
under `output/video/a3-final/<student-id>/`. Chapter timestamps in the reading
scripts are rounded to seconds; the SRT files carry millisecond timings.

All six videos use 1920 × 1080 H.264 video and AAC audio. Each has eight chapters
and 48 caption cues and is shorter than 15 minutes. Exact lengths are recorded
in `VIDEO-INFO.json`. The generic macOS system voices are Daniel and Karen for
English and Tingting for Mandarin; these are not recordings of either student.
The older local workflows were recorded on 6 October. Hosted screenshots and
verification evidence are from 11 October. Scene labels distinguish these sources.
No credentials or private hosting configuration are included in the media.

To package the already prepared recordings:

```sh
python3 project/demo/final/package_media.py
python3 project/package_delivery.py --include-final-media
```

The first command creates each member's ZIP, a combined media ZIP and a smaller
transcript-only ZIP. It requires every expected file and checks archive integrity.
The second command incorporates the individual materials into the complete local
A3 source and documentation bundle. Neither command regenerates missing recordings.
Use `--include-video` separately if the earlier shared walkthrough is also wanted.

The media files remain local. SCU OneDrive upload and marker access verification
are not complete. Confirm the permitted narration format, review each personal
statement, and keep the required assistance declaration accurate before uploading
an assessed version. Cohort/Team ID administration, private peer evaluation and
Blackboard submission remain separate tasks in `project/SUBMISSION_CHECKLIST.md`.
