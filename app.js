// Blokes Businesses — plain JS, no build step.
// Depends on CATEGORIES, STATES and BUSINESSES from data.js.
(function () {
  const STORAGE_KEY = "blokes-directory-listings";
  const $ = (sel) => document.querySelector(sel);
  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  }
  function saveListings(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  }

  const state = {
    added: loadSaved(),
    query: "",
    category: "all",
    state: "All",
    dealsOnly: false,
  };

  const LISTED = BUSINESSES.map((b, i) => ({
    id: `ba-${i}`, name: b.n, category: b.c, state: b.s, suburb: b.a, blurb: b.d,
    website: b.w || "", google: b.g || "", social: b.i || "", phone: b.p || "",
    memberDeal: b.deal || "", tags: [],
  })).sort((x, y) => x.name.localeCompare(y.name));
  const all = () => [...state.added, ...LISTED];
  const stateLabel = (s) => (s === "AUS" ? "Australia-wide" : s);

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return all().filter((b) => {
      if (state.category !== "all" && b.category !== state.category) return false;
      if (state.state !== "All" && b.state !== state.state) return false;
      if (state.dealsOnly && !b.memberDeal) return false;
      if (!q) return true;
      return [b.name, b.suburb, b.blurb, stateLabel(b.state), catById[b.category]?.label, ...(b.tags || [])]
        .join(" ").toLowerCase().includes(q);
    });
  }

  function cardHTML(b) {
    const cat = catById[b.category] || catById.other;
    const loc = [b.suburb, b.state && b.state !== "AUS" ? b.state : b.state === "AUS" && !b.suburb ? "Australia-wide" : ""]
      .filter(Boolean).join(", ") || "Location not given";
    const tags = (b.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const safe = (u) => (/^https?:\/\//i.test(u || "") ? esc(u) : "");
    const ext = (u, label) => (safe(u) ? `<a class="btn btn-ghost btn-sm" href="${safe(u)}" target="_blank" rel="noopener noreferrer">${label}</a>` : "");
    const links = [
      ext(b.website, "Website"),
      ext(b.social, /instagram/i.test(b.social) ? "Instagram" : "Socials"),
      ext(b.google, "Google"),
    ].join("");
    const search = `https://www.google.com/search?q=${encodeURIComponent([b.name, b.suburb].filter(Boolean).join(" "))}`;
    const call = b.phone
      ? `<a class="btn btn-hi btn-sm" href="tel:${esc(String(b.phone).replace(/[^\d+]/g, ""))}">📞 ${esc(b.phone)}</a>`
      : !links ? `<a class="btn btn-hi btn-sm" href="${search}" target="_blank" rel="noopener noreferrer">Find on Google</a>` : "";
    return `
      <article class="card">
        <div class="card-top">
          <span class="card-icon">${cat.icon}</span>
          <div>
            <h3>${esc(b.name)}</h3>
            <p class="card-loc">${esc(loc)} · ${esc(cat.label)}</p>
          </div>
        </div>
        <p class="card-blurb">${esc(b.blurb)}</p>
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        ${b.memberDeal ? `<div class="badges"><span class="badge deal">🏷️ ${esc(b.memberDeal)}</span></div>` : ""}
        <div class="card-foot">
          <span class="owner">${b.mine ? "Your listing" : ""}</span>
          <div class="card-actions">${links}${call}</div>
        </div>
      </article>`;
  }

  function renderCats() {
    const counts = { all: all().length };
    all().forEach((b) => (counts[b.category] = (counts[b.category] || 0) + 1));
    $("#cats").innerHTML = CATEGORIES.map(
      (c) => `
      <li>
        <button class="cat${state.category === c.id ? " active" : ""}" data-cat="${c.id}">
          <span class="cat-icon">${c.icon}</span>
          <span class="cat-label">${esc(c.label)}</span>
          <span class="cat-count">${counts[c.id] || 0}</span>
        </button>
      </li>`
    ).join("");
  }

  function render() {
    const list = all();
    $("#stat-total").textContent = list.length;
    $("#stat-cats").textContent = CATEGORIES.length - 1;
    $("#stat-deals").textContent = list.filter((b) => b.memberDeal).length;

    renderCats();

    const results = filtered();
    const title = state.category === "all" ? "All businesses" : catById[state.category].label;
    $("#results-title").innerHTML = esc(title) + (state.state !== "All" ? ` <small>${state.state === "AUS" ? "Australia-wide" : "in " + esc(state.state)}</small>` : "");
    $("#results-count").textContent = `${results.length} ${results.length === 1 ? "result" : "results"}`;
    $("#grid").innerHTML = results.map(cardHTML).join("");
    $("#grid").hidden = results.length === 0;
    $("#empty").hidden = results.length !== 0;
  }

  // ---- Filters ----
  const stateOptions = (includeAll) =>
    STATES.filter((s) => includeAll || s !== "All")
      .map((s) => `<option value="${s}">${s === "All" ? "All states" : stateLabel(s)}</option>`)
      .join("");
  $("#state").innerHTML = stateOptions(true);
  $("#f-state").innerHTML = stateOptions(false);
  $("#f-category").innerHTML = CATEGORIES.filter((c) => c.id !== "all")
    .map((c) => `<option value="${c.id}">${esc(c.label)}</option>`)
    .join("");

  $("#search-form").addEventListener("submit", (e) => e.preventDefault());
  $("#q").addEventListener("input", (e) => { state.query = e.target.value; render(); });
  $("#state").addEventListener("change", (e) => { state.state = e.target.value; render(); });
  $("#deals-only").addEventListener("change", (e) => { state.dealsOnly = e.target.checked; render(); });
  $("#cats").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    render();
  });
  $("#clear").addEventListener("click", () => {
    Object.assign(state, { query: "", category: "all", state: "All", dealsOnly: false });
    $("#q").value = "";
    $("#state").value = "All";
    $("#deals-only").checked = false;
    render();
  });

  // ---- Listing form ----
  const modal = $("#modal");
  const form = $("#listing-form");
  const err = $("#form-err");

  function openForm() { modal.hidden = false; form.elements.name.focus(); }
  function closeForm() { modal.hidden = true; form.reset(); err.hidden = true; }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-form]")) openForm();
    if (e.target.closest("[data-close-form]") || e.target === modal) closeForm();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeForm(); });

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3500);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = (k) => form.elements[k].value.trim();
    if (!v("name") || !v("suburb") || !v("blurb")) {
      err.textContent = "Fill in the name, suburb and a short description, mate.";
      err.hidden = false;
      return;
    }
    let website = v("website");
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    const listing = {
      id: Date.now(),
      mine: true,
      name: v("name"),
      category: form.elements.category.value,
      state: form.elements.state.value,
      suburb: v("suburb"),
      phone: v("phone"),
      website,
      blurb: v("blurb"),
      tags: v("tags").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
      memberDeal: v("memberDeal"),
    };
    state.added.unshift(listing);
    saveListings(state.added);
    closeForm();
    render();
    toast(`${listing.name} is on the board. Good on ya.`);
  });

  $("#year").textContent = new Date().getFullYear();
  render();
})();
