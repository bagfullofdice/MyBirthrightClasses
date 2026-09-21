# My Birthright Classes

A Foundry VTT module for **Swords & Wizardry** containing expanded character classes adapted for a Birthright campaign.

## Character Sheet Bloodline Panel

Character sheets gain a compact Birthright bloodline section with:

- Blooded toggle
- Derivation: Anduiras, Basaïa, Brenna, Masela, Reynir, Vorynn, or Azrai
- Strength: Tainted, Minor, Major, Great, or True
- Numeric bloodline score

For example: **Brenna · Major · 33**. Bloodline data is stored on the Actor in module flags and does not modify the S&W system schema.

## Multi-Class and Dual-Class Progression

The module adds a **Class Progression** panel to S&W character sheets without modifying the S&W Actor schema.

The panel supports:

- Multi-Class mode for concurrent classes
- Dual-Class mode for former and current classes
- Individual class name, level, XP, XP bonus, and status
- Shared XP tracking for Multi-Class characters
- Automatic synchronization to the standard S&W Class, Level, XP, and XP Bonus fields
- Module-flag storage so system updates do not overwrite the progression data

When Dual-Class mode is used, only one class is treated as the current active class; other class entries are retained as former classes.

This is the foundation layer. Automatic S&W advancement tables, best saving throw/attack calculation, spell progression, XP distribution, and campaign-specific HP automation are planned as later steps.

## Compendiums

### Expanded Classes
Player-facing Journal Entries. Each class has two pages:

1. **Class** — class information, advancement, abilities, and examples.
2. **Birthright & S&W** — setting integration, domain play, Regency guidance, and examples.

Classes included:

- Guilder
- Tomb Raider
- Swashbuckler
- Metaphysician
- Friar
- Wanderer
- Spiritualist
- Jester
- Errant Fool
- Scout
- Captain
- Courtier
- Scholar
- Engineer
- Mystic

### Expanded Class Features
Drag-and-drop S&W Feature Items for the class abilities.

### Mystic Psionic Powers
Spell-style Items for Mystic Sciences, Devotions, Attack Modes, and Defense Modes.

The ordinary spellcasting classes in this module use spells from the Swords & Wizardry spell lists. Core S&W spells are not duplicated in this module.

## Install

Manifest URL:

`https://raw.githubusercontent.com/bagfullofdice/MyBirthrightClasses/main/module.json`

## Status

These classes and character-sheet extensions are campaign material and should be treated as experimental until tested in play.
