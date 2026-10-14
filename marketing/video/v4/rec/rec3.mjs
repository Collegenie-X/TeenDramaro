import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  recordVideo: { dir: 'out/', size: { width: 780, height: 1688 } } });
const p = await ctx.newPage();
const W = (ms) => p.waitForTimeout(ms);
const T0 = Date.now(); const log = (m) => console.log(((Date.now()-T0)/1000).toFixed(1), m);
const btns = async () => (await p.locator('button').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
const has = async (re) => (await btns()).find(t => re.test(t));
const scroller = () => p.evaluateHandle(() => [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).sort((a,b)=>b.scrollHeight-a.scrollHeight)[0] || document.scrollingElement);
async function glide(max, step = 5) { const s = await scroller(); const H = Math.min(max, await s.evaluate(e => e.scrollHeight - e.clientHeight)); log('glideH ' + H); for (let y = 0; y < H; y += step) { await s.evaluate((e, y) => e.scrollTop = y, y); await W(16); } }
await p.goto('https://teen-dramaro.vercel.app/', { waitUntil: 'networkidle' }); log('home'); await W(2500); await glide(1600); log('homeEnd'); await W(800);
await p.goto('https://teen-dramaro.vercel.app/situation/yourname', { waitUntil: 'networkidle' }); log('card'); await W(2000); await glide(99999); log('cardEnd'); await W(800);
await p.getByRole('button', { name: '들어가기' }).click(); log('chat'); await W(3000);
const box = p.getByPlaceholder(/말해 봐/);
async function say(t) { await box.click(); await box.pressSequentially(t, { delay: 55 }); await W(300); await p.getByRole('button', { name: '보내기' }).click(); log('say ' + t); await W(7000); }
await say('사진? 무슨 사진인데. 나 어제 그냥 집에 일찍 갔는데');
await say('반장한테 내가 뭐라고 했는데? 진짜 하나도 기억 안 나');
await p.getByRole('button', { name: '컷' }).first().click(); log('cut'); await W(2200);
await p.getByRole('button', { name: '솔직함 4' }).click(); log('dial'); await W(1500);
await p.getByRole('button', { name: '장난기 1' }).click(); await W(1200);
await p.getByRole('button', { name: '🎬 액션' }).click(); log('action'); await W(2500);
const lines = ['그럼 공책에 이 글씨는 누가 쓴 건데', '반장, 어제 그 말 진심이었어?', '어제 내가 이상했다는 거, 나도 좀 궁금해', '알았어. 다시 말할게', '좋아, 지금 말할게', '반장, 나 할 말 있어', '그래도 들어 줘'];
for (const l of lines) { if (await has(/결정적 자리/)) break; await say(l); }
log('btns ' + (await btns()).join(' | '));
for (let step = 0; step < 6; step++) {
  const piv = p.locator('button', { hasText: /결정적 자리|마지막 컷|이 한 줄|이걸로 끝|놓기|커튼|저장|내 씬/ }).first();
  const inputs = p.locator('textarea:visible, input:visible');
  const n = await inputs.count();
  log(`step ${step} inputs ${n} ` + JSON.stringify(await inputs.evaluateAll(es => es.map(e => e.placeholder + '=' + e.value))));
  for (let i = 0; i < n; i++) { const v = await inputs.nth(i).inputValue(); if (!v) { await inputs.nth(i).click(); await inputs.nth(i).pressSequentially(i === 0 ? '기억은 안 나. 근데… 마음은 같아.' : '도은이 공책 글씨 옆에 「나야」라고 적는다', { delay: 50 }); await W(500); } }
  if (!(await piv.count())) { log('no next btn'); break; }
  log('click ' + (await piv.innerText()).replace(/\s+/g,' ')); await piv.click(); await W(4500);
  log('btns ' + (await btns()).join(' | '));
  await p.screenshot({ path: `out/s${step}.png` });
}
await glide(3000, 6); await W(1500);
await p.goto('https://teen-dramaro.vercel.app/scenes', { waitUntil: 'networkidle' }); log('scenes'); await W(2500); await glide(1200); await W(1500);
log('scenesText ' + (await p.locator('body').innerText()).slice(0, 600).replace(/\n+/g, ' / '));
await ctx.close(); await b.close(); log('done');
