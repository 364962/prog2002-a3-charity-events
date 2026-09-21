# Project report

`24832520A2-Report.pdf` is the nine-page technical report. The required template
headings are covered, with database/API explanations, actual screenshots and test
evidence. Body text uses 12-point Arial and 18-point leading (1.5 spacing).

`build_report.py` is the editable report source. It uses ReportLab and the Arial
fonts in macOS `/System/Library/Fonts/Supplemental/`. The screenshots and test
results needed by the builder are included in this directory. Run it from the
project root with a Python environment containing reportlab, Pillow and pypdf.
Run `python3 report/build_report.py`. It writes the PDF under `output/pdf/` and
updates the identical copy in `report/`.

The report accompanies the fourth milestone on 21 September 2026. Its figures
and verification logs were refreshed from that day's successful checks. Its short
preparation note identifies the uses of generative AI without estimating a
percentage of the work.
