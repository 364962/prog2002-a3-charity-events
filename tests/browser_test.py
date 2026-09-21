"""Browser acceptance checks. Run against a running local server; no data is changed."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:3088')
OUT = Path(os.environ.get('QA_OUTPUT', 'tmp/qa'))
OUT.mkdir(parents=True, exist_ok=True)
results = []

def run(browser_type):
    browser = browser_type.launch(headless=True)
    context = browser.new_context(viewport={'width':1440,'height':1000})
    page = context.new_page()
    js_errors=[]
    page.on('pageerror', lambda error: js_errors.append(str(error)))
    def visit(path):
        page.goto(BASE+path,wait_until='networkidle')
    def passed(name):
        results.append({'browser':browser_type.name,'check':name,'result':'passed'})
    response = context.request.get(BASE+'/api/events')
    assert response.ok, 'The events API must be available for browser checks'
    events = response.json()['data']
    expected_count = len(events)
    expected_current = sum(event['event_status']=='current' for event in events)
    assert expected_count > 0, 'The sample dataset must contain upcoming events'
    visit('/')
    expect(page.locator('.event-card')).to_have_count(expected_count)
    assert page.locator('.event-card').filter(has_text='Winter warmth walk').count()==0
    assert page.locator('.event-card').filter(has_text='Community gala review').count()==0
    expect(page.locator('.status-pill.current')).to_have_count(expected_current)
    expect(page.locator('.category-chip')).to_have_count(7)
    expect(page.locator('.card-title')).to_have_text([event['name'] for event in events])
    passed('Home matches API events and current status, with category shortcuts; past/suspended excluded')
    page.screenshot(path=str(OUT/f'{browser_type.name}-home-top.png'))
    page.get_by_role('link',name='Fun run',exact=True).click()
    page.wait_for_load_state('networkidle')
    expect(page.locator('.event-card')).to_have_count(2)
    expect(page.locator('#category')).to_have_value('1')
    passed('Home category link restores the filter on Search')
    event=page.request.get(BASE+'/api/events/1').json()['data']
    page.locator('#date').fill(event['starts_at'][:10])
    page.locator('#location').fill('Southport')
    page.locator('#category').select_option('1')
    page.get_by_role('button',name='Find events').click()
    expect(page.locator('.event-card')).to_have_count(1)
    expect(page.locator('.card-title')).to_have_text('Steps for a brighter coast')
    assert 'date=' in page.url and 'location=Southport' in page.url and 'category=1' in page.url
    page.screenshot(path=str(OUT/f'{browser_type.name}-search.png'),full_page=True)
    passed('Date + suburb + category returns one matching event and a shareable URL')
    page.get_by_role('button',name='Clear Filters').click()
    expect(page.locator('.event-card')).to_have_count(expected_count)
    for field in ['date','location','category']: expect(page.locator('#'+field)).to_have_value('')
    passed('Clear Filters resets all DOM controls and reloads all events')
    page.go_back(wait_until='networkidle')
    expect(page.locator('.event-card')).to_have_count(1)
    expect(page.locator('#location')).to_have_value('Southport')
    passed('Browser Back restores prior filters and results')
    page.locator('#location').fill('NoSuchSuburb')
    page.get_by_role('button',name='Find events').click()
    expect(page.locator('#empty-state')).to_be_visible()
    expect(page.locator('.event-card')).to_have_count(0)
    page.get_by_role('button',name='Explore all events').click()
    expect(page.locator('.event-card')).to_have_count(expected_count)
    passed('Empty result and its recovery action')
    visit('/search.html?date=2026-02-30')
    expect(page.locator('#events-error')).to_contain_text('valid date')
    passed('Invalid URL date displays API validation feedback in the DOM')
    page.route('**/api/events?*',lambda route:route.fulfill(status=503,json={'error':'Events are temporarily unavailable. Please try again shortly.'}))
    visit('/search.html')
    expect(page.locator('#events-error')).to_be_visible()
    page.unroute('**/api/events?*')
    page.get_by_role('button',name='Try again').click()
    expect(page.locator('.event-card')).to_have_count(expected_count)
    passed('Service error shown and Retry recovers')
    page.locator('.card-title').filter(has_text='Steps for a brighter coast').click()
    page.wait_for_load_state('networkidle')
    expect(page.locator('h1')).to_have_text('Steps for a brighter coast')
    expect(page.locator('#detail-price')).to_have_text('$25')
    expect(page.locator('#detail-percent')).to_have_text('65%')
    page.locator('#ticket-quantity').select_option('3')
    expect(page.locator('#ticket-total')).to_have_text('$75')
    page.get_by_role('button',name='Register',exact=False).click()
    expect(page.get_by_role('dialog')).to_be_visible()
    expect(page.locator('#dialog-description')).to_have_text('This feature is currently under construction.')
    page.screenshot(path=str(OUT/f'{browser_type.name}-registration.png'))
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    expect(page.locator('#register-button')).to_be_focused()
    passed('Correct detail, fundraising, ticket total, exact modal text and Escape focus restoration')
    visit('/event.html?id=2')
    expect(page.locator('#detail-price')).to_have_text('Free entry')
    expect(page.locator('#ticket-total')).to_have_text('Free')
    passed('Zero-priced tickets are explicitly free')
    visit('/event.html?id=11')
    expect(page.locator('#detail-status-label')).to_have_text('Past event')
    expect(page.locator('#registration-form')).not_to_be_visible()
    expect(page.locator('#detail-percent')).to_have_text('110%')
    assert page.locator('#detail-progress').get_attribute('value')=='100'
    passed('Past event cannot register; raised amount above goal stays accurate')
    for path in ['/event.html?id=12','/event.html?id=999','/event.html?id=0','/event.html']:
        visit(path);expect(page.locator('#detail-error')).to_be_visible();expect(page.locator('#event-detail')).not_to_be_visible()
    passed('Suspended, missing and invalid event IDs show helpful errors')
    for width in [390,768,1440]:
        page.set_viewport_size({'width':width,'height':900})
        for path,label in [('/','home'),('/search.html','search'),('/event.html?id=1','detail')]:
            visit(path)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow: {width} {path}'
            assert page.locator('nav[aria-label="Main navigation"]').is_visible()
            assert page.locator('img').evaluate_all('(images)=>images.every(i=>!i.complete || i.naturalWidth>0)'), 'Broken image'
            if width==390: page.screenshot(path=str(OUT/f'{browser_type.name}-{label}-mobile.png'),full_page=True)
    passed('390px, 768px and 1440px: no horizontal overflow or broken images; navigation visible')
    page.set_viewport_size({'width':390,'height':844})
    visit('/event.html?id=1');page.locator('#register-button').click();expect(page.get_by_role('dialog')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.get_by_role('button',name='Got it').click();expect(page.get_by_role('dialog')).not_to_be_visible()
    passed('Mobile ticket controls and modal close action')
    visit('/not-a-page');expect(page.locator('h1')).to_contain_text('wandered off')
    passed('Custom 404 preserves the navigation')
    assert js_errors==[],js_errors
    passed('No uncaught JavaScript errors')
    context.close();browser.close()

with sync_playwright() as p:
    run(p.chromium)
    run(p.webkit)
OUT.joinpath('browser-results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)} browser acceptance checks passed in Chromium and WebKit.')
