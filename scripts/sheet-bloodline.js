const MODULE_ID = "my-birthright-classes";
const FLAG_ROOT = "bloodline";

const DEFAULTS = {
  blooded: false,
  derivation: "Brenna",
  strength: "Minor",
  score: 0
};

const DERIVATIONS = ["Anduiras", "Basaïa", "Brenna", "Masela", "Reynir", "Vorynn", "Azrai"];
const STRENGTHS = ["Tainted", "Minor", "Major", "Great", "True"];

function collapseKey(actor) {
  return `${MODULE_ID}.bloodlineCollapsed.${actor.id}`;
}

function isCollapsed(actor) {
  const stored = sessionStorage.getItem(collapseKey(actor));
  return stored === null ? true : stored === "true";
}

function setCollapsed(actor, collapsed) {
  sessionStorage.setItem(collapseKey(actor), String(collapsed));
}

function getRoot(html) {
  if (!html) return null;
  if (html instanceof HTMLElement) return html;
  if (html[0] instanceof HTMLElement) return html[0];
  return null;
}

function getBloodline(actor) {
  const stored = actor.getFlag(MODULE_ID, FLAG_ROOT) ?? {};
  return foundry.utils.mergeObject(foundry.utils.deepClone(DEFAULTS), stored, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  });
}

async function saveBloodline(actor, data) {
  return actor.setFlag(MODULE_ID, FLAG_ROOT, data);
}

function selectOptions(values, selected) {
  return values.map(v => `<option value="${v}" ${v === selected ? "selected" : ""}>${v}</option>`).join("");
}

function makeBloodlinePanel(actor, data) {
  const section = document.createElement("section");
  section.className = "mbrc-bloodline";
  section.dataset.mbrcBloodlineActor = actor.id;

  const collapsed = isCollapsed(actor);

  section.classList.toggle("mbrc-collapsed", collapsed);

  section.innerHTML = `
    <div class="mbrc-bloodline-title">
      <button type="button"
              class="mbrc-collapse-toggle"
              data-mbrc-action="toggle-collapse"
              aria-expanded="${collapsed ? "false" : "true"}"
              title="${collapsed ? "Expand bloodline details" : "Collapse bloodline details"}">
        <span class="mbrc-chevron">${collapsed ? "▶" : "▼"}</span>
      </button>

      <span class="mbrc-bloodline-icon">◆</span>
      <strong>Birthright Bloodline</strong>

      <span class="mbrc-header-summary">
        ${data.blooded ? `${data.derivation} · ${data.strength} · ${Number(data.score) || 0}` : "Unblooded"}
      </span>

      <label class="mbrc-blooded-toggle">
        <input type="checkbox" data-mbrc-field="blooded" ${data.blooded ? "checked" : ""}>
        <span>Blooded</span>
      </label>
    </div>

    <div class="mbrc-bloodline-body ${collapsed ? "mbrc-hidden" : ""}">
      <div class="mbrc-bloodline-fields ${data.blooded ? "" : "mbrc-bloodline-disabled"}">
        <label>
          <span>Derivation</span>
          <select data-mbrc-field="derivation">
            ${selectOptions(DERIVATIONS, data.derivation)}
          </select>
        </label>

        <label>
          <span>Strength</span>
          <select data-mbrc-field="strength">
            ${selectOptions(STRENGTHS, data.strength)}
          </select>
        </label>

        <label class="mbrc-score-field">
          <span>Score</span>
          <input type="number" min="0" step="1" data-mbrc-field="score" value="${Number(data.score) || 0}">
        </label>
      </div>
    </div>
  `;

  return section;
}

function findInsertionTarget(root) {
  const selectors = [
    ".sheet-header .header-details",
    ".sheet-header",
    "header.sheet-header",
    ".character-details",
    ".sheet-body"
  ];

  for (const sel of selectors) {
    const target = root.querySelector(sel);
    if (target) return target;
  }
  return root;
}

async function wireBloodlinePanel(panel, actor) {
  panel.querySelector('[data-mbrc-action="toggle-collapse"]')?.addEventListener("click", () => {
    const body = panel.querySelector(".mbrc-bloodline-body");
    const toggle = panel.querySelector(".mbrc-collapse-toggle");
    const chevron = panel.querySelector(".mbrc-chevron");
    const collapsed = !panel.classList.contains("mbrc-collapsed");

    panel.classList.toggle("mbrc-collapsed", collapsed);
    body?.classList.toggle("mbrc-hidden", collapsed);
    setCollapsed(actor, collapsed);

    if (toggle) {
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.title = collapsed ? "Expand bloodline details" : "Collapse bloodline details";
    }
    if (chevron) chevron.textContent = collapsed ? "▶" : "▼";
  });

  panel.querySelectorAll("[data-mbrc-field]").forEach(input => {
    input.addEventListener("change", async () => {
      const data = getBloodline(actor);
      const field = input.dataset.mbrcField;

      if (field === "blooded") data.blooded = input.checked;
      else if (field === "score") data.score = Math.max(0, Number(input.value) || 0);
      else data[field] = input.value;

      await saveBloodline(actor, data);

      if (field === "blooded") {
        panel.querySelector(".mbrc-bloodline-fields")?.classList.toggle("mbrc-bloodline-disabled", !data.blooded);
      }

      const summary = panel.querySelector(".mbrc-header-summary");
      if (summary) {
        summary.textContent = data.blooded
          ? `${data.derivation} · ${data.strength} · ${data.score}`
          : "Unblooded";
      }
    });
  });
}

async function injectBloodline(app, html) {
  const actor = app?.actor ?? app?.document;
  if (!actor || actor.documentName !== "Actor" || actor.type !== "character") return;
  if (game.system.id !== "swords-wizardry") return;

  const root = getRoot(html);
  if (!root || root.querySelector(".mbrc-bloodline")) return;

  const data = getBloodline(actor);
  const panel = makeBloodlinePanel(actor, data);
  const target = findInsertionTarget(root);

  if (target.classList?.contains("sheet-body")) target.prepend(panel);
  else target.append(panel);

  await wireBloodlinePanel(panel, actor);
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Birthright character sheet additions`);
});

Hooks.on("renderActorSheet", injectBloodline);
Hooks.on("renderActorSheetV2", injectBloodline);
