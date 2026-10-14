#!/usr/bin/env python3
"""마인드씬 기획 영상 v3 — 연구 · 두 기법 · 씬 조립. 720p 30fps. DOC=1 이면 다큐 배치."""
import os, re, subprocess, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
AI, VO, G, OUT = (os.path.join(ROOT, d) for d in ("ai", "vo", "gfx", "out"))
for d in (G, OUT): os.makedirs(d, exist_ok=True)
OLD = os.path.join(ROOT, "../video/ai")          # v1 영상의 클립(같은 주인공)
APP = os.path.join(ROOT, "../video/rec/app3.webm")
APP4 = os.path.join(ROOT, "../video/rec4/app4.webm")
APP5 = os.path.join(ROOT, "../video/rec5/app5.webm")
APP6 = os.path.join(ROOT, "../video/rec6/app6.webm")
V2 = os.path.join(ROOT, "../video2/ai")
DOC = os.environ.get("DOC") == "1"
W, H, FPS, SR = 1280, 720, 30, 44100
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
def F(size, w="bold"): return ImageFont.truetype(FONT, size, index={"light": 8, "reg": 0, "med": 2, "semi": 4, "bold": 6, "heavy": 6}[w])
GOLD, PURPLE, INK = (255, 210, 122), (196, 166, 255), (250, 246, 255)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(" ".join(map(str, cmd))[:600]); print(r.stderr[-2500:]); raise SystemExit(1)
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)

# ── 텍스트 PNG (광고 카피) ─────────────────────────────
def parts(s): return [(p, i % 2 == 1) for i, p in enumerate(re.split(r"==", s)) if p]
def copy_png(name, lines, size=84, pos="c", glow=True, sub=None, subsize=30):
    """lines: 여러 줄, ==금색==. pos: c(중앙) / b(하단) / tl(좌상단)"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = F(size, "heavy"); lh = int(size * 1.22)
    blocks = [(ln, f) for ln in lines]
    total = lh * len(lines) + (subsize * 1.9 if sub else 0)
    y0 = {"c": H / 2 - total / 2, "b": H - total - (180 if DOC else 70), "t": 70}[pos]
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shadow)
    y = y0
    for ln, ff in blocks:
        tw = sum(d.textlength(p, font=ff) for p, _ in parts(ln)); x = W / 2 - tw / 2
        for p, on in parts(ln):
            sd.text((x, y + 4), p, font=ff, fill=(0, 0, 0, 230))
            if glow and on: sd.text((x, y), p, font=ff, fill=GOLD + (200,))
            x += d.textlength(p, font=ff)
        y += lh
    shadow = shadow.filter(ImageFilter.GaussianBlur(10)); im = Image.alpha_composite(im, shadow); d = ImageDraw.Draw(im)
    y = y0
    for ln, ff in blocks:
        tw = sum(d.textlength(p, font=ff) for p, _ in parts(ln)); x = W / 2 - tw / 2
        for p, on in parts(ln):
            d.text((x, y), p, font=ff, fill=GOLD if on else INK, stroke_width=max(2, size // 22), stroke_fill=(28, 12, 44))
            x += d.textlength(p, font=ff)
        y += lh
    if sub:
        fs = F(subsize, "semi"); tw = d.textlength(sub, font=fs)
        d.text((W / 2 - tw / 2, y + 6), sub, font=fs, fill=(225, 215, 245), stroke_width=1, stroke_fill=(10, 5, 20))
    p = os.path.join(G, name + ".png"); im.save(p); return p

def tag_png(name, text, sub=None):
    """좌하단 이름표 (로워서드)."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = F(40, "bold"); tw = d.textlength(text, font=f)
    dy = -150 if DOC else 0
    d.rectangle([70, 560 + dy, 76, 640 + dy], fill=GOLD)
    d.text((96, 556 + dy), text, font=f, fill=INK, stroke_width=1, stroke_fill=(0, 0, 0))
    if sub: d.text((98, 608 + dy), sub, font=F(24, "semi"), fill=GOLD, stroke_width=1, stroke_fill=(0, 0, 0))
    p = os.path.join(G, name + ".png"); im.save(p); return p

def slate_png(name, a, b):
    """씬 슬레이트: SCENE · 시라노"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fa, fb = F(26, "bold"), F(56, "heavy")
    wa, wb = d.textlength(a, font=fa), d.textlength(b, font=fb)
    bw = max(wa, wb) + 80
    d.rounded_rectangle([W / 2 - bw / 2, 250, W / 2 + bw / 2, 430], radius=18, fill=(12, 8, 20, 225), outline=GOLD, width=3)
    for k in range(8): d.polygon([(W / 2 - bw / 2 + k * bw / 8, 250), (W / 2 - bw / 2 + k * bw / 8 + bw / 16, 250), (W / 2 - bw / 2 + k * bw / 8 + bw / 16 + 20, 228), (W / 2 - bw / 2 + k * bw / 8 + 20, 228)], fill=INK if k % 2 == 0 else (30, 24, 40))
    d.text((W / 2 - wa / 2, 280), a, font=fa, fill=GOLD)
    d.text((W / 2 - wb / 2, 330), b, font=fb, fill=INK)
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

# ── 세그먼트 ─────────────────────────────────────────
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), "-an"]
SEGS, VOX, SFX = [], [], []      # 영상, (vo파일, 절대시각), (종류, 절대시각)
T = [0.0]                        # 현재 타임라인 위치

def clip_chain(srcs, total):
    """[(파일, 시작, 끝)] 을 이어 total 초로 늘림(슬로모). 결과 라벨 [base]."""
    raw = sum(b - a for _, a, b in srcs); k = total / raw
    ins, fc = [], ""
    for i, (s, a, b) in enumerate(srcs):
        if s.endswith(".png"):   # 정지 그림 → 패닝 + 줌으로 움직이게
            d = (b - a) * k
            ins += ["-loop", "1", "-t", f"{d:.3f}", "-i", s]
            fc += (f"[{i}:v]scale=1472:828,setsar=1,fps={FPS},crop={W}:{H}:x='192*t/{d:.3f}':y='108*(1-t/{d:.3f})',"
                   f"scale=w='{W}*(1+0.06*t/{d:.3f})':h=-1:eval=frame,crop={W}:{H},setpts=PTS-STARTPTS[c{i}];")
            continue
        ins += ["-ss", f"{a}", "-t", f"{b-a}", "-i", s]
        fc += f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},setpts=(PTS-STARTPTS)*{k:.4f}[c{i}];"
    fc += "".join(f"[c{i}]" for i in range(len(srcs))) + f"concat=n={len(srcs)}:v=1:a=0,trim=0:{total:.3f},setpts=PTS-STARTPTS[base0];"
    return ins, fc

def segment(srcs, vos, total=None, overlays=(), shake=(), flash=(), grade="", letterbox=False, pad=0.22, fin=0.2, fout=0.2, phone=None, glitch=()):
    """vos: [(vo파일, 오프셋)] / overlays: [(png, 등장, 퇴장, 효과)] 효과: slam|fade|rise
       shake/flash: 세그먼트 내 시각 리스트 / phone: (앱시작, 앱끝, 등장, 퇴장)"""
    vend = max([o + dur(os.path.join(VO, v)) for v, o in vos] or [0])
    total = total or (vend + pad)
    ins, fc = clip_chain(srcs, total); n = len(srcs); last = "base0"
    # 흔들림: 살짝 키운 뒤 crop 위치를 진동
    if shake:
        ex = "+".join(f"if(between(t,{s},{s+0.45}),14*sin(95*t)*exp(-(t-{s})*7),0)" for s in shake)
        ey = ex.replace("sin(95", "cos(83")
        fc += f"[{last}]scale=1320:743,crop={W}:{H}:x='20+{ex}':y='11+{ey}'[sk];"; last = "sk"
    if grade: fc += f"[{last}]{grade}[gr];"; last = "gr"
    for q, (gs, ge) in enumerate(glitch):
        fc += (f"[{last}]rgbashift=rh=14:bh=-14:gv=4:enable='between(t,{gs},{ge})',"
               f"noise=alls=40:allf=t:enable='between(t,{gs},{ge})'[gl{q}];"); last = f"gl{q}"
    phones = phone if isinstance(phone, list) else ([phone] if phone else [])
    for pi, ph in enumerate(phones):
        app, a, b, s, e = ph if len(ph) == 5 else (APP, *ph)
        ins += ["-ss", f"{a}", "-t", f"{b-a}", "-i", app, "-loop", "1", "-i", phone_mask(), "-loop", "1", "-i", phone_frame_png()]
        k = (e - s) / (b - a)
        fc += (f"[{n}:v]fps={FPS},crop=390:844:0:0,scale=296:640:flags=lanczos,setpts=(PTS-STARTPTS)*{k:.4f}+{s}/TB,format=rgba[ap{pi}];"
               f"[{n+1}:v]format=gray,scale=296:640[am{pi}];[ap{pi}][am{pi}]alphamerge[apm{pi}];"
               f"[{last}]boxblur=12:1:enable='between(t,{s},{e})',eq=brightness=-0.12:enable='between(t,{s},{e})'[pb{pi}];"
               f"[pb{pi}][{n+2}:v]overlay=0:0:enable='between(t,{s},{e})'[pf{pi}];"
               f"[pf{pi}][apm{pi}]overlay=x=492:y='if(lt(t,{s}+0.3),40+700*(1-(t-{s})/0.3)^2,40)':enable='between(t,{s},{e})':eof_action=pass[ph{pi}];")
        last = f"ph{pi}"; n += 3
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
    if flash:
        for q, s in enumerate(flash):
            fc += (f"color=white:s={W}x{H}:d={total:.3f}:r={FPS},format=rgba,"
                   f"fade=t=in:st={max(0,s-0.03):.3f}:d=0.03:alpha=1,fade=t=out:st={s+0.02:.3f}:d=0.35:alpha=1[wh{q}];"
                   f"[{last}][wh{q}]overlay=0:0[fl{q}];"); last = f"fl{q}"
    fc += f"[{last}]vignette=PI/5,fade=t=in:st=0:d={fin},fade=t=out:st={total-fout:.3f}:d={fout},format=yuv420p"
    out = os.path.join(OUT, f"s{len(SEGS):02d}.mp4")
    run(["ffmpeg", "-y", *ins, "-filter_complex", fc, "-t", f"{total:.3f}", *ENC, out])
    for v, o in vos: VOX.append((v, T[0] + o))
    for s in shake: SFX.append(("boom", T[0] + s))
    for gs, ge in glitch: SFX.append(("glitch", T[0] + gs))
    for s in flash: SFX.append(("hit", T[0] + s))
    for png, s, e, fx in overlays:
        if fx == "slam": SFX.append(("hit", T[0] + s))
    SEGS.append(out); T[0] += total
    return total

C = lambda i: os.path.join(AI if i >= 20 else V2, f"c{i}.mp4")
K = lambda i: os.path.join(AI if i >= 20 else V2, f"k{i}.png")
O = lambda i: os.path.join(OLD, f"v{i}.mp4")
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
    """tags: [(텍스트, 중심x, y, 'me'|'ai')] — 인물 위 역할 이름표 + 아래 꼬리"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for txt, cx, y, kind in tags:
        badge = {"me": "나", "ai": "AI", "story": "씬"}[kind]
        col = {"me": GOLD, "ai": (150, 200, 255), "story": (210, 200, 230)}[kind]
        fb, ft = F(24, "heavy"), F(26, "bold")
        bw = d.textlength(badge, font=fb) + 20; tw = d.textlength(txt, font=ft)
        w0 = bw + tw + 34; x0 = cx - w0 / 2
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([x0, y + 4, x0 + w0, y + 52], radius=24, fill=(0, 0, 0, 200))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(8))); d = ImageDraw.Draw(im)
        d.rounded_rectangle([x0, y, x0 + w0, y + 48], radius=24, fill=(14, 10, 24, 235), outline=col, width=3)
        d.rounded_rectangle([x0 + 7, y + 7, x0 + 7 + bw, y + 41], radius=17, fill=col)
        d.text((x0 + 17, y + 9), badge, font=fb, fill=(20, 12, 30))
        d.text((x0 + bw + 20, y + 8), txt, font=ft, fill=INK)
        d.polygon([(cx - 10, y + 48), (cx + 10, y + 48), (cx, y + 62)], fill=col)
    p = os.path.join(G, name + ".png"); im.save(p); return p

COLD = "eq=saturation=0.85:contrast=1.06,colorbalance=bs=0.08:bm=0.04"
WARM = "eq=saturation=1.1:contrast=1.05,colorbalance=rs=0.05:rm=0.03"

def word_at(name, txt, x, y=520, size=54):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); f = F(size, "heavy")
    d = ImageDraw.Draw(im); tw = d.textlength(txt, font=f)
    if DOC and y > 400: y -= 110
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
    """tags: [(텍스트, 중심x, y, 'me'|'ai')] — 인물 위 역할 이름표 + 아래 꼬리"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for txt, cx, y, kind in tags:
        badge = {"me": "나", "ai": "AI", "story": "씬"}[kind]
        col = {"me": GOLD, "ai": (150, 200, 255), "story": (210, 200, 230)}[kind]
        fb, ft = F(24, "heavy"), F(26, "bold")
        bw = d.textlength(badge, font=fb) + 20; tw = d.textlength(txt, font=ft)
        w0 = bw + tw + 34; x0 = cx - w0 / 2
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([x0, y + 4, x0 + w0, y + 52], radius=24, fill=(0, 0, 0, 200))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(8))); d = ImageDraw.Draw(im)
        d.rounded_rectangle([x0, y, x0 + w0, y + 48], radius=24, fill=(14, 10, 24, 235), outline=col, width=3)
        d.rounded_rectangle([x0 + 7, y + 7, x0 + 7 + bw, y + 41], radius=17, fill=col)
        d.text((x0 + 17, y + 9), badge, font=fb, fill=(20, 12, 30))
        d.text((x0 + bw + 20, y + 8), txt, font=ft, fill=INK)
        d.polygon([(cx - 10, y + 48), (cx + 10, y + 48), (cx, y + 62)], fill=col)
    p = os.path.join(G, name + ".png"); im.save(p); return p

COLD = "eq=saturation=0.85:contrast=1.06,colorbalance=bs=0.08:bm=0.04"
WARM = "eq=saturation=1.1:contrast=1.05,colorbalance=rs=0.05:rm=0.03"
DARK = "eq=contrast=1.1:saturation=0.9"
MARK = {}   # 구간 표시(음악용)
def mark(k): MARK[k] = T[0]

# ───────────── 타임라인 ─────────────
# 0. 오프닝 — 나의 영상 (실제 촬영으로 교체할 자리)
mark("intro")
segment([(C(60), 0, 10)], [("t60.wav", 0.3)], grade="eq=saturation=1.05", fin=0.05, total=9.95,
        overlays=[(rec_png("o_rec"), 0.0, 9.95, "fade"),
                  (tag_png("o_name", "김승아", "중학교 1학년 · 기획자"), 1.4, 6.0, "rise"),
                  (copy_png("o_open", ["오늘 소개할 서비스  ==마인드씬=="], 50, pos="b"), 6.2, 9.8, "slam")])
segment([(O(1), 0.5, 5)], [("t61.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_dream", ["꿈 ·  ==아이돌 스토리 디렉터=="], 58), 0.3, 3.6, "slam")])
# 1. character.ai · 제타
mark("dark")
segment([(O(2), 0, 5), (C(1), 0, 2.2)], [("t32.wav", 0.2)], grade=COLD, letterbox=True,
        overlays=[(copy_png("o_cai", ["character.ai"], 92), 2.5, 3.85, "slam"),
                  (copy_png("o_zeta", ["제타"], 110), 3.85, 5.2, "slam"),
                  (copy_png("o_none", ["밤새 대화했는데,", "==내 이야기는 한 줄도 없었다.=="], 64), 6.6, 10.2, "slam")],
        glitch=[(2.5, 2.75), (3.85, 4.1)], shake=[6.6])
# 2. 세 가지 빈칸
segment([(C(2), 0, 2.5), (C(12), 0, 5)], [("t4.wav", 0.15)], grade=COLD,
        overlays=[(copy_png("o_eye", ["기획자의 눈으로 보니"], 48, pos="t"), 0.2, 4.6, "fade"),
                  (word_at("o_w1", "끝이 없다", 213), 4.7, 8.9, "fade"),
                  (word_at("o_w2", "내가 없다", 640), 5.95, 8.9, "fade"),
                  (word_at("o_w3", "남는 게 없다", 1067), 7.2, 8.9, "fade")],
        flash=[4.7, 5.95, 7.2])
# 3. 연구
mark("research")
segment([(K(21), 0, 4.2), (C(11), 0, 3.4)], [("t33.wav", 0.15)], grade=WARM,
        overlays=[(copy_png("o_res", ["==연구==했다"], 96), 0.2, 2.2, "slam"),
                  (copy_png("o_two", ["부담 없이 마음을 꺼내는 ==두 가지 방법=="], 50, pos="b"), 5.2, 7.2, "slam")])
# 4. 기법 ① 상황극
segment([(C(22), 0, 5), (C(61), 0, 4), (C(63), 0, 4)], [("t39.wav", 0.15)], grade=WARM,
        overlays=[(copy_png("o_t1", ["기법 ①  ==상황극=="], 60, pos="t"), 0.1, 6.0, "slam"),
                  (word_at("o_m1", "영화", 330, 300, 72), 1.95, 4.6, "fade"),
                  (word_at("o_m2", "고전", 640, 300, 72), 2.65, 4.6, "fade"),
                  (word_at("o_m3", "만화", 950, 300, 72), 3.25, 4.6, "fade"),
                  (copy_png("o_conf", ["명작의 ==갈등 장면==  →  ==우리 일상=="], 52, pos="b"), 4.7, 8.6, "rise"),
                  (copy_png("o_real", ["==현실감=="], 140), 9.7, 12.7, "slam")],
        flash=[1.95, 2.65, 3.25], shake=[9.7], phone=[(APP4, 13.6, 18.5, 6.2, 9.3)])
# 5. 기법 ② 사이코드라마
segment([(K(24), 0, 5), (C(22), 2.5, 5)], [("t35.wav", 0.15)], grade="eq=saturation=0.95:contrast=1.04",
        overlays=[(copy_png("o_t2", ["기법 ②  ==사이코드라마=="], 60, pos="t"), 0.1, 3.6, "slam"),
                  (copy_png("o_one", ["마음에 남은 ==장면 하나==,", "한 걸음 떨어져서"], 52, pos="b"), 3.6, 8.9, "rise")],
        phone=[(APP4, 8.1, 10.7, 6.0, 8.9)])
# 6. 결정타
mark("climax")
segment([(C(23), 0, 5)], [("t36.wav", 0.15)], grade=WARM,
        overlays=[(copy_png("o_kick", ["결정타"], 120), 1.2, 2.9, "slam"),
                  (copy_png("o_asm", ["둘을 ==씬 하나==로 조립"], 86), 2.95, 6.3, "slam"),
                  (word_at("o_s1", "시작", 340), 6.4, 9.2, "fade"),
                  (word_at("o_s2", "흔들림", 640), 6.7, 9.2, "fade"),
                  (word_at("o_s3", "마지막 컷", 940), 7.5, 9.2, "fade")],
        flash=[1.2, 2.95], shake=[1.2, 2.95])
# 7. 타이틀
mark("title")
segment([(C(4), 0, 5)], [("t6.wav", 0.6)], grade=WARM + ",eq=brightness=-0.18:enable='gte(t,3.7)'", total=5.4,
        overlays=[(copy_png("o_stage", ["내 안의 무대, 한 씬씩."], 40, pos="b"), 0.6, 5.4, "fade"),
                  (copy_png("o_title", ["==마인드씬=="], 150), 3.75, 5.4, "slam")],
        flash=[3.75], shake=[3.75], fin=0.05)
# 8. 드라마 〈너의 이름은.〉 — 나 = 도은, AI(ChatGPT API) = 미소 · 반장
mark("drama")
segment([(C(61), 0, 5)], [("t62.wav", 0.2)], grade="eq=contrast=1.05", letterbox=True,
        overlays=[(slate_png("o_slate", "SCENE  ·  상황극 · 코미디", "〈너의 이름은.〉 어제 내가 반장한테 뭐라고 했다고?"), 0.15, 3.0, "slam")])
segment([(C(61), 2.0, 5), (C(62), 0, 5)], [("t69.wav", 0.1), ("t64.wav", 9.1)], grade="eq=contrast=1.05", letterbox=True, total=13.8,
        overlays=[(copy_png("o_gpt", ["AI 상대역 = ==ChatGPT API=="], 46, pos="t"), 1.6, 8.8, "rise"),
                  (role_tag("o_r1", [("도은", 500, 150, "me"), ("미소", 900, 120, "ai")]), 0.4, 8.9, "slam")],
        phone=[(APP6, 3.6, 8.2, 9.0, 13.7)])
segment([(C(63), 0, 5)], [("t65.wav", 0.2), ("t11.wav", 2.4)], grade="eq=contrast=1.08", letterbox=True,
        overlays=[(role_tag("o_r3", [("반장", 680, 120, "ai"), ("도은", 400, 330, "me")]), 0.2, 6.0, "fade"),
                  (copy_png("o_you", ["==너였다면?=="], 130), 6.15, 7.4, "slam")], shake=[6.15], flash=[6.15])
segment([(C(64), 0, 5)], [("t12.wav", 0.1), ("t66.wav", 3.1)], grade=WARM, letterbox=True,
        overlays=[(copy_png("o_last", ["마지막 대사는 ==내가== 쓴다"], 60, pos="t"), 0.3, 3.0, "slam"),
                  (role_tag("o_r4", [("도은 · 마지막 컷", 560, 240, "me")]), 3.1, 7.6, "fade"),
                  *([] if DOC else [(copy_png("o_line", ["「기억은 안 나. 근데… 마음은 같아.」"], 40, pos="b"), 3.2, 7.6, "fade")])])
# 9. AI에게 물은 질문 (요강 ③)
mark("payoff")
def bubble_png(name, text, y):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); f = F(34, "bold")
    tw = d.textlength(text, font=f); x0 = W - 90 - tw - 48
    if DOC: y -= 60
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([x0, y + 6, W - 90, y + 76], radius=30, fill=(0, 0, 0, 200))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(10))); d = ImageDraw.Draw(im)
    d.rounded_rectangle([x0, y, W - 90, y + 70], radius=30, fill=(255, 210, 122, 245))
    d.polygon([(W - 120, y + 70), (W - 96, y + 70), (W - 100, y + 88)], fill=(255, 210, 122, 245))
    d.text((x0 + 24, y + 14), text, font=f, fill=(30, 18, 40))
    p = os.path.join(G, name + ".png"); im.save(p); return p
segment([(K(21), 0, 6), (C(11), 0, 5)], [("t67.wav", 0.15)], grade=WARM,
        overlays=[(copy_png("o_askai", ["AI에게 이렇게 ==물었다=="], 56, pos="t"), 0.2, 3.6, "slam"),
                  (bubble_png("o_q1", "부담 없이 마음을 꺼내는 연극 방법이 있을까?", 230), 3.6, 11.6, "rise"),
                  (bubble_png("o_q2", "위험을 막는 규칙을 같이 만들어 줄래?", 340), 7.1, 11.6, "rise"),
                  (copy_png("o_pick", ["답은 ==내가== 고르고 고쳤다"], 62, pos="b"), 11.7, 13.4, "slam")])
# 10. 부담 없이 → 내면 이야기
segment([(C(9), 0, 5), (K(24), 0, 3)], [("t37.wav", 0.15)], grade=WARM,
        overlays=[(copy_png("o_play", ["놀다 보면 ==한 편==, 모으면 ==내 무대=="], 56, pos="t"), 0.2, 3.9, "rise"),
                  (copy_png("o_inner", ["부담 없이,", "==나만의 내면 이야기=="], 80), 5.6, 8.3, "slam")],
        phone=[(APP4, 0.8, 4.5, 2.0, 5.3)])
# 11. 주인공은 나
segment([(C(13), 0, 5)], [("t15.wav", 0.15)], grade=WARM,
        overlays=[(copy_png("o_hero", ["주인공은 ==나=="], 96), 2.4, 4.9, "slam"),
                  (copy_png("o_safe", ["진단 0  ·  점수 0  ·  기록은 내 폰에만"], 40, pos="b"), 5.0, 8.2, "rise")], shake=[2.4])
# 12. 엔딩 → 나의 영상으로 마무리
mark("end")
segment([(C(9), 2.5, 5)], [("t16.wav", 0.3)], grade=WARM + ",eq=brightness=-0.12:enable='gte(t,1.6)'", total=5.0,
        overlays=[(copy_png("o_end2", ["==마인드씬=="], 150, sub="내 안의 무대, 한 씬씩.   teen-dramaro.vercel.app"), 1.7, 5.0, "slam")],
        flash=[1.7], fout=0.3)
segment([(C(60), 6.5, 10)], [("t68.wav", 0.3)], total=3.0, fout=0.8,
        overlays=[(rec_png("o_rec2"), 0.0, 3.0, "fade")])

# ── 이어 붙이기
lst = os.path.join(OUT, "list.txt"); open(lst, "w").write("".join(f"file '{s}'\n" for s in SEGS))
silent = os.path.join(OUT, "silent.mp4"); run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent])
TOTAL = dur(silent)

# ── 음악 + 효과음
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
def riser(a, b, amp=0.12):
    m = (t >= a) & (t < b); x = (t[m] - a) / (b - a)
    mix[m] += amp * x ** 2 * (np.random.randn(m.sum()) * 0.6 + np.sin(2 * np.pi * (200 + 1200 * x) * t[m]))
M = MARK
Am, F_, C_, G_ = (110, 164.81, 220, 261.63), (87.31, 130.81, 174.61, 220), (130.81, 196, 261.63, 329.63), (98, 146.83, 196, 246.94)
D_ = (146.83, 220, 293.66, 369.99)
mix += pad(C_, M["intro"], M["dark"] + 0.5, 0.03, 0.8)
mix += pad(Am, M["dark"] - 0.5, M["research"] + 0.8, 0.04, 0.3)
# 연구 → 결정타: 비트가 깔리며 점점 빨라짐
x = M["research"]; beat = 0.5
while x < M["climax"]:
    kick(x); x += beat
mix += pad(F_, M["research"] - 0.5, M["climax"] + 0.5, 0.03, 0.8)
riser(M["climax"] - 3.0, M["climax"] + 1.2, 0.1)
riser(M["title"] + 1.0, M["title"] + 3.75, 0.12)
prog = [C_, G_, Am, F_]; bar = 2.2
def groove(a, b, arp=True, kicks=True):
    k = 0; x = a
    while x < b:
        ch = prog[k % 4]; mix[:] += pad(ch, x, min(b, x + bar + 0.5), 0.03, 1.0)
        for j, f in enumerate([ch[2] * 2, ch[3] * 2, ch[1] * 2, ch[3] * 2]):
            if arp and x + j * bar / 4 < b: note(f, x + j * bar / 4)
        if kicks:
            for j in range(4):
                if x + j * bar / 4 < b: kick(x + j * bar / 4, 0.22)
        x += bar; k += 1
groove(M["title"] + 3.75, M["drama"])
groove(M["drama"], M["payoff"], arp=True, kicks=False)
groove(M["payoff"], TOTAL - 0.5, kicks=True)
for kind, at in SFX: {"boom": boom, "hit": hit, "glitch": glitch}[kind](at)

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

# ── 다큐 배치: 오른쪽 아래 내레이터 창 + 자막
SUB = {
 "t31.wav": "저는 중학교 1학년, 김승아예요. | 제 꿈은 아이돌의 스토리를 기획하는 디렉터예요.",
 "t32.wav": "스토리를 공부하려고, | character.ai와 제타로 밤새 AI 캐릭터와 이야기를 만들어 봤어요.",
 "t2.wav": "그런데 앱을 닫는 순간… 이상하게 허전했어요. | 몇 시간을 이야기했는데, 내 이야기는 한 줄도 없었거든요.",
 "t4.wav": "기획자의 눈으로 다시 보니, 세 가지가 빠져 있었어요. | 끝이 없고. 내가 없고. 남는 게 없었어요.",
 "t33.wav": "그래서 연구했어요. 사람들이 부담 없이 마음을 꺼내는 방법을요. | 그리고, 두 가지를 찾았어요.",
 "t39.wav": "하나는 상황극. | 영화, 고전, 만화처럼 청소년이 볼 수 있는 명작에서 갈등 장면을 가져와, | 우리 일상으로 옮겼어요. | 그래서 진짜 내 얘기처럼, 현실감이 있어요.",
 "t35.wav": "또 하나는 사이코드라마. | 내 마음에 남은 장면 하나를 무대에 세우고, 조금 떨어져서 바라보는 거예요.",
 "t36.wav": "그리고 결정타. 이 둘을, 씬 하나로 조립했어요. | 시작, 흔들림, 마지막 컷.",
 "t6.wav": "내 안의 무대, 한 씬씩. 마인드씬.",
 "t60.wav": "안녕하세요! 저는 중학교 1학년, 김승아예요. | 오늘은 제가 기획하고 만든 AI 서비스, 마인드씬을 소개할게요.",
 "t61.wav": "제 꿈은, 아이돌의 스토리를 기획하는 디렉터예요.",
 "t62.wav": "오늘의 씬은 너의 이름은. 어제의 내가, 내가 아니었던 아침이에요.",
 "t69.wav": "나는 도은이 되고, | 미소와 반장은 ChatGPT API로 만든 AI가 내 말에 반응하며 연기해요.",
 "t64.wav": "AI 미소 「야, 너 진짜 기억 안 나? 어제 너 완전 딴사람이었어!」",
 "t65.wav": "AI 반장 「어제 그 말, 오늘도 같아?」",
 "t66.wav": "나(도은) 「기억은 안 나. 근데… 마음은 같아.」",
 "t67.wav": "만들면서 AI에게 이렇게 물었어요. | 부담 없이 마음을 꺼내는 연극 방법이 있을까? | 위험을 막는 규칙을 같이 만들어 줄래? | 답은 그대로 쓰지 않고, 제가 고르고 고쳤어요.",
 "t68.wav": "들어 주셔서 감사합니다!",
 "t51.wav": "오늘의 씬은 인사이드 아웃. 전학 첫날 저녁, 라희의 머릿속 감정 본부예요.",
 "t52.wav": "나는 기쁨이가 되고, AI는 슬픔이를 연기해요.",
 "t53.wav": "AI 슬픔이 「…나, 조종판 한 번만 만져 보면 안 되지?」",
 "t54.wav": "AI 슬픔이 「…이번엔, 나랑 같이 눌러 줄래?」",
 "t55.wav": "나(기쁨이) 「그래, 같이 누르자. 오늘은 괜찮지 않았다고 말해도 돼.」",
 "t8.wav": "도윤 「첫 줄만. 첫 줄이 제일 어려워.」",
 "t9.wav": "AI는 상대 인물만 연기해요. 내 말을 듣고, 진짜처럼 받아쳐요.",
 "t10.wav": "도윤 「…야. 너도 봤던 거야? 그 웃는 거.」",
 "t11.wav": "그리고 결정적인 순간, 이렇게 물어요. 너였다면?",
 "t12.wav": "마지막 대사는, AI가 아니라 내가 써요.",
 "t13.wav": "하은 「네 말로 보내. 첫 줄은 이미 네 안에 있어.」",
 "t37.wav": "놀다 보면 한 편, 모으면 내 무대. | 그래서 부담 없이, 나만의 내면 이야기를 꺼낼 수 있어요.",
 "t15.wav": "AI가 주인공이 아니에요. 주인공은, 나예요. | 진단도 점수도 없고, 기록은 내 폰에만 남아요.",
 "t38.wav": "기획자 김승아의 첫 번째 스토리는, 친구들의 진짜 마음에서 시작해요.",
 "t16.wav": "오늘은, 씬 한 편만. 마인드씬.",
}
IN_CHARACTER = {"t64.wav", "t65.wav", "t66.wav", "t60.wav", "t68.wav"}
def sub_png(i, text):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); f = F(28, "semi")
    tw = d.textlength(text, font=f); x = 48; y = H - 92
    d.rounded_rectangle([x - 16, y - 12, x + tw + 16, y + 44], radius=8, fill=(8, 6, 14, 190))
    d.text((x, y), text, font=f, fill=(250, 246, 255))
    p = os.path.join(G, f"sub{i:03d}.png"); im.save(p); return p
def pip_frame_png():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    x0, y0, w0, h0 = W - 36 - 352, H - 36 - 198, 352, 198
    d.rounded_rectangle([x0 - 4, y0 - 4, x0 + w0 + 4, y0 + h0 + 4], radius=14, outline=GOLD, width=3)
    d.rounded_rectangle([x0 + 10, y0 + h0 - 40, x0 + 190, y0 + h0 - 10], radius=6, fill=(10, 6, 18, 210))
    d.ellipse([x0 + 18, y0 + h0 - 30, x0 + 28, y0 + h0 - 20], fill=(255, 80, 80))
    d.text((x0 + 36, y0 + h0 - 36), "김승아 · 기획자", font=F(20, "bold"), fill=INK)
    p = os.path.join(G, "pipframe.png"); im.save(p); return p

final = os.path.join(ROOT, "mindscene_v3_doc_720p.mp4" if DOC else "mindscene_v3_720p.mp4")
if not DOC:
    run(["ffmpeg", "-y", "-i", silent, "-i", fa, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final])
else:
    narr = [(f, at, at + dur(os.path.join(VO, f))) for f, at in VOX if f not in IN_CHARACTER]
    on = "+".join(f"between(t,{a-0.2:.2f},{b+0.4:.2f})" for _, a, b in narr)
    ins = ["-i", silent, "-stream_loop", "-1", "-i", os.path.join(AI, "c25.mp4"), "-loop", "1", "-i", pip_frame_png()]
    fc = (f"[1:v]scale=352:198,setsar=1,fps={FPS}[pip];[0:v][pip]overlay=x={W-36-352}:y={H-36-198}:enable='{on}':shortest=1[a0];"
          f"[2:v]format=rgba[pf];[a0][pf]overlay=0:0:enable='{on}':shortest=1[a1];")
    last, k = "a1", 3
    for f, a, b in [(f, at, at + dur(os.path.join(VO, f))) for f, at in VOX]:
        chunks = [c.strip() for c in SUB[f].split("|")]
        tot = sum(len(c) for c in chunks); s = a
        for c in chunks:
            e = s + (b - a) * len(c) / tot
            ins += ["-loop", "1", "-i", sub_png(k, c)]
            fc += f"[{k}:v]format=rgba[s{k}];[{last}][s{k}]overlay=0:0:enable='between(t,{s:.2f},{e+0.15:.2f})':shortest=1[b{k}];"
            last = f"b{k}"; s = e; k += 1
    fc += f"[{last}]format=yuv420p"
    run(["ffmpeg", "-y", *ins, "-i", fa, "-filter_complex", fc, "-map", f"{k}:a", "-t", f"{TOTAL:.3f}", *ENC[:-1], "-c:a", "aac", "-b:a", "192k", final])
print("DONE", final, f"{TOTAL:.1f}s", len(SEGS))
