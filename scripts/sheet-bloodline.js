const MODULE_ID = "my-birthright-classes";
const FLAG_ROOT = "bloodline";

const DEFAULTS = {
  blooded: false,
  regent: false,
  regentHpApplied: false,
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

  section.classList.toggle("mbrc-bloodline-collapsed", collapsed);

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

      <label class="mbrc-regent-toggle">
        <input type="checkbox" data-mbrc-field="regent" ${data.regent ? "checked" : ""}>
        <span>Regent</span>
      </label>

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
    ".sheet-header",
    "header.sheet-header",
    ".sheet-body"
  ];

  for (const sel of selectors) {
    const target = root.querySelector(sel);
    if (target) return { target, position: target.classList?.contains("sheet-body") ? "prepend" : "after" };
  }
  return { target: root, position: "prepend" };
}

function insertPanel(panel, insertion) {
  const { target, position } = insertion;
  if (position === "after") target.insertAdjacentElement("afterend", panel);
  else if (position === "prepend") target.prepend(panel);
  else target.append(panel);
}

async function saveRegentState(actor, data, enable) {
  const maxHp = Number(foundry.utils.getProperty(actor, "system.hp.max"));
  if (!Number.isFinite(maxHp)) {
    ui.notifications?.warn("Could not adjust Regent HP bonus: actor.system.hp.max is not numeric.");
    return false;
  }

  data.regent = enable;

  let nextMax = maxHp;
  if (enable && !data.regentHpApplied) {
    nextMax = maxHp + 10;
    data.regentHpApplied = true;
  } else if (!enable && data.regentHpApplied) {
    nextMax = Math.max(0, maxHp - 10);
    data.regentHpApplied = false;
  }

  // Save the checkbox state and HP change in one Actor update. This prevents the
  // HP update from rerendering the sheet before the Regent flag has been saved.
  await actor.update({
    "system.hp.max": nextMax,
    [`flags.${MODULE_ID}.${FLAG_ROOT}`]: data
  });

  return true;
}

async function wireBloodlinePanel(panel, actor) {
  panel.querySelector('[data-mbrc-action="toggle-collapse"]')?.addEventListener("click", () => {
    const body = panel.querySelector(".mbrc-bloodline-body");
    const toggle = panel.querySelector(".mbrc-collapse-toggle");
    const chevron = panel.querySelector(".mbrc-chevron");
    const collapsed = !panel.classList.contains("mbrc-bloodline-collapsed");

    panel.classList.toggle("mbrc-bloodline-collapsed", collapsed);
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

      if (field === "blooded") {
        data.blooded = input.checked;
        await saveBloodline(actor, data);
      } else if (field === "regent") {
        const saved = await saveRegentState(actor, data, input.checked);
        if (!saved) input.checked = data.regent;
      } else if (field === "score") {
        data.score = Math.max(0, Number(input.value) || 0);
        await saveBloodline(actor, data);
      } else {
        data[field] = input.value;
        await saveBloodline(actor, data);
      }

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
  insertPanel(panel, findInsertionTarget(root));
  await wireBloodlinePanel(panel, actor);
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Birthright character sheet additions`);
});

// Foundry V14 / S&W 4.2.x uses ActorSheetV2 with the concrete
// SwordsWizardryActorSheet class. Register both generic V2 hooks and the
// class-specific hook so the panel survives sheet/render-hook changes.
Hooks.on("renderActorSheet", injectBloodline);
Hooks.on("renderActorSheetV2", injectBloodline);
