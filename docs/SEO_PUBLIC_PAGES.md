# ShuffleUp public SEO pages

This patch adds statically served public pages under `frontend/public`, so each guide has an independent HTML response, title, description, canonical URL, Open Graph metadata, and structured data.

## Added routes

- `/card-games/` — directory of all supported games and guide links.
- `/how-to-play/kachuful/` — Kachuful guide.
- `/how-to-play/teen-patti/` — Teen Patti guide.
- `/how-to-play/indian-rummy/` — Indian Rummy guide.
- `/how-to-play/mangoose/` — Mangoose guide.
- `/how-to-play/uno/` — UNO guide.
- `/how-to-play/jack-thief/` — Jack Thief guide.
- `/how-to-play/napoleon/` — Napoleon guide.
- `/how-to-play/bridge/` — Bridge guide.
- `/how-to-play/spades/` — Spades guide.
- `/how-to-play/twenty-nine/` — Twenty-Nine (29) guide.
- `/how-to-play/mindi-coat/` — Mindi Coat guide.
- `/how-to-play/bluff/` — Bluff (Cheat) guide.
- `/how-to-play/satte-pe-satta/` — Satte Pe Satta guide.
- `/how-to-play/war/` — War guide.
- `/how-to-play/solitaire/` — Solitaire Multiplayer guide.

## Discovery files

- `/sitemap.xml` lists the homepage, directory, and guide pages.
- `/robots.txt` allows crawling and references the sitemap.

## Verification after deploy

1. Open `https://shuffleup-five.vercel.app/card-games/` and several guide URLs; each should show its own page content and tab title.
2. Open `https://shuffleup-five.vercel.app/robots.txt` and `https://shuffleup-five.vercel.app/sitemap.xml`.
3. In Search Console, inspect `/card-games/` and 2–3 guide URLs, run the live test, and request indexing if available.
4. Check the Pages report over time. A sitemap helps discovery but does not guarantee indexing or rankings.

## Keep content accurate

Guides describe the rules in ShuffleUp's current in-repository game manuals. When a game engine changes, review its guide so the public article continues to match the running game. Avoid submitting private room links or user-specific URLs in the sitemap.
