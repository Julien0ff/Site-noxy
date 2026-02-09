const copyBtns = document.querySelectorAll(".copy");
copyBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.getAttribute("data-copy") || "";
    try {
      await navigator.clipboard.writeText(value);
      btn.textContent = t("copy.success", "Copied!");
      setTimeout(() => (btn.textContent = t("buttons.copy", "Copy")), 1500);
    } catch {
      btn.textContent = t("copy.error", "Error");
      setTimeout(() => (btn.textContent = t("buttons.copy", "Copy")), 1500);
    }
  });
});

const getCookie = (name) => {
  const safeName = name.replace(/([.$?*|{}()[\]\\/\+^])/g, "\\$1");
  const match = document.cookie.match(new RegExp(`(?:^|; )${safeName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (name, value, days = 365) => {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
};

const getStored = (key) => {
  const cookieValue = getCookie(key);
  if (cookieValue) return cookieValue;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStored = (key, value) => {
  setCookie(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const UI_DEFAULT_LANG = "en";
const normalizeTheme = (value) => (["light", "dark", "auto"].includes(value) ? value : "auto");
const normalizeLang = (value) => {
  if (typeof value !== "string") return UI_DEFAULT_LANG;
  const trimmed = value.trim().toLowerCase();
  return trimmed || UI_DEFAULT_LANG;
};

const uiCache = new Map();
let uiStrings = {};

const fetchUiJson = async (lang) => {
  if (uiCache.has(lang)) return uiCache.get(lang);
  const response = await fetch(`data/UI/${lang}.json`);
  if (!response.ok) throw new Error(`Erreur de chargement: data/UI/${lang}.json`);
  const data = await response.json();
  uiCache.set(lang, data);
  return data;
};

const deepMerge = (base, override) => {
  if (!override || typeof override !== "object") return base;
  const result = Array.isArray(base) ? [...base] : { ...(base || {}) };
  Object.keys(override).forEach((key) => {
    const value = override[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(base?.[key] || {}, value);
    } else {
      result[key] = value;
    }
  });
  return result;
};

const loadUiStrings = async (lang) => {
  const normalized = normalizeLang(lang);
  let base = {};
  try {
    base = await fetchUiJson(UI_DEFAULT_LANG);
  } catch {
    base = {};
  }
  if (normalized === UI_DEFAULT_LANG) {
    uiStrings = base;
    return uiStrings;
  }
  let override = {};
  try {
    override = await fetchUiJson(normalized);
  } catch {
    override = {};
  }
  uiStrings = deepMerge(base, override);
  return uiStrings;
};

const t = (path, fallback = "") => {
  if (!path) return fallback;
  const value = path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), uiStrings);
  if (value === undefined || value === null) return fallback;
  return value;
};

const formatTemplate = (template, values = {}) => {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (_, key) => (values[key] !== undefined ? values[key] : ""));
};

const root = document.documentElement;
const savedTheme = normalizeTheme(getStored("aurora_theme"));
const savedLang = normalizeLang(getStored("aurora_lang"));
root.dataset.theme = savedTheme;
root.dataset.lang = savedLang;
document.documentElement.lang = savedLang;

const applyTheme = (theme) => {
  const normalized = normalizeTheme(theme);
  root.dataset.theme = normalized;
  setStored("aurora_theme", normalized);
};

const setText = (selector, key, options = {}) => {
  const value = t(key, options.fallback || "");
  if (!value) return;
  document.querySelectorAll(selector).forEach((el) => {
    if (options.html) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });
};

const setAttr = (selector, attr, key, options = {}) => {
  const value = t(key, options.fallback || "");
  if (!value) return;
  document.querySelectorAll(selector).forEach((el) => {
    el.setAttribute(attr, value);
  });
};

const applyUiStrings = () => {
  const page = document.body?.dataset.page;
  document.documentElement.lang = root.dataset.lang || UI_DEFAULT_LANG;

  setText('nav .nav-links a[href="resourcepacks.html"]', "nav.resourcepacks");
  setText('nav .nav-links a[href="mods.html"]', "nav.mods");
  setText('nav .nav-links a[href="modpacks.html"]', "nav.modpacks");
  setText('nav .nav-links a[href="serveurs.html"]', "nav.servers");
  setAttr("nav .nav-links a.nav-icon-btn", "aria-label", "nav.settings");
  setAttr("nav .nav-links a.nav-icon-btn", "title", "nav.settings");
  setAttr(".mobile-settings", "aria-label", "nav.settings");
  setAttr(".mobile-settings", "title", "nav.settings");

  setText('.hero-actions .btn.primary[href="serveurs.html"]', "buttons.servers");
  setText(".hero-actions .btn.ghost span:last-child", "buttons.explore");

  setAttr(".mobile-nav", "aria-label", "mobile.navigationLabel");
  setText('.mobile-nav-item[href="index.html"] span', "breadcrumbs.home");
  setText('.mobile-nav-item[href="serveurs.html"] span', "nav.servers");
  setAttr(".mobile-nav-center", "aria-label", "mobile.explore");

  setAttr(".mobile-nav-modal", "aria-label", "mobile.explore");
  setAttr(".mobile-nav-close", "aria-label", "buttons.close");
  setText(".mobile-nav-modal h3", "mobile.explore");
  setText('.mobile-nav-actions a[href="modpacks.html"]', "nav.modpacks");
  setText('.mobile-nav-actions a[href="mods.html"]', "nav.mods");
  setText('.mobile-nav-actions a[href="resourcepacks.html"]', "nav.resourcepacks");
  setText('.mobile-nav-actions a[href="parametres.html"]', "nav.settings");

  setText("footer.footer > div:first-child", "footer.copyright");
  setText("footer .footer-links a:nth-child(1)", "footer.discord");
  setText("footer .footer-links a:nth-child(2)", "footer.tiktok");
  setText("footer .footer-links a:nth-child(3)", "footer.shop");

  setText('.breadcrumbs a[href="index.html"]', "breadcrumbs.home");
  setText('.breadcrumbs a[href="mods.html"]', "nav.mods");
  setText('.breadcrumbs a[href="modpacks.html"]', "nav.modpacks");
  setText('.breadcrumbs a[href="resourcepacks.html"]', "nav.resourcepacks");
  setText('.breadcrumbs a[href="serveurs.html"]', "nav.servers");
  setText('.breadcrumbs a[href="parametres.html"]', "nav.settings");

  setAttr(".download-modal", "aria-label", "download.modalLabel");
  setAttr(".download-close", "aria-label", "buttons.close");
  setText("[data-download-title]", "download.modalLabel");

  setText(".copy", "buttons.copy");

  if (page === "home") {
    setText(".hero-content h1", "home.hero.title", { html: true });
    setText(".hero-content p", "home.hero.subtitle");
    setText("#modpacks h2", "sections.modpacks");
    setText("#mods h2", "sections.mods");
    setText("#resourcepacks h2", "sections.resourcepacks");
    const prefix = t("site.titlePrefix", "AuroraStudio —");
    const suffix = t("site.titles.home", "Home");
    document.title = `${prefix} ${suffix}`.trim();
  }

  if (page === "list") {
    const type = document.body?.dataset.type;
    const listMap = {
      mods: "list.mods",
      modpacks: "list.modpacks",
      resourcepacks: "list.resourcepacks",
    };
    const titleMap = {
      mods: "site.titles.mods",
      modpacks: "site.titles.modpacks",
      resourcepacks: "site.titles.resourcepacks",
    };
    const baseKey = listMap[type];
    if (baseKey) {
      setText("main.page > h1", `${baseKey}.title`);
      setText("main.page > p", `${baseKey}.subtitle`);
      setText(".breadcrumbs span", `${baseKey}.breadcrumb`);
    }
    const titleKey = titleMap[type];
    if (titleKey) {
      const prefix = t("site.titlePrefix", "AuroraStudio —");
      const suffix = t(titleKey, "");
      if (suffix) document.title = `${prefix} ${suffix}`.trim();
    }
  }

  if (page === "detail") {
    setText('[data-tab="description"]', "detail.tabs.description");
    setText('[data-tab="images"]', "detail.tabs.images");
    setText('[data-tab="downloads"]', "detail.tabs.downloads");
    setText('[data-tab="changelog"]', "detail.tabs.changelog");
    setText('.tab-panel[data-panel="changelog"] .empty-state', "detail.empty.changelog");
    setText("[data-download-main] span:last-child", "detail.downloadCta");
    const prefix = t("site.titlePrefix", "AuroraStudio —");
    const suffix = t("site.titles.details", "Details");
    document.title = `${prefix} ${suffix}`.trim();
  }

  if (page === "servers") {
    setText(".breadcrumbs span", "nav.servers");
    setText(".page-hero .badge", "servers.badge");
    setText(".page-hero h1", "servers.title");
    setText(".page-hero p", "servers.subtitle");
    setText(".page-hero .info-box h3", "servers.info.title");
    setText(".page-hero .info-box p", "servers.info.text");
    setText("#survie > h3", "servers.survival.title");
    setText("#survie > p", "servers.survival.description");
    setText("#survie .server-card .label", "servers.survival.ipLabel");
    setText("#survie .tags .tag:nth-child(1)", "servers.survival.tags.quest");
    setText("#survie .tags .tag:nth-child(2)", "servers.survival.tags.boss");
    setText("#survie .tags .tag:nth-child(3)", "servers.survival.tags.economy");
    setText("#creatif > h3", "servers.creative.title");
    setText("#creatif > p", "servers.creative.description");
    setText("#creatif .server-card .label", "servers.creative.ipLabel");
    setText("#creatif .tags .tag:nth-child(1)", "servers.creative.tags.plots");
    setText("#creatif .tags .tag:nth-child(2)", "servers.creative.tags.worldedit");
    setText("#creatif .tags .tag:nth-child(3)", "servers.creative.tags.decorations");
    const prefix = t("site.titlePrefix", "AuroraStudio —");
    const suffix = t("site.titles.servers", "Servers");
    document.title = `${prefix} ${suffix}`.trim();
  }

  if (page === "settings") {
    setText(".breadcrumbs span", "settings.breadcrumb");
    setText(".settings-title", "settings.title");
    setText(".settings-header h1", "settings.title");
    setText(".settings-header p", "settings.intro");
    setText(".settings-section", "settings.sidebar.display");
    setText('[data-settings-tab="appearance"] span:first-child', "settings.sidebar.appearance");
    setText('[data-settings-tab="language"] span:first-child', "settings.sidebar.language");
    setText(".beta-pill", "settings.sidebar.beta");
    setText('[data-settings-panel="appearance"] h2', "settings.appearance.title");
    setText('[data-settings-panel="appearance"] p', "settings.appearance.subtitle");
    setText('[data-settings-panel="language"] h2', "settings.language.title");
    setText('[data-settings-panel="language"] p', "settings.language.subtitle");

    const updateThemeCard = (value, nameKey, metaKey) => {
      const input = document.querySelector(`.theme-card input[value="${value}"]`);
      const card = input?.closest(".theme-card");
      if (!card) return;
      const nameEl = card.querySelector(".theme-name");
      const metaEl = card.querySelector(".theme-meta");
      if (nameEl) nameEl.textContent = t(nameKey, nameEl.textContent);
      if (metaEl) metaEl.textContent = t(metaKey, metaEl.textContent);
    };

    updateThemeCard("auto", "settings.appearance.options.auto.name", "settings.appearance.options.auto.meta");
    updateThemeCard("light", "settings.appearance.options.light.name", "settings.appearance.options.light.meta");
    updateThemeCard("dark", "settings.appearance.options.dark.name", "settings.appearance.options.dark.meta");

    const updateLangCard = (value, nameKey, metaKey) => {
      const input = document.querySelector(`.lang-card input[value="${value}"]`);
      const card = input?.closest(".lang-card");
      if (!card) return;
      const nameEl = card.querySelector(".lang-name");
      const metaEl = card.querySelector(".lang-meta");
      if (nameEl) nameEl.textContent = t(nameKey, nameEl.textContent);
      if (metaEl) metaEl.textContent = t(metaKey, metaEl.textContent);
    };

    updateLangCard("fr", "settings.language.options.fr.name", "settings.language.options.fr.meta");
    updateLangCard("en", "settings.language.options.en.name", "settings.language.options.en.meta");
    updateLangCard("pl", "settings.language.options.pl.name", "settings.language.options.pl.meta");

    const prefix = t("site.titlePrefix", "AuroraStudio —");
    const suffix = t("site.titles.settings", "Settings");
    document.title = `${prefix} ${suffix}`.trim();
  }
};

const applyLang = async (lang) => {
  const normalized = normalizeLang(lang);
  root.dataset.lang = normalized;
  document.documentElement.lang = normalized;
  setStored("aurora_lang", normalized);
  await loadUiStrings(normalized);
  applyUiStrings();
  await initDataPages();
};

const tabsets = document.querySelectorAll("[data-tabset]");
tabsets.forEach((tabset) => {
  const buttons = tabset.querySelectorAll("[data-tab]");
  const panels = tabset.querySelectorAll("[data-panel]");
  if (!buttons.length || !panels.length) return;

  const activate = (name) => {
    buttons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === name);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === name);
    });
  };

  const current = Array.from(buttons).find((btn) => btn.classList.contains("is-active"));
  activate(current ? current.dataset.tab : buttons[0].dataset.tab);

  const activateFromHash = () => {
    const hash = window.location.hash.replace("#", "").trim();
    if (!hash) return;
    const match = Array.from(buttons).find((btn) => btn.dataset.tab === hash);
    if (match) activate(hash);
  };

  activateFromHash();
  window.addEventListener("hashchange", activateFromHash);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activate(btn.dataset.tab);
      history.replaceState(null, "", `#${btn.dataset.tab}`);
    });
  });
});

const settingsTabs = document.querySelectorAll("[data-settings-tab]");
const settingsPanels = document.querySelectorAll("[data-settings-panel]");
if (settingsTabs.length && settingsPanels.length) {
  const activateSettings = (name) => {
    settingsTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.settingsTab === name);
    });
    settingsPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.settingsPanel === name);
    });
  };

  activateSettings(settingsTabs[0].dataset.settingsTab);
  settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateSettings(tab.dataset.settingsTab));
  });
}

const themeInputs = document.querySelectorAll("input[data-setting=\"theme\"]");
if (themeInputs.length) {
  themeInputs.forEach((input) => {
    input.checked = input.value === savedTheme;
    input.addEventListener("change", () => applyTheme(input.value));
  });
}

const langInputs = document.querySelectorAll("input[data-setting=\"lang\"]");
if (langInputs.length) {
  langInputs.forEach((input) => {
    input.checked = input.value === savedLang;
    input.addEventListener("change", () => applyLang(input.value));
  });
}

const mobileOverlay = document.querySelector("[data-mobile-overlay]");
const mobileOpeners = document.querySelectorAll("[data-mobile-open]");
const mobileClosers = document.querySelectorAll("[data-mobile-close]");

if (mobileOverlay) {
  let closeTimer;
  const openModal = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    }
    mobileOverlay.classList.remove("is-closing");
    mobileOverlay.classList.add("is-open");
  };
  const closeModal = () => {
    if (!mobileOverlay.classList.contains("is-open")) return;
    mobileOverlay.classList.remove("is-open");
    mobileOverlay.classList.add("is-closing");
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      mobileOverlay.classList.remove("is-closing");
      closeTimer = undefined;
    }, 320);
  };

  mobileOpeners.forEach((btn) => btn.addEventListener("click", openModal));
  mobileClosers.forEach((btn) => btn.addEventListener("click", closeModal));

  mobileOverlay.addEventListener("click", (event) => {
    if (event.target === mobileOverlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

const DATA_FOLDERS = {
  mod: "mods",
  modpack: "modpacks",
  resourcepack: "resourcepacks",
  mods: "mods",
  modpacks: "modpacks",
  resourcepacks: "resourcepacks",
};

const STATUS_CLASSES = {
  release: "release",
  beta: "beta",
  alpha: "alpha",
};

const normalizeTypeKey = (value) => (value ? value.replace(/s$/, "") : value);
const getTypeLabel = (value) => {
  const key = normalizeTypeKey(value);
  return t(`types.${key}`, key || "");
};

const getStatusInfo = (status) => {
  const key = STATUS_CLASSES[status] ? status : "alpha";
  return {
    label: t(`status.${key}`, key),
    letter: t(`statusLetters.${key}`, key.charAt(0).toUpperCase()),
    className: STATUS_CLASSES[key],
  };
};
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const uniqueValues = (values) => Array.from(new Set(values.filter(Boolean)));

const getTextBlock = (content) => {
  const lang = root.dataset.lang || UI_DEFAULT_LANG;
  if (!content?.texts) return {};
  const english = content.texts.en || {};
  const localized = content.texts[lang] || {};
  if (lang === "en") return { ...english };
  if (Object.keys(english).length) return { ...english, ...localized };
  const fallback = Object.values(content.texts)[0] || {};
  return { ...fallback, ...localized };
};

const jsonCache = new Map();
const fetchJson = async (path) => {
  if (jsonCache.has(path)) return jsonCache.get(path);
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erreur de chargement: ${path}`);
  const data = await response.json();
  jsonCache.set(path, data);
  return data;
};

const downloadOverlay = document.querySelector("[data-download-overlay]");
const downloadBody = downloadOverlay?.querySelector("[data-download-body]");
const downloadTitle = downloadOverlay?.querySelector("[data-download-title]");
const downloadClosers = downloadOverlay ? downloadOverlay.querySelectorAll("[data-download-close]") : [];
let downloadTimer;

const closeDownloadModal = () => {
  if (!downloadOverlay || !downloadOverlay.classList.contains("is-open")) return;
  downloadOverlay.classList.remove("is-open");
  downloadOverlay.classList.add("is-closing");
  if (downloadTimer) clearTimeout(downloadTimer);
  downloadTimer = setTimeout(() => {
    downloadOverlay.classList.remove("is-closing");
    downloadTimer = undefined;
  }, 220);
};

const openDownloadModal = (content) => {
  if (!downloadOverlay || !downloadBody) return;
  if (downloadTimer) {
    clearTimeout(downloadTimer);
    downloadTimer = undefined;
  }
  const text = getTextBlock(content);
  if (downloadTitle) {
    const label = text.title || getTypeLabel(content.type) || t("site.titles.details", "Details");
    downloadTitle.textContent = `${t("download.titlePrefix", "Download —")} ${label}`;
  }
  downloadBody.innerHTML = "";
  renderDownloadModal(content, text);
  downloadOverlay.classList.remove("is-closing");
  downloadOverlay.classList.add("is-open");
};

if (downloadOverlay) {
  downloadClosers.forEach((btn) => btn.addEventListener("click", closeDownloadModal));
  downloadOverlay.addEventListener("click", (event) => {
    if (event.target === downloadOverlay) closeDownloadModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDownloadModal();
  });
}

const createStatusDot = (status) => {
  const info = getStatusInfo(status);
  return `<span class="status-dot ${info.className}">${info.letter}</span><span class="status-text">${info.label}</span>`;
};

const renderListPage = async (typeKey) => {
  const listEl = document.querySelector("[data-list]");
  if (!listEl) return;
  try {
    const manifest = await fetchJson("data/manifest.json");
    const entries = ensureArray(manifest[typeKey]).filter((item) => item.listed);
    const contents = await Promise.all(
      entries.map((item) => fetchJson(`data/${typeKey}/${item.id}.json`).catch(() => null))
    );
    const html = contents
      .filter(Boolean)
      .map((content) => {
        const text = getTextBlock(content);
        const title = text.title || content.id;
        const latest = ensureArray(content.versions)[0];
        const statusInfo = getStatusInfo(latest?.status);
        const versionName = latest?.name || "—";
        const logo = content.images?.logo;
        const tags = ensureArray(content.tags);
        const tagHtml = tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
        const iconHtml = logo
          ? `<img src="${logo}" alt="${title}" />`
          : `<span class="icon-letter">${title.charAt(0).toUpperCase()}</span>`;
        const statusHtml = `<span class="status-dot ${statusInfo.className}">${statusInfo.letter}</span><span class="status-text">${statusInfo.label}</span>`;
        return `
        <div class="list-item-container">
          <a class="list-item" href="${content.page || "#"}">
            <div class="list-icon">${iconHtml}</div>
            <div>
              <div class="list-title">${title}</div>
              <p class="list-desc">${text.shortDescription || ""}</p>
              <div class="list-meta">${tagHtml}</div>
            </div>
            <div class="list-stats">
              <div>
                <div class="stat-value">${versionName}</div>
              <div class="stat-label">${t("list.labels.version", "Version")}</div>
              </div>
              <div>
                <div class="stat-value">${statusHtml}</div>
              <div class="stat-label">${t("list.labels.status", "Status")}</div>
              </div>
            </div>
          </a>
          <button class="list-download-btn" type="button" data-download-id="${content.id}" data-download-type="${typeKey}" aria-label="${t("download.label", "Download")}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12"></path>
              <path d="M7 10l5 5 5-5"></path>
              <path d="M5 21h14"></path>
            </svg>
          </button>
        </div>`;
      })
      .join("");
    listEl.innerHTML = html || `<p class="empty-state">${t("list.empty", "No content available.")}</p>`;
  } catch (error) {
    listEl.innerHTML = `<p class="empty-state">${t("list.error", "Unable to load data.")}</p>`;
  }
};

const buildCard = (content) => {
  const text = getTextBlock(content);
  const title = text.title || content.id;
  const description = text.shortDescription || "";
  const image = content.images?.banner || content.images?.logo;
  const hasImage = Boolean(image);
  
  const downloadBtn = `
    <button class="card-download" type="button" data-download-id="${content.id}" data-download-type="${content.type}" aria-label="${t("download.label", "Download")}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v12"></path>
        <path d="M7 10l5 5 5-5"></path>
        <path d="M5 21h14"></path>
      </svg>
    </button>`;

  if (hasImage) {
    return `
      <div class="card media-card">
        <a class="card-link" href="${content.page || "#"}">
          <img src="${image}" alt="${title}" />
          <div class="card-body">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        </a>
        ${downloadBtn}
      </div>`;
  }
  return `
    <div class="card">
      <a class="card-link" href="${content.page || "#"}">
        <div class="card-body">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </a>
      ${downloadBtn}
    </div>`;
};

const renderHomePage = async () => {
  const sections = {
    modpacks: document.querySelector('[data-featured-list="modpacks"]'),
    mods: document.querySelector('[data-featured-list="mods"]'),
    resourcepacks: document.querySelector('[data-featured-list="resourcepacks"]'),
  };
  try {
    const manifest = await fetchJson("data/manifest.json");
    await Promise.all(
      Object.entries(sections).map(async ([key, container]) => {
        if (!container) return;
        const entries = ensureArray(manifest[key]);
        const featured = entries.filter((item) => item.featured);
        const selection = (featured.length ? featured : entries.filter((item) => item.listed)).slice(0, 4);
        const contents = await Promise.all(
          selection.map((item) => fetchJson(`data/${key}/${item.id}.json`).catch(() => null))
        );
        container.innerHTML = contents.filter(Boolean).map(buildCard).join("");
      })
    );
  } catch {
    // ignore homepage errors
  }
};

const renderDetailPage = async (typeKey, id) => {
  const folder = DATA_FOLDERS[typeKey];
  if (!folder || !id) return;
  try {
    const content = await fetchJson(`data/${folder}/${id}.json`);
    const text = getTextBlock(content);
    const titlePrefix = t("site.titlePrefix", "AuroraStudio —");
    document.title = `${titlePrefix} ${text.title || t("site.titles.details", "Details")}`.trim();

    document.querySelectorAll('[data-field="breadcrumb"]').forEach((el) => {
      el.textContent = text.title || content.id;
    });
    document.querySelectorAll('[data-field="title"]').forEach((el) => {
      el.textContent = text.title || content.id;
    });
    document.querySelectorAll('[data-field="subtitle"]').forEach((el) => {
      el.textContent = text.shortDescription || "";
    });
    document.querySelectorAll('[data-field="type-label"]').forEach((el) => {
      el.textContent = getTypeLabel(content.type || typeKey) || "";
    });
    document.querySelectorAll('[data-field="byline"]').forEach((el) => {
      if (text.byline) {
        el.textContent = text.byline;
        el.style.display = "";
      } else {
        el.textContent = "";
        el.style.display = "none";
      }
    });

    const logoEl = document.querySelector('[data-field="logo"]');
    if (logoEl) {
      logoEl.innerHTML = "";
      if (content.images?.logo) {
        const img = document.createElement("img");
        img.src = content.images.logo;
        img.alt = text.title || content.id;
        logoEl.appendChild(img);
      } else {
        const span = document.createElement("span");
        span.className = "icon-letter";
        span.textContent = (text.title || content.id || "?").charAt(0).toUpperCase();
        logoEl.appendChild(span);
      }
    }

    const tagsEl = document.querySelector('[data-field="tags"]');
    if (tagsEl) {
      tagsEl.innerHTML = "";
      ensureArray(content.tags).forEach((tag) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag;
        tagsEl.appendChild(span);
      });
    }

    const descriptionEl = document.querySelector('[data-field="description"]');
    if (descriptionEl) {
      descriptionEl.innerHTML = text.descriptionHtml || `<p class="empty-state">${t("detail.empty.description", "Description not available.")}</p>`;
    }

    const galleryEl = document.querySelector('[data-field="gallery"]');
    if (galleryEl) {
      const gallery = ensureArray(content.images?.gallery);
      const fallback = content.images?.banner ? [content.images.banner] : [];
      const images = gallery.length ? gallery : fallback;
      galleryEl.innerHTML = "";
      if (!images.length) {
        galleryEl.innerHTML = `<p class="empty-state">${t("detail.empty.gallery", "No image available.")}</p>`;
      } else {
        images.forEach((src) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = text.title || content.id;
          galleryEl.appendChild(img);
        });
      }
    }

    const versionsEl = document.querySelector('[data-field="versions"]');
    if (versionsEl) {
      versionsEl.innerHTML = "";
      versionsEl.appendChild(buildVersionsTable(content, text));
    }

    renderCompatibility(content);
    renderDetails(content);

    const downloadMain = document.querySelector("[data-download-main]");
    if (downloadMain) {
      downloadMain.onclick = () => openDownloadModal(content);
    }
  } catch {
    // ignore rendering errors
  }
};

const buildVersionsTable = (content, text) => {
  const table = document.createElement("div");
  table.className = "versions-table";
  const header = document.createElement("div");
  header.className = "versions-header";
  header.innerHTML = `<div>${t("versions.headers.name", "Name")}</div><div>${t("versions.headers.version", "Version")}</div><div>${t("versions.headers.platforms", "Platforms")}</div><div>${t("versions.headers.published", "Published")}</div><div>${t("versions.headers.downloads", "Downloads")}</div><div></div>`;
  table.appendChild(header);

  const versions = ensureArray(content.versions);
  if (!versions.length) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "versions-row";
    emptyRow.innerHTML = `<div class="versions-empty">${t("versions.empty", "No downloads available.")}</div>`;
    table.appendChild(emptyRow);
    return table;
  }

  versions.forEach((version) => {
    const info = getStatusInfo(version.status);
    const row = document.createElement("div");
    row.className = "versions-row";

    const nameCell = document.createElement("div");
    nameCell.className = "version-name";
    nameCell.innerHTML = `
      <span class="version-badge ${info.className}">${info.letter}</span>
      <div>
        <div class="version-title">${version.name || "—"}</div>
        <div class="version-sub">${text.title || content.id} ${version.name || ""}</div>
      </div>`;
    row.appendChild(nameCell);

    const versionCell = document.createElement("div");
    versionCell.innerHTML = ensureArray(version.minecraft)
      .map((mc) => `<span class="tag">${mc}</span>`)
      .join("") || "<span class=\"tag\">—</span>";
    row.appendChild(versionCell);

    const platformCell = document.createElement("div");
    const platforms = version.loader ? [version.loader] : ensureArray(content.compatibility?.platforms);
    platformCell.innerHTML = platforms.length
      ? platforms.map((p) => `<span class="tag">${p}</span>`).join("")
      : "<span class=\"tag\">—</span>";
    row.appendChild(platformCell);

    const publishedCell = document.createElement("div");
    publishedCell.textContent = version.published || "—";
    row.appendChild(publishedCell);

    const downloadsCell = document.createElement("div");
    downloadsCell.textContent = version.downloads || "—";
    row.appendChild(downloadsCell);

    const actionsCell = document.createElement("div");
    actionsCell.className = "version-actions";
    const file = ensureArray(version.files)[0];
    if (file?.url) {
      const link = document.createElement("a");
      link.className = "icon-btn";
      link.href = file.url;
      link.setAttribute("aria-label", t("versions.downloadAria", "Download"));
      link.textContent = "⭳";
      actionsCell.appendChild(link);
    } else {
      const disabled = document.createElement("span");
      disabled.className = "icon-btn is-disabled";
      disabled.textContent = "—";
      actionsCell.appendChild(disabled);
    }
    row.appendChild(actionsCell);
    table.appendChild(row);
  });

  return table;
};

const renderCompatibility = (content) => {
  const box = document.querySelector('[data-field="compatibility"]');
  if (!box) return;
  box.innerHTML = `<h3>${t("compatibility.title", "Compatibility")}</h3>`;
  const compat = content.compatibility || {};
  if (compat.edition) {
    const p = document.createElement("p");
    p.textContent = formatTemplate(t("compatibility.minecraftEdition", "Minecraft: {edition} Edition"), {
      edition: compat.edition,
    });
    box.appendChild(p);
  }
  const mc = ensureArray(compat.minecraft);
  if (mc.length) {
    mc.forEach((version) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = version;
      box.appendChild(span);
    });
  }
  const platforms = ensureArray(compat.platforms);
  if (platforms.length) {
    const p = document.createElement("p");
    p.textContent = t("compatibility.platforms", "Platforms");
    box.appendChild(p);
    platforms.forEach((platform) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = platform;
      box.appendChild(span);
    });
  }
  const env = ensureArray(compat.environments);
  if (env.length) {
    const p = document.createElement("p");
    p.textContent = t("compatibility.environments", "Supported environments");
    box.appendChild(p);
    env.forEach((environment) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = environment;
      box.appendChild(span);
    });
  }
  if (!compat.edition && !mc.length && !platforms.length && !env.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = t("compatibility.empty", "Not specified.");
    box.appendChild(p);
  }
};

const renderDetails = (content) => {
  const box = document.querySelector('[data-field="details"]');
  if (!box) return;
  box.innerHTML = `<h3>${t("details.title", "Details")}</h3>`;
  const details = [...ensureArray(content.details)];
  const latest = ensureArray(content.versions)[0];
  if (latest?.status) {
    const status = getStatusInfo(latest.status).label;
    details.push(`${t("details.status", "Status")}: ${status}`);
  }
  if (!details.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = t("details.empty", "Not specified.");
    box.appendChild(p);
    return;
  }
  details.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    box.appendChild(p);
  });
};

const renderDownloadModal = (content, text) => {
  if (!downloadBody) return;
  if (content.type === "mod") {
    renderModDownload(content, text);
    return;
  }
  if (content.type === "resourcepack") {
    renderResourcepackDownload(content, text);
    return;
  }
  renderModpackDownload(content, text);
};

const renderModpackDownload = (content, text) => {
  if (!downloadBody) return;
  const latest = ensureArray(content.versions)[0];
  const info = document.createElement("p");
  info.className = "download-meta";
  info.innerHTML = `${t("download.latest", "Latest version:")} <strong>${latest?.name || "—"}</strong>`;
  downloadBody.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "download-actions";
  const modrinth = content.links?.modrinth;
  const curseforge = content.links?.curseforge;
  if (modrinth && modrinth !== "#") {
    const link = document.createElement("a");
    link.className = "download-btn modrinth";
    link.href = modrinth;
    link.textContent = t("download.modrinth", "Download on Modrinth");
    actions.appendChild(link);
  }
  if (curseforge && curseforge !== "#") {
    const link = document.createElement("a");
    link.className = "download-btn curseforge";
    link.href = curseforge;
    link.textContent = t("download.curseforge", "Download on CurseForge");
    actions.appendChild(link);
  }
  if (!actions.children.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = t("download.noLinks", "No links available.");
    downloadBody.appendChild(empty);
    return;
  }
  downloadBody.appendChild(actions);
};

const renderModDownload = (content) => {
  if (!downloadBody) return;
  const versions = ensureArray(content.versions);
  const mcOptions = uniqueValues(versions.flatMap((version) => ensureArray(version.minecraft)));
  const loaderOptions = uniqueValues(versions.map((version) => version.loader).filter(Boolean));

  const filters = document.createElement("div");
  filters.className = "download-filters";
  const results = document.createElement("div");
  results.className = "download-results";

  let currentMc = mcOptions[0] || "";
  let currentLoader = loaderOptions[0] || "";

  const updateResults = () => {
    results.innerHTML = "";
    const matches = versions.filter((version) => {
      const mcMatch = !currentMc || ensureArray(version.minecraft).includes(currentMc) || !ensureArray(version.minecraft).length;
      const loaderMatch = !currentLoader || version.loader === currentLoader || !version.loader;
      return mcMatch && loaderMatch;
    });
    if (!matches.length) {
      results.innerHTML = `<p class="empty-state">${t("download.noCompatible", "No compatible files.")}</p>`;
      return;
    }
    matches.forEach((version) => {
      results.appendChild(buildDownloadItem(version, content));
    });
  };

  if (mcOptions.length) {
    const label = document.createElement("label");
    label.className = "download-label";
    label.textContent = t("download.filters.minecraft", "Minecraft version");
    const select = document.createElement("select");
    select.className = "download-select";
    mcOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      currentMc = select.value;
      updateResults();
    });
    label.appendChild(select);
    filters.appendChild(label);
  }

  if (loaderOptions.length) {
    const label = document.createElement("label");
    label.className = "download-label";
    label.textContent = t("download.filters.loader", "Loader");
    const select = document.createElement("select");
    select.className = "download-select";
    loaderOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      currentLoader = select.value;
      updateResults();
    });
    label.appendChild(select);
    filters.appendChild(label);
  }

  downloadBody.appendChild(filters);
  downloadBody.appendChild(results);
  updateResults();
};

const renderResourcepackDownload = (content) => {
  if (!downloadBody) return;
  const versions = ensureArray(content.versions);
  const mcOptions = uniqueValues(versions.flatMap((version) => ensureArray(version.minecraft)));

  const filters = document.createElement("div");
  filters.className = "download-filters";
  const results = document.createElement("div");
  results.className = "download-results";

  let currentMc = mcOptions[0] || "";

  const updateResults = () => {
    results.innerHTML = "";
    const matches = versions.filter((version) => {
      return !currentMc || ensureArray(version.minecraft).includes(currentMc) || !ensureArray(version.minecraft).length;
    });
    if (!matches.length) {
      results.innerHTML = `<p class="empty-state">${t("download.noCompatible", "No compatible files.")}</p>`;
      return;
    }
    matches.forEach((version) => {
      results.appendChild(buildDownloadItem(version, content));
    });
  };

  if (mcOptions.length) {
    const label = document.createElement("label");
    label.className = "download-label";
    label.textContent = t("download.filters.minecraft", "Minecraft version");
    const select = document.createElement("select");
    select.className = "download-select";
    mcOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      currentMc = select.value;
      updateResults();
    });
    label.appendChild(select);
    filters.appendChild(label);
  }

  downloadBody.appendChild(filters);
  downloadBody.appendChild(results);
  updateResults();
};

const buildDownloadItem = (version, content) => {
  const info = getStatusInfo(version.status);
  const item = document.createElement("div");
  item.className = "download-item";

  const header = document.createElement("div");
  header.className = "download-item-header";
  header.innerHTML = `
    <span class="version-badge ${info.className}">${info.letter}</span>
    <div>
      <div class="download-item-title">${version.name || "—"}</div>
      <div class="download-item-sub">${ensureArray(version.minecraft).join(", ")}${version.loader ? ` • ${version.loader}` : ""}</div>
    </div>`;
  item.appendChild(header);

  const files = ensureArray(version.files);
  const fileList = document.createElement("div");
  fileList.className = "download-file-list";
  if (!files.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = t("download.noFiles", "No files available.");
    fileList.appendChild(empty);
  } else {
    files.forEach((file) => {
      const link = document.createElement("a");
      link.className = "download-file";
      link.href = file.url || "#";
      link.textContent = file.label || t("download.fileLabel", "Download");
      fileList.appendChild(link);
    });
  }
  item.appendChild(fileList);
  return item;
};

const initDataPages = async () => {
  const page = document.body?.dataset.page;
  if (page === "home") {
    await renderHomePage();
    return;
  }
  if (page === "list") {
    const type = document.body.dataset.type;
    if (type) await renderListPage(type);
    return;
  }
  if (page === "detail") {
    const type = document.body.dataset.type;
    const id = document.body.dataset.id;
    if (type && id) await renderDetailPage(type, id);
  }

  // Set active navbar link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-nav-item, .mobile-nav-actions a, .brand");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    
    // Normalize paths for comparison
    const pathName = currentPath.split("/").pop() || "index.html";
    const hrefName = href.split("/").pop();
    
    // Check for direct match
    let isActive = pathName === hrefName;
    
    // Handle category active states for detail pages
    if (!isActive && hrefName !== "index.html") {
      if (hrefName === "mods.html" && pathName.startsWith("mod-")) isActive = true;
      if (hrefName === "modpacks.html" && pathName.startsWith("modpack-")) isActive = true;
      if (hrefName === "resourcepacks.html" && pathName.startsWith("resourcepack-")) isActive = true;
    }
    
    // Special case for root
    if (!isActive && pathName === "index.html" && hrefName === "index.html") isActive = true;
    
    if (isActive) {
      link.classList.add("active");
    }
  });

  // Handle dynamic download button clicks
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-download-id]");
    if (!btn) return;

    const id = btn.dataset.downloadId;
    const type = btn.dataset.downloadType || document.body.dataset.type;
    if (!id || !type) return;

    try {
      const folder = DATA_FOLDERS[type] || type;
      const content = await fetchJson(`data/${folder}/${id}.json`);
      openDownloadModal(content);
    } catch (error) {
      console.error("Failed to load download data:", error);
    }
  });
};

const boot = async () => {
  await loadUiStrings(savedLang);
  applyUiStrings();
  await initDataPages();
};

boot();
