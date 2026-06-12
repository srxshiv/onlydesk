# onlydesk — User Manual

> Everything you can do on your desk, end to end.

onlydesk is a personal productivity desk. You install AI-powered **tools** (widgets) onto a virtual desk, feed the desk **context** about your real life (work history, skills, goals, health, anything you define), and the tools use that context — plus external services via MCP — to do real work for you.

---

## 1. Getting started

### 1.1 Create your desk

1. Visit the app (default `http://localhost:3000`).
2. Click **Get a desk** and sign up with your name, email, and password.
3. You land on `/desk` — your desk, dark and softly lit, empty for now.

Sessions use secure httpOnly cookies. **Sign in** / sign-out are available any time; your access token refreshes automatically.

### 1.2 The first 5 minutes

1. Press **⌘K** (or `Ctrl+K`) → type the name of a tool → **Install**.
2. The tool lands as a widget on your current Focus Space.
3. Open the **Context Store** (database icon in the dock) and add a few entries — a work-log line, a skill, a goal.
4. Open the tool's workspace (arrow icon on its widget) and put it to work.

---

## 2. The desk

### 2.1 Focus Spaces

Your desk is actually several desks. A **Focus Space** is a distinct surface with its own widgets, its own wood finish, and its own lamplight — and switching spaces re-tints every pane, button, and hairline in the app to match:

| Space | Finish | Light |
| --- | --- | --- |
| **Professional** | Walnut & brass | Warm amber lamps |
| **Personal** | Rosewood & copper | Rose-gold evening light |
| **Zen** | Smoked oak & moss | Soft green-gold stillness |

Switch spaces from the **dock** (the glowing dot button — it blooms into a space picker) or via **⌘K → "Go to …"**. The wood, lamps, and accents crossfade to the new space's palette, and the widget set swaps with it.

A widget lives on exactly one space. Newly installed tools mount onto whichever space is active.

### 2.2 Layout modes

The dock's right-most button toggles how the desk lays itself out:

- **Snap to Grid** (default) — a clean bento-box. Widgets auto-flow into a grid. Drag one widget **over another to swap their slots**; everything animates into place.
- **Freeform** — a messy physical desk. Widgets sit at absolute positions, can overlap, and **grabbing one raises it** to the top of the pile. Drag anything anywhere; positions persist.

Layout, positions, sizes, and your active space are remembered per browser.

### 2.3 Widgets

Every installed tool is a widget on the desk. Hover a widget to reveal its controls:

- **S / M / L** — resize. Small is icon-and-name, Medium adds the description, Large also previews the tool's actions.
- **↗** — open the tool's full workspace page.
- **Drag** — move it (swap slots in grid; place freely in freeform).

The footer chips show the tool's category and action count.

---

## 3. The dock

The floating glass strip at the bottom-center:

| Button | What it does |
| --- | --- |
| 🏪 Store | Opens the **App Store** overlay |
| 🗄 Database | Opens the **Context Store** drawer |
| ⌘ (center, glowing) | Opens the **Command Palette** |
| ● Colored dot | **Focus Space** switcher |
| ⊞ / ✥ | Toggle **grid / freeform** layout |

---

## 4. The Context Store

The Context Store is your desk's memory — the data tools read to act like they know you. It opens as a full-height frosted drawer from the right edge (dock → database icon, the only way in) and is organized into **three pillars**:

### 4.0 Daily check-in

At the top of the drawer: *"How are you doing today?"* — pick a mood (🌧 → ☀️), slide your energy, count your water, **Log today**. It lands in your Health Log as a `daily_checkin` entry, readable by any tool you've granted Health Log access.

### 4.1 Core Personal & Core Professional (built-in stores)

| Pillar | Stores |
| --- | --- |
| **Core Personal** | Goals · Social Voice · Health Log (workouts, weight, sleep, check-ins) |
| **Core Professional** | Work Log · Job Targets · Skills · Projects · Education |

Open any store, fill the **Add entry** form (fields are typed — dates get date pickers, choices get dropdowns), and submit. Entries list below the form; hover one to delete it. For profile basics (name, age, weight), use the one-tap **Profile** template in the custom-store builder.

### 4.2 Custom stores (define your own)

You aren't limited to the built-ins. **Custom Stores → Create custom store** opens the schema builder (with one-tap starting points: Profile, Book Log, Crypto Holdings):

1. **Name it** — e.g. "Daily Mood" (stored as `daily_mood`).
2. **Add fields** — each with a name and a type:
   - **Text** — short string (e.g. a title)
   - **Long text** — paragraphs
   - **Number** — age, weight, reps
   - **Yes / No** — a toggle
   - **Date** — a date picker
   - **Choice** — pick-one from options you list (e.g. `great, fine, rough`)
3. Mark fields **Required** as needed.
4. **Create store** — it exists immediately. No migrations, no waiting.

The new store behaves exactly like a built-in: a generated entry form, a record list, delete-on-hover. The server validates every entry against your schema — wrong types or unknown fields are rejected with a per-field message under the offending input.

Deleting a custom store deletes its entries with it (you'll find the red button at the bottom of the store's page).

### 4.3 Tool access — who can read your context?

The drawer's **Tool access** panel is a patch bay: every installed tool shows a row of sockets, one per store (built-in *and* custom). Click to plug (●) or unplug (○) a store from a tool; a `*` marks stores the tool's manifest asked for. **A tool can only read what you've wired to it here** — the backend refuses everything else, even scopes the manifest declared. Installing a tool wires up its requested stores by default; you can revoke or extend (e.g. plug your Book Log into the Post Writer) at any time. The App Store still shows each tool's requested scopes (the 👁 chips) before you install.

---

## 5. The App Store

Dock → store icon (or ⌘K → "Open App Store").

Each card shows the tool's name, version, category, description, and **which context stores it reads**. Actions:

- **Install** — registers the tool to your account and mounts its widget on your active Focus Space instantly.
- **Trash** (on installed tools) — uninstalls and removes its widgets from every space.

---

## 6. The Command Palette (⌘K)

The fastest way to drive the desk. Open with **⌘K** / **Ctrl+K**, the center dock button, or close with **Esc**.

Available actions, filtered as you type:

- **Navigate** — open the App Store, open the Context Store
- **Spaces** — jump to another Focus Space
- **Desk** — toggle grid / freeform layout
- **Tools** — open any installed tool's workspace
- **Install** — install any not-yet-installed tool, one keystroke

Arrows to move, **Enter** to run.

---

## 7. Tool workspaces

A widget is the tool's face; the **workspace** (`↗` on the widget, or ⌘K → "Open …") is its full page. What lives there depends on the tool — e.g. the Resume Editor's workspace is where you pick a job target and generate a tailored resume.

Tool actions run in one of two modes (you'll see it on the widget's action chips):

- **inline** — answers immediately.
- **queued** — long-running (AI + external services). The action is accepted instantly and works in the background; results appear when it finishes. Failed runs are retried automatically before being reported as failed.

---

## 8. Keyboard shortcuts

| Keys | Action |
| --- | --- |
| **⌘K** / **Ctrl+K** | Open / close the command palette |
| **Esc** | Close any overlay (palette, drawer, store) |
| **↑ ↓ / Enter** | Navigate / run in the palette |

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Redirected to sign-in | Session expired — sign in again. |
| "Couldn't reach the registry" in the App Store | The API isn't running, or `NEXT_PUBLIC_API_URL` points to the wrong place. |
| A form field shows a red message | The server rejected that value (wrong type, missing required, unknown field). Fix the field and resubmit. |
| Custom store name rejected | Keys must start with a letter and use only letters, numbers, `_`, `-`; reserved names (the 8 built-ins, `schemas`, `summary`) are not allowed. |
| Widget layout looks stale | Layout is stored per browser (localStorage). A different browser/profile starts with the default arrangement. |
| Queued action stuck "pending" | The worker or Redis isn't running — see the [Development guide](../guides/DEVELOPMENT.md). |

---

*For the REST endpoints behind every screen, see the [API reference](../api/REST-API.md). For how it's all built, start at the [architecture overview](../architecture/ARCHITECTURE.md).*
