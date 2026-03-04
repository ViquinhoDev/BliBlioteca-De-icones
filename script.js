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
const toast = createToast();
let toastTimeout;

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

function createToast() {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("aria-live", "polite");
  document.body.appendChild(el);
  return el;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
}

async function copyToClipboard(text, htmlText) {
  if (!text && !htmlText) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      if (htmlText && window.ClipboardItem) {
        const payload = new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([htmlText], { type: "text/html" }),
        });
        await navigator.clipboard.write([payload]);
        return true;
      }

      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // fallback abaixo
  }

  try {
    const helper = document.createElement("textarea");
    helper.value = text || htmlText || "";
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(helper);
    return copied;
  } catch (_) {
    return false;
  }
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

  card.addEventListener("click", async () => {
    toggleSelected(id);
    const copied = await copyToClipboard(icon.svg, icon.svg);
    showToast(copied ? `Ícone "${icon.name}" copiado!` : "Não foi possível copiar o ícone.");
  });

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

  card.addEventListener("click", async () => {
    toggleSelected(id);
    const copied = await copyToClipboard(emojiItem.emoji);
    showToast(copied ? `Emoji ${emojiItem.emoji} copiado!` : "Não foi possível copiar o emoji.");
  });

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
