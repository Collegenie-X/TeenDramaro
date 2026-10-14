#!/usr/bin/env python3
"""마인드씬 기획 영상 v2 — 내레이션 · 드라마 · 광고 카피. 720p 30fps."""
import os, re, subprocess, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
AI, VO, G, OUT = (os.path.join(ROOT, d) for d in ("ai", "vo", "gfx", "out"))
for d in (G, OUT): os.makedirs(d, exist_ok=True)
OLD = os.path.join(ROOT, "../video/ai")          # v1 영상의 클립(같은 주인공)
APP = os.path.join(ROOT, "../video/rec/app3.webm")
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
    y0 = {"c": H / 2 - total / 2, "b": H - total - 70, "t": 70}[pos]
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
    d.rectangle([70, 560, 76, 640], fill=GOLD)
    d.text((96, 556), text, font=f, fill=INK, stroke_width=1, stroke_fill=(0, 0, 0))
    if sub: d.text((98, 608), sub, font=F(24, "semi"), fill=GOLD, stroke_width=1, stroke_fill=(0, 0, 0))
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
        ins += ["-ss", f"{a}", "-t", f"{b-a}", "-i", s]
        fc += f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},setpts=(PTS-STARTPTS)*{k:.4f}[c{i}];"
    fc += "".join(f"[c{i}]" for i in range(len(srcs))) + f"concat=n={len(srcs)}:v=1:a=0,trim=0:{total:.3f},setpts=PTS-STARTPTS[base0];"
    return ins, fc

def segment(srcs, vos, total=None, overlays=(), shake=(), flash=(), grade="", letterbox=False, pad=0.5, fin=0.3, fout=0.3, phone=None):
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
    if phone:
        a, b, s, e = phone
        ins += ["-ss", f"{a}", "-t", f"{b-a}", "-i", APP, "-loop", "1", "-i", phone_mask(), "-loop", "1", "-i", phone_frame_png()]
        k = (e - s) / (b - a)
        fc += (f"[{n}:v]fps={FPS},crop=390:844:0:0,scale=296:640:flags=lanczos,setpts=(PTS-STARTPTS)*{k:.4f}+{s}/TB,format=rgba[ap];"
               f"[{n+1}:v]format=gray,scale=296:640[am];[ap][am]alphamerge[apm];"
               f"[{last}]boxblur=12:1:enable='between(t,{s},{e})',eq=brightness=-0.12:enable='between(t,{s},{e})'[pb];"
               f"[pb][{n+2}:v]overlay=0:0:enable='between(t,{s},{e})'[pf];"
               f"[pf][apm]overlay=x=492:y='if(lt(t,{s}+0.35),40+700*(1-(t-{s})/0.35)^2,40)':enable='between(t,{s},{e})':eof_action=pass[ph];")
        last = "ph"; n += 3
    for i, (png, s, e, fx) in enumerate(overlays):
        ins += ["-loop", "1", "-t", f"{total:.3f}", "-i", png]; j = n + i
        fade = f"fade=t=in:st={s}:d={0.12 if fx=='slam' else 0.4}:alpha=1,fade=t=out:st={e-0.3}:d=0.3:alpha=1"
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
    for s in flash: SFX.append(("hit", T[0] + s))
    for png, s, e, fx in overlays:
        if fx == "slam": SFX.append(("hit", T[0] + s))
    SEGS.append(out); T[0] += total
    return total

C = lambda i: os.path.join(AI, f"c{i}.mp4")
O = lambda i: os.path.join(OLD, f"v{i}.mp4")
COLD = "eq=saturation=0.85:contrast=1.06,colorbalance=bs=0.08:bm=0.04"
WARM = "eq=saturation=1.1:contrast=1.05,colorbalance=rs=0.05:rm=0.03"

# ───────────── 타임라인 ─────────────
# 1. 콜드 오픈 — 새벽 2시
segment([(C(1), 0, 2.2)], [("t1.wav", 0.4)], grade=COLD, letterbox=True,
        overlays=[(copy_png("o_2am", ["AM 2:00"], 46, pos="t"), 0.2, 4.6, "fade")], fin=0.8)
# 2. 산산조각
segment([(C(2), 0, 5)], [("t2.wav", 0.2)], grade=COLD, letterbox=True,
        overlays=[(copy_png("o_none", ["내 이야기는,", "==한 줄도 없었다.=="], 80), 7.0, 9.7, "slam")], shake=[7.0])
# 3. 나 · 꿈
segment([(O(1), 0.5, 5), (C(3), 0, 5)], [("t3.wav", 0.3)], grade=WARM,
        overlays=[(tag_png("o_name", "승아", "중학교 1학년 · 기획자"), 0.4, 4.4, "rise"),
                  (copy_png("o_dream", ["꿈 ·  ==아이돌 스토리 디렉터=="], 54, pos="b"), 5.3, 8.8, "rise"),
                  (copy_png("o_heart", ["사람을 움직이는 이야기는", "==진짜 마음==에서 시작된다"], 66), 11.4, 14.3, "slam")])
# 4. 세 가지 빈칸 (세 칸 그림 위 단어)
def word_at(name, txt, x):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); f = F(54, "heavy")
    tw = d.textlength(txt, font=f)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((x - tw / 2, 524), txt, font=f, fill=(0, 0, 0, 255))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(8))); d = ImageDraw.Draw(im)
    d.text((x - tw / 2, 520), txt, font=f, fill=GOLD, stroke_width=2, stroke_fill=(10, 5, 20))
    p = os.path.join(G, name + ".png"); im.save(p); return p
segment([(C(12), 0, 5)], [("t4.wav", 0.3)], grade=COLD,
        overlays=[(copy_png("o_eye", ["기획자의 눈으로 보니"], 48, pos="t"), 0.3, 4.6, "fade"),
                  (word_at("o_w1", "끝이 없다", 213), 4.85, 9.2, "fade"),
                  (word_at("o_w2", "내가 없다", 640), 6.1, 9.2, "fade"),
                  (word_at("o_w3", "남는 게 없다", 1067), 7.35, 9.2, "fade")],
        flash=[4.85, 6.1, 7.35])
# 5. 그래서 직접 → 6. 타이틀 (빛 폭발)
segment([(C(4), 0, 3.6)], [("t5.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_made", ["그래서, ==직접 만들었다.=="], 72), 1.5, 3.9, "slam")], fout=0.1)
segment([(C(4), 3.6, 5)], [("t6.wav", 0.1)], grade=WARM + ",eq=brightness=-0.18:enable='gte(t,3.2)'", total=5.2,
        overlays=[(copy_png("o_stage", ["내 안의 무대, 한 씬씩."], 40, pos="b"), 0.2, 5.2, "fade"),
                  (copy_png("o_title", ["==마인드씬=="], 150), 3.25, 5.2, "slam")],
        flash=[3.25], shake=[3.25], fin=0.05)
# 7. 기획자 승아
segment([(C(11), 0, 5)], [("t17.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_plan0", ["나는 ==기획자=="], 64, pos="t"), 0.2, 6.8, "slam"),
                  (copy_png("o_plan", ["기록  →  패턴  →  ==만들고 고친다=="], 46, pos="b"), 1.9, 6.8, "rise")])
# 8. 씬 설계 — 시작 · 흔들림 · 마지막 컷 (노트 그림 줌 + 앱 그림)
segment([(O(4), 0, 5), (C(11), 2.5, 5)], [("t18.wav", 0.2)], grade=WARM,
        overlays=[(word_at("o_s1", "시작", 300), 1.55, 7.5, "fade"),
                  (word_at("o_s2", "흔들림", 640), 3.0, 7.5, "fade"),
                  (word_at("o_s3", "마지막 컷", 980), 4.25, 7.5, "fade")],
        flash=[1.55, 3.0, 4.25], phone=(9.6, 12.4, 7.6, 12.3))
# 9~12. 드라마 — 〈시라노〉
segment([(C(5), 0, 5)], [("t7.wav", 0.3)], grade="eq=contrast=1.08", letterbox=True,
        overlays=[(slate_png("o_slate", "SCENE  ·  오늘의 씬", "〈시라노〉 대신 쓰는 DM"), 0.2, 2.6, "slam")])
segment([(C(6), 0, 5)], [("t8.wav", 0.1), ("t9.wav", 3.0)], grade="eq=contrast=1.08", letterbox=True,
        overlays=[(copy_png("o_ai", ["AI는 ==상대 인물==만"], 58, pos="b"), 3.2, 8.4, "rise")], phone=(31.0, 38.0, 5.6, 8.5))
segment([(C(7), 0, 5)], [("t10.wav", 0.2), ("t11.wav", 3.8)], grade="eq=contrast=1.12:saturation=0.9", letterbox=True,
        overlays=[(copy_png("o_you", ["==너였다면?=="], 130), 7.6, 9.1, "slam")], shake=[7.6], flash=[7.6])
segment([(C(8), 0, 5)], [("t12.wav", 0.2), ("t13.wav", 3.3)], grade=WARM, letterbox=True,
        overlays=[(copy_png("o_last", ["마지막 대사는 ==내가== 쓴다"], 60, pos="t"), 0.4, 3.2, "slam"),
                  (copy_png("o_line", ["「네 말로 보내. 첫 줄은 이미 네 안에 있어.」"], 36, pos="b"), 3.4, 7.2, "fade")])
# 13. 씬 카드가 모인다
segment([(C(9), 0, 5)], [("t14.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_5min", ["==5분==이면 한 편"], 84), 0.25, 2.4, "slam"),
                  (copy_png("o_story", ["모으면, ==나만의 이야기=="], 70, pos="b"), 5.6, 7.5, "slam")],
        phone=(87.0, 90.6, 2.5, 5.4))
# 14. 차별점 — 그림으로
segment([(C(13), 0, 5)], [("t15.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_hero", ["주인공은 ==나=="], 96), 2.45, 5.0, "slam"),
                  (copy_png("o_safe", ["진단 0  ·  점수 0  ·  기록은 내 폰에만"], 40, pos="b"), 5.1, 8.3, "rise")],
        shake=[2.45])
# 15. 친구들
segment([(C(10), 0, 5)], [("t19.wav", 0.2)], grade=WARM,
        overlays=[(copy_png("o_first", ["기획자 승아의 ==첫 번째 스토리=="], 60, pos="b"), 0.3, 5.7, "rise")])
# 16. 엔딩
segment([(C(9), 2.5, 5)], [("t16.wav", 0.5)], grade=WARM + ",eq=brightness=-0.12:enable='gte(t,1.9)'", total=6.5,
        overlays=[(copy_png("o_end1", ["오늘은, ==씬 한 편==만."], 56, pos="t"), 0.5, 6.5, "fade"),
                  (copy_png("o_end2", ["==마인드씬=="], 150, sub="내 안의 무대, 한 씬씩.   teen-dramaro.vercel.app"), 2.0, 6.5, "slam")],
        flash=[2.0], fout=1.0)

# ── 이어 붙이기
lst = os.path.join(OUT, "list.txt"); open(lst, "w").write("".join(f"file '{s}'\n" for s in SEGS))
silent = os.path.join(OUT, "silent.mp4"); run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent])
TOTAL = dur(silent)

# ── 음악 + 효과음 (numpy 합성)
N = int(TOTAL * SR) + SR; t = np.arange(N) / SR
mix = np.zeros(N)
def env(a, b, atk=1.5, rel=1.5):
    e = np.clip((t - a) / atk, 0, 1) * np.clip((b - t) / rel, 0, 1); return e
def pad(freqs, a, b, amp=0.05, bright=1.0):
    e = env(a, b)
    s = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) + 0.3 * bright * np.sin(2 * np.pi * 2 * f * t) for f in freqs)
    return amp * e * s * (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * t))
def note(f, at, d=0.9, amp=0.08):
    i0 = int(at * SR); n = int(d * SR); tt = np.arange(n) / SR
    s = amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 4.5) * (1 - np.exp(-tt * 200))
    mix[i0:i0 + n] += s[: max(0, min(n, N - i0))]
def boom(at, amp=0.6):
    i0 = int(at * SR); n = int(1.6 * SR); tt = np.arange(n) / SR
    f = 55 * np.exp(-tt * 1.5) + 30
    s = amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.8)
    s += amp * 0.4 * np.random.randn(n) * np.exp(-tt * 18)
    mix[i0:i0 + n] += s[: max(0, min(n, N - i0))]
def hit(at, amp=0.35):
    i0 = int(at * SR); n = int(0.9 * SR); tt = np.arange(n) / SR
    s = amp * (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 9) + 0.5 * np.random.randn(n) * np.exp(-tt * 25))
    s += amp * 0.5 * np.sin(2 * np.pi * 880 * tt) * np.exp(-tt * 6)
    mix[i0:i0 + n] += s[: max(0, min(n, N - i0))]
def riser(a, b, amp=0.12):
    m = (t >= a) & (t < b); x = (t[m] - a) / (b - a)
    mix[m] += amp * x ** 2 * (np.random.randn(m.sum()) * 0.6 + np.sin(2 * np.pi * (200 + 1200 * x) * t[m]))

seg_t = np.cumsum([0] + [dur(s) for s in SEGS])
S = lambda i: float(seg_t[i])
Am, F_, C_, G_ = (110, 164.81, 220, 261.63), (87.31, 130.81, 174.61, 220), (130.81, 196, 261.63, 329.63), (98, 146.83, 196, 246.94)
# 어두운 도입(0~4) → 밝아지는 꿈(2~3) → 빈칸(3) → 리저 → 타이틀 이후 따뜻한 진행
mix += pad(Am, 0, S(2) + 1, 0.035, 0.3)
mix += pad(F_, S(2) - 1, S(3) + 1, 0.04, 0.6)
mix += pad(Am, S(3) - 1, S(4) + 0.5, 0.04, 0.3)
riser(S(4) + 0.2, S(5) + 3.25, 0.1)
prog = [C_, G_, Am, F_]
bar = 2.4
k = 0; x = S(5) + 3.25
while x < TOTAL - 1:
    ch = prog[k % 4]
    mix += pad(ch, x, x + bar + 0.6, 0.032, 1.0)
    for j, f in enumerate([ch[2] * 2, ch[3] * 2, ch[1] * 2, ch[3] * 2]):
        if not (S(9) - 0.5 < x + j * bar / 4 < S(11)):  # 긴장 구간에선 아르페지오 쉼
            note(f, x + j * bar / 4, 0.8, 0.035)
    x += bar; k += 1
# 드라마 긴장: 시계 틱
for x in np.arange(S(8), S(11), 0.75): note(1800, x, 0.05, 0.03)
for kind, at in SFX: (boom if kind == "boom" else hit)(at)

# 내레이션 얹고 덕킹
vo = np.zeros(N)
for f, at in VOX:
    with wave.open(os.path.join(VO, f)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
    i0 = int(at * SR); vo[i0:i0 + len(a)] += a[: max(0, min(len(a), N - i0))]
ev = np.convolve(np.abs(vo), np.ones(SR // 5) / (SR // 5), mode="same")
duck = 1 - 0.55 * np.clip(ev * 12, 0, 1)
final_a = mix * duck * 0.9 + vo * 1.35
final_a = np.tanh(final_a * 1.1) * 0.95
final_a[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
fa = os.path.join(OUT, "mix.wav")
with wave.open(fa, "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((final_a[: int(TOTAL * SR)] * 32767).astype(np.int16).tobytes())
final = os.path.join(ROOT, "mindscene_drama_720p.mp4")
run(["ffmpeg", "-y", "-i", silent, "-i", fa, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final])
print("DONE", final, f"{TOTAL:.1f}s", len(SEGS))
for i, s in enumerate(SEGS): print(i, f"{S(i):.1f}")
