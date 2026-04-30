const STORAGE_KEY = "europa-oportunitatilor.responses.v1";
const DRAFT_KEY = "europa-oportunitatilor.draft.v1";

const directions = [
  {
    id: "invatare",
    label: "Învățare",
    color: "#1e5aa8",
    short: "studiu",
    prompt: "Unde ai merge ca să înveți ceva care ți-ar schimba viitorul?"
  },
  {
    id: "viitor",
    label: "Viitor",
    color: "#14805e",
    short: "viitor",
    prompt: "Ce țară europeană ți se pare că arată cum ar putea arăta viitorul?"
  },
  {
    id: "implicare",
    label: "Implicare",
    color: "#c99812",
    short: "voluntariat",
    prompt: "Unde ai merge ca să ajuți, să contribui sau să faci voluntariat?"
  },
  {
    id: "bariera",
    label: "Barieră",
    color: "#c43f4b",
    short: "barieră",
    prompt: "Unde ai ezita să mergi și de ce?"
  },
  {
    id: "identitate",
    label: "Identitate",
    color: "#6e55c7",
    short: "identitate",
    prompt: "Ce țară se potrivește cu persoana care ai vrea să devii peste 10 ani?"
  }
];

const mapDataset = window.EUROPE_COUNTRIES_GEOJSON || { features: [] };
const countries = mapDataset.features
  .map((feature) => ({
    code: feature.properties.code,
    name: feature.properties.name,
    nameEn: feature.properties.nameEn,
    subregion: feature.properties.subregion
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "ro"));
const mapInstances = new WeakMap();
const europeViewport = [
  [34, -25],
  [72, 45]
];
const romaniaLatLng = [45.9432, 24.9668];
const countryCenters = {
  AD: [42.55, 1.58],
  AL: [41.15, 20.17],
  AM: [40.07, 45.04],
  AT: [47.52, 14.55],
  AZ: [40.14, 47.58],
  BA: [44.16, 17.79],
  BE: [50.5, 4.47],
  BG: [42.73, 25.49],
  BY: [53.71, 27.95],
  CH: [46.82, 8.23],
  CY: [35.13, 33.43],
  CZ: [49.82, 15.47],
  DE: [51.16, 10.45],
  DK: [56.26, 9.5],
  EE: [58.6, 25.01],
  ES: [40.46, -3.75],
  FI: [61.92, 25.75],
  FR: [46.23, 2.21],
  GB: [54.7, -2.4],
  GE: [42.32, 43.36],
  GR: [39.07, 21.82],
  HR: [45.1, 15.2],
  HU: [47.16, 19.5],
  IE: [53.41, -8.24],
  IS: [64.96, -19.02],
  IT: [42.83, 12.57],
  LI: [47.16, 9.55],
  LT: [55.17, 23.88],
  LU: [49.82, 6.13],
  LV: [56.88, 24.6],
  MC: [43.74, 7.42],
  MD: [47.41, 28.37],
  ME: [42.71, 19.37],
  MK: [41.61, 21.75],
  MT: [35.94, 14.38],
  NL: [52.13, 5.29],
  NO: [60.47, 8.47],
  PL: [51.92, 19.15],
  PT: [39.4, -8.22],
  RO: romaniaLatLng,
  RS: [44.02, 20.91],
  RU: [55.75, 37.62],
  SE: [60.13, 18.64],
  SI: [46.15, 14.99],
  SK: [48.67, 19.7],
  SM: [43.94, 12.46],
  TR: [39.0, 35.0],
  UA: [48.38, 31.17],
  VA: [41.9, 12.45],
  XK: [42.6, 20.9]
};

const reasonOptions = [
  "educație",
  "carieră",
  "calitatea vieții",
  "siguranță",
  "mediu",
  "tehnologie",
  "cultură",
  "libertate",
  "oportunități",
  "nu știu exact, dar mă atrage"
];

const barrierOptions = [
  "costurile",
  "limba",
  "distanța",
  "familia",
  "lipsa de informații",
  "încrederea",
  "admiterea",
  "documentele",
  "teama de necunoscut"
];

const opportunityTypes = [
  "Nu știu încă",
  "Studiu",
  "Voluntariat",
  "Schimb de experiență",
  "Internship",
  "Carieră",
  "Cultură și mobilitate"
];

const steps = [
  { title: "Direcția", description: "Alege lentila prin care privești Europa." },
  { title: "Țara", description: "Selectează un loc de pe hartă." },
  { title: "Motivul", description: "Clarifică ce te atrage." },
  { title: "Profunzime", description: "Adaugă bariere, realism și idei." },
  { title: "Context", description: "Finalizează răspunsul." }
];

const emptyDraft = {
  directionId: "",
  countryCode: "",
  reasons: [],
  reasonText: "",
  qMissing: "",
  barriers: [],
  qBarrier: "",
  qBring: "",
  keyword: "",
  realism: 3,
  desire: 4,
  className: "",
  school: "FSGC",
  city: "",
  opportunityType: "Nu știu încă"
};

let responses = loadResponses();
let draft = { ...emptyDraft, ...loadDraft() };
let currentStep = getInitialStep();
let activeMapDirection = "all";
let filters = {
  direction: "all",
  className: "all",
  school: "all",
  city: "all",
  opportunityType: "all"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindDashboardActions();
  renderLanding();
  renderStepper();
  renderWizard();
  renderDashboard();
});

function bindNavigation() {
  $$("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.nav));
  });
}

function showScreen(screenId) {
  $$(".screen").forEach((screen) => screen.classList.toggle("is-active", screen.id === screenId));
  $$(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.nav === screenId));
  if (screenId === "dashboard") {
    renderDashboard();
  }
  if (screenId === "participate") {
    renderWizard();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindDashboardActions() {
  $("#download-csv").addEventListener("click", downloadCsv);
  $("#download-json").addEventListener("click", downloadJson);
  $("#clear-data").addEventListener("click", clearLocalData);
}

function loadResponses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveResponses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  const status = $("#draft-status");
  if (status) {
    status.textContent = "Draft salvat local";
  }
}

function clearDraft() {
  draft = { ...emptyDraft };
  localStorage.removeItem(DRAFT_KEY);
}

function getInitialStep() {
  if (!draft.directionId) return 0;
  if (!draft.countryCode) return 1;
  if (!draft.reasons.length && !draft.reasonText) return 2;
  if (!draft.qMissing && !draft.qBarrier && !draft.qBring && !draft.keyword) return 3;
  return 4;
}

function renderLanding() {
  const stats = getStats(responses);
  $("#landing-total").textContent = stats.total;
  $("#landing-countries").textContent = stats.countryCount;
  $("#landing-top-direction").textContent = stats.topDirection || "-";
  renderHeroEuropeMap($("#landing-map"), responses);
}

function renderStepper() {
  const stepper = $("#stepper");
  stepper.innerHTML = steps
    .map(
      (step, index) => `
        <div class="step-item ${index === currentStep ? "is-current" : ""} ${index < currentStep ? "is-done" : ""}">
          <span class="step-index">${index + 1}</span>
          <span>
            <strong>${step.title}</strong>
            <small>${step.description}</small>
          </span>
        </div>
      `
    )
    .join("");
}

function renderWizard() {
  renderStepper();
  const panel = $("#wizard-panel");
  const renderers = [renderDirectionStep, renderCountryStep, renderReasonStep, renderDepthStep, renderContextStep];
  panel.innerHTML = renderers[currentStep]();
  bindWizardStep(panel);
}

function renderDirectionStep() {
  return `
    <h3>Alege direcția</h3>
    <p class="wizard-intro">
      Începe cu întrebarea care te interesează cel mai mult. Fiecare categorie devine un strat separat în harta finală.
    </p>
    <div class="direction-grid">
      ${directions
        .map(
          (direction) => `
            <button class="direction-card ${draft.directionId === direction.id ? "is-selected" : ""}" type="button"
              data-direction="${direction.id}" style="--accent:${direction.color}">
              <strong>${direction.label}</strong>
              <span>${direction.prompt}</span>
              <small>${direction.short}</small>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCountryStep() {
  const selectedCountry = getCountry(draft.countryCode);
  const direction = getDirection(draft.directionId);
  return `
    <h3>Alege țara</h3>
    <p class="wizard-intro">
      Selectează o țară de pe hartă sau folosește lista. Punctele sunt plasate geografic, iar România rămâne reperul de pornire.
    </p>
    <div class="split-layout">
      <div class="interactive-map" id="country-map"></div>
      <aside class="selection-card">
        <dl>
          <div>
            <dt>Direcție</dt>
            <dd style="color:${direction?.color || "var(--blue)"}">${direction?.label || "Nealeasă"}</dd>
          </div>
          <div>
            <dt>Țară aleasă</dt>
            <dd>${selectedCountry?.name || "Alege de pe hartă"}</dd>
          </div>
        </dl>
        <label class="field">
          <span>Caută în listă</span>
          <select class="country-select" id="country-select">
            <option value="">Alege o țară</option>
            ${countries
              .map((country) => `<option value="${country.code}" ${country.code === draft.countryCode ? "selected" : ""}>${country.name}</option>`)
              .join("")}
          </select>
        </label>
        <div class="form-actions" style="margin-top:22px">
          <button class="ghost-action" type="button" data-prev>Înapoi</button>
          <button class="primary-action" type="button" data-next ${draft.countryCode ? "" : "disabled"}>Continuă</button>
        </div>
      </aside>
    </div>
  `;
}

function renderReasonStep() {
  const selectedCountry = getCountry(draft.countryCode);
  const direction = getDirection(draft.directionId);
  return `
    <h3>Ce te face să alegi această țară?</h3>
    <p class="wizard-intro">
      Ai ales <strong>${selectedCountry?.name || "-"}</strong> pentru direcția <strong style="color:${direction?.color || "var(--blue)"}">${direction?.label || "-"}</strong>.
      Alege motive rapide și adaugă o explicație scurtă.
    </p>
    <div class="form-card">
      <label class="field">
        <span>Răspunsuri rapide</span>
        <div class="chip-row" data-chip-group="reasons">
          ${reasonOptions
            .map(
              (reason) => `
                <button class="chip ${draft.reasons.includes(reason) ? "is-selected" : ""}" type="button" data-chip="${escapeAttr(reason)}">
                  ${reason}
                </button>
              `
            )
            .join("")}
        </div>
      </label>
      <label class="field">
        <span>Spune în 1-2 fraze de ce ai ales această țară</span>
        <textarea id="reason-text" maxlength="420" placeholder="Ex: Mi se pare o țară în care educația și tehnologia sunt luate în serios...">${escapeHtml(draft.reasonText)}</textarea>
      </label>
      <div class="form-actions">
        <button class="ghost-action" type="button" data-prev>Înapoi</button>
        <button class="primary-action" type="button" data-next>Continuă</button>
      </div>
    </div>
  `;
}

function renderDepthStep() {
  return `
    <h3>Întrebări de profunzime</h3>
    <p class="wizard-intro">
      Aici răspunsul devine util pentru analiza calitativă: ce lipsește, ce oprește, ce ar merita adus în România.
    </p>
    <div class="form-card">
      <label class="field">
        <span>Ce ai vrea să găsești acolo și simți că lipsește aici?</span>
        <textarea id="q-missing" maxlength="520">${escapeHtml(draft.qMissing)}</textarea>
      </label>
      <label class="field">
        <span>Ce te-ar putea opri să ajungi acolo?</span>
        <div class="chip-row" data-chip-group="barriers">
          ${barrierOptions
            .map(
              (barrier) => `
                <button class="chip ${draft.barriers.includes(barrier) ? "is-selected" : ""}" type="button" data-chip="${escapeAttr(barrier)}">
                  ${barrier}
                </button>
              `
            )
            .join("")}
        </div>
      </label>
      <label class="field">
        <span>Detaliază bariera principală, dacă vrei</span>
        <textarea id="q-barrier" maxlength="520">${escapeHtml(draft.qBarrier)}</textarea>
      </label>
      <label class="field">
        <span>Ce ai aduce în România din experiența acelei țări?</span>
        <textarea id="q-bring" maxlength="520">${escapeHtml(draft.qBring)}</textarea>
      </label>
      <label class="field">
        <span>Dacă țara aleasă ar fi un cuvânt, care ar fi acela?</span>
        <input id="keyword" value="${escapeAttr(draft.keyword)}" maxlength="42" placeholder="Ex: libertate" />
      </label>
      <label class="field">
        <span>Cât de realist ți se pare să ai o experiență europeană în următorii 5 ani?</span>
        <div class="scale-row" data-scale="realism">
          ${[1, 2, 3, 4, 5].map((value) => `<button class="scale-button ${Number(draft.realism) === value ? "is-selected" : ""}" type="button" data-value="${value}">${value}</button>`).join("")}
        </div>
      </label>
      <label class="field">
        <span>Cât de mult îți dorești experiența aceasta?</span>
        <div class="scale-row" data-scale="desire">
          ${[1, 2, 3, 4, 5].map((value) => `<button class="scale-button ${Number(draft.desire) === value ? "is-selected" : ""}" type="button" data-value="${value}">${value}</button>`).join("")}
        </div>
      </label>
      <div class="form-actions">
        <button class="ghost-action" type="button" data-prev>Înapoi</button>
        <button class="primary-action" type="button" data-next>Continuă</button>
      </div>
    </div>
  `;
}

function renderContextStep() {
  const country = getCountry(draft.countryCode);
  const direction = getDirection(draft.directionId);
  return `
    <h3>Finalizează răspunsul</h3>
    <p class="wizard-intro">
      Completează doar context non-personal. Platforma nu cere nume, email sau date sensibile.
    </p>
    <div class="form-card">
      <div class="review-grid">
        <div class="review-item">
          <span>Direcție</span>
          <strong style="color:${direction?.color || "var(--blue)"}">${direction?.label || "-"}</strong>
        </div>
        <div class="review-item">
          <span>Țară</span>
          <strong>${country?.name || "-"}</strong>
        </div>
        <div class="review-item">
          <span>Motive</span>
          <p>${draft.reasons.length ? draft.reasons.join(", ") : "necompletat"}</p>
        </div>
        <div class="review-item">
          <span>Realism / dorință</span>
          <strong>${draft.realism} / 5 · ${draft.desire} / 5</strong>
        </div>
      </div>
      <label class="field">
        <span>Clasă</span>
        <input id="class-name" value="${escapeAttr(draft.className)}" maxlength="32" placeholder="Ex: a XI-a B" />
      </label>
      <label class="field">
        <span>Liceu</span>
        <input id="school" value="${escapeAttr(draft.school)}" maxlength="80" placeholder="FSGC" />
      </label>
      <label class="field">
        <span>Oraș</span>
        <input id="city" value="${escapeAttr(draft.city)}" maxlength="80" placeholder="Ex: București" />
      </label>
      <label class="field">
        <span>Tip oportunitate</span>
        <select id="opportunity-type">
          ${opportunityTypes
            .map((type) => `<option value="${escapeAttr(type)}" ${draft.opportunityType === type ? "selected" : ""}>${type}</option>`)
            .join("")}
        </select>
      </label>
      <div class="form-actions">
        <button class="ghost-action" type="button" data-prev>Înapoi</button>
        <button class="primary-action" type="button" id="submit-response">Salvează răspunsul</button>
      </div>
    </div>
  `;
}

function bindWizardStep(panel) {
  $$("[data-direction]", panel).forEach((button) => {
    button.addEventListener("click", () => {
      draft.directionId = button.dataset.direction;
      saveDraft();
      currentStep = 1;
      renderWizard();
    });
  });

  const countryMap = $("#country-map", panel);
  if (countryMap) {
    renderEuropeMap(countryMap, {
      mode: "select",
      data: responses,
      selectedCode: draft.countryCode,
      activeDirection: draft.directionId || "all",
      showLabels: false,
      onSelect: (country) => {
        draft.countryCode = country.code;
        saveDraft();
        renderWizard();
      }
    });
  }

  const countrySelect = $("#country-select", panel);
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      draft.countryCode = countrySelect.value;
      saveDraft();
      renderWizard();
    });
  }

  $$("[data-chip-group]", panel).forEach((group) => {
    group.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-chip]");
      if (!chip) return;
      const key = group.dataset.chipGroup;
      toggleArrayValue(draft[key], chip.dataset.chip);
      saveDraft();
      renderWizard();
    });
  });

  const reasonText = $("#reason-text", panel);
  if (reasonText) {
    reasonText.addEventListener("input", () => {
      draft.reasonText = reasonText.value.trim();
      saveDraft();
    });
  }

  bindTextInput(panel, "#q-missing", "qMissing");
  bindTextInput(panel, "#q-barrier", "qBarrier");
  bindTextInput(panel, "#q-bring", "qBring");
  bindTextInput(panel, "#keyword", "keyword");
  bindTextInput(panel, "#class-name", "className");
  bindTextInput(panel, "#school", "school");
  bindTextInput(panel, "#city", "city");
  bindTextInput(panel, "#opportunity-type", "opportunityType", "change");

  $$("[data-scale]", panel).forEach((scale) => {
    scale.addEventListener("click", (event) => {
      const button = event.target.closest("[data-value]");
      if (!button) return;
      draft[scale.dataset.scale] = Number(button.dataset.value);
      saveDraft();
      renderWizard();
    });
  });

  $$("[data-next]", panel).forEach((button) => {
    button.addEventListener("click", () => {
      if (currentStep === 1 && !draft.countryCode) {
        showToast("Alege mai întâi o țară.");
        return;
      }
      currentStep = Math.min(currentStep + 1, steps.length - 1);
      renderWizard();
    });
  });

  $$("[data-prev]", panel).forEach((button) => {
    button.addEventListener("click", () => {
      currentStep = Math.max(currentStep - 1, 0);
      renderWizard();
    });
  });

  const submit = $("#submit-response", panel);
  if (submit) {
    submit.addEventListener("click", submitResponse);
  }
}

function bindTextInput(panel, selector, key, eventName = "input") {
  const input = $(selector, panel);
  if (!input) return;
  input.addEventListener(eventName, () => {
    draft[key] = input.value.trim();
    saveDraft();
  });
}

function toggleArrayValue(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) {
    array.splice(index, 1);
  } else {
    array.push(value);
  }
}

function submitResponse() {
  if (!draft.directionId || !draft.countryCode) {
    showToast("Răspunsul are nevoie de direcție și țară.");
    return;
  }

  const response = {
    id: crypto.randomUUID ? crypto.randomUUID() : `rsp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    directionId: draft.directionId,
    direction: getDirection(draft.directionId)?.label || "",
    countryCode: draft.countryCode,
    country: getCountry(draft.countryCode)?.name || "",
    reasons: [...draft.reasons],
    reasonText: draft.reasonText,
    qMissing: draft.qMissing,
    barriers: [...draft.barriers],
    qBarrier: draft.qBarrier,
    qBring: draft.qBring,
    keyword: normalizeLoose(draft.keyword),
    realism: Number(draft.realism) || 3,
    desire: Number(draft.desire) || 4,
    className: draft.className || "Nespecificat",
    school: draft.school || "FSGC",
    city: draft.city || "Nespecificat",
    opportunityType: draft.opportunityType || "Nu știu încă"
  };

  responses.push(response);
  saveResponses();
  clearDraft();
  currentStep = 0;
  renderLanding();
  renderSuccess();
  renderDashboard();
}

function renderSuccess() {
  renderStepper();
  $("#wizard-panel").innerHTML = `
    <div class="success-panel">
      <div>
        <p class="section-kicker">Răspuns salvat</p>
        <h3>Ai contribuit la harta colectivă.</h3>
        <p>
          Răspunsul este salvat local în acest browser. Poți adăuga un alt răspuns sau poți vedea imediat dashboard-ul generației.
        </p>
        <div class="form-actions" style="justify-content:center">
          <button class="primary-action" type="button" data-new-response>Adaugă alt răspuns</button>
          <button class="secondary-action" type="button" data-nav="dashboard">Vezi dashboard</button>
        </div>
      </div>
    </div>
  `;
  $("[data-new-response]").addEventListener("click", () => {
    currentStep = 0;
    renderWizard();
  });
  $("#wizard-panel [data-nav='dashboard']").addEventListener("click", () => showScreen("dashboard"));
}

function renderDashboard() {
  fillFilters();
  const filtered = getFilteredResponses();
  renderSnapshot(filtered);
  renderRanking(filtered);
  renderMapTabs();
  renderDashboardMap(filtered);
  renderMatrix(filtered);
  renderQualitative(filtered);
  renderLanding();
}

function fillFilters() {
  fillSelect("#filter-direction", [
    { value: "all", label: "Toate" },
    ...directions.map((direction) => ({ value: direction.id, label: direction.label }))
  ], filters.direction);

  fillSelect("#filter-class", makeOptions(responses.map((item) => item.className)), filters.className);
  fillSelect("#filter-school", makeOptions(responses.map((item) => item.school)), filters.school);
  fillSelect("#filter-city", makeOptions(responses.map((item) => item.city)), filters.city);
  fillSelect("#filter-opportunity", makeOptions(responses.map((item) => item.opportunityType)), filters.opportunityType);

  [
    ["#filter-direction", "direction"],
    ["#filter-class", "className"],
    ["#filter-school", "school"],
    ["#filter-city", "city"],
    ["#filter-opportunity", "opportunityType"]
  ].forEach(([selector, key]) => {
    const select = $(selector);
    select.onchange = () => {
      filters[key] = select.value;
      renderDashboard();
    };
  });
}

function fillSelect(selector, options, selectedValue) {
  const select = $(selector);
  const markup = options.map((option) => `<option value="${escapeAttr(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`).join("");
  select.innerHTML = markup;
}

function makeOptions(values) {
  const clean = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ro"));
  return [{ value: "all", label: "Toate" }, ...clean.map((value) => ({ value, label: value }))];
}

function getFilteredResponses() {
  return responses.filter((item) => {
    if (filters.direction !== "all" && item.directionId !== filters.direction) return false;
    if (filters.className !== "all" && item.className !== filters.className) return false;
    if (filters.school !== "all" && item.school !== filters.school) return false;
    if (filters.city !== "all" && item.city !== filters.city) return false;
    if (filters.opportunityType !== "all" && item.opportunityType !== filters.opportunityType) return false;
    return true;
  });
}

function renderSnapshot(data) {
  const stats = getStats(data);
  const cards = [
    ["Număr total răspunsuri", stats.total, "în filtrul curent"],
    ["Țara cea mai aleasă", stats.topCountry || "-", stats.topCountryCount ? `${stats.topCountryCount} voturi` : "fără date"],
    ["Categoria dominantă", stats.topDirection || "-", stats.topDirectionCount ? `${stats.topDirectionCount} răspunsuri` : "fără date"],
    ["Principala barieră", stats.topBarrier || "-", stats.topBarrierCount ? `${stats.topBarrierCount} mențiuni` : "fără date"],
    ["Scor mediu de încredere", stats.avgRealism ? `${stats.avgRealism} / 5` : "-", "realism perceput"],
    ["Cel mai frecvent cuvânt", stats.topWord || "-", stats.topWordCount ? `${stats.topWordCount} apariții` : "fără date"]
  ];

  $("#snapshot-grid").innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="snapshot-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </article>
      `
    )
    .join("");
}

function renderRanking(data) {
  $("#ranking-count").textContent = `${data.length} ${data.length === 1 ? "răspuns" : "răspunsuri"}`;
  const counts = countBy(data, "country");
  const ranking = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const max = ranking[0]?.[1] || 1;

  $("#ranking-chart").innerHTML = ranking.length
    ? ranking
        .map(
          ([country, count]) => `
            <div class="ranking-row">
              <span class="ranking-country" title="${escapeAttr(country)}">${country}</span>
              <span class="ranking-track"><span class="ranking-fill" style="--value:${Math.max(8, (count / max) * 100)}%"></span></span>
              <span class="ranking-value">${count} voturi</span>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state">Încă nu există răspunsuri pentru filtrul curent.</div>`;
}

function renderMapTabs() {
  const tabs = [{ id: "all", label: "Toate" }, ...directions.map(({ id, label }) => ({ id, label }))];
  $("#map-tabs").innerHTML = tabs
    .map((tab) => `<button class="chip ${activeMapDirection === tab.id ? "is-selected" : ""}" type="button" data-map-tab="${tab.id}">${tab.label}</button>`)
    .join("");
  $$("[data-map-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeMapDirection = button.dataset.mapTab;
      renderDashboard();
    });
  });
}

function renderDashboardMap(data) {
  const scoped = activeMapDirection === "all" ? data : data.filter((item) => item.directionId === activeMapDirection);
  renderEuropeMap($("#dashboard-map"), {
    mode: "dashboard",
    data: scoped,
    activeDirection: activeMapDirection,
    showCounts: true,
    onSelect: (country) => renderCountryInsight(country, scoped)
  });
}

function renderCountryInsight(country, data) {
  const rows = data.filter((item) => item.countryCode === country.code);
  if (!rows.length) {
    $("#country-insight").innerHTML = `<strong>${country.name}</strong>: nu există încă răspunsuri în filtrul curent.`;
    return;
  }
  const reasons = topEntries(flatten(rows.map((item) => item.reasons)), 4)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
  const quote = rows.find((item) => item.reasonText)?.reasonText || rows.find((item) => item.qBring)?.qBring || "";
  $("#country-insight").innerHTML = `
    <strong>${country.name}</strong>: ${rows.length} ${rows.length === 1 ? "răspuns" : "răspunsuri"}.
    ${reasons ? `<br>Motive dominante: ${reasons}.` : ""}
    ${quote ? `<br><span>"${escapeHtml(quote)}"</span>` : ""}
  `;
}

function renderMatrix(data) {
  const grouped = groupBy(data, "countryCode");
  const points = Object.entries(grouped)
    .map(([countryCode, rows]) => {
      const country = getCountry(countryCode);
      return {
        country,
        desire: average(rows.map((item) => Number(item.desire))),
        realism: average(rows.map((item) => Number(item.realism))),
        count: rows.length
      };
    })
    .filter((point) => point.country && point.count);

  const matrix = $("#matrix-chart");
  matrix.innerHTML = `
    <span class="quadrant q1">Aspirații realizabile</span>
    <span class="quadrant q2">Oportunități subestimate</span>
    <span class="quadrant q3">Visuri îndepărtate</span>
    <span class="quadrant q4">Zone de ezitare</span>
    ${points
      .map((point) => {
        const left = scale(point.desire, 1, 5, 8, 92);
        const bottom = scale(point.realism, 1, 5, 8, 92);
        const width = Math.min(86, 28 + point.count * 4);
        return `
          <span class="matrix-point" style="left:${left}%; bottom:${bottom}%; min-width:${width}px"
            title="${escapeAttr(point.country.name)}: dorință ${point.desire.toFixed(1)}, realism ${point.realism.toFixed(1)}">
            ${point.country.name}
          </span>
        `;
      })
      .join("")}
  `;
}

function renderQualitative(data) {
  const words = data
    .map((item) => item.keyword)
    .filter(Boolean)
    .flatMap((word) => word.split(/[,\s]+/))
    .map(normalizeLoose)
    .filter((word) => word.length > 2);
  const barriers = flatten(data.map((item) => item.barriers)).filter(Boolean);
  renderCloud("#word-cloud", topEntries(words, 18));
  renderCloud("#barrier-cloud", topEntries(barriers, 18));
}

function renderCloud(selector, entries) {
  const max = entries[0]?.[1] || 1;
  $(selector).innerHTML = entries.length
    ? entries
        .map(([label, count]) => {
          const size = 0.82 + (count / max) * 0.38;
          return `<span class="cloud-chip" style="--chip-size:${size.toFixed(2)}rem">${label} · ${count}</span>`;
        })
        .join("")
    : `<div class="empty-state">Nu există încă suficiente răspunsuri.</div>`;
}

function renderHeroEuropeMap(container, data = []) {
  if (!container || !mapDataset.features.length) return;
  const existing = mapInstances.get(container);
  if (existing) {
    existing.remove();
    mapInstances.delete(container);
  }
  const countsByCountry = countBy(data, "countryCode");
  const maxCount = Math.max(1, ...Object.values(countsByCountry));
  const flowEntries = Object.entries(countsByCountry)
    .filter(([code]) => code !== "RO" && countryCenters[code])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const fallbackEntries = ["DE", "FR", "NL", "SE", "ES", "IT", "PL", "DK", "AT"].map((code) => [code, 1]);
  const flows = flowEntries.length ? flowEntries : fallbackEntries;
  const romania = projectEuropePoint([romaniaLatLng[1], romaniaLatLng[0]]);

  container.innerHTML = `
    <svg class="real-hero-map" viewBox="0 0 960 560" role="img" aria-label="Hartă reală a Europei">
      <g class="hero-map-countries">
        ${mapDataset.features
          .map((feature) => {
            const country = featureToCountry(feature);
            const count = countsByCountry[country.code] || 0;
            const intensity = count ? Math.max(0.2, count / maxCount) : 0;
            const fill = count ? mixHex("#d9e4f1", "#123b73", Math.min(0.82, intensity * 0.75)) : "#d8e2ef";
            const stroke = country.code === "RO" ? "#111827" : "rgba(79, 97, 126, 0.72)";
            return `<path class="hero-country ${country.code === "RO" ? "is-romania" : ""}" d="${geometryToSvgPath(feature.geometry)}" fill="${fill}" stroke="${stroke}" />`;
          })
          .join("")}
      </g>
      <g class="hero-map-flows">
        ${flows
          .map(([code, count], index) => {
            const center = getProjectedCountryCenter(code);
            if (!center) return "";
            const controlX = (romania.x + center.x) / 2;
            const controlY = Math.min(romania.y, center.y) - 54 - index * 3;
            const opacity = flowEntries.length ? 0.22 + (count / maxCount) * 0.42 : 0.2 + (index % 5) * 0.035;
            return `<path class="hero-flow" d="M ${romania.x.toFixed(1)} ${romania.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${center.x.toFixed(1)} ${center.y.toFixed(1)}" style="--flow-opacity:${opacity.toFixed(2)}" />`;
          })
          .join("")}
      </g>
      <g class="hero-map-points">
        ${flows
          .map(([code, count], index) => {
            const center = getProjectedCountryCenter(code);
            if (!center) return "";
            const radius = flowEntries.length ? 5 + (count / maxCount) * 9 : 6 + (index % 4);
            return `<circle class="hero-point pulse" cx="${center.x.toFixed(1)}" cy="${center.y.toFixed(1)}" r="${radius.toFixed(1)}" />`;
          })
          .join("")}
        <circle class="hero-origin" cx="${romania.x.toFixed(1)}" cy="${romania.y.toFixed(1)}" r="9" />
        <text class="hero-origin-label" x="${romania.x + 14}" y="${romania.y + 5}">România</text>
      </g>
    </svg>
  `;
}

function geometryToSvgPath(geometry) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToSvgPath(ring)).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map((ring) => ringToSvgPath(ring)).join(" ")).join(" ");
  }
  return "";
}

function ringToSvgPath(ring) {
  return ring
    .map((point, index) => {
      const projected = projectEuropePoint(point);
      return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(" ")
    .concat(" Z");
}

function projectEuropePoint(point) {
  const [lon, lat] = point;
  const minLon = -25;
  const maxLon = 45;
  const minLat = 34;
  const maxLat = 72;
  return {
    x: ((lon - minLon) / (maxLon - minLon)) * 960,
    y: ((maxLat - lat) / (maxLat - minLat)) * 540 + 10
  };
}

function getProjectedCountryCenter(code) {
  const center = countryCenters[code];
  if (!center) return null;
  return projectEuropePoint([center[1], center[0]]);
}

function renderEuropeMap(container, options = {}) {
  const {
    data = [],
    selectedCode = "",
    activeDirection = "all",
    mode = "dashboard",
    showLabels = true,
    showCounts = false,
    onSelect = null
  } = options;

  if (!container) return;
  const existing = mapInstances.get(container);
  if (existing) {
    existing.remove();
    mapInstances.delete(container);
  }

  if (typeof L === "undefined" || !mapDataset.features.length) {
    container.innerHTML = `<div class="empty-state">Harta reală nu a putut fi încărcată. Verifică fișierele din <strong>vendor/leaflet</strong> și <strong>data/europe-countries.js</strong>.</div>`;
    return;
  }

  const countsByCountry = countBy(data, "countryCode");
  const maxCount = Math.max(1, ...Object.values(countsByCountry));
  const directionColor = activeDirection === "all" ? "#123b73" : getDirection(activeDirection)?.color || "#123b73";
  const shell = document.createElement("div");
  shell.className = `leaflet-map-canvas ${mode === "landing" ? "is-landing-map" : ""}`;
  container.replaceChildren(shell);

  const map = L.map(shell, {
    attributionControl: mode !== "landing",
    boxZoom: mode !== "landing",
    doubleClickZoom: mode !== "landing",
    dragging: mode !== "landing",
    keyboard: mode !== "landing",
    scrollWheelZoom: false,
    tap: mode !== "landing",
    touchZoom: mode !== "landing",
    zoomControl: mode !== "landing",
    zoomSnap: 0.25
  });
  mapInstances.set(container, map);
  setEuropeMapView(map, shell, mode);

  if (mode !== "landing") {
    map.createPane("flowPane");
    map.getPane("flowPane").style.zIndex = 350;
    map.createPane("countryPane");
    map.getPane("countryPane").style.zIndex = 410;
    map.createPane("badgePane");
    map.getPane("badgePane").style.zIndex = 520;
  }

  const countryLayer = L.geoJSON(mapDataset, {
    attribution: "Natural Earth",
    pane: mode === "landing" ? "overlayPane" : "countryPane",
    style: (feature) =>
      getCountryFeatureStyle({
        feature,
        countsByCountry,
        maxCount,
        selectedCode,
        directionColor,
        mode
      }),
    onEachFeature: (feature, layer) => {
      const country = featureToCountry(feature);
      const count = countsByCountry[country.code] || 0;
      const tooltip = getCountryTooltip(country, count, mode);
      layer.bindTooltip(tooltip, {
        className: "map-tooltip",
        direction: "top",
        sticky: true
      });

      layer.on({
        mouseover: () => {
          layer.setStyle({
            color: "#123b73",
            fillOpacity: mode === "landing" ? 0.36 : 0.84,
            weight: mode === "landing" ? 1.2 : 2
          });
          layer.bringToFront();
        },
        mouseout: () => {
          countryLayer.resetStyle(layer);
        },
        click: () => {
          if (onSelect) onSelect(country);
        }
      });
    }
  }).addTo(map);

  const layerByCode = new Map();
  countryLayer.eachLayer((layer) => {
    const country = featureToCountry(layer.feature);
    layerByCode.set(country.code, layer);
  });

  addRomaniaFlows(map, layerByCode, countsByCountry, maxCount, directionColor, mode);
  addCountryBadges(map, layerByCode, countsByCountry, selectedCode, { showLabels, showCounts, mode });
  addMapSourceControl(map, mode);

  requestAnimationFrame(() => map.invalidateSize());
}

function setEuropeMapView(map, shell, mode) {
  const width = shell.clientWidth || 960;
  const compact = width < 720;
  const zoom = mode === "landing" ? (compact ? 3.4 : 4.05) : compact ? 3.4 : 4.05;
  map.setView([51.2, 15.2], zoom, { animate: false });
  map.setMaxBounds([
    [31, -31],
    [73.5, 49]
  ]);
}

function getCountryFeatureStyle({ feature, countsByCountry, maxCount, selectedCode, directionColor, mode }) {
  const country = featureToCountry(feature);
  const count = countsByCountry[country.code] || 0;
  const selected = selectedCode === country.code;
  const intensity = count ? Math.max(0.18, count / maxCount) : 0;
  const isRomania = country.code === "RO";
  const baseFill = mode === "landing" ? "#c8d6e8" : "#eef3f8";
  const selectedFill = selected ? "#f6c744" : "";
  const dataFill = count ? mixHex("#e9f0fa", directionColor, Math.min(0.86, intensity * 0.9)) : baseFill;
  return {
    color: selected ? "#9b7410" : isRomania ? "#111827" : mode === "landing" ? "rgba(18, 59, 115, 0.72)" : "rgba(113, 128, 150, 0.62)",
    dashArray: mode === "landing" ? "0" : "",
    fillColor: selectedFill || dataFill,
    fillOpacity: mode === "landing" ? 0.94 : count ? 0.72 : 0.46,
    opacity: mode === "landing" ? 0.96 : 1,
    weight: selected ? 2.2 : isRomania ? 1.7 : mode === "landing" ? 1.35 : 0.9
  };
}

function addRomaniaFlows(map, layerByCode, countsByCountry, maxCount, directionColor, mode) {
  const entries = Object.entries(countsByCountry)
    .filter(([code]) => code !== "RO" && layerByCode.has(code))
    .sort((a, b) => b[1] - a[1])
    .slice(0, mode === "landing" ? 12 : 18);
  const fallbackEntries = mode === "landing" && !entries.length ? ["DE", "FR", "NL", "SE", "ES", "IT", "PL"].map((code) => [code, 1]) : entries;

  fallbackEntries.forEach(([code, count], index) => {
    const layer = layerByCode.get(code);
    if (!layer) return;
    const target = getCountryLayerCenter(layer);
    const line = L.polyline([romaniaLatLng, target], {
      className: mode === "landing" ? "animated-flow-line" : "",
      color: directionColor,
      dashArray: mode === "landing" ? "2 9" : "4 8",
      opacity: mode === "landing" ? 0.34 + (index % 5) * 0.05 : 0.18 + (count / maxCount) * 0.36,
      pane: mode === "landing" ? "overlayPane" : "flowPane",
      smoothFactor: 1.3,
      weight: mode === "landing" ? 1.35 : 1 + (count / maxCount) * 3
    }).addTo(map);
    if (mode !== "landing") line.bringToBack();
  });

  L.circleMarker(romaniaLatLng, {
    className: "romania-origin",
    color: "#ffffff",
    fillColor: "#111827",
    fillOpacity: 0.95,
    pane: mode === "landing" ? "overlayPane" : "badgePane",
    radius: mode === "landing" ? 5 : 7,
    weight: 2
  })
    .bindTooltip("România", { className: "map-tooltip", direction: "top", permanent: false })
    .addTo(map);
}

function addCountryBadges(map, layerByCode, countsByCountry, selectedCode, options) {
  const { showLabels, showCounts, mode } = options;
  const labelCodes = new Set(["RO", selectedCode].filter(Boolean));
  Object.entries(countsByCountry)
    .filter(([, count]) => count > 0)
    .forEach(([code]) => labelCodes.add(code));

  labelCodes.forEach((code) => {
    const layer = layerByCode.get(code);
    const country = getCountry(code);
    if (!layer || !country) return;
    const count = countsByCountry[code] || 0;
    const shouldShowText = showLabels || selectedCode === code || code === "RO";
    const shouldShowCount = showCounts && count > 0;
    if (!shouldShowText && !shouldShowCount) return;
    const html = `
      <span class="map-badge ${selectedCode === code ? "is-selected" : ""}">
        ${shouldShowText ? `<strong>${country.name}</strong>` : ""}
        ${shouldShowCount ? `<em>${count}</em>` : ""}
      </span>
    `;
    L.marker(getCountryLayerCenter(layer), {
      icon: L.divIcon({
        className: "map-badge-icon",
        html,
        iconAnchor: [0, 0]
      }),
      interactive: false,
      pane: mode === "landing" ? "overlayPane" : "badgePane"
    }).addTo(map);
  });
}

function addMapSourceControl(map, mode) {
  if (mode === "landing") return;
  const sourceControl = L.control({ position: "bottomleft" });
  sourceControl.onAdd = () => {
    const node = L.DomUtil.create("div", "map-source-control");
    node.textContent = "Granițe reale: Natural Earth · Motor hartă: Leaflet";
    return node;
  };
  sourceControl.addTo(map);
}

function getCountryLayerCenter(layer) {
  const featureCode = layer.feature?.properties?.code;
  if (countryCenters[featureCode]) {
    return countryCenters[featureCode];
  }
  return layer.getBounds().getCenter();
}

function getCountryTooltip(country, count, mode) {
  const suffix = count ? ` · ${count} ${count === 1 ? "răspuns" : "răspunsuri"}` : mode === "select" ? " · selectează" : "";
  return `${country.name}${suffix}`;
}

function featureToCountry(feature) {
  return {
    code: feature.properties.code,
    name: feature.properties.name,
    nameEn: feature.properties.nameEn,
    subregion: feature.properties.subregion
  };
}

function mixHex(from, to, amount) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mixed = {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount)
  };
  return rgbToHex(mixed);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function getStats(data) {
  const countryCounts = countBy(data, "country");
  const directionCounts = countBy(data, "direction");
  const barrierCounts = countValues(flatten(data.map((item) => item.barriers)));
  const wordCounts = countValues(
    data
      .map((item) => item.keyword)
      .filter(Boolean)
      .map(normalizeLoose)
  );
  const [topCountry, topCountryCount] = topEntriesFromCounts(countryCounts)[0] || ["", 0];
  const [topDirection, topDirectionCount] = topEntriesFromCounts(directionCounts)[0] || ["", 0];
  const [topBarrier, topBarrierCount] = topEntriesFromCounts(barrierCounts)[0] || ["", 0];
  const [topWord, topWordCount] = topEntriesFromCounts(wordCounts)[0] || ["", 0];

  return {
    total: data.length,
    countryCount: new Set(data.map((item) => item.countryCode)).size,
    topCountry,
    topCountryCount,
    topDirection,
    topDirectionCount,
    topBarrier,
    topBarrierCount,
    avgRealism: data.length ? average(data.map((item) => Number(item.realism))).toFixed(1) : "",
    topWord,
    topWordCount
  };
}

function countBy(data, key) {
  return data.reduce((acc, item) => {
    const value = item[key];
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countValues(values) {
  return values.reduce((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(values, limit = 10) {
  return topEntriesFromCounts(countValues(values)).slice(0, limit);
}

function topEntriesFromCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ro"));
}

function groupBy(data, key) {
  return data.reduce((acc, item) => {
    const value = item[key];
    if (!value) return acc;
    acc[value] = acc[value] || [];
    acc[value].push(item);
    return acc;
  }, {});
}

function flatten(items) {
  return items.reduce((acc, item) => acc.concat(item || []), []);
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function scale(value, min, max, outMin, outMax) {
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function getDirection(id) {
  return directions.find((direction) => direction.id === id);
}

function getCountry(code) {
  return countries.find((country) => country.code === code);
}

function normalizeLoose(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function downloadCsv() {
  if (!responses.length) {
    showToast("Nu există încă răspunsuri de descărcat.");
    return;
  }
  const headers = [
    "id",
    "createdAt",
    "direction",
    "country",
    "reasons",
    "reasonText",
    "qMissing",
    "barriers",
    "qBarrier",
    "qBring",
    "keyword",
    "realism",
    "desire",
    "className",
    "school",
    "city",
    "opportunityType"
  ];
  const rows = responses.map((item) =>
    headers.map((header) => {
      const value = Array.isArray(item[header]) ? item[header].join("; ") : item[header];
      return csvCell(value);
    })
  );
  const csv = `\uFEFF${[headers.join(","), ...rows.map((row) => row.join(","))].join("\n")}`;
  downloadBlob(csv, `europa-oportunitatilor-raspunsuri-${dateStamp()}.csv`, "text/csv;charset=utf-8");
}

function downloadJson() {
  if (!responses.length) {
    showToast("Nu există încă răspunsuri de descărcat.");
    return;
  }
  downloadBlob(JSON.stringify(responses, null, 2), `europa-oportunitatilor-raspunsuri-${dateStamp()}.json`, "application/json");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`Fișier generat: ${filename}`);
}

function clearLocalData() {
  const confirmed = window.confirm("Ștergi toate răspunsurile salvate local în acest browser?");
  if (!confirmed) return;
  responses = [];
  clearDraft();
  currentStep = 0;
  saveResponses();
  filters = {
    direction: "all",
    className: "all",
    school: "all",
    city: "all",
    opportunityType: "all"
  };
  activeMapDirection = "all";
  renderDashboard();
  renderWizard();
  showToast("Datele locale au fost șterse.");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}
