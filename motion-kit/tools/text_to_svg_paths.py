"""Turn a word into SVG outline paths, one <path> per letter, for the markIntro loader (or any
stroke-drawn logo). Uses the real glyph outlines of a font file, kerned.

    pip install fonttools brotli          # brotli only for .woff2 fonts
    python text_to_svg_paths.py "The 1%" path/to/font.woff2 [--weight 600] [--strong 4,5]

Prints an <svg> to paste into both the loader overlay and the hero target. Each letter is a
.mark-glyph path with pathLength="1" (so CSS shows it whole without scripts); --strong marks
letters (1-based, spaces skipped) that get the .is-strong class (a heavier stroke, say).
Variable fonts: --weight picks the instance (needs fontTools' instancer).
"""
import argparse, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('text')
    ap.add_argument('font')
    ap.add_argument('--weight', type=float)
    ap.add_argument('--strong', default='')
    a = ap.parse_args()

    font = TTFont(a.font)
    if a.weight and 'fvar' in font:
        from fontTools.varLib.instancer import instantiateVariableFont
        font = instantiateVariableFont(font, {'wght': a.weight})
    cmap, glyphs, hmtx = font.getBestCmap(), font.getGlyphSet(), font['hmtx']
    kern = {}
    if 'kern' in font:
        for table in font['kern'].kernTables:
            kern.update(table.kernTable)
    strong = {int(n) for n in a.strong.split(',') if n.strip()}

    x, paths, letter, prev = 0, [], 0, None
    for ch in a.text:
        name = cmap.get(ord(ch))
        if name is None:
            sys.exit(f'the font has no glyph for {ch!r}')
        if prev and (prev, name) in kern:
            x += kern[(prev, name)]
        if not ch.isspace():
            letter += 1
            pen = SVGPathPen(glyphs)
            glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))  # flip y: font units point up
            cls = 'mark-glyph is-strong' if letter in strong else 'mark-glyph'
            paths.append(f'  <path class="{cls}" pathLength="1" d="{pen.getCommands()}"/>')
        x += hmtx[name][0]
        prev = name

    upm = font['head'].unitsPerEm
    ascent = font['hhea'].ascent
    descent = -font['hhea'].descent
    print(f'<svg class="mark-svg" viewBox="-20 {-ascent - 20} {x + 40} {ascent + descent + 40}" aria-hidden="true" focusable="false">')
    print('\n'.join(paths))
    print('</svg>')
    print(f'<!-- {letter} letters, {upm} units per em -->', file=sys.stderr)


if __name__ == '__main__':
    main()
