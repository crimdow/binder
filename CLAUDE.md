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
  - The area (Garage wall, Attic…) is saved in `genre`, so the chips filter by area and the list groups by it. `info` holds `size` (LG), `num` (1), `code` (the label code, LG-01), `spot`, `items` (the contents, one string each) and `checked` (YYYY-MM-DD). `body` is the note, `files` are photos, and `title` is an optional name.
  - **Areas and sizes** are the family's own lists, managed from the round pencil button after the area chips (the "Areas & sizes" sheet). Saved in Home Board's `app_settings` per household under `binder_bin_areas` (`[{name, pre}]`) and `binder_bin_sizes` (`[{key, vol, unit}]`, unit `gal` or `L` as written on the bin; older entries have just `gal`). Only Home Board editors can read or change them. Without a household they're kept in `pb.binAreas` / `pb.binSizes` on the phone. Until the first change, it offers Garage wall and Attic, and XS 6, SM 12, MD 18, LG 27 and XL 40 gallons; sizes sort by real volume, whichever unit; `keepShown()` / `keepSizes()` turn those into the saved list so nothing vanishes. Renaming an area moves all its bins. An area or size can only be removed when no bin uses it, and a size's letters are locked once it's on a label (the volume can still change).
  - **Codes** are area letters + size + number, e.g. **A-LG-01** (Ben's design). Numbers count up within a size, whatever the area. **The label prints only size + number (LG-01)**, so a bin can move without a new label: the area part is worked out from where it is now (`binCode()`), and only `size`/`num` are stored. Changing a bin's size gives it the next number in that size and needs a new label. Label codes must be unique. Bins from before sizes keep their old `code` (GW-01) until someone gives them a size.
  - **The form** (Ben chose this layout): Area chips with + New area, Size chips showing each volume (gal or L), the code card (full code, what the label says, and Change to type a label code like LG-03), What's inside as a list with an Add box, then Optional: Spot, Name, Notes, Photos. A new bin needs a size. When adding from Bins or editing a bin, the section picker is hidden. The form always opens at the top with nothing focused.
  - **The list is a table** (Ben chose it over a card list): Code | name (if any) and what's inside | Spot, grouped by area with a count, sorted by size then number.
  - The bin page lets you add and take out contents, and mark the bin checked, without opening Edit. Search covers names, contents, notes, codes and spots, and shows "Has …" or "Note: …" under a match.
  - QR labels link to `#bin=<record id>`, which keeps working if the code, name or area changes. `#bin=LG-01` and `#bin=A-LG-01` also work. The QR maker is `qrcode.js` (qrcode-generator 1.4.4, MIT), loaded the first time it's needed.
  - Labels print from the bin page (this bin, its area, or all) on plain Letter paper: 3.5 × 2 in, 10 a page, with dashed cut lines. A label has only the QR and the size + number, nothing that changes when the bin moves or is repacked. Sticker sheets will be added as another entry in `LABELS`; Ben hasn't picked the brand yet.
  - **NFC tags** (for later): a tag holds the same `#bin=<id>` link. **Copy NFC link** on the bin page copies it, and Ben writes it to an NTAG213/215 sticker with an app such as NFC Tools, because iPhones can't write NFC from a web page.
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
