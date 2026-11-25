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
| `data.js` | Trade categories, states and the example listings |
| `app.js` | Search, filters, rendering and the listing form |

## Notes

- The 12 listings in `data.js` are examples (marked "Example listing", 0400 000 0xx numbers). Replace them with real member businesses.
- Listings added through the form are saved in the visitor's own browser (localStorage) only. To share them with everyone, send the form to a backend (Supabase, Firebase, a simple API) with an approval step.
