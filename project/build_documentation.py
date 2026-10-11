"""Render the project documentation and captured UI evidence as a readable PDF."""
from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,Image,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'project/PROJECT_DOCUMENTATION.md').read_text(encoding='utf-8')
prepared=re.search(r'^Prepared (\d{1,2} \w+ \d{4})\.',source,re.MULTILINE).group(1)
OUT=ROOT/'output/pdf/Good-Together-A3-Documentation.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
ink=colors.HexColor('#203b30');green=colors.HexColor('#22543d');muted=colors.HexColor('#606c63');soft=colors.HexColor('#f0f2e9')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyGT',fontName='Helvetica',fontSize=10,leading=15,textColor=ink,spaceAfter=10,allowWidows=0,allowOrphans=0))
styles.add(ParagraphStyle(name='H1GT',fontName='Times-Roman',fontSize=25,leading=29,textColor=green,spaceBefore=18,spaceAfter=14,keepWithNext=True))
styles.add(ParagraphStyle(name='SmallGT',fontName='Helvetica',fontSize=8,leading=11,textColor=muted,spaceAfter=7))
styles.add(ParagraphStyle(name='CellGT',fontName='Helvetica',fontSize=8,leading=11,textColor=ink))
styles.add(ParagraphStyle(name='TitleGT',fontName='Times-Roman',fontSize=39,leading=44,textColor=green,spaceAfter=25))
def clean(t):
    t=t.replace('–','-').replace('—','-').replace('“','"').replace('”','"').replace('’',"'").replace('->',' > ')
    t=escape(t);t=re.sub(r'`([^`]+)`',r'<font face="Courier">\1</font>',t);t=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',t)
    return t
story=[Spacer(1,40),Paragraph('GOOD TOGETHER / PROG2002',styles['SmallGT']),Paragraph('Charity events.<br/>Connected communities.',styles['TitleGT']),Paragraph('Assessment 3 - project documentation',styles['H1GT']),Paragraph('Lu Yu | 24832520<br/>Zhuolin Han | 24832119',styles['BodyGT']),Spacer(1,15),Paragraph('Prepared '+prepared,styles['BodyGT']),Paragraph('Both SCU sites deployed and verified on 11 October. Final individual and external submission steps remain pending.',styles['BodyGT']),Spacer(1,18)]
if (ROOT/'project/figures/home.png').exists():story.append(Image(str(ROOT/'project/figures/home.png'),width=479,height=359))
story.append(PageBreak())
lines=source.splitlines();i=0;buffer=[]
def flush():
    if buffer:story.append(KeepTogether([Paragraph(clean(' '.join(buffer)),styles['BodyGT'])]));buffer.clear()
while i<len(lines):
    line=lines[i]
    if line.startswith('# '):i+=1;continue
    if line.startswith('## '):
        flush()
        if line.startswith(('## 4.', '## 6.', '## 7.')): story.append(PageBreak())
        story.append(Paragraph(clean(line[3:]),styles['H1GT']))
    elif line.startswith('|'):
        flush();rows=[]
        while i<len(lines) and lines[i].startswith('|'):
            cells=[x.strip() for x in lines[i].strip('|').split('|')]
            if not all(re.fullmatch(r'[-: ]+',x) for x in cells):rows.append([Paragraph(clean(x),styles['CellGT']) for x in cells])
            i+=1
        widths=[87,128,264] if 'Table' in line else [76,177,226]
        table=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT');table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),soft),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),('LINEBELOW',(0,0),(-1,-1),0.3,colors.HexColor('#dce1d6'))]));story.extend([table,Spacer(1,15)]);continue
    elif not line:flush()
    else:buffer.append(line)
    i+=1
flush()
story.extend([PageBreak(),Paragraph('Interface evidence',styles['H1GT']),Paragraph('Captured from the running local application on 6 October 2026. These views do not claim a deployed SCU destination.',styles['BodyGT'])])
for index,(name,title) in enumerate([('registration','Dedicated event registration'),('admin','Staff event management')]):
    if index:story.append(PageBreak())
    story.append(Paragraph(title,styles['H1GT']));story.append(Image(str(ROOT/f'project/figures/{name}.png'),width=479,height=359));story.append(Spacer(1,18))
    caption='The selected event, ticket quantity and total are loaded from API data. Confirmation persists the registration and links to the event list.' if name=='registration' else 'The complete event list includes active, past and suspended records. The editor and delete action call the staff API; registered events remain protected.'
    story.append(Paragraph(caption,styles['BodyGT']))
def footer(c,doc):
    c.setStrokeColor(colors.HexColor('#dce1d6'));c.line(58,47,537,47);c.setFont('Helvetica',8);c.setFillColor(muted);c.drawString(58,32,'GOOD TOGETHER / A3 / '+prepared.upper());c.drawRightString(537,32,str(doc.page))
SimpleDocTemplate(str(OUT),pagesize=(595,842),rightMargin=58,leftMargin=58,topMargin=48,bottomMargin=65,title='Good Together - A3 project documentation',author='Good Together project').build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
