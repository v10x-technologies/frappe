# v10x Theme Development Guide

This document provides a deep dive into the `v10x_theme` codebase, explaining the architecture, component logic, and implementation details line-by-line.

## 1. Architecture Overview

The v10x theme is a Vue. js-based frontend layer that sits on top of the Frappe Framework. It replaces the standard Desk interface with a "Shell" layout that manages:
-   **Header**: Global navigation, user menu, search, and notifications.
-   **Primary Sidebar**: App switching and module navigation.
-   **Secondary Sidebar**: Context-specific navigation (e.g., Workspace shortcuts).
-   **Main Content**: A "Portal" system that injects Frappe's standard page content into the custom layout.

**File Structure:**
```
frappe/public/js/v10x_theme/
├── v10x_shell.vue            # Root App Component (The Shell)
├── components/
│   ├── V10xHeader.vue        # Top Navigation Bar
│   ├── V10xSidebar.vue       # Primary Left Sidebar
│   ├── V10xPageHeader.vue    # Sticky Page Header (Breadcrumbs/Actions)
│   ├── V10xSecondarySidebar.vue # Contextual Sidebar
│   └── workspace/            # Widget Components (Charts, Shortcuts)
```

---

## 2. Component Deep Dive

### 2.1 [v10x_shell.vue](v10x_shell.vue)

The root component that orchestrates the entire layout.

#### Code Analysis

**Template Structure:**
-   `<div class="v10x-layout">`: The main flex container.
-   `<V10xHeader ... />`: Hooks up sidebar toggle events and passes global branding props.
-   `<V10xSidebar ... />`: Receives route updates to highlight active items.
-   `<V10xSecondarySidebar ... />`: Conditionally rendered based on `showSecondarySidebar` state.
-   `<main class="v10x-main-content">`: The dynamic content area where Frappe pages are rendered.
    -   `<div id="v10x-frappe-portal">`: A wrapper logic for the portals.
    -   `<V10xPageHeader />`: The sticky header that grabs breadcrumbs/titles from the active page.
    -   `<div id="v10x-body-portal">`: **CRITICAL**. This div exists for the bundle script to "teleport" the standard Frappe `#body` content into.

**Script Logic:**
-   **Data**:
    -   `sidebar_collapsed` / `sidebar_hidden`: State persisted in `localStorage`.
    -   `observer`: A `MutationObserver` instance that watches `#v10x-body-portal` for changes. This triggers the "Portal Logic" to update headers when the page content changes (e.g., via AJAX).
    -   `workspaceCache`: Caches workspace JSON responses to prevent redundant API calls when clicking sidebar items.
-   **Key Methods**:
    -   `checkSecondarySidebarOnLoad()`: When the app loads, it checks if the current route is a Workspace. If so, it fetches that workspace's metadata to populate the Secondary Sidebar items.
    -   `portalPageActions()`: The **Core Magic**. This function runs on every route change or DOM mutation:
        1.  Finds the *active* page container (hidden by default) in the DOM.
        2.  Extracts `.page-head`, `.title-area`, `.custom-actions` from that standard Frappe page.
        3.  Moves (jquery `.appendTo`) these elements into the `V10xPageHeader` portals (`#v10x-title-text-portal`, etc.).
        4.  This allows us to reskin the header while keeping all Frappe standard button functionality intact.
    -   `applyTheme()`: (Previously present) Managed custom dark mode classes. Now relies on native Frappe `[data-theme]` attributes.

**Style Logic:**
-   `margin-left`: Dynamically adjusted on `.v10x-main-content` based on sidebar state (240px expanded, 60px collapsed, 0px hidden).
-   `z-index`: Carefully managed to keep the Header (1000) above Sidebars (999) but below Modals (1050).

### 2.2 [V10xHeader.vue](components/V10xHeader.vue)

The global top bar.

#### Code Analysis

**Template Structure:**
-   **Logo Area**: Switches between full logo and initial (`M` or similar) when sidebar is collapsed.
-   **Search**: Renders `#navbar-search` which hooks into Frappe's `AwesomeBar` logic.
-   **Notifications**: Standard dropdown consuming `frappe.desk.doctype.notification_log` API.
-   **User Menu**: Dynamic dropdown populated from `frappe.boot.navbar_settings`.

**Script Logic:**
-   `setup_search()`: Initializes `frappe.search.AwesomeBar` on the input. This connects the global search functionality.
-   `fetch_notifications()`: Polls the backend for new alerts. Tied to `frappe.realtime` events to update legally instantly.
-   `toggleTheme()`: Cycles through `Light` -> `Dark` -> `Automatic` using `frappe.ui.theme.change_theme`.

### 2.3 [V10xSidebar.vue](components/V10xSidebar.vue)

The primary navigation bar.

#### Code Analysis

**Template Logic:**
-   Renders two lists: `public_items` (standard modules) and `private_items` (user-specific).
-   **Edit Mode**: `<i class="fas fa-pencil-alt"></i>` icons appear when `is_edit_mode` is true, allowing direct editing of Workspace definitions via Dialogs.
-   **Footer**: Contains the collapse/expand toggle.

**Script Logic:**
-   `fetchWorkspaces()`: Calls `frappe.desk.desktop.get_workspace_sidebar_items`.
    -   It *merges* this data with a direct DB call to `Workspace` to get custom fields like `custom_icons`. This allows overriding standard icons with FontAwesome or MDI classes.
-   `navigate(item)`:
    -   If the sidebar is collapsed and the item has children, it *expands* instead of navigating.
    -   Otherwise, it emits `workspace-selected` to the Shell (handling Secondary Sidebar logic) and sets the route.
-   `create_workspace()`: Opens a `frappe.ui.Dialog` to create new private/public workspaces.

### 2.4 [V10xSecondarySidebar.vue](components/V10xSecondarySidebar.vue)

A slide-out panel for additional links.

#### Code Analysis

-   **Props**: Receives `menuItems` (array) from the parent Shell. These are the "Shortcuts" or "Links" defined in the active Workspace DocType.
-   **Logic**:
    -   `sortedMenuItems`: Filters active items and sorts them by `sequel` (sequence).
    -   `isHeader()`: Identifies separation headers in the list to visually group links.

### 2.5 [V10xPageHeader.vue](components/V10xPageHeader.vue)

The "Sticky" header that contains the page context.

#### Code Analysis

-   **Portals**: This component defines empty `div`s with IDs (`v10x-breadcrumbs-portal`, `v10x-standard-actions-portal`).
    -   It **DOES NOT** populate them itself.
    -   It passively waits (via `MutationObserver` in `setupObserver`) for the Shell to inject content into them.
-   **Visibility**: Uses a `v-show` tied to `hasContent`. If the Shell hasn't found a page title yet, this header stays invisible to prevent a "empty white bar" glitch.
-   **Styling**:
    -   `position: sticky`: Ensures it stays at the top of the content area while scrolling.
    -   `z-index: 1010`: High enough to sit above page content but below dropdowns/modals.

### 2.6 [V10xWorkspace.vue](components/workspace/V10xWorkspace.vue)

The renderer for individual Workspace pages (Dashboards).

#### Code Analysis

**Script Logic:**
-   **Props**: `workspace_name` and `is_public`.
-   **Fetching**: `fetch_data()` calls `frappe.desk.desktop.get_desktop_page`. This returns the JSON definition of the workspace (charts, shortcuts, cards).
-   **Processing**: `process_blocks()` flattens the disparate data structures (charts, cards, shortcuts) into a single linear array `blocks`.
    -   It assigns grid columns (`col: 6`, `col: 12`, etc.) based on the widget type.
    -   It hands these blocks off to the child component `WorkspaceBlock` for actual rendering.

**Template Logic:**
-   **Loading State**: Shows a Bootstrap spinner while fetching.
-   **Grid System**: Uses Bootstrap `row gx-4 gy-4` to create a grid with consistent gutters.

---

## 3. Key Mechanisms

### The Portal System
The theme relies on "portaling" (moving DOM nodes) rather than re-implementing Frappe's page logic.
1.  **Frappe Renders**: Frappe renders a page (e.g., generic List View) into a hidden DOM container.
2.  **Shell Detects**: `v10x_shell.vue` detects this new render.
3.  **Shell Teleports**: It detaches the Title, Breadcrumbs, and Buttons from that hidden container and appends them into the `V10xPageHeader`'s portal slots.
4.  **Result**: The buttons still work (their event listeners are preserved by jQuery `appendTo`), but they appear in the custom V10x layout.

### Responsiveness
-   **Mobile**: The Sidebar logic (CSS) hides the sidebar completely (`margin-left: 0`) on small screens. The Toggle Button in the header becomes a "Show Sidebar" drawer trigger.
-   **Large Screens**: The "Comfortable" layout (Theme 2) applies a `max-width: 1600px` to `v10x-content-inner` to prevent content from stretching too wide on ultrawide monitors.
