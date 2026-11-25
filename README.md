# Blokes Businesses

A directory of businesses run by Aussie blokes — search, filter by trade and state, member-deal badges, and a "list your business" form.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Works as-is on GitHub Pages (Settings → Pages → deploy from `main`, root).

## Files

| File | What it is |
|---|---|
| `index.html` | Page markup |
| `styles.css` | All styling |
| `data.js` | Trade categories, states and the business listings |
| `app.js` | Search, filters, rendering and the listing form |

## Notes

- `data.js` holds 224 businesses that owners posted in the Blokes Advice "Aussie small businesses, let's back each other" thread (Nov 2026). Only business details are kept: name, trade, area, a short summary, and any website/social/phone the owner shared. Jokes, requests for work, and comments with no business name were left out.
- To add, fix or remove a listing, edit `data.js` (one line per business) or open an issue.
- Listings added through the form are saved in the visitor's own browser (localStorage) only. To share them with everyone, send the form to a backend (Supabase, Firebase, a simple API) with an approval step.
