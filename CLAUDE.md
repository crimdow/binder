# Pocket Binder (binder.jermins.com) — notes for Claude

The family binder of saved things. It is one file, `index.html`, with no build step, served by Caddy. Data and login come from PocketBase on bkweb. The server code lives in the **home-board** repo: `server/pb_hooks/binder.pb.js` and the `server/pb_migrations/179160…` to `179190…` and `1792100000_binder_bins.js` files.

## Never
- Put passwords or secret keys in this repo. The clipper key is fetched from the `clip_keys` table at runtime.
- Add `clipper.js` to this repo.

## Data
- **`clips`:** fields are type, title, by, body, genre, tags (json), info (json), done (bool), files and owner/household. Types:
  - lyrics
  - stories
  - chords (shown as **Tabs**, banjo icon)
  - places
  - activities
  - bins
- **Recipes and Notes:** use Home Board's `recipes` and `notes` tables, with `recipeToItem`/`noteToItem` and matching save/remove helpers. Only Home Board editors can change them.
- **Other tables:** `binder_files` holds uploaded photos and PDFs. `clip_inbox` is the share-sheet inbox (t, u, x, d = description, img = picture link) and is cleaned nightly.
- **Login:** the Home Board login. A household shares one binder.

## Features and decisions
- **Tabs:** the order and which tabs are hidden are set from ☰ Menu → Edit (up/down/eye), saved in `pb.tabs`, with at most 6 in the bar.
- **Swipes:**
  - Rows: swipe left to show Delete (a full swipe deletes), with an Undo bar.
  - An open page: swipe right to go back. Sideways scrollers and the bottom controls are left alone.
  - Section flip: swiping the list flips sections only **above** the rows (title, search, tags), because rows swipe to delete.
- **Places:**
  - Fields: Google/Apple Maps link + **Look up**, address, phone, hours, tags such as "Fun for family" and "Date night", and a website.
  - Reader buttons: Apple Maps, Google Maps, Call, **+ Plans** (makes a Home Board `plans` row; with no date it's saved as an idea).
- **Activities:** tick circles, a "Done" group at the bottom, and a date or place in `info`. They also get **+ Plans**.
- **Getting things in:**
  - **iPhone "Add to Binder" shortcut:** Run JavaScript on a Safari page (the script comes from ☰ → Copy shortcut script), then Open URLs.
  - **"Add To Places" shortcut** (for the Google Maps / Google app): Text(Shortcut Input) → URL Encode → Text `https://binder.jermins.com/#add&u=` + URL Encoded Text → Open URLs. No JavaScript step, because the Maps app shares a URL, not a Safari page.
  - **Laptop bookmark:** it POSTs a form to `/api/binder/clip-form`. postMessage is blocked by PocketBase's COOP header.
  - **Deep links:** `#add&t=&u=&x=`, `#add&clip=<inbox id>`, `#lyrics` and the other section names.
- **Google Maps lookup** (`/api/binder/place-link`):
  - It resolves short links with `curl` via `$os.cmd`, one hop at a time. It strips `?g_st=…`, because that makes Google return an "open in app" page, and it asks as desktop Chrome.
  - It reads og tags, or the name, address and coordinates from `/maps/place/…` or `?q=` links.
  - On failure the note shows a bracketed diagnostic.
  - Results against real Google are only partly reliable, and Ben has accepted that.
- **Bins** (storage bins with printed QR labels):
  - The area (Garage wall, Attic…) is saved in `genre`, so the chips filter by area and the list groups by it. `info` holds `code`, `spot`, `items` (the contents, one string each) and `checked` (YYYY-MM-DD). `body` is the note and `files` are photos.
  - Codes come from the area's initials plus the next number (Garage wall → GW-01, Attic → A-01). They must be unique. Changing one means printing a new label.
  - The bin page lets you add and take out contents, and mark the bin checked, without opening Edit. Search covers the contents and shows "Has …" under a match.
  - QR labels link to `#bin=<record id>`, which keeps working if the code or name changes. `#bin=<code>` also works. The QR maker is `qrcode.js` (qrcode-generator 1.4.4, MIT), loaded the first time it's needed.
  - Labels print from the bin page (this bin, its area, or all) on plain Letter paper: 3.5 × 2 in, 10 a page, with dashed cut lines. Sticker sheets will be added as another entry in `LABELS`; Ben hasn't picked the brand yet.
  - Scanning a label with the iPhone camera opens Safari, not the home-screen app, so Safari needs its own sign-in once.
- **Zoom:** locked (viewport and gesturestart).

## Look
- It matches Home Board: same colours, system font, sheets, ☰ menu.
- Appearance is Light / Dark / Auto, and there are skins.
- The Ben/Ash colours are `--ben` `#4f7bd4` and `--ash` `#d45b6c`.

## Testing
- Serve this folder as PocketBase's `--publicDir`, with the home-board repo's hooks and migrations. Sign in as a throwaway test user and drive it with Playwright.
- For gestures, use `hasTouch` and CDP `Input.dispatchTouchEvent`.
- To test Google lookups, use a mock HTTPS server with an `/etc/hosts` entry, and point `SSL_CERT_FILE` and `CURL_CA_BUNDLE` at the mock certificate.
