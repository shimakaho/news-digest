// TODO: リポジトリ作成後に実際のGitHubユーザー名/リポジトリ名に置き換える
const GITHUB_USER = "shimakaho";
const GITHUB_REPO = "news-digest";
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data`;

const STAR_KEY = "news-digest-starred-ids";
const CATEGORY_LABELS = {
  customer: "顧客ニュース",
  industry: "業界ニュース",
  ai_data: "AI・データ業界",
};

function getStarred() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STAR_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function setStarred(set) {
  localStorage.setItem(STAR_KEY, JSON.stringify([...set]));
}

async function fetchJSON(path) {
  const res = await fetch(`${RAW_BASE}/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

async function loadAllItems() {
  const index = await fetchJSON("index.json");
  const dates = index.map((entry) => entry.date).sort().reverse();
  const days = await Promise.all(
    dates.map((date) => fetchJSON(`${date}.json`).catch(() => null))
  );
  const items = [];
  days.forEach((day) => {
    if (!day) return;
    day.items.forEach((item) => {
      items.push({ ...item, date: day.date, covers_weekend: day.covers_weekend });
    });
  });
  return items;
}

function populateFilterOptions(items) {
  const companySelect = document.getElementById("company-filter");
  const dateSelect = document.getElementById("date-filter");

  const companies = [...new Set(items.map((i) => i.company).filter(Boolean))].sort();
  companies.forEach((company) => {
    const opt = document.createElement("option");
    opt.value = company;
    opt.textContent = company;
    companySelect.appendChild(opt);
  });

  const dates = [...new Set(items.map((i) => i.date))].sort().reverse();
  dates.forEach((date) => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = date;
    dateSelect.appendChild(opt);
  });

  if (dates.length > 0) {
    document.getElementById("last-updated").textContent = `最終更新: ${dates[0]}`;
  }
}

function render(items, starred) {
  const container = document.getElementById("items");
  const emptyState = document.getElementById("empty-state");
  container.innerHTML = "";

  if (items.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const meta = document.createElement("div");
    meta.className = "meta";

    const tierBadge = document.createElement("span");
    tierBadge.className = `tier-badge ${item.tier}`;
    tierBadge.textContent = item.tier === "large" ? "大型" : "簡易";
    meta.appendChild(tierBadge);

    const categorySpan = document.createElement("span");
    categorySpan.textContent = CATEGORY_LABELS[item.category] || item.category;
    meta.appendChild(categorySpan);

    if (item.company) {
      const companySpan = document.createElement("span");
      companySpan.textContent = item.company;
      meta.appendChild(companySpan);
    }

    const dateSpan = document.createElement("span");
    dateSpan.textContent = item.date;
    meta.appendChild(dateSpan);

    const starBtn = document.createElement("button");
    starBtn.className = "star-btn";
    starBtn.textContent = starred.has(item.id) ? "★" : "☆";
    starBtn.onclick = () => {
      if (starred.has(item.id)) {
        starred.delete(item.id);
      } else {
        starred.add(item.id);
      }
      setStarred(starred);
      starBtn.textContent = starred.has(item.id) ? "★" : "☆";
    };
    meta.appendChild(starBtn);

    card.appendChild(meta);

    const title = document.createElement("h3");
    title.textContent = item.headline;
    card.appendChild(title);

    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = item.summary;
    card.appendChild(summary);

    const source = document.createElement("p");
    source.className = "source";
    const link = document.createElement("a");
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.source_name || "出典";
    source.appendChild(link);
    card.appendChild(source);

    container.appendChild(card);
  });
}

function applyFilters(items, starred) {
  const company = document.getElementById("company-filter").value;
  const category = document.getElementById("category-filter").value;
  const date = document.getElementById("date-filter").value;
  const starredOnly = document.getElementById("starred-only").checked;

  return items.filter((item) => {
    if (company && item.company !== company) return false;
    if (category && item.category !== category) return false;
    if (date && item.date !== date) return false;
    if (starredOnly && !starred.has(item.id)) return false;
    return true;
  });
}

async function main() {
  const allItems = await loadAllItems();
  const starred = getStarred();
  populateFilterOptions(allItems);

  const rerender = () => render(applyFilters(allItems, starred), starred);

  ["company-filter", "category-filter", "date-filter"].forEach((id) => {
    document.getElementById(id).addEventListener("change", rerender);
  });
  document.getElementById("starred-only").addEventListener("change", rerender);

  rerender();
}

main().catch((err) => {
  document.getElementById("items").textContent = `読み込みエラー: ${err.message}`;
});
