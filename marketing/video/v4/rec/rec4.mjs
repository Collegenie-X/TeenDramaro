import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  recordVideo: { dir: 'out/', size: { width: 780, height: 1688 } } });
const p = await ctx.newPage();
const W = (ms) => p.waitForTimeout(ms);
const T0 = Date.now(); const log = (m) => console.log(((Date.now()-T0)/1000).toFixed(1), m);
const btns = async () => (await p.locator('button, a').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
const scroller = () => p.evaluateHandle(() => [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).sort((a,b)=>b.scrollHeight-a.scrollHeight)[0] || document.scrollingElement);
async function glide(from, to, step = 5) { const s = await scroller(); const H = Math.min(to, await s.evaluate(e => e.scrollHeight - e.clientHeight)); log('glideH ' + H); for (let y = from; y < H; y += step) { await s.evaluate((e, y) => e.scrollTop = y, y); await W(16); } }
await p.goto('https://teen-dramaro.vercel.app/scenes', { waitUntil: 'networkidle' }); await W(1500);
const day = p.locator('button, a', { hasText: 'Day 14' }).last(); log('dayBtns ' + await day.count());
await day.scrollIntoViewIfNeeded(); await day.click(); log('day14'); await W(3000);
log('url ' + p.url()); log('btns ' + (await btns()).slice(0,40).join(' | '));
await p.goto('https://teen-dramaro.vercel.app/scenes', { waitUntil: 'networkidle' }); log('scenes'); await W(2500);
await glide(0, 2600, 5); log('scrolled'); await W(1500);
log('text ' + (await p.locator('body').innerText()).slice(0, 1200).replace(/\n+/g, ' / '));
await p.screenshot({ path: 'out/scenes.png', fullPage: false });
await ctx.close(); await b.close(); log('done');
