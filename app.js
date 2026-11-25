// Blokes Businesses — plain JS, no build step.
// Depends on CATEGORIES, STATES and EXAMPLE_BUSINESSES from data.js.
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

  const all = () => [...state.added, ...EXAMPLE_BUSINESSES];

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return all().filter((b) => {
      if (state.category !== "all" && b.category !== state.category) return false;
      if (state.state !== "All" && b.state !== state.state) return false;
      if (state.dealsOnly && !b.memberDeal) return false;
      if (!q) return true;
      return [b.name, b.suburb, b.blurb, ...(b.tags || [])].join(" ").toLowerCase().includes(q);
    });
  }

  function cardHTML(b) {
    const cat = catById[b.category] || catById.other;
    const tel = String(b.phone).replace(/[^\d+]/g, "");
    const tags = (b.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const site = /^https?:\/\//i.test(b.website || "")
      ? `<a class="btn btn-ghost btn-sm" href="${esc(b.website)}" target="_blank" rel="noopener noreferrer">Website</a>`
      : "";
    return `
      <article class="card">
        <div class="card-top">
          <span class="card-icon">${cat.icon}</span>
          <div>
            <h3>${esc(b.name)}</h3>
            <p class="card-loc">${esc(b.suburb)}, ${esc(b.state)} · ${esc(cat.label)}</p>
          </div>
        </div>
        <p class="card-blurb">${esc(b.blurb)}</p>
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        <div class="badges">${b.memberDeal ? `<span class="badge deal">🏷️ ${esc(b.memberDeal)}</span>` : ""}${b.veteranOwned ? `<span class="badge vet">🎖️ Veteran owned</span>` : ""}</div>
        <div class="card-foot">
          <span class="owner">${esc(b.owner)}</span>
          <div class="card-actions">
            ${site}
            <a class="btn btn-hi btn-sm" href="tel:${esc(tel)}">📞 ${esc(b.phone)}</a>
          </div>
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
    $("#results-title").innerHTML = esc(title) + (state.state !== "All" ? ` <small>in ${esc(state.state)}</small>` : "");
    $("#results-count").textContent = `${results.length} ${results.length === 1 ? "result" : "results"}`;
    $("#grid").innerHTML = results.map(cardHTML).join("");
    $("#grid").hidden = results.length === 0;
    $("#empty").hidden = results.length !== 0;
  }

  // ---- Filters ----
  const stateOptions = (includeAll) =>
    STATES.filter((s) => includeAll || s !== "All")
      .map((s) => `<option value="${s}">${s === "All" ? "All states" : s}</option>`)
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
    if (!v("name") || !v("suburb") || !v("phone") || !v("blurb")) {
      err.textContent = "Fill in the name, suburb, phone and a short description, mate.";
      err.hidden = false;
      return;
    }
    let website = v("website");
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    const listing = {
      id: Date.now(),
      owner: "Member listing",
      name: v("name"),
      category: form.elements.category.value,
      state: form.elements.state.value,
      suburb: v("suburb"),
      phone: v("phone"),
      website,
      blurb: v("blurb"),
      tags: v("tags").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
      memberDeal: v("memberDeal"),
      veteranOwned: form.elements.veteranOwned.checked,
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
