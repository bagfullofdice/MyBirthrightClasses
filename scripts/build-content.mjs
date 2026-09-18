import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";

const MODULE_ID = "my-birthright-classes";
const OUT = "build";

function idFor(prefix, name) {
  return crypto.createHash("sha256").update(prefix + ":" + name).digest("hex").slice(0, 16);
}

function writeDoc(dir, doc) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, doc._id + ".json"), JSON.stringify(doc, null, 2));
}

function journalDoc(name, classHtml, brHtml) {
  const id = idFor("journal", name);
  const p1 = idFor("page", name + ":class");
  const p2 = idFor("page", name + ":br");
  return {
    name,
    _id: id,
    pages: [
      {
        name: "Class",
        type: "text",
        _id: p1,
        sort: 100000,
        title: { show: true, level: 1 },
        text: { format: 1, content: classHtml },
        ownership: { default: 0 },
        flags: {},
        _key: "!journal.pages!" + p1
      },
      {
        name: "Birthright & S&W",
        type: "text",
        _id: p2,
        sort: 200000,
        title: { show: true, level: 1 },
        text: { format: 1, content: brHtml },
        ownership: { default: 0 },
        flags: {},
        _key: "!journal.pages!" + p2
      }
    ],
    sort: 0,
    ownership: { default: 0 },
    flags: { [MODULE_ID]: { expandedClass: name } },
    _key: "!journal!" + id
  };
}

function featureDoc(className, featureName, html) {
  const display = className + " — " + featureName;
  const id = idFor("feature", display);
  return {
    name: display,
    type: "feature",
    _id: id,
    img: "systems/swords-wizardry/assets/game-icons-net/skills.svg",
    system: {
      description: "<h3>" + className + "</h3>" + html,
      formula: "",
      target: 1,
      targetType: "descending"
    },
    effects: [],
    sort: 0,
    ownership: { default: 0 },
    flags: { [MODULE_ID]: { expandedClass: className, feature: featureName } },
    _key: "!items!" + id
  };
}

function powerDoc(name, chakra, discipline, category, psp, extra = {}) {
  const id = idFor("power", name);
  const label = category === "science" ? "Major Science" :
                category === "devotion" ? "Minor Devotion" :
                category === "attack" ? "Attack Mode" : "Defense Mode";
  const detail = extra.detail || "This entry identifies the Mystic discipline, Chakra, and PSP cost. Use the Mystic class journal and campaign psionics rules for the full effect.";
  return {
    name,
    type: "spell",
    _id: id,
    img: "systems/swords-wizardry/assets/game-icons-net/spell-book.svg",
    system: {
      description:
        "<h3>" + label + "</h3>" +
        "<p><strong>Chakra:</strong> " + chakra + "</p>" +
        "<p><strong>Discipline:</strong> " + discipline + "</p>" +
        "<p><strong>PSP Cost:</strong> " + psp + "</p>" +
        (extra.target ? "<p><strong>Target/Area:</strong> " + extra.target + "</p>" : "") +
        "<p>" + detail + "</p>",
      spellLevel: 1,
      range: extra.range || "",
      duration: extra.duration || "",
      formula: "",
      effectType: "none",
      requiresSave: category === "attack",
      saveEffect: "negate"
    },
    effects: [],
    sort: 0,
    ownership: { default: 0 },
    flags: {
      [MODULE_ID]: {
        psionic: true,
        category,
        chakra,
        discipline,
        pspCost: psp,
        target: extra.target || ""
      }
    },
    _key: "!items!" + id
  };
}

fs.rmSync(OUT, { recursive: true, force: true });
const journalsDir = path.join(OUT, "journals");
const featuresDir = path.join(OUT, "features");
const powersDir = path.join(OUT, "powers");

const b64 = Array.from({ length: 9 }, (_, i) => fs.readFileSync(`data/chunks/${String(i).padStart(2, "0")}.txt`, "utf8").trim()).join("");
const compressed = Buffer.from(b64, "base64");
const experimental = JSON.parse(zlib.gunzipSync(compressed).toString("utf8"));

for (const c of experimental) {
  writeDoc(journalsDir, journalDoc(c.name, c.class_html, c.br_html));
  for (const f of c.features) writeDoc(featuresDir, featureDoc(c.name, f.name, f.html));
}

const mysticClass = `
<h1>Mystic</h1>
<p>Mystics are rare individuals who unlock the hidden potential of the mind through meditation, discipline, and intense mental training. Psionics are not spells: their abilities arise from the trained mind rather than spellbooks, prayer, or magical Sources.</p>
<h2>Class Information</h2>
<p><strong>Prime Attributes:</strong> Intelligence and Wisdom<br>
<strong>Minimum Attributes:</strong> INT 9, WIS 9<br>
<strong>Hit Dice:</strong> d4<br>
<strong>Armor:</strong> Leather only; no shield<br>
<strong>Weapons:</strong> Dagger only<br>
<strong>Ancestry:</strong> Human by default<br>
<strong>Alignment:</strong> Any<br>
<strong>Psionic Strength:</strong> 5 PSP per level</p>
<p>Either INT or WIS 13+ grants +5% XP. INT 13+ and WIS 16+ grants +10% XP instead.</p>
<h2>Mystic Advancement</h2>
<table><thead><tr><th>Level</th><th>XP</th><th>Hit Dice</th><th>PSP</th><th>Chakras</th><th>Sciences</th><th>Devotions</th><th>Attack</th><th>Defense</th></tr></thead><tbody>
<tr><td>1</td><td>0</td><td>1d4</td><td>5</td><td>1</td><td>1</td><td>3</td><td>1</td><td>0</td></tr>
<tr><td>2</td><td>2,200</td><td>2d4</td><td>10</td><td>1</td><td>1</td><td>5</td><td>2</td><td>1</td></tr>
<tr><td>3</td><td>4,400</td><td>3d4</td><td>15</td><td>2</td><td>2</td><td>7</td><td>2</td><td>1</td></tr>
<tr><td>4</td><td>8,800</td><td>4d4</td><td>20</td><td>2</td><td>2</td><td>9</td><td>3</td><td>2</td></tr>
<tr><td>5</td><td>16,600</td><td>5d4</td><td>25</td><td>2</td><td>3</td><td>10</td><td>3</td><td>2</td></tr>
<tr><td>6</td><td>33,000</td><td>6d4</td><td>30</td><td>3</td><td>3</td><td>11</td><td>4</td><td>3</td></tr>
<tr><td>7</td><td>66,000</td><td>7d4</td><td>35</td><td>3</td><td>4</td><td>12</td><td>4</td><td>3</td></tr>
<tr><td>8</td><td>125,000</td><td>8d4</td><td>40</td><td>3</td><td>4</td><td>13</td><td>5</td><td>4</td></tr>
<tr><td>9</td><td>250,000</td><td>9d4</td><td>45</td><td>4</td><td>5</td><td>14</td><td>5</td><td>4</td></tr>
<tr><td>10</td><td>500,000</td><td>9d4+1</td><td>50</td><td>4</td><td>5</td><td>15</td><td>5</td><td>5</td></tr>
<tr><td>11</td><td>750,000</td><td>9d4+2</td><td>55</td><td>4</td><td>6</td><td>16</td><td>5</td><td>5</td></tr>
<tr><td>12</td><td>1,000,000</td><td>9d4+3</td><td>60</td><td>5</td><td>6</td><td>17</td><td>5</td><td>5</td></tr>
<tr><td>13</td><td>1,250,000</td><td>9d4+4</td><td>65</td><td>5</td><td>7</td><td>18</td><td>5</td><td>5</td></tr>
<tr><td>14</td><td>1,500,000</td><td>9d4+5</td><td>70</td><td>6</td><td>7</td><td>19</td><td>5</td><td>5</td></tr>
<tr><td>15</td><td>1,750,000</td><td>9d4+6</td><td>75</td><td>6</td><td>8</td><td>20</td><td>5</td><td>5</td></tr>
<tr><td>16</td><td>2,000,000</td><td>9d4+7</td><td>80</td><td>6</td><td>8</td><td>21</td><td>5</td><td>5</td></tr>
<tr><td>17</td><td>2,250,000</td><td>9d4+8</td><td>85</td><td>6</td><td>9</td><td>22</td><td>5</td><td>5</td></tr>
<tr><td>18</td><td>2,500,000</td><td>9d4+9</td><td>90</td><td>6</td><td>9</td><td>23</td><td>5</td><td>5</td></tr>
<tr><td>19</td><td>2,750,000</td><td>9d4+10</td><td>95</td><td>6</td><td>10</td><td>24</td><td>5</td><td>5</td></tr>
<tr><td>20</td><td>3,000,000</td><td>9d4+11</td><td>100</td><td>6</td><td>10</td><td>25</td><td>5</td><td>5</td></tr>
</tbody></table>
<h2>Core Abilities</h2>
<h3>Psionic Strength Points</h3><p>Gain 5 PSP per psionic level. Known abilities may be used repeatedly while sufficient PSP remain. A full night's rest followed by about one hour of undisturbed meditation restores spent PSP.</p>
<h3>Chakras and Disciplines</h3><p>Sciences and Devotions are organized under Root/Psychometabolic, Sacral/Clairsentient, Plexus/Psychokinetic, Heart/Telepathic, Throat/Psychoportative, and Third Eye/Metapsionic Chakras.</p>
<h3>Concentration</h3><p>Most psionic disciplines require concentration. The combined PSP cost of simultaneously active abilities may not exceed psionic level +3; Defense Modes do not count against this limit.</p>
<h3>Psionic Combat</h3><p>Mystics learn Attack and Defense Modes and normally use no more than one of each per round.</p>
<h3>Non-Possessiveness</h3><p>Mystics practice detachment from material wealth. Practical wealth needed for survival, adventuring, research, followers, or legitimate domain responsibilities is acceptable; personal hoarding and luxury violate the ideal.</p>
<h3>Ashram</h3><p>At 9th level a Mystic may establish an ashram or similar sanctuary and attract low-level Mystic followers.</p>
`;

const mysticBR = `
<h1>Mystic in S&amp;W and Birthright</h1>
<h2>Psionics Are Not Magic</h2>
<p>Psionic powers are a distinct supernatural system. A Mystic does not automatically become a spellcaster, wizard regent, or Source user simply because a psionic ability resembles a spell.</p>
<h2>Bloodlines</h2>
<p>A Mystic may be blooded or unblooded. Bloodline powers and psionics are separate. A blooded Mystic may rule a domain if properly invested, but Mystic levels do not grant Source holdings, ley lines, or realm magic.</p>
<h2>Example</h2>
<p>A blooded Mystic who controls a Law holding can perform the same lawful domain actions as another invested regent. Using a psionic Science does not normally cost Regency Points, and controlling a Source requires some other legitimate qualification.</p>
<h2>Magic and Psionics</h2>
<p>Effects that specifically target spells, spell slots, Sources, or realm magic do not automatically affect psionics unless the effect says otherwise. Likewise, suppressing mebhaighl does not automatically remove PSP.</p>
`;

const mysticFeatures = [
  ["Psionic Strength Points","<p>Gain 5 PSP per psionic level. Recover spent PSP after a full night's rest followed by about one hour of undisturbed meditation.</p>"],
  ["Psionic Saving Throws","<p>Use the campaign's S&amp;W psionic saving throw conversion. Intelligence modifies resistance to psionic effects; Wisdom modifies psionic combat damage.</p>"],
  ["Chakras and Disciplines","<p>Learn Major Sciences and Minor Devotions from unlocked Chakras: Root, Sacral, Plexus, Heart, Throat, and Third Eye.</p>"],
  ["Concentration and Simultaneous Powers","<p>Most disciplines require concentration. Total PSP cost of simultaneous powers may not exceed psionic level +3; Defense Modes do not count.</p>"],
  ["Psionic Combat","<p>Attack Modes and Defense Modes use the same PSP pool. Normally no more than one Attack Mode and one Defense Mode may be used in a round.</p>"],
  ["Non-Possessiveness","<p>Mystics practice detachment from personal wealth and luxury while still being able to fund legitimate adventuring and domain responsibilities.</p>"],
  ["Magic Items","<p>Mystics treat magical and psionic items as tools rather than trophies and follow the campaign's Mystic item restrictions.</p>"],
  ["Ashram","<p>At 9th level establish an ashram or similar sanctuary and attract low-level Mystics, subject to Charisma and regular instruction.</p>"]
];

writeDoc(journalsDir, journalDoc("Mystic", mysticClass, mysticBR));
for (const f of mysticFeatures) writeDoc(featuresDir, featureDoc("Mystic", f[0], f[1]));

const groups = [
  ["Root","Psychometabolic","science",3,["Animal Affinity","Complete Healing","Energy Control","Etherealness","Life Draining","Shadow Form","Shape Alteration"]],
  ["Root","Psychometabolic","devotion",1,["Absorption","Adrenaline Control","Biofeedback","Body Control","Body Equilibrium","Body Weaponry","Cell Adjustment","Chameleon Ability","Expansion","Mind Over Body","Reduction","Suspend Animation"]],
  ["Sacral","Clairsentient","science",3,["Aura Sight","Catacognition","Hypercognition","Precognition","Psionic Divination","Psionic True Seeing","Sensitivity to Psychic Impressions"]],
  ["Sacral","Clairsentient","devotion",1,["360° Vision","Clairaudience","Clairvoyance","Danger Sense","Detection of Good/Evil","Detection of Magic","Infravision","Know Direction","Know Location","Object Reading","Poison Sense","Spirit Sense"]],
  ["Plexus","Psychokinetic","science",3,["Create Object","Detonate","Disintegrate","Molecular Manipulation","Molecular Rearrangement","Project Force","Telekinesis"]],
  ["Plexus","Psychokinetic","devotion",1,["Animate Object","Animate Shadow","Control Body","Control Flames","Control Light","Control Sound","Control Temperature","Control Wind","Disrupt Invisibility","Inertial Barrier","Levitation","Molecular Agitation"]],
  ["Heart","Telepathic","science",3,["Mass Domination","Mind Bar","Mind Link","Mind Wipe","Probe","Speak Any Language","Switch Personality"]],
  ["Heart","Telepathic","devotion",1,["Animal Telepathy","Conceal Thoughts","Domination","Empathy","ESP","Hypnosis","Identity Penetration","Invisibility","Life Detection","Phobia Amplification","Synaptic Static","Telempathic Projection"]],
  ["Throat","Psychoportative","science",3,["Banishment","Dimension Door","Dimension Walk","Probability Travel","Summon Planar Creature","Teleport Other","Teleportation"]],
  ["Throat","Psychoportative","devotion",1,["Astral Projection","Blink","Burst","Catfall","Dimension Slide","Dimension Swap","Dissipating Touch","Dream Travel","Phase Shift","Retrieve","Time Leap","Time/Space Anchor"]],
  ["Third Eye","Metapsionic","science",5,["Empower","Psychic Clone","Psychic Surgery","Retrospection","Schism","Splice","Ultrablast"]],
  ["Third Eye","Metapsionic","devotion",2,["Appraise","Aura Alteration","Cannibalize","Convergence","Enhancement","Magnify","Martial Trance","Psionic Sense","Psychic Drain","Receptacle","Stasis Field","Stretch"]]
];

for (const [chakra, discipline, category, psp, names] of groups) {
  for (const name of names) writeDoc(powersDir, powerDoc(name, chakra, discipline, category, psp));
}

const attacks = [
  ["Id Insinuation",4,"180'","10-foot radius","A failed psionic save causes fear, rage, hopelessness, or mental collapse for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Ego Whip",3,"90'","1 creature","A failed psionic save leaves the target stunned and unable to act for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Mind Thrust",3,"60'","1 creature","A failed psionic save confuses the target for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Psionic Blast",5,"60-foot cone","Cone","A failed psionic save inflicts 1d6 + 1 hit point per 2 psionic levels and stuns for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Psychic Crush",5,"90'","1 creature","A failed psionic save inflicts 2d6 + psionic level hit points of damage."]
];
const defenses = [
  ["Mind Blank",0,"Self","Self","+2 against attack modes causing behavioral effects and reduces area-attack effects."],
  ["Thought Shield",2,"Self","Self","+1 to saves against all attack modes and halves emotion, stun, or confusion effects."],
  ["Mental Barrier",2,"Self","Self","+3 to saves against area attacks and halves hit point damage from attack modes."],
  ["Intellect Fortress",4,"Self","10-foot radius","Halves the effect of any psionic attack mode affecting creatures within the protected area."],
  ["Tower of Iron Will",5,"Self","5-foot radius","+3 to saves against psionic attack modes for creatures within the protected area."]
];

for (const [name, psp, range, target, detail] of attacks) {
  writeDoc(powersDir, powerDoc(name, "Psionic Combat", "Combat Mode", "attack", psp, { range, duration: "Instantaneous", target, detail }));
}
for (const [name, psp, range, target, detail] of defenses) {
  writeDoc(powersDir, powerDoc(name, "Psionic Combat", "Combat Mode", "defense", psp, { range, duration: "1 round", target, detail }));
}

console.log("Built " + fs.readdirSync(journalsDir).length + " class journals, " + fs.readdirSync(featuresDir).length + " class features, and " + fs.readdirSync(powersDir).length + " Mystic powers.");
