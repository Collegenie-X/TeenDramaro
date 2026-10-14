import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  recordVideo: { dir: 'rec/', size: { width: 780, height: 1688 } } });
const p = await ctx.newPage();
const W = (ms) => p.waitForTimeout(ms);
const log = (m) => console.log(((Date.now()-T0)/1000).toFixed(1), m);
const T0 = Date.now();
// ── About scroll
await p.goto('https://teen-dramaro.vercel.app/about', { waitUntil: 'networkidle' }); log('about'); await W(2500);
const scroller = await p.evaluateHandle(() => [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) || document.scrollingElement);
const H = await scroller.evaluate(e => e.scrollHeight - e.clientHeight); log('aboutH '+H);
for (let y = 0; y < H; y += 6) { await scroller.evaluate((e, y) => e.scrollTop = y, y); await W(16); }
log('aboutEnd'); await W(1500);
// ── Cyrano
await p.goto('https://teen-dramaro.vercel.app/situation/cyrano', { waitUntil: 'networkidle' }); log('cyIntro'); await W(2000);
const s2 = await p.evaluateHandle(() => [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) || document.scrollingElement);
const H2 = await s2.evaluate(e => e.scrollHeight - e.clientHeight);
for (let y = 0; y < H2; y += 8) { await s2.evaluate((e, y) => e.scrollTop = y, y); await W(16); }
await W(800);
await p.getByText('들어가기').click(); log('chat'); await W(2500);
const lines = ['서아는 별 보는 거 좋아한대. 그 얘기로 시작해 봐', '「오늘 하늘 봤어? 너 생각났어」 어때?', '그건 네 마음이잖아. 네 말로 써', '…그냥 보내. 네가 쓴 거라고 해', '나? 아니야. 그냥 글 쓰는 게 좋아서', '서아는 너 같은 애 좋아할 거야'];
const has = async (t) => (await p.locator(`button:has-text("${t}")`).count()) > 0;
for (const l of lines) {
  await p.click('textarea'); await p.type('textarea', l, { delay: 45 }); await W(300);
  await p.click('button:has-text("↑")'); log('turn'); await W(2600);
  if (await has('결정적 자리로')) break;
}
if (!(await has('결정적 자리로')) && await has('접기')) { await p.click('button:has-text("접기")'); await W(800); }
log('has pivot '+await has('결정적 자리로'));
await p.click('button:has-text("결정적 자리로")'); log('pivot'); await W(3000);
await p.click('textarea'); await p.type('textarea', '응. 근데 그건 내가 아니라 네가 말해야 돼.', { delay: 45 }); await W(400);
await p.click('button:has-text("이 한 줄 놓기")'); await W(1500);
await p.click('button:has-text("마지막 컷 쓰기")'); log('lastcut'); await W(2000);
const inputs = p.locator('input.field');
await inputs.nth(0).fill(''); await inputs.nth(0).type('네 말로 보내. 첫 줄은 이미 네 안에 있어.', { delay: 50 }); await W(400);
await inputs.nth(1).type('하은이 펜 뚜껑을 닫고, 폰을 도윤 쪽으로 밀어 준다', { delay: 45 }); await W(1200);
await p.click('button:has-text("이걸로 끝")'); log('reveal'); await W(5000);
await p.click('button:has-text("작가실로")'); log('room'); await W(3000);
for (let i = 0; i < 5; i++) { if (await p.locator('button:has-text("다음 ›"):not([disabled])').count()) { await p.click('button:has-text("다음 ›")'); await W(2200); } }
log('roomEnd'); await W(1000);
// ── Scenes
await p.click('button.btn-tone:has-text("내 씬")'); await p.waitForLoadState('networkidle'); log('scenes '+p.url()); await W(2500);
const s3 = await p.evaluateHandle(() => [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) || document.scrollingElement);
const H3 = await s3.evaluate(e => e.scrollHeight - e.clientHeight); log('scenesH '+H3);
for (let y = 0; y < H3; y += 6) { await s3.evaluate((e, y) => e.scrollTop = y, y); await W(16); }
await W(1500); await p.goto('https://teen-dramaro.vercel.app/scenes', { waitUntil: 'networkidle' }); log('list'); await W(3000);
const s4 = await p.evaluateHandle(() => [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) || document.scrollingElement);
const H4 = await s4.evaluate(e => e.scrollHeight - e.clientHeight); log('listH '+H4);
for (let y = 0; y < Math.min(H4,900); y += 5) { await s4.evaluate((e, y) => e.scrollTop = y, y); await W(16); }
await W(2000); log('end');
await p.screenshot({ path: 'shots/final_scenes.png' });
await ctx.close(); await b.close();
