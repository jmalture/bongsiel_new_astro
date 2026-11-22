# EmDash 1.5.0 — technical brief for bongsiel-web (Astro 7)

Source: `emdash@1.5.0` installed in a scratch dir (it ships `src/` + `.d.mts`), CLI help, and docs.emdashcms.com (index: `/llms.txt`), read 2026-11-21. Paths like `src/plugins/types.ts` refer to `node_modules/emdash/src/`. **UNVERIFIED** = not confirmed from code or docs.

## 1. Setup

```bash
npm i emdash @astrojs/node @astrojs/react react react-dom sharp
```
`@astrojs/react` must be **registered**: without it the admin hangs on "Loading EmDash…". `sharp` is needed for image resizing.

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";   // also exports s3, memoryCache
import { sqlite } from "emdash/db";               // also libsql, postgres (emdash/db/*)

export default defineConfig({
  site: process.env.EMDASH_SITE_URL,
  output: "server",                       // no trailingSlash: "always" (breaks /_emdash/admin/setup/)
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: `file:${DATA_DIR}/data.db` }),   // Node built-in SQLite
      storage: local({ directory: `${DATA_DIR}/uploads`, baseUrl: "/_emdash/api/media/file" }),
      siteUrl: process.env.EMDASH_SITE_URL,   // or the env var EMDASH_SITE_URL / SITE_URL
      admin: { locales: ["en", "de"], siteName: "Bongsiel CMS", hiddenNavItems: ["comments", "widgets", "bylines", "import"] },
      plugins: [reservationsPlugin()],        // see §4
    }),
  ],
});
```
```ts
// src/live.config.ts  (required)
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";
export const collections = { _emdash: defineLiveCollection({ loader: emdashLoader() }) };
```
Other config keys (`EmDashConfig`, `src/astro/integration/runtime.ts`): `migrations`, `objectCache`, `images`, `maxUploadSize` (50 MB), `imagePlaceholders`, `allowedOrigins`, `trustedProxyHeaders`, `authProviders`, `mcp` (on by default, needs a token), `toolbar: "server"|"client"|false`, `fonts`, `coEditing`.
Env vars: `EMDASH_SITE_URL`, `EMDASH_ENCRYPTION_KEY` (`npx emdash secrets generate`), `EMDASH_PREVIEW_SECRET` (optional), `EMDASH_TRUSTED_PROXY_HEADERS`.

### Seed file
Looked up in this order: `.emdash/seed.json`, then `package.json#emdash.seed`, then `seed/seed.json`. It is inlined at build time. On the first request to an **empty** database, migrations run and the seed is applied. It is **never re-applied** to an existing database: use `npx emdash schema add-field … --url --token`, or `npx emdash seed --on-conflict update`.
```jsonc
{ "version": "1", "defaultLocale": "de",
  "meta": { "name": "Bongsiel" },
  "settings": { "title": "Dat Swarte Peerd", "tagline": "…", "timezone": "Europe/Berlin" },
  "blockTypes": [{ "slug": "hero", "label": "Hero", "currentVersion": 1,
    "versions": [{ "version": 1, "fields": [
      { "slug": "title", "label": "Titel", "type": "string", "required": true },
      { "slug": "image", "label": "Bild", "type": "image" } ] }] }],
  "collections": [{
    "slug": "menu_items", "label": "Speisekarte", "labelSingular": "Gericht",
    "description": "…", "icon": "fork-knife", "group": "Restaurant", "sortOrder": 1,
    "supports": ["drafts", "revisions", "preview", "search", "seo"],
    "urlPattern": "/speisekarte/{slug}", "routable": false, "hidden": false,
    "titleField": "name", "dateField": "updatedAt", "admin": { "listColumns": ["price", "category"] },
    "fields": [
      { "slug": "name", "label": "Name", "type": "string", "required": true, "validation": { "maxLength": 120 } },
      { "slug": "price", "label": "Preis (€)", "type": "number", "validation": { "min": 0 }, "indexed": true, "translatable": false },
      { "slug": "category", "label": "Kategorie", "type": "select", "validation": { "options": ["vorspeise", "hauptgang", "dessert"] } },
      { "slug": "vegetarian", "label": "Vegetarisch", "type": "boolean", "defaultValue": false },
      { "slug": "available_from", "label": "Ab", "type": "datetime" },
      { "slug": "photo", "label": "Foto", "type": "image", "validation": { "allowedMimeTypes": ["image/jpeg", "image/webp"] } },
      { "slug": "body", "label": "Text", "type": "portableText" },
      { "slug": "extras", "label": "Extras", "type": "repeater", "validation": { "maxItems": 12, "subFields": [
          { "slug": "label", "label": "Bezeichnung", "type": "string", "required": true },
          { "slug": "kind", "label": "Art", "type": "select", "options": ["a", "b"] } ] } },
      { "slug": "layout", "label": "Abschnitte", "type": "blocks", "validation": { "allowedTypes": ["hero"], "maxItems": 20 } },
      { "slug": "sort_order", "label": "Reihenfolge", "type": "integer", "indexed": true }
    ] }],
  "taxonomies": [{ "name": "allergens", "label": "Allergene", "hierarchical": false, "collections": ["menu_items"], "terms": [{ "slug": "gluten", "label": "Gluten" }] }],
  "menus": [{ "name": "primary", "label": "Hauptmenü", "items": [{ "type": "custom", "label": "Reservieren", "url": "/reservieren" }] }],
  "redirects": [{ "source": "/alt", "destination": "/neu", "type": 301 }],
  "content": { "menu_items": [{ "id": "m1", "slug": "scholle", "status": "published", "data": { "name": "Scholle" } }] } }
```
- **Field types:** `string, text, url, number, integer, boolean, datetime, select, multiSelect, portableText, image, file, reference, json, slug, repeater, blocks`.
- **Repeater sub-fields:** `string, text, url, number, integer, boolean, datetime, select, image`. Repeaters cannot nest.
- **Block fields:** the field types above minus `reference`, `json`, `slug`, `blocks`. A block field can be a `repeater`. A `blocks` field cannot be required; it holds at most 100 items.
- **Field properties:** `required, unique, searchable, indexed, translatable, defaultValue, validation, widget, options`.
- **Validation keys:** `min, max, minLength, maxLength, pattern, options[], subFields, minItems, maxItems, allowedMimeTypes, allowedTypes`, plus reference keys `relation/targetCollection/multiple`.
- **Reserved field slugs:** `id, slug, status, author_id, created_at, updated_at, published_at, …`, `terms, bylines, byline`.
- **Images in the seed:** `{ "$media": { "url": "https://…", "alt": "…" } }`. Local files and localhost URLs are blocked.
- **Singletons do not exist.** `settings` only accepts the fixed `SiteSettings` keys: `title, tagline, logo, favicon, url, staging, postsPerPage, dateFormat, timezone, social{facebook,instagram,…}, seo`. For opening hours, phone and similar data use one of these:
  - (a) a `hidden` or normal collection with one entry under a known slug. Editors can delete that entry, so keep defaults in code.
  - (b) a plugin `settingsSchema` (§4), read with `getPluginSetting(pluginId, key)`. Editors cannot delete these.

## 2. Reading content in pages (`import … from "emdash"`)
```astro
---
import { getEmDashCollection, getEmDashEntry, getSiteSettings, getMenu, getTaxonomyTerms, getEntryTerms } from "emdash";
import { Image, PortableText, Blocks, EmDashHead } from "emdash/ui";
const { entries, error, nextCursor, hasMore, cacheHint } = await getEmDashCollection("menu_items", {
  status: "published",                              // default "published"; "draft" | "archived"
  where: { category: "hauptgang", allergens: ["gluten"], price: { lte: "20" } }, // taxonomy names auto-JOIN
  orderBy: { sort_order: "asc", published_at: "desc" },  // any field/column; default { created_at: "desc" }
  limit: 50, /* cursor | offset */ locale: "de",
});
const { entry, isPreview, fallbackLocale } = await getEmDashEntry("pages", Astro.params.slug);
if (!entry) return Astro.rewrite("/404");
const settings = await getSiteSettings(); const nav = await getMenu("primary"); // nav.items[].{label,url,children}
---
<head><EmDashHead /></head>   <!-- SEO/meta tags + plugin page:metadata contributions -->
<Image image={entry.data.photo} priority />          <!-- image field values are objects, never <img src> -->
<PortableText value={entry.data.body} />
<Blocks value={entry.data.layout} components={{ hero: Hero }} />
<h1 {...entry.edit.name}>{entry.data.name}</h1>      <!-- visual-editing annotations -->
```
- `entry.id` is the slug and `entry.data.id` is the database ID. Datetime values arrive as `Date` objects.
- Drafts show automatically for logged-in editors (edit mode) and on `?_preview=` URLs. Other visitors see only published entries.
- Also exported: `getEmDashReferences`, `resolveEmDashPath`, `getTranslations`, `search`, `getSection(s)`, `getWidgetArea`, `getEntriesByTerm`, `getSeoMeta`, `getHreflangAlternates`.
- `npx emdash types` generates `emdash-env.d.ts` with typed `data`. Dev mode does this automatically.

## 3. Auth: protecting our own pages and API routes with the EmDash login
- The EmDash auth middleware runs on **every** route. On public, non-`/_emdash` routes it does a "soft" check: when an `astro-session` cookie exists, it sets `Astro.locals.user` (`User`: `id, email, name, role, disabled…`) and never blocks the request (`src/astro/middleware/auth.ts handlePublicRouteAuth`). Types come from `emdash/locals` (`locals.d.ts`).
```ts
// src/pages/api/reservations/list.ts  (or an .astro page under /intern/…)
import { hasPermission, Role } from "@emdash-cms/auth";   // transitive dep: add it to package.json explicitly
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role < Role.EDITOR) return new Response("Forbidden", { status: 403 });
  // or hasPermission(locals.user, "content:edit_any")
};
```
- **Roles:** `SUBSCRIBER 10, CONTRIBUTOR 20, AUTHOR 30, EDITOR 40, ADMIN 50`. The first user is Admin.
- **Permissions:** `Permissions` map, e.g. `content:publish_any: 40`, `settings:manage: 50`, `users:invite: 50`.
- **Login:** a passkey (bound to the domain), magic link (needs email), or GitHub/Google/Microsoft providers. Invites go through Admin → Users. Without an email provider, copy the invite link (valid 7 days) and send it by hand.
- Logging in again on a different domain needs a new passkey. Sessions live in Astro's session store.
- **Our own POST routes:** EmDash's CSRF check covers only `/_emdash/*`. For our routes, Astro's `security.checkOrigin` (on by default in server output) applies. **UNVERIFIED** for Astro 7.

## 4. Plugin system (decides where reservations live)
**Yes, a plugin can do everything needed.** Native plugin = `definePlugin` from `"emdash"`:
```ts
// packages/plugin-reservations/src/index.ts  (local package, added as "file:" dep; docs use `pnpm add ../plugin`)
import { definePlugin, type PluginDescriptor } from "emdash";
import { z } from "zod";
export const reservationsPlugin = (): PluginDescriptor => ({
  id: "reservations", version: "0.1.0", format: "native",
  entrypoint: "@bongsiel/plugin-reservations",              // module specifier, bundled at build time
  adminEntry: "@bongsiel/plugin-reservations/admin",        // React admin pages (optional)
});
export function createPlugin() {                           // named export REQUIRED
  return definePlugin({
    id: "reservations", version: "0.1.0",
    capabilities: ["email:send"],                           // gates ctx.content/media/http/email/users…
    storage: { reservations: { indexes: ["date", "status", ["date", "status"]], uniqueIndexes: [] } },
    admin: {
      entry: "@bongsiel/plugin-reservations/admin",
      pages: [{ path: "/list", label: "Reservierungen", icon: "calendar", group: "Restaurant" }],
      widgets: [{ id: "today", title: "Heute", size: "half" }],
      settingsSchema: { maxGuests: { type: "number", label: "Max. Personen", min: 1, max: 200, default: 60 },
                        notifyEmail: { type: "email", label: "Benachrichtigung an" } },
    },
    routes: {
      create: { public: true, input: z.object({ name: z.string(), date: z.string(), guests: z.number().int() }),
        handler: async (ctx) => { const id = crypto.randomUUID();
          await ctx.storage.reservations.put(id, { ...ctx.input, status: "new", createdAt: new Date().toISOString() });
          return { ok: true, id }; } },
      list: { permission: "content:edit_any",               // private: session + X-EmDash-Request: 1
        handler: async (ctx) => ctx.storage.reservations.query({ where: { status: "new" }, orderBy: { date: "asc" }, limit: 100 }) },
    },
    hooks: { "content:afterPublish": async (e, ctx) => {}, cron: async (e, ctx) => {} },
  });
}
```
- **Routes** mount at `/_emdash/api/plugins/<id>/<route>`. Nested names are allowed. `ctx` = `RouteContext`: `input, request, requestMeta (IP, UA), user` plus the full `PluginContext`.
- **Public routes** (`public: true`): no auth, rate limit, or captcha. An Origin check returns 403 when the Origin header differs. `ctx.user` is **always undefined** there, even for logged-in admins.
- **Plugin storage:** document collections in the `_plugin_storage` table.
  - Methods: `get/put/delete/exists/getMany/putMany/deleteMany/query/count/compareAndSet/updateIf`.
  - `updateIf` makes an atomic guarded update, e.g. decrement free seats without overbooking: `updateIf(id, { where: { seats: { gte: n } }, delta: { seats: { dec: n } } })`.
  - Query and sort work **only on indexed fields**. `limit` is at most 100 and pages by cursor.
- **KV:** `ctx.kv` (`get/set/list(prefix)`). **Settings:** `ctx.settings`. In Astro pages, read settings with `getPluginSetting("reservations", "maxGuests")`. `settingsSchema` defaults are not stored, so apply the fallback in code.
- **Admin pages:** at `/_emdash/admin/plugins/<id><path>`, listed in the sidebar (optionally inside a `group` folder).
  - Native React: the admin module exports `pages: { "/list": Component }` and `widgets`. Call routes with `apiFetch` / `parseApiResponse` from `emdash/plugin-utils` (it adds the CSRF header).
  - No React: Block Kit. A route named `admin` receives `{type:"page_load"|"block_action"|"form_submit", page}` and returns `{blocks, toast?}`.
- **Other admin surfaces:** `editorPanels`, `editorActions`, `fieldWidgets` (`widget: "reservations:name"` on a field), `portableTextBlocks`, and the hooks `page:metadata` / `page:fragments`.
- **Hooks:** `plugin:install|activate|deactivate|uninstall`, `content:beforeSave|afterSave|beforeDelete|afterDelete|beforePublish|afterPublish|beforeUnpublish|afterUnpublish|beforeSchedule|afterSchedule|afterUnschedule|afterRestore`, `media:beforeUpload|afterUpload`, `cron` (`ctx.cron.schedule(name, {schedule})`), `email:beforeSend|deliver|afterSend`, `comment:*`, `byline:*`, `page:metadata|fragments`.
- **Not allowed:** custom SQL tables through the plugin API. Storage is JSON documents only. A native plugin runs in-process without a sandbox, so it *could* import `getDb` (§5).
- **Entrypoint:** passing a `definePlugin()` result directly into `plugins: []` throws. The plugin needs a package/file `entrypoint`. Relative file paths and TS source without a build step are **UNVERIFIED**; docs build with `tsdown`.

## 5. Anonymous writes and DB access from our own routes
- **No anonymous content API.** `/_emdash/api/content/*` needs a session or token with at least `content:create` (20). Anonymous `locals.emdash` has no `handleContentCreate`. Comments are the only built-in public write.
- **Option A (recommended):** a plugin `public` route plus plugin storage (§4). Reservations appear in the EmDash admin, and roles and email come with it.
- **Option B:** our own Astro API route using the same Kysely instance:
```ts
import { getDb } from "emdash/runtime";          // Promise<Kysely<Database>>, same SQLite file, request-scoped aware
import { sql } from "kysely";
const db = await getDb();
await db.schema.createTable("bs_reservations").ifNotExists()
  .addColumn("id", "text", c => c.primaryKey()).addColumn("date", "text").addColumn("data", "text").execute();
await sql`INSERT INTO bs_reservations (id, date, data) VALUES (${id}, ${date}, ${json})`.execute(db);
```
  - Type it with `(db as unknown as Kysely<MySchema>)`.
  - **UNVERIFIED:** whether EmDash's site export, transfer or backup copies foreign tables. A SQLite `VACUUM INTO` backup does.
  - `locals.emdash.db` also exists on authenticated or `/_emdash` requests (`get db()` in `src/astro/middleware.ts`). It is not set for anonymous visitors, so use `getDb()`.

## 6. Admin customisation
- **Collections:** `label`, `labelSingular`, `description`, `icon` (Phosphor name, at most 64 characters), `group` (sidebar folder), `sortOrder`, `hidden`, `admin.listColumns` (at most 4), `admin.quickCreate`, `titleField`, `dateField`.
- **Fields:** `label` only. There is **no field description, help text or placeholder**, and **no hidden fields**. Searched the `Field` type and the admin bundle: nothing renders one. Put help in the collection `description` or in labels.
- **Validation:** `required`, `min/max` (number, integer), `minLength/maxLength/pattern` (string, text), `minItems/maxItems`, `allowedMimeTypes`.
- **Select:** `validation.options: string[]`. The value is shown as the label, so use readable German values. **UNVERIFIED:** separate value/label pairs.
- **Plugin settings:** these do support `{value,label}` and `description`.
- **Admin language:** German `de` ships (36 locales). The language follows the browser, and a switcher exists. `admin.locales: ["en","de"]` limits which locales are bundled.
  - Our own field and collection labels show exactly as written in the seed. They are not translated.
  - Plugin setting labels are not translated either.
- **Branding:** `admin.logo/siteName/favicon/footerLabel`.
- **Hidden menu items:** `admin.hiddenNavItems` accepts `calendar, media, comments, menus, redirects, widgets, sections, bylines, import`.

## 7. i18n, SEO/sitemap, preview, pitfalls
- **i18n:** EmDash reads Astro's `i18n {defaultLocale, locales, fallback}`.
  - Never set `prefixDefaultLocale: true` or `"prefix-always"`: either breaks the admin.
  - Each translation is its own row (`translation_group`). Use `translatable: false` for prices and flags.
  - Use `getEmDashEntry(.., {locale})` and `getTranslations`.
  - For a German-only site, skip `i18n` and set seed `"defaultLocale": "de"`.
- **SEO:** a collection with `supports: ["seo"]` and `routable` gets an SEO panel and is listed in `/sitemap.xml` and `/sitemap-{collection}.xml`.
  - `/robots.txt` is auto-generated. A `src/pages/robots.txt` overrides it.
  - Render `<EmDashHead/>`.
  - `settings.staging` adds noindex until the site goes live.
- **Preview:** collection `supports: ["preview"]`. The `?_preview=<HMAC token>` parameter is verified by the middleware, and `getEmDashEntry` then returns the draft with `isPreview: true`. `getPreviewUrl({..., secret})` creates such links.
- **Pitfalls** (docs plus Alture's be-agency build on 1.4.0):
  - **Paths and URLs:** never set `trailingSlash: "always"`. Set `EMDASH_SITE_URL` at build and run time; without it you get `SITE_URL_REQUIRED` and wrong srcset/canonical URLs. Add the domain to `security.allowedDomains` or `Image` will not resize.
  - **Data location:** a Hostinger build wipes the app folder, so keep the DB and uploads in an absolute `DATA_DIR` outside it.
  - **First run:** setup is open to anyone until it is completed.
  - **Seed:** the seed is applied only to an empty database.
  - **Images:** CMS images are objects; render them with `Image`.
  - **Portable Text:** do not round-trip it through `emdash/client`; that loses image sizes.
  - **Node 22:** prints the "SQLite is experimental" warning. It is harmless.
  - **Processes:** PM2 cluster mode leads to single-editor mode.
  - **Releases:** `npx emdash migrate --check` after a deploy.
  - **Logins:** editors log in again after a redeploy.
