const state = {
  activeTab: "icons",
  selectedId: null,
  query: "",
  icons: [],
  emojis: [],
};

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const tabs = Array.from(document.querySelectorAll(".tab"));

async function loadData() {
  const [iconsResponse, emojisResponse] = await Promise.all([
    fetch("iconslib/icons.json"),
    fetch("emojilib/emojis.json"),
  ]);

  const iconsData = await iconsResponse.json();
  const emojisData = await emojisResponse.json();

  state.icons = Array.isArray(iconsData.icons) ? iconsData.icons : [];
  state.emojis = Object.entries(emojisData).map(([emoji, details]) => ({
    emoji,
    ...details,
  }));

  render();
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filterItems(items) {
  if (!state.query) return items;

  return items.filter((item) => {
    const haystack = state.activeTab === "icons"
      ? `${item.name} ${item.category}`
      : `${item.name} ${item.slug || ""} ${item.group || ""} ${item.emoji}`;

    return normalize(haystack).includes(normalize(state.query));
  });
}

function getCurrentItems() {
  const source = state.activeTab === "icons" ? state.icons : state.emojis;
  return filterItems(source);
}

function createIconCard(icon, index) {
  const id = `icon-${index}`;
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.dataset.id = id;

  card.innerHTML = `
    <span class="symbol" aria-hidden="true">${icon.svg}</span>
    <span class="name">${icon.name}</span>
  `;

  card.addEventListener("click", () => toggleSelected(id));
  return card;
}

function createEmojiCard(emojiItem, index) {
  const id = `emoji-${index}`;
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.dataset.id = id;

  card.innerHTML = `
    <span class="symbol" aria-hidden="true">${emojiItem.emoji}</span>
    <span class="name">${emojiItem.name}</span>
  `;

  card.addEventListener("click", () => toggleSelected(id));
  return card;
}

function toggleSelected(id) {
  state.selectedId = state.selectedId === id ? null : id;
  render();
}

function render() {
  const items = getCurrentItems();
  grid.innerHTML = "";

  items.forEach((item, index) => {
    const card = state.activeTab === "icons"
      ? createIconCard(item, index)
      : createEmojiCard(item, index);

    if (card.dataset.id === state.selectedId) {
      card.classList.add("selected");
    }

    grid.appendChild(card);
  });

  emptyState.hidden = items.length > 0;
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeTab = tab.dataset.tab;
    state.selectedId = null;

    tabs.forEach((button) => {
      const active = button === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    render();
  });
});

loadData().catch(() => {
  emptyState.hidden = false;
  emptyState.textContent = "Erro ao carregar os arquivos JSON.";
});
