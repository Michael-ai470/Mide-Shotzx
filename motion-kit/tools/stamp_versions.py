"""Cache-busting for any static site. Run before every upload:

    python stamp_versions.py <site folder>           # stamp, and list what changed
    python stamp_versions.py <site folder> --check   # only report; exit 1 if anything is out of date

(No folder given: the current folder.)

Every local .js and .css reference gets ?v=<fingerprint of that file's contents>:
  - in the HTML pages (<script src>, <link href>)
  - in the JavaScript modules' own import statements, so a module reached only through
    another module (js/motion/core.js, for example) is versioned too.

A fingerprint changes only when its file changes, so visitors keep their cached copies of
everything else. Modules are stamped leaves first: when core.js changes, every module that
imports it gets a new fingerprint as well, up to the HTML. Every importer of a module uses the
same fingerprint, so the browser never loads two copies of one module.

Fonts and images are not stamped: the font preload has to match the @font-face URL exactly.
"""
import hashlib
import os
import re
import sys

_args = [a for a in sys.argv[1:] if not a.startswith('--')]
SITE = os.path.normpath(os.path.abspath(_args[0] if _args else os.getcwd()))

# import x from './a.js'   export { y } from '../b.js'   import './c.js'   (statements only,
# not the import('...') type hints in JSDoc comments)
IMPORT = re.compile(
    r'''(?P<head>(?:^|\n)[ \t]*(?:import|export)\b[^;'"]*?\bfrom[ \t]*|(?:^|\n)[ \t]*import[ \t]*)'''
    r'''(?P<q>['"])(?P<path>\.{1,2}/[^'"?]+?\.js)(?:\?v=[0-9a-f]*)?(?P=q)''')
# <script src="..."> and <link href="..."> pointing at a local .js or .css
TAG = re.compile(r'''(?P<head><(?:script|link)\b[^>]*?\b(?:src|href)=)(?P<q>["'])(?P<path>(?!https?:|//)[^"'?#]+?\.(?:js|css))(?:\?v=[0-9a-f]*)?(?P=q)''')


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def fingerprint(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:10]


def main(check_only):
    changed, versions, done = [], {}, {}

    def stamp_module(path, trail=()):
        """Stamps a JS module's imports (deps first) and returns its fingerprint."""
        path = os.path.normpath(path)
        if path in done:
            return done[path]
        if path in trail:
            raise SystemExit('import cycle: ' + ' -> '.join(trail + (path,)))
        text = read(path)
        if path.endswith('.js') and os.sep + 'vendor' + os.sep not in path:
            def sub(m):
                dep = os.path.join(os.path.dirname(path), m.group('path'))
                if not os.path.exists(dep):
                    raise SystemExit(f'{rel(path)} imports a missing file: {m.group("path")}')
                v = stamp_module(dep, trail + (path,))
                return f"{m.group('head')}{m.group('q')}{m.group('path')}?v={v}{m.group('q')}"
            new = IMPORT.sub(sub, text)
            if new != text:
                changed.append(rel(path))
                if not check_only:
                    with open(path, 'w', encoding='utf-8', newline='') as f:
                        f.write(new)
                text = new
        done[path] = fingerprint(text)
        return done[path]

    def rel(p):
        return os.path.relpath(p, SITE).replace(os.sep, '/')

    pages = []
    for d, dirs, files in os.walk(SITE):
        dirs[:] = [x for x in dirs if not x.startswith('.')]
        pages += [os.path.join(d, f) for f in files if f.endswith('.html')]

    missing = []
    for page in sorted(pages):
        text = read(page)

        def sub(m):
            target = os.path.join(os.path.dirname(page), m.group('path'))
            if not os.path.exists(target):
                missing.append(f'{rel(page)}: {m.group("path")}')
                return m.group(0)
            v = stamp_module(target)
            return f"{m.group('head')}{m.group('q')}{m.group('path')}?v={v}{m.group('q')}"

        new = TAG.sub(sub, text)
        if new != text:
            changed.append(rel(page))
            if not check_only:
                with open(page, 'w', encoding='utf-8', newline='') as f:
                    f.write(new)

    for m in missing:
        print('missing file referenced by', m)
    if changed:
        print(('out of date: ' if check_only else 'stamped: ') + f'{len(changed)} file(s)')
        for c in changed:
            print('  ' + c)
    else:
        print('all versions up to date')
    return 1 if (check_only and changed) or missing else 0


if __name__ == '__main__':
    sys.exit(main('--check' in sys.argv[1:]))
