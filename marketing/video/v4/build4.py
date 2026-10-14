#!/usr/bin/env python3
"""마인드씬 기획 영상 v4 — 다큐 형식 · 나 소개 + AI와 함께 구상한 과정 + 씬 한 편 4단계 + 확장 단계도.
720p 30fps. v2·v3 소재를 재사용하고, 새 장면(c70~c81)은 Nano Banana 키프레임 → Kling 3.0 클립.
움직이는 자막·설명은 마지막 단계에서 프레임마다 그려(키네틱 레이어) 얹는다."""
import os, re, subprocess, wave, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
V1, V2, V3, V4 = (os.path.join(ROOT, p) for p in ("../v1/clips", "../v2/clips", "../v3/clips", "clips"))
VO, G, OUT = (os.path.join(ROOT, d) for d in ("vo_mix", "gfx", "out"))
for d in (VO, G, OUT): os.makedirs(d, exist_ok=True)
APP = os.path.join(ROOT, "rec/app_scene.webm")      # 홈 → 〈너의 이름은.〉 상황 카드 → 대화 → 컷·다이얼 → 결정적 자리 → 마지막 컷
APPS = os.path.join(ROOT, "rec/app_scenes.webm")    # 내 씬 (하은이의 2주 Day 14)
W, H, FPS, SR = 1280, 720, 30, 44100
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
_FC = {}
def F(size, w="bold"):
    k = (size, w)
    if k not in _FC: _FC[k] = ImageFont.truetype(FONT, size, index={"light": 8, "reg": 0, "med": 2, "semi": 4, "bold": 6, "heavy": 6}[w])
    return _FC[k]
GOLD, PURPLE, INK, BLUE = (255, 210, 122), (196, 166, 255), (250, 246, 255), (150, 200, 255)
DEEP = (14, 10, 24)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(" ".join(map(str, cmd))[:600]); print(r.stderr[-2500:]); raise SystemExit(1)
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)

# ── 내레이션 준비: v4 새 줄은 1.3배로(앞선 판과 말 빠르기 맞춤), v2·v3 줄은 그대로 ──
TEMPO = 1.3
for f in sorted(os.listdir(os.path.join(ROOT, "vo"))):
    src, dst = os.path.join(ROOT, "vo", f), os.path.join(VO, f)
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        run(["ffmpeg", "-y", "-i", src, "-af", f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo={TEMPO}", "-ac", "1", "-ar", str(SR), dst])
for d, names in ((V3.replace("clips", "vo"), ("t60", "t61", "t64", "t65", "t66", "t68", "t6")), (V2.replace("clips", "vo"), ("t4", "t12", "t16"))):
    for n in names: shutil.copy(os.path.join(d, n + ".wav"), os.path.join(VO, n + ".wav"))

# ── 텍스트 PNG (광고 카피) — v2·v3와 같은 모양 ─────────────
def parts(s): return [(p, i % 2 == 1) for i, p in enumerate(re.split(r"==", s)) if p]
def copy_png(name, lines, size=84, pos="c", glow=True, sub=None, subsize=30):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = F(size, "heavy"); lh = int(size * 1.22)
    total = lh * len(lines) + (subsize * 1.9 if sub else 0)
    y0 = {"c": H / 2 - total / 2, "b": H - total - 180, "t": 70}[pos]
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shadow)
    y = y0
    for ln in lines:
        tw = sum(d.textlength(p, font=f) for p, _ in parts(ln)); x = W / 2 - tw / 2
        for p, on in parts(ln):
            sd.text((x, y + 4), p, font=f, fill=(0, 0, 0, 230))
            if glow and on: sd.text((x, y), p, font=f, fill=GOLD + (200,))
            x += d.textlength(p, font=f)
        y += lh
    im = Image.alpha_composite(im, shadow.filter(ImageFilter.GaussianBlur(10))); d = ImageDraw.Draw(im)
    y = y0
    for ln in lines:
        tw = sum(d.textlength(p, font=f) for p, _ in parts(ln)); x = W / 2 - tw / 2
        for p, on in parts(ln):
            d.text((x, y), p, font=f, fill=GOLD if on else INK, stroke_width=max(2, size // 22), stroke_fill=(28, 12, 44))
            x += d.textlength(p, font=f)
        y += lh
    if sub:
        fs = F(subsize, "semi"); tw = d.textlength(sub, font=fs)
        d.text((W / 2 - tw / 2, y + 6), sub, font=fs, fill=(225, 215, 245), stroke_width=1, stroke_fill=(10, 5, 20))
    p = os.path.join(G, name + ".png"); im.save(p); return p

def tag_png(name, text, sub=None):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); dy = -150
    d.rectangle([70, 560 + dy, 76, 640 + dy], fill=GOLD)
    d.text((96, 556 + dy), text, font=F(40, "bold"), fill=INK, stroke_width=1, stroke_fill=(0, 0, 0))
    if sub: d.text((98, 608 + dy), sub, font=F(24, "semi"), fill=GOLD, stroke_width=1, stroke_fill=(0, 0, 0))
    p = os.path.join(G, name + ".png"); im.save(p); return p

def slate_png(name, a, b):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fa, fb = F(26, "bold"), F(50, "heavy")
    wa, wb = d.textlength(a, font=fa), d.textlength(b, font=fb)
    bw = max(wa, wb) + 80
    d.rounded_rectangle([W / 2 - bw / 2, 250, W / 2 + bw / 2, 430], radius=18, fill=(12, 8, 20, 225), outline=GOLD, width=3)
    for k in range(8): d.polygon([(W / 2 - bw / 2 + k * bw / 8, 250), (W / 2 - bw / 2 + k * bw / 8 + bw / 16, 250), (W / 2 - bw / 2 + k * bw / 8 + bw / 16 + 20, 228), (W / 2 - bw / 2 + k * bw / 8 + 20, 228)], fill=INK if k % 2 == 0 else (30, 24, 40))
    d.text((W / 2 - wa / 2, 280), a, font=fa, fill=GOLD)
    d.text((W / 2 - wb / 2, 335), b, font=fb, fill=INK)
    p = os.path.join(G, name + ".png"); im.save(p); return p

def letterbox_png():
    p = os.path.join(G, "letterbox.png")
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 64], fill=(0, 0, 0, 255)); d.rectangle([0, H - 64, W, H], fill=(0, 0, 0, 255)); im.save(p); return p

def phone_frame_png():
    p = os.path.join(G, "phone.png")
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([474, 46, 806, 700], radius=52, fill=(0, 0, 0, 200))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(22)))
    ImageDraw.Draw(im).rounded_rectangle([474, 30, 806, 690], radius=48, outline=(255, 230, 180, 255), width=4)
    im.save(p); return p
def phone_mask():
    p = os.path.join(G, "pmask.png"); m = Image.new("L", (296, 640), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 295, 639], radius=40, fill=255); m.save(p); return p

def word_at(name, txt, x, y=410, size=54):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); f = F(size, "heavy")
    d = ImageDraw.Draw(im); tw = d.textlength(txt, font=f)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((x - tw / 2, y + 4), txt, font=f, fill=(0, 0, 0, 255))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(8))); d = ImageDraw.Draw(im)
    d.text((x - tw / 2, y), txt, font=f, fill=GOLD, stroke_width=3, stroke_fill=(28, 12, 44))
    p = os.path.join(G, name + ".png"); im.save(p); return p

def rec_png(name):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = (255, 255, 255, 230); L = 46
    for (x, y, dx, dy) in [(40, 40, 1, 1), (W - 40, 40, -1, 1), (40, H - 40, 1, -1), (W - 40, H - 40, -1, -1)]:
        d.line([(x, y), (x + dx * L, y)], fill=c, width=4); d.line([(x, y), (x, y + dy * L)], fill=c, width=4)
    d.ellipse([66, 64, 84, 82], fill=(255, 60, 60)); d.text((94, 58), "REC", font=F(26, "heavy"), fill=INK)
    f = F(22, "bold"); t = "실제 촬영 영상 자리"; tw = d.textlength(t, font=f)
    d.rounded_rectangle([W - 70 - tw - 24, 56, W - 70, 92], radius=18, fill=(255, 210, 122, 235))
    d.text((W - 70 - tw - 12, 61), t, font=f, fill=(30, 18, 40))
    p = os.path.join(G, name + ".png"); im.save(p); return p

def role_tag(name, tags):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for txt, cx, y, kind in tags:
        badge = {"me": "나", "ai": "AI"}[kind]; col = {"me": GOLD, "ai": BLUE}[kind]
        fb, ft = F(24, "heavy"), F(26, "bold")
        bw = d.textlength(badge, font=fb) + 20; tw = d.textlength(txt, font=ft)
        w0 = bw + tw + 34; x0 = cx - w0 / 2
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([x0, y + 4, x0 + w0, y + 52], radius=24, fill=(0, 0, 0, 200))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(8))); d = ImageDraw.Draw(im)
        d.rounded_rectangle([x0, y, x0 + w0, y + 48], radius=24, fill=DEEP + (235,), outline=col, width=3)
        d.rounded_rectangle([x0 + 7, y + 7, x0 + 7 + bw, y + 41], radius=17, fill=col)
        d.text((x0 + 17, y + 9), badge, font=fb, fill=(20, 12, 30))
        d.text((x0 + bw + 20, y + 8), txt, font=ft, fill=INK)
        d.polygon([(cx - 10, y + 48), (cx + 10, y + 48), (cx, y + 62)], fill=col)
    p = os.path.join(G, name + ".png"); im.save(p); return p

# ── 세그먼트 (v3 엔진) ─────────────────────────────────
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS)]
SEGS, VOX, SFX, KIN = [], [], [], []   # 영상, (vo, 시각), (효과음, 시각), 키네틱 요소
PHONE_ON = []                          # 폰 화면이 떠 있는 구간 (내레이터 창 숨김)
T = [0.0]

def clip_chain(srcs, total):
    raw = sum(b - a for _, a, b in srcs); k = total / raw
    ins, fc = [], ""
    for i, (s, a, b) in enumerate(srcs):
        if s.endswith(".png"):
            d = (b - a) * k
            ins += ["-loop", "1", "-t", f"{d:.3f}", "-i", s]
            fc += (f"[{i}:v]scale=1472:828,setsar=1,fps={FPS},crop={W}:{H}:x='192*t/{d:.3f}':y='108*(1-t/{d:.3f})',"
                   f"scale=w='{W}*(1+0.06*t/{d:.3f})':h=-1:eval=frame,crop={W}:{H},setpts=PTS-STARTPTS[c{i}];")
            continue
        ins += ["-ss", f"{a}", "-t", f"{b-a}", "-i", s]
        fc += f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},setpts=(PTS-STARTPTS)*{k:.4f}[c{i}];"
    fc += "".join(f"[c{i}]" for i in range(len(srcs))) + f"concat=n={len(srcs)}:v=1:a=0,trim=0:{total:.3f},setpts=PTS-STARTPTS[base0];"
    return ins, fc

def segment(srcs, vos, total=None, overlays=(), shake=(), flash=(), grade="", letterbox=False, pad=0.22, fin=0.2, fout=0.2, phone=None, glitch=(), kin=()):
    """vos: [(vo, 오프셋)] · overlays: [(png, 등장, 퇴장, slam|fade|rise)] · phone: [(앱, 앱시작, 앱끝, 등장, 퇴장)]
       kin: 키네틱 요소(세그먼트 기준 시각) — 마지막 합성 때 프레임마다 그린다"""
    vend = max([o + dur(os.path.join(VO, v)) for v, o in vos] or [0])
    total = total or (vend + pad)
    ins, fc = clip_chain(srcs, total); n = len(srcs); last = "base0"
    if shake:
        ex = "+".join(f"if(between(t,{s},{s+0.45}),14*sin(95*t)*exp(-(t-{s})*7),0)" for s in shake)
        ey = ex.replace("sin(95", "cos(83")
        fc += f"[{last}]scale=1320:743,crop={W}:{H}:x='20+{ex}':y='11+{ey}'[sk];"; last = "sk"
    if grade: fc += f"[{last}]{grade}[gr];"; last = "gr"
    for q, (gs, ge) in enumerate(glitch):
        fc += (f"[{last}]rgbashift=rh=14:bh=-14:gv=4:enable='between(t,{gs},{ge})',"
               f"noise=alls=40:allf=t:enable='between(t,{gs},{ge})'[gl{q}];"); last = f"gl{q}"
    for pi, (app, a, b, s, e) in enumerate(phone or []):
        ins += ["-ss", f"{a}", "-t", f"{b-a}", "-i", app, "-loop", "1", "-i", phone_mask(), "-loop", "1", "-i", phone_frame_png()]
        k = (e - s) / (b - a)
        fc += (f"[{n}:v]fps={FPS},crop=390:844:0:0,scale=296:640:flags=lanczos,setpts=(PTS-STARTPTS)*{k:.4f}+{s}/TB,format=rgba[ap{pi}];"
               f"[{n+1}:v]format=gray,scale=296:640[am{pi}];[ap{pi}][am{pi}]alphamerge[apm{pi}];"
               f"[{last}]boxblur=12:1:enable='between(t,{s},{e})',eq=brightness=-0.12:enable='between(t,{s},{e})'[pb{pi}];"
               f"[pb{pi}][{n+2}:v]overlay=0:0:enable='between(t,{s},{e})'[pf{pi}];"
               f"[pf{pi}][apm{pi}]overlay=x=492:y='if(lt(t,{s}+0.3),40+700*(1-(t-{s})/0.3)^2,40)':enable='between(t,{s},{e})':eof_action=pass[ph{pi}];")
        last = f"ph{pi}"; n += 3
        PHONE_ON.append((T[0] + s, T[0] + e))
    for i, (png, s, e, fx) in enumerate(overlays):
        ins += ["-loop", "1", "-t", f"{total:.3f}", "-i", png]; j = n + i
        fade = f"fade=t=in:st={s}:d={0.12 if fx=='slam' else 0.4}:alpha=1,fade=t=out:st={e-0.25}:d=0.25:alpha=1"
        if fx == "slam":
            fc += f"[{j}:v]format=rgba,{fade},scale=w='iw*(1+0.55*max(0,1-(t-{s})/0.22))':h=-1:eval=frame[o{i}];"
            fc += f"[{last}][o{i}]overlay=x='(W-w)/2':y='(H-h)/2':eval=frame[v{i}];"
        elif fx == "rise":
            fc += f"[{j}:v]format=rgba,{fade}[o{i}];[{last}][o{i}]overlay=x=0:y='if(lt(t,{s}+0.5),30*(1-(t-{s})/0.5),0)':eval=frame[v{i}];"
        else:
            fc += f"[{j}:v]format=rgba,{fade}[o{i}];[{last}][o{i}]overlay=0:0[v{i}];"
        last = f"v{i}"
    j = n + len(overlays)
    if letterbox:
        ins += ["-loop", "1", "-t", f"{total:.3f}", "-i", letterbox_png()]; fc += f"[{last}][{j}:v]overlay=0:0[lb];"; last = "lb"; j += 1
    for q, s in enumerate(flash):
        fc += (f"color=white:s={W}x{H}:d={total:.3f}:r={FPS},format=rgba,"
               f"fade=t=in:st={max(0,s-0.03):.3f}:d=0.03:alpha=1,fade=t=out:st={s+0.02:.3f}:d=0.35:alpha=1[wh{q}];"
               f"[{last}][wh{q}]overlay=0:0[fl{q}];"); last = f"fl{q}"
    fc += f"[{last}]vignette=PI/5,fade=t=in:st=0:d={fin},fade=t=out:st={total-fout:.3f}:d={fout},format=yuv420p"
    out = os.path.join(OUT, f"s{len(SEGS):02d}.mp4")
    run(["ffmpeg", "-y", *ins, "-filter_complex", fc, "-t", f"{total:.3f}", *ENC, "-an", out])
    for v, o in vos: VOX.append((v, T[0] + o))
    for s in shake: SFX.append(("boom", T[0] + s))
    for gs, ge in glitch: SFX.append(("glitch", T[0] + gs))
    for s in flash: SFX.append(("hit", T[0] + s))
    for png, s, e, fx in overlays:
        if fx == "slam": SFX.append(("hit", T[0] + s))
    for el in kin:
        el.shift(T[0], total); KIN.append(el)
        for at in el.pops(): SFX.append(("pop", at))
    SEGS.append(out); T[0] += total
    return total

C1 = lambda i: os.path.join(V1, f"v{i}.mp4")
C2 = lambda i: os.path.join(V2, f"c{i}.mp4")
C3 = lambda i: os.path.join(V3, f"c{i}.mp4")
C4 = lambda i: os.path.join(V4, f"c{i}.mp4")
K3 = lambda i: os.path.join(V3, f"k{i}.png")
COLD = "eq=saturation=0.85:contrast=1.06,colorbalance=bs=0.08:bm=0.04"
WARM = "eq=saturation=1.1:contrast=1.05,colorbalance=rs=0.05:rm=0.03"
MARK = {}
def mark(k): MARK[k] = T[0]
def vd(v): return dur(os.path.join(VO, v))

# ═════════════ 키네틱 레이어 — 움직이는 자막 · 설명 ═════════════
def ease(x): x = min(1, max(0, x)); return 1 - (1 - x) ** 3
def back(x):
    x = min(1, max(0, x)); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def wrap(d, text, font, maxw):
    """==금색== 표시를 지키며 단어 단위로 줄바꿈 → [[(단어, [(조각, 금색)])]] — 「마인드씬==을」처럼 붙은 조사는 붙여 둔다"""
    words, cur_w = [], []
    for p, on in parts(text):
        for i, chunk in enumerate(p.split(" ")):
            if i > 0 and cur_w: words.append(("".join(c for c, _ in cur_w), cur_w)); cur_w = []
            if chunk: cur_w.append((chunk, on))
    if cur_w: words.append(("".join(c for c, _ in cur_w), cur_w))
    lines, cur, cw = [], [], 0
    sp = d.textlength(" ", font=font)
    for w, on in words:
        ww = d.textlength(w, font=font)
        if cur and cw + sp + ww > maxw: lines.append(cur); cur, cw = [], 0
        cur.append((w, on)); cw += (sp if cw else 0) + ww
    if cur: lines.append(cur)
    return lines

def glow_text(L, xy, text, font, fill, stroke=3, glow=None):
    d = ImageDraw.Draw(L)
    if glow:
        g = Image.new("RGBA", L.size, (0, 0, 0, 0)); ImageDraw.Draw(g).text(xy, text, font=font, fill=glow)
        L.alpha_composite(g.filter(ImageFilter.GaussianBlur(8)))
    d.text(xy, text, font=font, fill=fill, stroke_width=stroke, stroke_fill=(20, 10, 34))

class El:
    """a·b 는 세그먼트 기준 → shift 뒤 절대 시각. 그리기는 별도 레이어에 하고 불투명도로 섞는다."""
    fi, fo = 0.25, 0.3
    def __init__(self, a, b=None): self.a, self.b = a, b
    def shift(self, t0, total):
        if self.b is None: self.b = total
        self.a += t0; self.b += t0; self.t0 = t0
    def pops(self): return []
    def active(self, t): return self.a <= t < self.b
    def opacity(self, t): return min(1, (t - self.a) / self.fi if self.fi else 1, (self.b - t) / self.fo if self.fo else 1)
    def draw(self, L, t):
        o = self.opacity(t)
        if o <= 0: return
        lay = Image.new("RGBA", L.size, (0, 0, 0, 0)); self.render(lay, t - self.a)
        if o < 1: lay.putalpha(lay.getchannel("A").point(lambda v: int(v * o)))
        L.alpha_composite(lay)

class Sub(El):
    """다이내믹 자막 — 단어가 톡톡 올라오고, 지금 말하는 단어에 금색 밑줄이 따라간다."""
    fi, fo = 0.12, 0.15
    def __init__(self, a, b, text, who=None):
        super().__init__(a, b); self.text, self.who = text, who
        d = ImageDraw.Draw(Image.new("RGBA", (8, 8))); self.f = F(31, "bold")
        self.maxw = 780 if not who else 700
        self.lines = wrap(d, text, self.f, self.maxw); self.d = d
        self.n = sum(len(l) for l in self.lines)
    def render(self, L, t):
        d = ImageDraw.Draw(L); f = self.f; lh = 44; dur_ = self.b - self.a
        widths = [sum(d.textlength(w, font=f) for w, _ in ln) + d.textlength(" ", font=f) * (len(ln) - 1) for ln in self.lines]
        bw = max(widths) + 44; bh = lh * len(self.lines) + 26
        x0 = 40 + (-30 * (1 - ease(t / 0.2))); y0 = H - 40 - bh
        tagw = 0
        if self.who:
            name, col = self.who
            ft = F(24, "heavy"); tagw = d.textlength(name, font=ft) + 30
            d.rounded_rectangle([x0, y0 - 40, x0 + tagw, y0 - 6], radius=16, fill=col + (240,))
            d.text((x0 + 15, y0 - 37), name, font=ft, fill=(24, 14, 36))
        d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=14, fill=(10, 6, 18, 205), outline=(GOLD + (120,)) if self.who else None, width=2)
        k = 0; cur = int(min(self.n - 1, (t / max(0.01, dur_ - 0.15)) * self.n))
        y = y0 + 13
        for ln in self.lines:
            x = x0 + 22
            for w, runs in ln:
                at = k * 0.045; p = ease((t - at) / 0.18)
                if p > 0:
                    ww = d.textlength(w, font=f); yy = y + 12 * (1 - p)
                    a = int(255 * p); xx = x
                    for piece, on in runs:
                        d.text((xx, yy), piece, font=f, fill=(GOLD if on else INK) + (a,), stroke_width=2 if on else 0, stroke_fill=(40, 20, 50, a))
                        xx += d.textlength(piece, font=f)
                    if k == cur: d.rounded_rectangle([x, y + lh - 8, x + ww, y + lh - 4], radius=2, fill=GOLD + (230,))
                x += d.textlength(w, font=f) + d.textlength(" ", font=f); k += 1
            y += lh

class PipTag(El):
    """내레이터 창 테두리 + 이름표 (창 영상은 ffmpeg가 넣는다)."""
    fi, fo = 0.2, 0.2
    def render(self, L, t):
        d = ImageDraw.Draw(L); x0, y0, w0, h0 = W - 36 - 352, H - 36 - 198, 352, 198
        d.rounded_rectangle([x0 - 4, y0 - 4, x0 + w0 + 4, y0 + h0 + 4], radius=14, outline=GOLD, width=3)
        d.rounded_rectangle([x0 + 10, y0 + h0 - 40, x0 + 196, y0 + h0 - 10], radius=6, fill=(10, 6, 18, 210))
        r = 5 + 2 * (np.sin(t * 5) > 0)
        d.ellipse([x0 + 23 - r, y0 + h0 - 25 - r, x0 + 23 + r, y0 + h0 - 25 + r], fill=(255, 80, 80))
        d.text((x0 + 36, y0 + h0 - 36), "김승아 · 기획자", font=F(20, "bold"), fill=INK)

class StepBar(El):
    """위쪽 진행 표시 — 지난 단계 ✓, 지금 단계는 금색으로 맥박."""
    def __init__(self, a, b, title, labels, active, slide=True):
        super().__init__(a, b); self.title, self.labels, self.act, self.slide = title, labels, active, slide
        self.fi = 0.3 if slide else 0.01
    def render(self, L, t):
        d = ImageDraw.Draw(L); f = F(22, "bold"); ft = F(20, "heavy")
        ws = [d.textlength(s, font=f) + 34 for s in self.labels]; gap = 26
        tw = d.textlength(self.title, font=ft) + 26
        total = tw + 16 + sum(ws) + gap * (len(ws) - 1)
        x = W / 2 - total / 2; y = 22 - (40 * (1 - ease(t / 0.35)) if self.slide else 0)
        d.rounded_rectangle([x - 12, y - 8, x + total + 12, y + 46], radius=24, fill=(10, 6, 18, 190))
        d.text((x + 6, y + 9), self.title, font=ft, fill=GOLD); x += tw + 16
        for i, (s, w) in enumerate(zip(self.labels, ws)):
            if i == self.act:
                pulse = 0.5 + 0.5 * np.sin(t * 6)
                g = Image.new("RGBA", L.size, (0, 0, 0, 0))
                ImageDraw.Draw(g).rounded_rectangle([x - 4, y - 2, x + w + 4, y + 40], radius=20, fill=GOLD + (int(120 + 100 * pulse),))
                L.alpha_composite(g.filter(ImageFilter.GaussianBlur(7))); d = ImageDraw.Draw(L)
                d.rounded_rectangle([x, y + 2, x + w, y + 36], radius=17, fill=GOLD)
                d.text((x + 17, y + 6), s, font=f, fill=(30, 16, 40))
            elif self.act is not None and i < self.act:
                d.rounded_rectangle([x, y + 2, x + w, y + 36], radius=17, fill=(60, 44, 30, 230), outline=GOLD, width=2)
                d.text((x + 17, y + 6), s, font=f, fill=GOLD)
            else:
                d.rounded_rectangle([x, y + 2, x + w, y + 36], radius=17, fill=(20, 14, 30, 200), outline=(120, 110, 140), width=2)
                d.text((x + 17, y + 6), s, font=f, fill=(170, 160, 190))
            if i < len(ws) - 1:
                cx = x + w + gap / 2; d.polygon([(cx - 5, y + 13), (cx + 6, y + 19), (cx - 5, y + 25)], fill=GOLD if (self.act is not None and i < self.act) else (120, 110, 140))
            x += w + gap

class Chat(El):
    """AI에게 묻기 — 내 질문이 타자로 쳐지고, AI가 … 하다가 답한다."""
    def __init__(self, a, b, q, ans, x=60, y=96, w=720):
        super().__init__(a, b); self.q, self.ans, self.x, self.y, self.w = q, ans, x, y, w
        self.f = F(27, "bold"); d = ImageDraw.Draw(Image.new("RGBA", (8, 8))); self.d = d
        self.tq = len(q) / 26; self.ta0 = 0.25 + self.tq + 0.3; self.ta1 = self.ta0 + 0.7
    def pops(self): return [self.a + 0.2, self.a + self.ta1]
    def bubble(self, L, text, shown, right, top, col, fg, label):
        d = ImageDraw.Draw(L); f = self.f
        lines = [[(w, False) for w in ln] for ln in [l for l in [[x[0] for x in ln] for ln in wrap(d, text, f, self.w - 60)]]]
        full = [" ".join(w for w, _ in ln) for ln in lines]
        bw = max(d.textlength(s, font=f) for s in full) + 44; bh = 40 * len(full) + 22
        x0 = self.x + self.w - bw if right else self.x
        d.rounded_rectangle([x0, top, x0 + bw, top + bh], radius=22, fill=col)
        fl = F(18, "heavy"); lw = d.textlength(label, font=fl) + 18
        lx = x0 + bw - lw - 6 if right else x0 + 6
        d.rounded_rectangle([lx, top - 26, lx + lw, top - 2], radius=10, fill=(10, 6, 18, 220))
        d.text((lx + 9, top - 25), label, font=fl, fill=GOLD if right else BLUE)
        left = shown; y = top + 11
        for s in full:
            seg = s[:max(0, left)]; left -= len(s) + 1
            d.text((x0 + 22, y), seg, font=f, fill=fg); y += 40
        return top + bh
    def render(self, L, t):
        nq = int(len(self.q) * min(1, max(0, (t - 0.25) / self.tq)))
        bot = self.bubble(L, self.q, nq if t < 0.25 + self.tq else 999, True, self.y + 26, GOLD + (245,), (30, 18, 40), "나 → AI")
        if t > self.ta0:
            top = bot + 40
            if t < self.ta1:
                d = ImageDraw.Draw(L)
                d.rounded_rectangle([self.x, top, self.x + 110, top + 52], radius=22, fill=(36, 30, 70, 240), outline=BLUE, width=2)
                for i in range(3):
                    yy = top + 26 - 6 * max(0, np.sin((t * 8) - i * 0.9))
                    d.ellipse([self.x + 26 + i * 24 - 6, yy - 6, self.x + 26 + i * 24 + 6, yy + 6], fill=BLUE)
                d.rounded_rectangle([self.x + 6, top - 26, self.x + 50, top - 2], radius=10, fill=(10, 6, 18, 220))
                d.text((self.x + 15, top - 25), "AI", font=F(18, "heavy"), fill=BLUE)
            else:
                na = int(len(self.ans) * min(1, (t - self.ta1) / (len(self.ans) / 34)))
                self.bubble(L, self.ans, na, False, top, (36, 30, 70, 240), INK, "AI")

class Cards(El):
    """설명 카드가 차례로 튀어 오른다. items: [(제목, 설명, 색, 등장)]"""
    def __init__(self, a, b, items, x=60, y=380, w=340, gap=24, h=104, vertical=False):
        super().__init__(a, b); self.items, self.x, self.y, self.w, self.gap, self.h, self.v = items, x, y, w, gap, h, vertical
    def pops(self): return [self.a + it[3] for it in self.items]
    def render(self, L, t):
        d = ImageDraw.Draw(L)
        for i, (head, sub, col, at) in enumerate(self.items):
            p = (t - at) / 0.35
            if p <= 0: continue
            s = back(p); x0 = self.x + (0 if self.v else i * (self.w + self.gap)); y0 = self.y + (i * (self.h + self.gap) if self.v else 0) + 40 * (1 - ease(p))
            cx, cy = x0 + self.w / 2, y0 + self.h / 2; w2, h2 = self.w / 2 * (0.7 + 0.3 * s), self.h / 2 * (0.7 + 0.3 * s)
            a = int(255 * min(1, p * 2))
            sh = Image.new("RGBA", L.size, (0, 0, 0, 0))
            ImageDraw.Draw(sh).rounded_rectangle([cx - w2, cy - h2 + 6, cx + w2, cy + h2 + 6], radius=20, fill=(0, 0, 0, int(a * 0.7)))
            L.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10))); d = ImageDraw.Draw(L)
            d.rounded_rectangle([cx - w2, cy - h2, cx + w2, cy + h2], radius=20, fill=(14, 10, 26, int(a * 0.93)), outline=col + (a,), width=3)
            d.rounded_rectangle([cx - w2, cy - h2, cx - w2 + 10, cy + h2], radius=5, fill=col + (a,))
            if p > 0.5:
                d.text((cx - w2 + 28, cy - h2 + 14), head, font=F(32, "heavy"), fill=col)
                d.text((cx - w2 + 30, cy - h2 + 60), sub, font=F(22, "semi"), fill=INK)

class Layers(El):
    """세 층 — 고전 · 요즘 작품 · 고전이 쌓여 「상황 카드 · 대사 0줄」이 된다."""
    def __init__(self, a, b, times, x=70, y=300):
        super().__init__(a, b); self.times, self.x, self.y = times, x, y
    def pops(self): return [self.a + s for s in self.times]
    def render(self, L, t):
        d = ImageDraw.Draw(L)
        rows = [("뼈대", "옛날 고전", "셰익스피어 · 우리 고전의 갈등", (214, 170, 110)),
                ("분위기", "요즘 작품", "상황의 ‘종류’만 · 장면은 안 가져와요", (140, 190, 255)),
                ("세부", "다시 고전", "편지 · 손수건 · 촛불 같은 물건", (214, 170, 110))]
        bw, bh = 640, 64
        for i, (k, src, sub, col) in enumerate(rows):
            p = (t - self.times[i]) / 0.45
            if p <= 0: continue
            yt = self.y + (2 - i) * (bh + 10); y0 = yt - 260 * (1 - ease(p))
            a = int(255 * min(1, p * 2))
            d.rounded_rectangle([self.x, y0, self.x + bw, y0 + bh], radius=14, fill=(col[0] // 5, col[1] // 5, col[2] // 5, int(a * 0.92)), outline=col + (a,), width=3)
            d.text((self.x + 20, y0 + 14), k, font=F(30, "heavy"), fill=col + (a,))
            d.text((self.x + 120, y0 + 9), src, font=F(24, "heavy"), fill=INK + (a,))
            d.text((self.x + 122, y0 + 37), sub, font=F(18, "semi"), fill=(210, 200, 230, a))
        p = (t - self.times[3]) / 0.4
        if p > 0:
            y0 = self.y + 3 * (bh + 10) + 6; s = back(p)
            d.rounded_rectangle([self.x, y0, self.x + bw * s, y0 + 56], radius=28, fill=GOLD)
            if p > 0.6: d.text((self.x + 24, y0 + 10), "= 상황 카드 한 장 · 대사 0줄", font=F(30, "heavy"), fill=(30, 16, 40))

class Dial(El):
    """성격 다이얼 — 솔직함 1 → 4 로 돌아가고 「같은 말, 다른 대답」."""
    def __init__(self, a, b, turn, cx=230, cy=330):
        super().__init__(a, b); self.turn, self.cx, self.cy = turn, cx, cy
    def pops(self): return [self.a + self.turn]
    def render(self, L, t):
        d = ImageDraw.Draw(L); cx, cy, r = self.cx, self.cy, 112
        d.ellipse([cx - r - 10, cy - r - 10, cx + r + 10, cy + r + 10], fill=(10, 6, 18, 215), outline=GOLD, width=3)
        for v in range(5):
            ang = np.radians(210 - v * 60)
            x1, y1 = cx + (r - 6) * np.cos(ang), cy - (r - 6) * np.sin(ang)
            x2, y2 = cx + (r - 26) * np.cos(ang), cy - (r - 26) * np.sin(ang)
            d.line([(x1, y1), (x2, y2)], fill=INK, width=4)
            tx, ty = cx + (r + 26) * np.cos(ang), cy - (r + 26) * np.sin(ang)
        val = 1 + 3 * ease((t - self.turn) / 0.6)
        ang = np.radians(210 - val * 60)
        d.line([(cx, cy), (cx + (r - 30) * np.cos(ang), cy - (r - 30) * np.sin(ang))], fill=GOLD, width=9)
        d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=GOLD)
        f = F(28, "heavy"); s = f"솔직함 {val:.0f}"; d.text((cx - d.textlength(s, font=f) / 2, cy + 40), s, font=f, fill=INK)
        d.text((cx - 112, cy - r - 58), "상대 성격 다이얼", font=F(26, "heavy"), fill=GOLD)
        p = (t - self.turn - 0.8) / 0.4
        if p > 0:
            y = cy + r + 40 + 20 * (1 - ease(p))
            glow_text(L, (cx - 150, y), "같은 말,", F(36, "heavy"), INK + (int(255 * min(1, p)),))
            glow_text(L, (cx - 150, y + 46), "다른 대답", F(44, "heavy"), GOLD + (int(255 * min(1, p)),), glow=GOLD + (160,))

class Cycle(El):
    """AI 초안 → 내가 고르기 → 고치기 → 친구들과 해 보기 → 다시 … 빙글빙글."""
    def __init__(self, a, b, cx=330, cy=330, r=150):
        super().__init__(a, b); self.cx, self.cy, self.r = cx, cy, r
    def render(self, L, t):
        d = ImageDraw.Draw(L); cx, cy, r = self.cx, self.cy, self.r
        nodes = ["AI 초안", "내가 고르기", "고치기", "친구들과 해 보기"]
        grow = ease(t / 0.8)
        d.arc([cx - r, cy - r, cx + r, cy + r], start=-90, end=-90 + 360 * grow, fill=GOLD + (200,), width=5)
        act = int(t / 0.75) % 4
        for i, s in enumerate(nodes):
            ang = np.radians(90 - i * 90); x, y = cx + r * np.cos(ang), cy - r * np.sin(ang)
            p = (t - i * 0.2) / 0.35
            if p <= 0: continue
            f = F(24, "heavy"); tw = d.textlength(s, font=f) + 34
            on = (i == act and t > 1.0)
            if on:
                g = Image.new("RGBA", L.size, (0, 0, 0, 0)); ImageDraw.Draw(g).rounded_rectangle([x - tw / 2 - 6, y - 30, x + tw / 2 + 6, y + 30], radius=26, fill=GOLD + (200,))
                L.alpha_composite(g.filter(ImageFilter.GaussianBlur(9))); d = ImageDraw.Draw(L)
            d.rounded_rectangle([x - tw / 2, y - 24, x + tw / 2, y + 24], radius=22, fill=GOLD if on else (20, 14, 32, 235), outline=GOLD, width=3)
            d.text((x - tw / 2 + 17, y - 15), s, font=f, fill=(30, 16, 40) if on else INK)
        if t > 0.9:
            ang = np.radians(90 - (t / 0.75) * 90 - 45); x, y = cx + r * np.cos(ang), cy - r * np.sin(ang)
            d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=GOLD)
        fc = F(30, "heavy"); s = "반복"; d.text((cx - d.textlength(s, font=fc) / 2, cy - 18), s, font=fc, fill=GOLD)

class Ladder(El):
    """확장 단계도 — 씬 한 편이 모이고, 이어지고, 길어져서 결국 나를 돌아보게 된다."""
    STEPS = [("씬 한 편", "5분 · 마지막 컷은 내가"), ("내 씬", "끝나면 저절로 모여요"), ("단막극", "씬 3~5개 이어 붙이기"),
             ("연속극", "한 주에 한 편씩"), ("돌아보기", "내가 쓴 말로 나를 알기")]
    def __init__(self, a, b, times, x=56, base=520, done=False):
        super().__init__(a, b); self.times, self.x, self.base, self.done = times, x, base, done
    def pops(self): return [self.a + s for s in self.times if s > 0.05]
    def render(self, L, t):
        d = ImageDraw.Draw(L); bw, gap = 156, 12
        tops = []
        for i, (head, sub) in enumerate(self.STEPS):
            if i >= len(self.times): break
            p = (t - self.times[i]) / 0.5
            if p <= 0: continue
            hh = (140 + i * 46) * ease(p); x0 = self.x + i * (bw + gap); y0 = self.base - hh
            last = i == len(self.STEPS) - 1
            col = GOLD if last else (180, 160, 255)
            fill = (70, 50, 20, 235) if last else (26, 18, 50, 230)
            if last or (i == max(k for k, s in enumerate(self.times) if s <= t)):
                g = Image.new("RGBA", L.size, (0, 0, 0, 0)); ImageDraw.Draw(g).rounded_rectangle([x0 - 6, y0 - 6, x0 + bw + 6, self.base + 6], radius=18, fill=col + (110,))
                L.alpha_composite(g.filter(ImageFilter.GaussianBlur(10))); d = ImageDraw.Draw(L)
            d.rounded_rectangle([x0, y0, x0 + bw, self.base], radius=14, fill=fill, outline=col, width=3)
            if p > 0.5:
                d.text((x0 + 14, y0 + 12), head, font=F(27, "heavy"), fill=col)
                ys = y0 + 50
                for ln in wrap(d, sub, F(18, "semi"), bw - 24):
                    d.text((x0 + 14, ys), " ".join(w for w, _ in ln), font=F(18, "semi"), fill=INK); ys += 24
                # 작은 씬 조각들 — 단계가 오를수록 많아진다
                n = [1, 3, 4, 4, 0][i]
                for k in range(n):
                    px = x0 + 14 + k * 34; py = self.base - 28
                    d.rounded_rectangle([px, py, px + 26, py + 18], radius=4, fill=(255, 210, 122, 200) if k == 0 else (200, 190, 240, 160))
                if last:
                    hx, hy = x0 + bw / 2, self.base - 46
                    d.ellipse([hx - 18, hy - 14, hx + 2, hy + 6], fill=GOLD); d.ellipse([hx - 2, hy - 14, hx + 18, hy + 6], fill=GOLD)
                    d.polygon([(hx - 18, hy - 2), (hx + 18, hy - 2), (hx, hy + 20)], fill=GOLD)
            tops.append((x0 + bw / 2, y0))
        for (x1, y1), (x2, y2) in zip(tops, tops[1:]):
            d.line([(x1 + 30, y1 - 14), (x2 - 30, y2 - 14)], fill=GOLD, width=4)
            d.polygon([(x2 - 30, y2 - 22), (x2 - 18, y2 - 14), (x2 - 30, y2 - 6)], fill=GOLD)
        d.text((self.x, self.base - 410), "씬 한 편이 커져요", font=F(30, "heavy"), fill=GOLD, stroke_width=2, stroke_fill=(20, 10, 34))

class Bridge(El):
    """상황극 ⇄ 내 무대 · 순한 맛부터 한 단계씩."""
    def __init__(self, a, b, cx=420, cy=250):
        super().__init__(a, b); self.cx, self.cy = cx, cy
    def pops(self): return [self.a + 0.2, self.a + 1.4]
    def render(self, L, t):
        d = ImageDraw.Draw(L); cx, cy = self.cx, self.cy
        for i, (lab, sub, col) in enumerate((("상황극", "명작 속 상황", GOLD), ("내 무대", "내 장면", BLUE))):
            p = (t - (0.2 + i * 0.25)) / 0.4
            if p <= 0: continue
            x = cx + (-200 if i == 0 else 200); r = 92 * back(p)
            d.ellipse([x - r, cy - r, x + r, cy + r], fill=(16, 12, 30, 230), outline=col, width=4)
            if p > 0.6:
                f = F(32, "heavy"); d.text((x - d.textlength(lab, font=f) / 2, cy - 30), lab, font=f, fill=col)
                f2 = F(20, "semi"); d.text((x - d.textlength(sub, font=f2) / 2, cy + 12), sub, font=f2, fill=INK)
        p = ease((t - 1.0) / 0.6)
        if p > 0:
            d.arc([cx - 120, cy - 150, cx + 120, cy + 10], start=200, end=200 + 140 * p, fill=GOLD, width=5)
            if p > 0.95:
                d.polygon([(cx + 95, cy - 108), (cx + 116, cy - 88), (cx + 88, cy - 82)], fill=GOLD)
                f = F(24, "heavy"); s = "「이거 내 얘긴데」"
                d.rounded_rectangle([cx - d.textlength(s, font=f) / 2 - 14, cy - 196, cx + d.textlength(s, font=f) / 2 + 14, cy - 158], radius=18, fill=GOLD)
                d.text((cx - d.textlength(s, font=f) / 2, cy - 192), s, font=f, fill=(30, 16, 40))
        p = (t - 2.6) / 0.4
        if p > 0:
            y = cy + 150; x0, x1 = cx - 270, cx + 270
            d.text((x0, y - 44), "순한 맛", font=F(24, "heavy"), fill=INK); s = "매운 맛"
            d.text((x1 - d.textlength(s, font=F(24, "heavy")), y - 44), s, font=F(24, "heavy"), fill=(255, 140, 110))
            d.rounded_rectangle([x0, y - 6, x1, y + 6], radius=6, fill=(60, 50, 80))
            k = ease((t - 3.2) / 2.5) * 0.45
            d.rounded_rectangle([x0, y - 6, x0 + (x1 - x0) * k, y + 6], radius=6, fill=GOLD)
            kx = x0 + (x1 - x0) * k; d.ellipse([kx - 15, y - 15, kx + 15, y + 15], fill=GOLD, outline=INK, width=3)
            labs = ["처음", "익숙", "능숙"]
            for i, s in enumerate(labs):
                q = (t - 3.2 - i * 0.5) / 0.3
                if q <= 0: continue
                bx = x0 + i * 190; on = i == 0
                d.rounded_rectangle([bx, y + 30, bx + 160, y + 68], radius=19, fill=GOLD if on else (24, 18, 40, 220), outline=GOLD, width=2)
                f = F(22, "heavy"); d.text((bx + 80 - d.textlength(s, font=f) / 2, y + 36), s, font=f, fill=(30, 16, 40) if on else INK)

class Badges(El):
    """안전 약속 — 알약 모양이 차례로 톡톡."""
    def __init__(self, a, b, items, x=60, y=420):
        super().__init__(a, b); self.items, self.x, self.y = items, x, y
    def pops(self): return [self.a + it[1] for it in self.items]
    def render(self, L, t):
        d = ImageDraw.Draw(L); x, y = self.x, self.y
        for i, (s, at) in enumerate(self.items):
            p = (t - at) / 0.3
            f = F(30, "heavy"); w = d.textlength(s, font=f) + 44
            if x + w > 840: x, y = self.x, y + 70
            if p > 0:
                sc = back(p); cx = x + w / 2
                d.rounded_rectangle([cx - w / 2 * sc, y, cx + w / 2 * sc, y + 54], radius=27, fill=(20, 14, 32, 235), outline=GOLD, width=3)
                if p > 0.5: d.text((x + 22, y + 9), s, font=f, fill=GOLD if i < 2 else INK)
            x += w + 14

# ═════════════ 타임라인 ═════════════
SUB = {
 "t60": "안녕하세요! 저는 중학교 1학년, ==김승아==예요. | 오늘은 제가 기획하고 만든 AI 서비스, ==마인드씬==을 소개할게요.",
 "t61": "제 꿈은, ==아이돌의 스토리를 기획하는 디렉터==예요.",
 "t71": "이야기 공부를 하려고, AI 캐릭터 채팅 앱으로 밤새 이야기를 만들어 봤어요. | 재밌었어요. 그런데 앱을 닫으니까, | 내 이야기는 ==한 줄도== 남아 있지 않았어요.",
 "t4": "기획자의 눈으로 다시 보니, 세 가지가 빠져 있었어요. | ==끝이 없고.== ==내가 없고.== ==남는 게 없었어요.==",
 "t72": "그래서 저는 AI를 정답 기계가 아니라, | 같이 고민하는 ==기획 파트너==로 썼어요. ==네 가지==를 물어봤어요.",
 "t73": "첫 번째 질문. 친구들이 부담 없이 마음을 꺼내는 방법이 있을까? | AI가 연극에서 쓰는 방법들을 알려 줬고, 저는 ==두 가지==를 골랐어요. | 명작 속 상황을 빌리는 ==상황극==, 그리고 내 장면을 직접 세우는 ==내 무대==.",
 "t74": "두 번째 질문. 명작을 가져와도 괜찮을까? | 그래서 ==세 층==으로 쌓았어요. 뼈대는 옛날 고전, 분위기는 요즘 작품, 세부는 다시 고전. | 대사는 한 줄도 안 가져오고, ==상황만== 가져와요.",
 "t75": "세 번째 질문. AI가 이야기를 대신 끝내 버리면 어떡하지? | 그래서 규칙을 정했어요. AI는 ==상대 인물만== 연기하고, | 결정적인 한 걸음은 꼭 ==내가== 내딛어요.",
 "t76": "네 번째 질문. 위험을 막는 규칙을 같이 만들어 줄래? | 그래서 ==진단도, 점수도 없고==, 기록은 ==내 폰에만== 남아요.",
 "t77": "AI의 답은 ==초안==일 뿐이에요. | 저는 고르고, 고치고, 친구들과 직접 해 보면서 다시 고쳤어요. | 그렇게 나온 게 바로,",
 "t6": "내 안의 무대, 한 씬씩. ==마인드씬.==",
 "t79": "하나, ==고르기==. 장르를 고르면 명작 속 상황이 우리 학교 이야기로 바뀌어 나와요. | 오늘은 〈너의 이름은.〉 어제의 내가, 내가 아니었던 아침이에요.",
 "t80": "둘, ==연기하기==. 나는 주인공 도은이 되고, | 미소와 반장은 ==AI==가 맡아요. 내 말에 따라 대답이 달라져요.",
 "t64": "야, 너 진짜 기억 안 나? 어제 너 완전 딴사람이었어!",
 "t81": "셋, ==컷!== 마음에 안 들면 씬을 멈추고 ==감독==이 돼요. | 상대의 성격 다이얼을 돌리고 다시 찍으면, 같은 말에도 ==대답이 달라져요.==",
 "t65": "어제 그 말, 오늘도 같아?",
 "t12": "마지막 대사는, AI가 아니라 ==내가== 써요.",
 "t66": "기억은 안 나. 근데… 마음은 같아.",
 "t83": "씬 하나로 끝이 아니에요. | 다 한 씬은 저절로 ==내 씬==에 모이고, | 몇 개를 이어 붙이면 ==단막극== 한 편, | 계속 이어 가면 ==연속극==이 돼요.",
 "t84": "상황극을 하다가 ‘이거 내 얘긴데’ 싶으면 | ==내 무대==로 건너갈 수 있어요. | ==순한 맛==부터 천천히, 한 단계씩.",
 "t85": "그리고 내가 쓴 마지막 컷들을 모아 돌아보면, | 나를 ==조금 더== 알게 돼요.",
 "t16": "오늘은, ==씬 한 편==만. 마인드씬.",
 "t68": "들어 주셔서 감사합니다!",
}
WHO = {"t64": ("AI · 단짝 미소", BLUE), "t65": ("AI · 반장 지한", BLUE), "t66": ("나 · 도은", GOLD)}
NO_PIP = {"t60", "t68", "t64", "t65", "t66"}     # 본인 촬영 화면 · 극 중 대사에는 내레이터 창을 띄우지 않는다

AI_STEPS = ["질문 1", "질문 2", "질문 3", "질문 4", "고르고 고치기"]
HOW = ["① 고르기", "② 연기하기", "③ 컷!", "④ 마지막 컷"]

# 1. 나 소개 (본인 촬영으로 바꿀 자리)
mark("intro")
segment([(C3(60), 0, 10)], [("t60.wav", 0.3)], grade="eq=saturation=1.05", fin=0.05,
        overlays=[(rec_png("o_rec"), 0.0, 9.95, "fade"),
                  (tag_png("o_name", "김승아", "중학교 1학년 · 기획자"), 1.2, 5.6, "rise"),
                  (copy_png("o_open", ["오늘 소개할 서비스  ==마인드씬=="], 50, pos="t"), 6.0, 9.9, "slam")])
segment([(C1(1), 0.5, 5)], [("t61.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_dream", ["꿈 ·  ==아이돌 스토리 디렉터=="], 58), 0.3, 3.5, "slam")])
# 2. 문제 — 밤새 채팅, 남은 게 없다
mark("dark")
d71 = vd("t71.wav")
segment([(C1(2), 0, 5), (C2(1), 0, 2.2), (C2(2), 0, 5)], [("t71.wav", 0.2)], grade=COLD, letterbox=True,
        overlays=[(copy_png("o_chat", ["AI 캐릭터 채팅"], 84), 1.3, 3.0, "slam"),
                  (copy_png("o_night", ["==밤새=="], 120), 3.0, 4.3, "slam"),
                  (copy_png("o_none", ["내 이야기는,", "==한 줄도 없었다.=="], 72), d71 - 2.6, d71 + 0.4, "slam")],
        glitch=[(1.3, 1.55), (3.0, 3.25)], shake=[d71 - 2.6])
segment([(C2(12), 0, 5)], [("t4.wav", 0.15)], grade=COLD,
        overlays=[(copy_png("o_eye", ["기획자의 눈으로 보니"], 48, pos="t"), 0.2, 4.6, "fade"),
                  (word_at("o_w1", "끝이 없다", 213), 4.7, 8.7, "fade"),
                  (word_at("o_w2", "내가 없다", 640), 5.95, 8.7, "fade"),
                  (word_at("o_w3", "남는 게 없다", 1067), 7.2, 8.7, "fade")],
        flash=[4.7, 5.95, 7.2])
# 3. AI와 함께 구상한 과정 — 질문 넷 + 고르고 고치기
mark("ai")
segment([(C4(70), 0, 5), (C2(11), 0, 3)], [("t72.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_partner", ["AI = ==기획 파트너=="], 92), 3.1, vd("t72.wav") + 0.4, "slam")],
        kin=[StepBar(0.3, None, "AI와 기획하기", AI_STEPS, None)])
d = vd("t73.wav")
segment([(C4(71), 0, 5), (C3(22), 0, 5), (C3(22), 2.5, 5)], [("t73.wav", 0.15)], grade=WARM,
        kin=[StepBar(0, None, "AI와 기획하기", AI_STEPS, 0, slide=False),
             Chat(0.2, d * 0.62, "친구들이 부담 없이 마음을 꺼내는 방법이 있을까?", "연극 치료에서 쓰는 방법들이 있어. 상황극, 역할 바꾸기, 사이코드라마…"),
             Cards(d * 0.62, None, [("상황극", "명작 속 상황을 빌려 와요", GOLD, 0.5 + d * 0.0), ("내 무대", "내 장면을 직접 세워요", BLUE, d * 0.24)], x=70, y=250, w=360, h=110)])
d = vd("t74.wav")
segment([(C4(72), 0, 3.4), (C4(81), 0, 5)], [("t74.wav", 0.15)], grade=WARM,
        kin=[StepBar(0, None, "AI와 기획하기", AI_STEPS, 1, slide=False),
             Chat(0.2, d * 0.22, "명작 장면을 가져와도 괜찮을까?", "대사·이름은 빼고, 상황의 ‘종류’만 빌려 와 봐."),
             Layers(d * 0.22, None, [0.15, d * 0.17, d * 0.29, d * 0.55], x=70, y=170)])
d = vd("t75.wav")
segment([(C4(73), 0, 5), (C3(64), 0, 4)], [("t75.wav", 0.15)], grade=WARM,
        kin=[StepBar(0, None, "AI와 기획하기", AI_STEPS, 2, slide=False),
             Chat(0.2, d * 0.40, "AI가 이야기를 대신 끝내 버리면 어떡하지?", "AI는 상대역만 맡고, 결정적인 순간은 사용자에게 넘기자."),
             Cards(d * 0.40, None, [("AI = 상대 인물만", "내 말을 받아서 반응해요", BLUE, 0.3), ("결정적 한 걸음 = 나", "끝 대사도 내가 써요", GOLD, d * 0.3)], x=70, y=200, w=380, h=110)])
d = vd("t76.wav")
segment([(C4(74), 0, 5), (C2(13), 0, 3)], [("t76.wav", 0.15)], grade=WARM,
        kin=[StepBar(0, None, "AI와 기획하기", AI_STEPS, 3, slide=False),
             Chat(0.2, d * 0.5, "위험을 막는 규칙을 같이 만들어 줄래?", "진단하지 않기, 점수 매기지 않기, 기록은 기기에만."),
             Badges(d * 0.5, None, [("진단 0", 0.1), ("점수 0", 0.45), ("기록은 내 폰에만", 0.9), ("아픈 얘기는 캐묻지 않기", 1.5)], x=70, y=200)])
d = vd("t77.wav")
segment([(C4(81), 0, 5), (C4(75), 0, 5)], [("t77.wav", 0.15)], grade=WARM, fout=0.08,
        overlays=[(copy_png("o_pick", ["답은 ==내가== 고르고 고쳤다"], 64, pos="t"), d * 0.08, d * 0.55, "slam")],
        kin=[StepBar(0, d * 0.08, "AI와 기획하기", AI_STEPS, 4, slide=False), Cycle(d * 0.12, None, cx=300, cy=360, r=140)])
# 4. 타이틀
mark("title")
segment([(C2(4), 0, 5)], [("t6.wav", 0.6)], grade=WARM + ",eq=brightness=-0.18:enable='gte(t,3.7)'", total=5.4,
        overlays=[(copy_png("o_stage", ["내 안의 무대, 한 씬씩."], 40, pos="b"), 0.6, 5.4, "fade"),
                  (copy_png("o_title", ["==마인드씬=="], 150), 3.75, 5.4, "slam")],
        flash=[3.75], shake=[3.75], fin=0.05)
# 5. 씬 한 편 = 네 단계 (〈너의 이름은.〉으로 직접 보여 주기)
mark("how")
d = vd("t79.wav")
segment([(C4(76), 0, 5), (C3(61), 0, 5)], [("t79.wav", 0.15)], grade=WARM,
        overlays=[(slate_png("o_slate", "SCENE  ·  상황극 · 코미디", "〈너의 이름은.〉 어제 내가 뭐라고 했다고?"), d * 0.62, d * 0.62 + 2.0, "slam")],
        phone=[(APP, 7.0, 11.6, 0.6, d * 0.58)],
        kin=[StepBar(0.1, None, "씬 하나 = 5분", HOW, 0),
             Cards(0.4, d * 0.6, [("추리", "", (180, 160, 255), 0.4), ("로맨스", "", (255, 150, 180), 0.75), ("코미디", "", GOLD, 1.1)], x=110, y=150, w=200, gap=16, h=66, vertical=True)])
d = vd("t80.wav") + 0.2 + vd("t64.wav")
segment([(C3(61), 2.0, 5), (C3(62), 0, 5)], [("t80.wav", 0.1), ("t64.wav", vd("t80.wav") + 0.25)], grade="eq=contrast=1.05", letterbox=True,
        overlays=[(role_tag("o_r1", [("도은", 500, 150, "me"), ("미소", 900, 120, "ai")]), vd("t80.wav") + 0.2, d + 0.3, "slam")],
        phone=[(APP, 12.3, 30.0, 0.3, vd("t80.wav"))],
        kin=[StepBar(0, None, "씬 하나 = 5분", HOW, 1, slide=False),
             Cards(1.4, vd("t80.wav"), [("나 = 주인공", "도은을 연기해요", GOLD, 0.0), ("AI = 상대역", "미소 · 반장 · 로운", BLUE, 1.2)], x=40, y=190, w=400, gap=20, h=110, vertical=True)])
d = vd("t81.wav")
segment([(C4(77), 0, 5), (C3(63), 0, 5)], [("t81.wav", 0.1), ("t65.wav", d + 0.25)], grade="eq=contrast=1.06", letterbox=True,
        overlays=[(copy_png("o_cut", ["==컷!=="], 170), 0.35, 1.7, "slam"),
                  (role_tag("o_r3", [("반장", 680, 120, "ai"), ("도은", 400, 330, "me")]), d + 0.2, d + 2.9, "fade"),
                  (copy_png("o_you", ["==너였다면?=="], 130), d + 2.9, d + 4.3, "slam")],
        shake=[0.35, d + 2.9], flash=[0.35, d + 2.9], total=d + 4.4,
        phone=[(APP, 33.3, 39.6, 1.9, d)],
        kin=[StepBar(0, None, "씬 하나 = 5분", HOW, 2, slide=False), Dial(1.9, d, 2.6, cx=250, cy=290)])
d = vd("t12.wav")
segment([(C3(64), 0, 5), (C4(73), 2.5, 5)], [("t12.wav", 0.1), ("t66.wav", d + 0.35)], grade=WARM, letterbox=True,
        overlays=[(copy_png("o_last", ["마지막 대사는 ==내가== 쓴다"], 60, pos="t"), 0.2, d + 0.3, "slam"),
                  (role_tag("o_r4", [("도은 · 마지막 컷", 560, 240, "me")]), d + 0.4, d + 0.35 + vd("t66.wav") + 0.2, "fade")],
        phone=[(APP, 103.5, 115.4, d + 0.4, d + 0.35 + vd("t66.wav") + 0.2)],
        kin=[StepBar(0, None, "씬 하나 = 5분", HOW, 3, slide=False)])
# 6. 확장 단계도 — 씬 한 편에서 연속극, 그리고 돌아보기까지
mark("grow")
d = vd("t83.wav")
segment([(C4(78), 0, 5), (C4(79), 0, 2.8)], [("t83.wav", 0.15)], grade=WARM,
        kin=[Ladder(0.1, None, [0.1, d * 0.3, d * 0.58, d * 0.8], x=56, base=540)])
d = vd("t84.wav")
segment([(C3(22), 0, 5), (C4(71), 1, 5)], [("t84.wav", 0.15)], grade=WARM,
        kin=[Bridge(0.1, None, cx=430, cy=270)])
d = vd("t85.wav")
segment([(C4(80), 0, 5)], [("t85.wav", 0.15)], grade=WARM, total=d + 1.8,
        phone=[(APPS, 6.0, 16.0, 2.0, d + 1.75)],
        kin=[Ladder(0, 2.0, [0, 0, 0, 0, 0.5], x=56, base=540),
             StepBar(0.1, None, "내 씬", ["고르기", "씬 하기", "모이기", "잇기", "고치기", "돌아보기"], 5)])
# 7. 엔딩
mark("end")
segment([(C2(13), 0, 5)], [], total=2.6, grade=WARM,
        overlays=[(copy_png("o_hero", ["주인공은 ==나=="], 104), 0.3, 2.6, "slam")], shake=[0.3])
segment([(C2(9), 2.5, 5)], [("t16.wav", 0.3)], grade=WARM + ",eq=brightness=-0.12:enable='gte(t,1.6)'", total=5.0,
        overlays=[(copy_png("o_end2", ["==마인드씬=="], 150, sub="내 안의 무대, 한 씬씩.   teen-dramaro.vercel.app"), 1.7, 5.0, "slam")],
        flash=[1.7], fout=0.3)
segment([(C3(60), 6.5, 10)], [("t68.wav", 0.3)], total=3.0, fout=0.8,
        overlays=[(rec_png("o_rec2"), 0.0, 3.0, "fade")])

# ── 이어 붙이기
lst = os.path.join(OUT, "list.txt"); open(lst, "w").write("".join(f"file '{s}'\n" for s in SEGS))
silent = os.path.join(OUT, "silent.mp4"); run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent])
TOTAL = dur(silent)

# ── 음악 + 효과음 (v3와 같은 합성)
N = int(TOTAL * SR) + SR; t = np.arange(N) / SR; mix = np.zeros(N)
def env(a, b, atk=1.2, rel=1.2): return np.clip((t - a) / atk, 0, 1) * np.clip((b - t) / rel, 0, 1)
def pad(freqs, a, b, amp=0.05, bright=1.0):
    s = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) + 0.3 * bright * np.sin(2 * np.pi * 2 * f * t) for f in freqs)
    return amp * env(a, b) * s * (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * t))
def put(s, at):
    i0 = int(at * SR); n = len(s); mix[i0:i0 + n] += s[: max(0, min(n, N - i0))]
def note(f, at, d=0.8, amp=0.035):
    tt = np.arange(int(d * SR)) / SR; put(amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 4.5) * (1 - np.exp(-tt * 200)), at)
def kick(at, amp=0.32):
    tt = np.arange(int(0.35 * SR)) / SR; f = 50 + 90 * np.exp(-tt * 30)
    put(amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), at)
def boom(at, amp=0.6):
    tt = np.arange(int(1.6 * SR)) / SR; f = 55 * np.exp(-tt * 1.5) + 30
    put(amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.8) + amp * 0.4 * np.random.randn(len(tt)) * np.exp(-tt * 18), at)
def hit(at, amp=0.33):
    tt = np.arange(int(0.9 * SR)) / SR
    put(amp * (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 9) + 0.5 * np.random.randn(len(tt)) * np.exp(-tt * 25) + 0.5 * np.sin(2 * np.pi * 880 * tt) * np.exp(-tt * 6)), at)
def glitch(at, amp=0.25):
    tt = np.arange(int(0.3 * SR)) / SR
    put(amp * np.sign(np.sin(2 * np.pi * (300 + 900 * np.random.rand()) * tt)) * (np.random.rand(len(tt)) > 0.5) * np.exp(-tt * 6), at)
def pop(at, amp=0.09):
    tt = np.arange(int(0.12 * SR)) / SR; f = 900 + 1400 * np.exp(-tt * 40)
    put(amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38), at)
def riser(a, b, amp=0.12):
    m = (t >= a) & (t < b); x = (t[m] - a) / (b - a)
    mix[m] += amp * x ** 2 * (np.random.randn(m.sum()) * 0.6 + np.sin(2 * np.pi * (200 + 1200 * x) * t[m]))
M = MARK
Am, F_, C_, G_ = (110, 164.81, 220, 261.63), (87.31, 130.81, 174.61, 220), (130.81, 196, 261.63, 329.63), (98, 146.83, 196, 246.94)
prog = [C_, G_, Am, F_]; bar = 2.2
def groove(a, b, arp=True, kicks=True, amp=0.03):
    k = 0; x = a
    while x < b:
        ch = prog[k % 4]; mix[:] += pad(ch, x, min(b, x + bar + 0.5), amp, 1.0)
        for j, f in enumerate([ch[2] * 2, ch[3] * 2, ch[1] * 2, ch[3] * 2]):
            if arp and x + j * bar / 4 < b: note(f, x + j * bar / 4)
        if kicks:
            for j in range(4):
                if x + j * bar / 4 < b: kick(x + j * bar / 4, 0.2)
        x += bar; k += 1
mix += pad(C_, M["intro"], M["dark"] + 0.5, 0.03, 0.8)
mix += pad(Am, M["dark"] - 0.5, M["ai"] + 0.8, 0.04, 0.3)
groove(M["ai"], M["title"], arp=True, kicks=False, amp=0.025)            # 생각하는 구간: 아르페지오만
x = M["ai"] + 4
while x < M["title"]: kick(x, 0.16); x += 0.55                           # 질문이 쌓이며 맥박
riser(M["title"] - 1.2, M["title"] + 3.75, 0.11)
groove(M["title"] + 3.75, M["grow"])
groove(M["grow"], M["end"], kicks=True)
groove(M["end"], TOTAL - 0.5, kicks=False)
for kind, at in SFX: {"boom": boom, "hit": hit, "glitch": glitch, "pop": pop}[kind](at)

vo = np.zeros(N)
for f, at in VOX:
    with wave.open(os.path.join(VO, f)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
    i0 = int(at * SR); vo[i0:i0 + len(a)] += a[: max(0, min(len(a), N - i0))]
ev = np.convolve(np.abs(vo), np.ones(SR // 5) / (SR // 5), mode="same")
final_a = np.tanh((mix * (1 - 0.55 * np.clip(ev * 12, 0, 1)) * 0.9 + vo * 1.35) * 1.1) * 0.95
fa = os.path.join(OUT, "mix.wav")
with wave.open(fa, "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((final_a[: int(TOTAL * SR)] * 32767).astype(np.int16).tobytes())

# ── 자막 · 내레이터 창 요소
def in_phone(a, b): return any(s < b and a < e for s, e in PHONE_ON)
narr = []
for f, at in VOX:
    k = f[:-4]; b = at + vd(f)
    chunks = [c.strip() for c in SUB[k].split("|")]; tot = sum(len(c) for c in chunks); s = at
    for c in chunks:
        e = s + (b - at) * len(c) / tot
        KIN.append(Sub(s - 0.05, e + 0.12, c, WHO.get(k))); s = e
    if k not in NO_PIP: narr.append((at - 0.2, b + 0.4))
# 붙은 구간은 합치고, 폰 화면이 뜬 곳은 뺀다
merged = []
for a, b in sorted(narr):
    if merged and a <= merged[-1][1] + 0.8: merged[-1][1] = max(merged[-1][1], b)
    else: merged.append([a, b])
pip = []
for a, b in merged:
    cuts = sorted([(s, e) for s, e in PHONE_ON if s < b and a < e]); cur = a
    for s, e in cuts:
        if s > cur + 0.6: pip.append((cur, s))
        cur = max(cur, e)
    if b > cur + 0.6: pip.append((cur, b))
for a, b in pip:
    el = PipTag(a, b); el.t0 = 0; KIN.append(el)

# ── 최종 합성: 바탕 영상 + 내레이터 창(ffmpeg) + 키네틱 레이어(파이썬 프레임) + 소리
on = "+".join(f"between(t,{a:.2f},{b:.2f})" for a, b in pip) or "0"
final = os.path.join(ROOT, "mindscene_v4_doc_720p.mp4")
nfr = int(TOTAL * FPS)
cmd = ["ffmpeg", "-y", "-i", silent, "-stream_loop", "-1", "-i", os.path.join(V3, "c25.mp4"),
       "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", fa,
       "-filter_complex", f"[1:v]scale=352:198,setsar=1,fps={FPS}[pip];[0:v][pip]overlay=x={W-36-352}:y={H-36-198}:enable='{on}':shortest=1[a0];[a0][2:v]overlay=0:0:shortest=1,format=yuv420p",
       "-map", "3:a", "-t", f"{TOTAL:.3f}", *ENC, "-c:a", "aac", "-b:a", "192k", final]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
KIN.sort(key=lambda e: e.a)
for fr in range(nfr):
    tt = fr / FPS
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for el in KIN:
        if el.active(tt): el.draw(L, tt)
    proc.stdin.write(L.tobytes())
    if fr % 600 == 0: print("frame", fr, "/", nfr, flush=True)
proc.stdin.close(); proc.wait()
print("DONE", final, f"{TOTAL:.1f}s", len(SEGS))
for k, v in MARK.items(): print(k, f"{v:.1f}")
