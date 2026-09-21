from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, Preformatted, KeepTogether, Flowable
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.pagesizes import A4
import json, html
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'output/pdf/24832520A2-Report.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial','/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic','/System/Library/Fonts/Supplemental/Arial Italic.ttf'))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic')
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
green=colors.HexColor('#22543d');ink=colors.HexColor('#233b30');muted=colors.HexColor('#657164');light=colors.HexColor('#edf1e6')
styles={
 'body':ParagraphStyle('body',fontName='Arial',fontSize=12,leading=18,textColor=ink,spaceAfter=12),
 'h1':ParagraphStyle('h1',fontName='Arial-Bold',fontSize=24,leading=30,textColor=green,spaceAfter=20),
 'h2':ParagraphStyle('h2',fontName='Arial-Bold',fontSize=15,leading=20,textColor=green,spaceBefore=13,spaceAfter=10),
 'small':ParagraphStyle('small',fontName='Arial',fontSize=10,leading=15,textColor=muted,spaceAfter=10),
 'label':ParagraphStyle('label',fontName='Arial-Bold',fontSize=10,leading=14,textColor=green,spaceAfter=10),
 'cell':ParagraphStyle('cell',fontName='Arial',fontSize=12,leading=18,textColor=ink,spaceAfter=0),
 'code':ParagraphStyle('code',fontName='Courier',fontSize=9,leading=13,textColor=ink,backColor=light,borderPadding=12,spaceAfter=15)
}
S=[];md=['# Good Together - Technical Project Report','','Student: 鲁彧 (Lu Yu) · 24832520','']
def para(text,style='body'):
 S.append(Paragraph(text,styles[style]));md.extend([text.replace('<b>','').replace('</b>',''), ''])
def title(n,t):
 para(f'PROG2002 / ASSESSMENT 2 / {n:02}','label');para(t,'h1');md.extend(['## '+t,''])
def heading(t):para(t,'h2')
def page():S.append(PageBreak())
def screenshot(file,width,height=None):
 from PIL import Image as PI
 w,h=PI.open(file).size
 S.append(Image(str(file),width=width,height=height or width*h/w));S.append(Spacer(1,8))
def table(rows,widths):
 cells=[[Paragraph(str(c),styles['cell']) for c in row] for row in rows]
 t=Table(cells,colWidths=widths,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),light),('VALIGN',(0,0),(-1,-1),'TOP'),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#cbd5c4')),('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#dbe2d5')),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]));S.append(t);S.append(Spacer(1,12))
class Diagram(Flowable):
 def __init__(self,kind):Flowable.__init__(self);self.width=483;self.height=135;self.kind=kind
 def draw(self):
  c=self.canv; c.translate(0,-20)
  if self.kind=='flow':
   boxes=[(0,'BROWSER',['HTML + CSS','JavaScript / DOM']),(172,'EXPRESS API',['Validation','Prepared queries']),(344,'MYSQL',['charityevents_db','Relational data'])];w=139
  else:
   boxes=[(0,'ORGANISATIONS',['PK id','name / contacts']),(172,'EVENTS',['PK id / FK links','dates / price / goal']),(344,'CATEGORIES',['PK id','unique name'])];w=139
  for x,label,lines in boxes:
   c.setFillColor(light);c.setStrokeColor(colors.HexColor('#b7c8ac'));c.roundRect(x,55,w,90,5,fill=1,stroke=1)
   c.setFillColor(green);c.setFont('Arial-Bold',10);c.drawString(x+12,124,label);c.setFont('Arial',10)
   for i,line in enumerate(lines):c.drawString(x+12,101-i*17,line)
  c.setStrokeColor(green)
  for x in [139,311]:
   c.line(x+4,96,x+28,96);c.line(x+23,100,x+28,96);c.line(x+23,92,x+28,96)
  c.setFillColor(muted);c.setFont('Arial',10)
  if self.kind=='flow':c.drawString(14,26,'Request: GET + query parameters     |     Response: JSON -> DOM update')
  else:c.drawString(16,26,'One organisation hosts many events. One category classifies many events.')

title(1,'Good Together')
para('A charity event discovery website for the Gold Coast','h2')
table([['Student ID','Last name','First name'],['24832520','<font name="STSong-Light">鲁</font> (Lu)','<font name="STSong-Light">彧</font> (Yu)']],[161,161,161])
heading('Introduction/Motivation')
para('Community fundraising depends on people being able to find an activity they can attend and understand the cause it supports. Good Together brings charity event information into one place, with a focus on local participation rather than a complicated purchasing process. A visitor can discover a free shared meal, a fun run or a creative workshop and see how the event contributes to a fundraising goal.')
para('The project uses a fictional Gold Coast organisation and a partner collective. The sample names, contact details, events and fundraising totals are demonstration data. Photographs are illustrative and do not document these events.')
heading('Problem Statement')
para('Event details are often scattered across notices and social posts. Visitors need a consistent way to compare dates, locations, categories and ticket prices. They also need to know whether an event is still running, has ended or is unavailable.')
para('The application must retrieve current data from a server, combine optional search criteria and open the correct event from a result. It must also handle invalid input, missing records and connection failures without leaving the visitor with an unexplained blank page.')
para('Scope: Assessment 2 provides event discovery and a registration placeholder. Booking records, payments and administration are reserved for Assessment 3.','small')
page();title(2,'Solution')
para('The implementation separates presentation, request handling and storage. Express serves the client files and the API from the same origin. The browser never connects directly to MySQL and does not receive database credentials.')
S.append(Diagram('flow'))
heading('From a search to an event card')
para('1. The search form collects an event start date, a suburb and a category. JavaScript prevents a page submission and builds a query string with URLSearchParams.')
para('2. The shared getJSON function calls fetch and awaits the JSON response. Express validates the query, builds the selected conditions and passes their values separately to mysql2.execute.')
para('3. MySQL joins the event, category and organisation tables. The API returns matching records in chronological order, with a count and the event time zone.')
para('4. The client clones an HTML card template, assigns record values with textContent and inserts a document fragment into the results area. No page reload is needed.')
heading('State and failure handling')
para('A new search cancels the previous request with AbortController. This prevents a slow response from replacing newer results. A request timeout, loading message, empty state and retry action make the result of each interaction visible. The search URL preserves the criteria, and browser Back restores the previous form values and results.')
para('Register displays “This feature is currently under construction.” Ticket quantities change only the displayed total; no booking or payment is made.')
page();title(3,'Web UX')
para('The visitor journey is Home -> Find an event -> Event details. The same navigation appears on every page, including error pages. The home page explains the mission before presenting the event list. Category shortcuts lead to a pre-filtered search.')
screenshot(ROOT/'report/figures/chromium-home-top.png',483)
para('Figure 1. Home page at 1440 px. The organisation introduction and primary event action establish the purpose of the site.','small')
para('The interface uses a warm neutral background, dark green text and restrained lime accents. Dates, category labels, free entry and suburb names make cards easy to scan. A native date input matches the date filter; a text field supports partial suburb names; and a dropdown shows categories supplied by the API.')
para('At narrow widths, the layout stacks into readable sections without horizontal scrolling. Controls have explicit labels, keyboard focus is visible, and the main content has a skip link. Search status uses an aria-live region, errors use an alert role, and the native dialog supports Escape and restores focus to Register.')
page();title(4,'Data Schema')
S.append(Diagram('schema'))
table([['Entity','Key data and responsibility'],['organisations','Name, mission and contact details. One organisation may host several events.'],['categories','A unique name and description for each type of event. One category may classify several events.'],['events','Foreign keys; event information, times and location; ticket price, fundraising figures, image, accessibility and publication status.']],[116,367])
para('Primary keys identify records. Foreign keys prevent orphaned events, and ON DELETE RESTRICT protects referenced records. Shared details are stored once to reduce duplication.')
para('Amounts use DECIMAL. A zero price means free entry, the fundraising goal must be positive, and the raised amount can exceed the goal. Both insert and update triggers reject invalid date order and negative amounts. Triggers are used because MySQL 5.7 does not enforce CHECK constraints.')
para('Publication status is active or suspended. Current, upcoming and past are derived from start and end times, using UTC plus ten hours. The public listing excludes suspended and ended events; a past event detail remains readable but registration is hidden. An end time equal to the current time counts as past.')
para('The import provides 12 events, 6 categories and 2 organisations. Dates are relative to import day, then remain fixed. Indexes support visibility, date and category filters. All times use Brisbane wall time.')
page();title(5,'API design')
table([['Method and resource','Purpose'],['GET /api/events','All current or upcoming active events. Optional date, location and category query parameters are combined with AND.'],['GET /api/categories','Category IDs, names and descriptions used to populate the filter dropdown.'],['GET /api/events/:id','One active event with complete details, including an ended event. A suspended or absent record returns 404.'],['GET /api/health','Confirms that the server can query its database.']],[176,307])
heading('A filtered request')
para('Example: GET /api/events?date=2026-09-26&amp;location=Southport&amp;category=1. The date matches the event start date in Gold Coast time. The location is a case-insensitive literal substring. The category is a positive integer ID. GET has no request body; the values are carried in the URL.')
para('The response is JSON with a data array and metadata. An empty match returns HTTP 200 with data: [] and count: 0. The following is an abbreviated response; each returned event also contains the detailed fields used by the client.','body')
S.append(Preformatted('''{
  "data": [{
    "id": 1, "name": "Steps for a brighter coast",
    "category": "Fun run", "location": "Southport",
    "starts_at": "2026-09-26 07:30:00",
    "ticket_price": 25, "event_status": "upcoming"
  }],
  "meta": { "count": 1, "timeZone": "Australia/Brisbane",
    "filters": { "date": "2026-09-26",
      "location": "Southport", "category": 1 } }
}''',styles['code']))
page();title(6,'API behaviour')
para('GET is used for every application resource because Assessment 2 only reads information. POST, PUT and DELETE are intentionally unavailable and return 405 with an Allow header. A registration button does not imply that a booking endpoint exists.')
para('Dates are checked for both format and calendar validity. IDs must be positive whole numbers within the database integer range. Duplicate and unknown filters are rejected. Location length is limited, SQL wildcard characters are escaped, and values are bound as prepared-statement parameters.')
para('Invalid input returns 400; an absent or suspended event returns 404; and an unexpected database failure returns a generic 503. API responses are not cached so time-derived status stays current. The server applies a same-origin content security policy, and the browser renders database text as text rather than HTML.')
screenshot(ROOT/'report/figures/chromium-registration.png',420)
para('Figure 2. The native registration dialog shows the required placeholder. No booking or payment request is made.','small')
page();title(7,'Verification')
heading('Recorded checks')
results=json.loads((ROOT/'report/verification/browser-results.json').read_text())
para(f'Final verification on 21 September 2026 used Node.js 20.20.0 and MySQL 5.7.28. All 32 backend tests passed. The browser suite passed {len(results)} checks across Chromium and WebKit. These results describe the supplied sample dataset and tested environments; they do not establish compatibility with every browser.')
table([['Area','Evidence'],['Data and API','12 records; valid joins; combined filters; empty results; free tickets; suspended and missing records; 400/404/405/503 responses.'],['Integrity and safety','Foreign-key rejection; insert/update validation; literal SQL-injection strings; escaped wildcard searches; exact date boundaries.'],['Browser journey','Home to search to details; clear filters; browser Back; empty-state recovery; error retry; ticket totals; modal and keyboard focus.'],['Responsive layout','Home, Search and Details at 390, 768 and 1440 px, with no horizontal overflow or broken loaded images.']],[125,358])
para('Backend tests create and remove a uniquely named disposable MySQL database. They do not overwrite the demonstration database. A WebKit focus-restoration issue was found during testing and corrected with an explicit dialog close handler.','small')
page();title(8,'Running and reviewing the project')
heading('Local installation')
para('Extract the two source archives into the same directory so api and clientside are siblings. Import api/database/charityevents_db.sql into a fresh MySQL installation, copy api/.env.example to api/.env and enter the local credentials. The SQL file does not drop existing tables.')
S.append(Preformatted('''cd api
npm ci
npm run db:check
npm start
# Open http://127.0.0.1:3088
npm test''',styles['code']))
para('The Node.js connection file is api/event_db.js. The main routes are in api/app.js, the browser rendering helpers are in clientside/js/common.js, and page-specific behaviour is in home.js, search.js and event.js. The client files and images are served locally, so the interface does not depend on a CDN.')
heading('Repository and remaining submission actions')
para('Private repository: <link href="https://github.com/364962/prog2002-a2-charity-events" color="#22543d">github.com/364962/prog2002-a2-charity-events</link>. The milestones are database setup (17 September), APIs and validation (18 September), client pages (19 September), and final verification and documentation (21 September). This report, the browser checks and the completed README form the fourth milestone. Commit dates record the actual submission of each stage.')
para('The student still needs to grant the marker repository access, record or replace the narration to demonstrate personal understanding, upload the final video to SCU OneDrive, and submit the required files and links through Blackboard. Source archive names currently use student ID 24832520; replace that prefix if the required university username differs.')
heading('Preparation disclosure')
para('Generative AI tools assisted with code implementation, testing and report preparation.')
page();title(9,'Interface evidence and references')
# Search screenshot scaled to readable width, trimmed only by selecting a fresh viewport capture.
screenshot(ROOT/'report/figures/chromium-search.png',380)
para('Figure 3. The combined search returns the matching event and displays the selected filters. This is a capture of the running application connected to MySQL.','small')
heading('Implementation references')
for text in [
 'Express: error handling. <link href="https://expressjs.com/en/guide/error-handling/" color="#22543d">expressjs.com/en/guide/error-handling</link>.',
 'MySQL2: promise API, connection pools and prepared statements. <link href="https://sidorares.github.io/node-mysql2/docs" color="#22543d">sidorares.github.io/node-mysql2/docs</link>.',
 'Illustrative image sources and license links are listed in clientside/assets/CREDITS.md. The supplied Assessment Brief and Report template informed the required scope and report headings.'
]:para(text,'small')

def decoration(canvas,doc):
 canvas.saveState();w,h=A4
 canvas.setStrokeColor(colors.HexColor('#d5dfcc'));canvas.line(56,h-40,w-56,h-40)
 canvas.setFont('Arial',9);canvas.setFillColor(muted);canvas.drawString(56,h-30,'GOOD TOGETHER  /  TECHNICAL PROJECT REPORT')
 canvas.drawString(56,30,'PROG2002 A2  |  24832520');canvas.drawRightString(w-56,30,str(doc.page));canvas.restoreState()
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=56,leftMargin=56,topMargin=62,bottomMargin=55,title='Good Together - PROG2002 A2 Technical Report',author='Lu Yu',allowSplitting=1)
doc.build(S,onFirstPage=decoration,onLaterPages=decoration)
(ROOT/'output/pdf/report-text.md').write_text('\n'.join(md))
(ROOT/'report/24832520A2-Report.pdf').write_bytes(OUT.read_bytes())
print(OUT)
