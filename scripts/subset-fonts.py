"""
Subsets + slims the self-hosted fonts (output is committed; run only if you
need characters/weights outside what's below).

    pip install fonttools brotli
    npm run fonts:subset          (or: python scripts/subset-fonts.py)

- Geist (sans):   Latin + punctuation/arrows, variable weight limited to 400–600
- Geist Mono:     ASCII only (labels/timecodes), weight 400–600
- Instrument Serif Italic: Latin + punctuation
Sources come from node_modules (geist, @fontsource/instrument-serif).
"""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2713"
ASCII = "U+0020-007E,U+00A0,U+00B7,U+2013-2014,U+2190-2193,U+2197"

JOBS = [
    ("node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2", "public/fonts/Geist-Variable.woff2", LATIN, (400, 600)),
    ("node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2", "public/fonts/GeistMono-Variable.woff2", ASCII, (400, 600)),
    ("node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", "public/fonts/InstrumentSerif-Italic.woff2", LATIN, None),
]


def unicodes(spec):
    out = []
    for part in spec.split(","):
        part = part.strip()[2:]
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a, 16), int(b, 16) + 1))
        else:
            out.append(int(part, 16))
    return out


for src, dst, ranges, wght in JOBS:
    font = TTFont(src, lazy=False)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.flavor = "woff2"
    opts.hinting = False
    opts.desubroutinize = True
    opts.drop_tables += ["meta"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes(ranges))
    sub.subset(font)
    # Limit the weight axis after subsetting (fewer glyph variations to keep).
    if wght and "fvar" in font:
        font = instantiateVariableFont(font, {"wght": wght})
    font.flavor = "woff2"
    font.save(dst)
    import os
    print(f"{dst}: {os.path.getsize(dst) / 1024:.1f} KB")
