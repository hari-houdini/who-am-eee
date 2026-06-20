# Project Guidelines

> These rules apply to every file in this repository. All agents and contributors
> must follow them exactly. No exceptions without an explicit comment explaining why.

---

## Runtime & Tooling

Use **Bun** exclusively. Never use Node.js, npm, yarn, pnpm, npx, jest, vitest,
webpack, vite, or esbuild.

| Task | Command |
|------|---------|
| Run dev server | `bun --hot run index.ts` |
| Build | `bun run build.config.ts` |
| Test | `bun test` |
| Install deps | `bun install` |
| Execute script | `bunx <package> <cmd>` |
| Run a file | `bun <file>` |

Bun APIs to use instead of third-party equivalents:

- `Bun.serve()` — HTTP server (no express)
- `bun:sqlite` — SQLite (no better-sqlite3)
- `Bun.redis` — Redis (no ioredis)
- `Bun.sql` — Postgres (no pg)
- `Bun.file` — file I/O (no fs.readFile/writeFile)
- `WebSocket` built-in (no ws)
- `` Bun.$`cmd` `` — shell commands (no execa)
- Bun auto-loads `.env` — never use dotenv

---

## File Naming Convention

Format: `<domain>.<subtype?>.<type>.<extension>`

| Type suffix | Purpose | Example |
|-------------|---------|---------|
| `.element.ts` | Web component class + registration | `hyper.element.ts` |
| `.template.html` | Shadow DOM HTML template | `hyper.template.html` |
| `.module.css` | Shadow DOM scoped styles | `hyper.module.css` |
| `.types.ts` | TypeScript interfaces and type aliases | `hyper.types.ts` |
| `.const.ts` | Constants and configuration data | `hyper.const.ts` |
| `.animation.ts` | RAF animation logic | `hyper.animation.ts` |
| `.service.ts` | Server-side service or API client | `spotify.service.ts` |
| `.plugin.ts` | Bun build plugin | `html-placeholder-replace.plugin.ts` |
| `.worker.ts` | Web Worker | `worker.ts` |
| `.test.ts` | Tests (co-located with source file) | `hyper.animation.test.ts` |
| `.config.ts` | Build or tool configuration | `build.config.ts` |

Global (cross-domain) files use `global.<type>.<extension>`:
- `global.css`, `global.const.ts`, `global.d.ts`

**No other naming patterns are permitted.** No `index.ts` barrel files anywhere in `src/`.

---

## Architecture & Dependency Layers

```
Layer 0  src/shared/types/    TypeScript interfaces. Zero imports from src/.
Layer 1  src/shared/const/    Global constants. Imports: Layer 0 only.
Layer 2  src/shared/utils/    Pure utility functions. Imports: Layers 0–1.
Layer 3  src/components/      Web components. Imports: Layers 0–2 (shared only).
Layer 4  src/services/        Server-side services. Imports: Layers 0–2.
Layer 5  index.ts             Bun server (outermost). Imports: all layers.
```

Page HTML files (`index.html`, `blog/index.html`, etc.) reference component scripts
via `<script type="module">` and are entry points, not a source layer.

**Rules:**

- Dependencies flow inward only — outer layers import inner layers, never the reverse.
- Components never import from other components.
- Services never import from components or pages.
- No circular dependencies.
- No barrel files (`index.ts` re-exports) anywhere in `src/`.
- Shared logic between two components must be extracted to `src/shared/utils/`.

**Within a component folder, intra-domain import order:**

```
<name>.types.ts → <name>.const.ts → <name>.[logic].ts → <name>.element.ts
```

---

## TypeScript

### Compiler flags

All of the following must be enabled in `tsconfig.json`:

- `strict: true`
- `noUncheckedIndexedAccess: true` — `arr[i]` returns `T | undefined`
- `noImplicitOverride: true` — HTMLElement lifecycle methods must use `override`
- `exactOptionalPropertyTypes: true` — `{ x?: T }` ≠ `{ x: T | undefined }`
- `noPropertyAccessFromIndexSignature: true`
- `forceConsistentCasingInFileNames: true`
- `noFallthroughCasesInSwitch: true`

### Style rules

- Prefer `type` over `interface` for object shapes unless declaration merging is needed.
- Use `import type` for type-only imports.
- Never mix value and type exports in one statement (`export { Foo, type Bar }` — split them).
- Never use `any`. Never use `@ts-ignore` without a comment explaining why.
- Use `as const` for literal constant objects.
- `override` keyword is mandatory on all HTMLElement lifecycle method implementations
  (`connectedCallback`, `disconnectedCallback`, `adoptedCallback`, `attributeChangedCallback`).
- Prefer `unknown` over `any` when the type is genuinely unknown.
- Use `satisfies` to validate object literals against a type without widening.

---

## Web Components

### Structure

Every component lives in `src/components/<name>/` and contains exactly:

```
<name>.types.ts       Domain-specific types (optional if using shared types only)
<name>.const.ts       Domain constants (optional)
<name>.template.html  Shadow DOM HTML template
<name>.module.css     Shadow DOM scoped styles
<name>.element.ts     Web component class and customElements.define()
```

### Shadow DOM

- Always attach shadow DOM with `mode: 'open'`.
- Inject styles via `adoptedStyleSheets` using the `CSSStyleSheet` API.
- Safari 14 does not support `adoptedStyleSheets` — fall back to a `<style>` element:

```typescript
if (shadowRoot.adoptedStyleSheets !== undefined) {
  shadowRoot.adoptedStyleSheets = [sheet];
} else {
  const style = document.createElement('style');
  style.textContent = cssText;
  shadowRoot.appendChild(style);
}
```

- Import template and CSS as text: `import x from './x.html' with { type: 'text' }`.
- Clone template content into shadow root: `template.content.cloneNode(true)`.

### Lifecycle methods

All four lifecycle callbacks must be present and use the `override` keyword:

```typescript
override connectedCallback(): void { ... }
override disconnectedCallback(): void { ... }
override adoptedCallback(): void { ... }
override attributeChangedCallback(
  name: string,
  oldValue: string | null,
  newValue: string | null,
): void { ... }
```

### Slots

Use `<slot>` for any content a parent consumer is expected to supply or override.

**Use slots when:**

- The component is a layout shell (card, dialog, page section wrapper).
- The component renders content that varies per usage site.
- Different consumers need different content in the same structural region.

**Do NOT use slots when:**

- All content is derived from internal JS constants or computed data.
- The component is fully self-contained with no consumer-facing content regions.

Named slot convention: `<slot name="<component>-<region>">` (e.g. `<slot name="card-header">`).
Always provide fallback content inside every named slot.

### DOM construction

**`innerHTML` is banned.** Never assign to `element.innerHTML` or call `insertAdjacentHTML`.

All dynamic DOM must be built via DOM APIs:

```typescript
const el = document.createElement('div');
el.textContent = data.title;
el.setAttribute('data-id', data.id);
el.classList.add('card', 'card--m');
parent.appendChild(el);
```

For repeated element creation, write a typed factory function:

```typescript
function createCard(data: Card): HTMLDivElement { ... }
```

### Custom element naming

Format: `<domain>-<name>` (e.g. `hyper-space`, `blog-card`).
Always kebab-case, always two parts minimum.

---

## CSS

### Layer stack

All global CSS (`global.css`) must declare and use `@layer` in this order:

```css
@layer reset, base, layout, components, utilities, overrides;
```

- `reset` — box-sizing, margin/padding zero, etc.
- `base` — body, typography, `:root` custom properties
- `layout` — page-level structural classes
- `components` — global component styles (avoid; prefer Shadow DOM)
- `utilities` — single-purpose helpers (`.visually-hidden`, `.sr-only`)
- `overrides` — `prefers-reduced-motion`, print styles, last-resort specificity fixes

Shadow DOM CSS (`*.module.css`) does **not** use `@layer` — Shadow DOM is already scoped.

### BEM (Block Element Modifier)

Strict BEM is enforced everywhere, with no exceptions.

```
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

Rules:

- Block name matches the component's semantic purpose (`.card`, `.viewport`, `.nav`).
- Never nest deeper than one element level (`.card__header`, never `.card__header__title`).
- Modifiers describe state or variant (`.card--active`, `.card--large`), never appearance (`.card--red`).
- No plain element selectors (`div {}`, `h2 {}`) inside Shadow DOM CSS.
- No ID selectors in CSS.
- No utility classes inside Shadow DOM (`.flex`, `.mt-4`); all styling is BEM-scoped.

### CSS custom properties

All design tokens live in `:root` in `global.css`. Shadow DOM inherits them.
Never hard-code color, spacing, or font values outside of `:root` definitions.

### 60fps & rendering performance

- **Compositor-only properties** in all animation: `transform` and `opacity` only.
  Never animate `top`, `left`, `width`, `height`, `margin`, `padding`, or `color` in `requestAnimationFrame`.
- **Read-then-write** in every RAF callback: all DOM reads must complete before any writes
  in the same frame. Never interleave `getBoundingClientRect()` and `element.style.*` inside a loop.
- Apply `will-change: transform` only immediately before an animation begins; remove it when done.
- Use `backface-visibility: hidden` and `transform: translateZ(0)` to promote composited layers
  only when genuinely needed.
- Avoid `backdrop-filter` on more than 2–3 elements simultaneously.

### Browser-safe features (Chrome 90+, Firefox 90+, Safari 14+)

Allowed without guard:

- CSS custom properties, `clamp()`, `min()`, `max()`
- `aspect-ratio`, CSS Grid, Flexbox
- `ResizeObserver`, `IntersectionObserver`
- ES modules, Web Workers

Requires `@supports` guard or progressive enhancement:

| Feature | Available from | Approach |
|---------|---------------|----------|
| CSS `@layer` | Chrome 99, FF 97, Safari 15.4 | `@supports` guard |
| `adoptedStyleSheets` | Chrome 73, FF 101, Safari 16.4 | `<style>` fallback for Safari 14 |
| `:has()` | Chrome 105, FF 121, Safari 15.4 | `@supports selector(:has(*))` |
| View Transitions API | Chrome 111, FF 131, Safari 18 | JS progressive enhancement only |
| Declarative Shadow DOM | Not universal | Avoid — use imperative `attachShadow()` |
| Container queries | Chrome 105, FF 110, Safari 16 | `@supports` guard |

---

## Security

### DOM construction

`innerHTML` is banned (see Web Components section). This is the primary XSS defense.

Also banned:

- `document.write()`
- `eval()`, `new Function()`
- `setTimeout(string)` / `setInterval(string)`
- `insertAdjacentHTML()`

### Server security headers

Every `Bun.serve()` response must include these headers.
Define them once and spread into every `Response`:

```typescript
/** Applied to every server response. Remove upgrade-insecure-requests in local dev. */
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self'; " +
    "media-src 'none'; " +
    "object-src 'none'; " +
    "frame-src 'none'; " +
    "worker-src 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'accelerometer=(), gyroscope=(), magnetometer=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-site',
};
```

### Input validation

All data entering the server from external sources (URL params, request body, query strings)
must be validated and sanitized before use. Never pass external strings directly to SQL,
file paths, or DOM construction.

### External packages (approved list)

Adding any new package requires all of the following:

1. No Bun built-in equivalent exists.
2. Package is actively maintained (commit within 6 months).
3. Gzipped size < 50 KB.
4. Zero transitive dependencies, or each is explicitly audited.
5. Decision documented in this approved list.

**Currently approved:**

- `lenis@^1.3.23` — smooth scroll with lerp control (no native CSS equivalent)
- `figlet@^1.11.0` — ASCII art for the server-side terminal API

Self-host all CDN-linked CSS/fonts where feasible to avoid loosening the CSP.

---

## Performance Budget

| Metric | Limit |
|--------|-------|
| JS bundle per page (gzipped) | ≤ 150 KB |
| CSS per page (gzipped) | ≤ 30 KB |
| Initial DOM node count | ≤ 1 500 |
| RAF callback duration | ≤ 8 ms |
| Web font families | ≤ 2 |
| Image file size | ≤ 500 KB each; WebP/AVIF format; lazy-loaded |
| Largest Contentful Paint | ≤ 2.5 s |
| Cumulative Layout Shift | ≤ 0.1 |

Animation rules:

- Only `transform` and `opacity` in RAF loops.
- No layout reads (`offsetWidth`, `scrollTop`, `getBoundingClientRect`) inside the RAF write phase.
- `will-change` is transient — set before animation starts, removed when it ends.
- Background particles: max 200 per scene.

---

## Accessibility (WCAG 2.2 AA)

- Every interactive element is keyboard-reachable with a visible focus indicator.
- All images have meaningful `alt` text. Decorative images use `alt=""`.
- Color is never the sole means of conveying information.
- Contrast ratios: 4.5:1 for body text, 3:1 for large text and UI components.
- Custom interactive web components must implement appropriate ARIA roles and states.
- Dynamically rendered content uses `aria-live` regions where appropriate.
- Navigation landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`) on every page.
- Skip-navigation link is the first focusable element on every page.
- Never use `tabindex` > 0.
- Wrap all non-trivial animations in `@media (prefers-reduced-motion: reduce)` with a no-motion fallback.

---

## Documentation (JSDoc)

Every symbol — function, class, method, property, type alias, interface, constant —
must have a JSDoc comment. No exceptions.

```typescript
/**
 * Computes the camera Z position from the current scroll offset.
 *
 * @param scroll - Raw scroll value in pixels.
 * @param camSpeed - Multiplier from {@link SpaceConfig.camSpeed}.
 * @returns Camera Z position in 3D space units.
 */
function computeCameraZ(scroll: number, camSpeed: number): number {
  return scroll * camSpeed;
}
```

Rules:

- Use `@param`, `@returns`, `@throws` where applicable.
- Use `{@link TargetName}` for cross-references.
- Web component classes use `@customElement` with the element name.
- Types and interfaces use `@remarks` for non-obvious constraints.
- `@internal` for symbols intentionally private but not yet using `#` private fields.
- Document the WHY and non-obvious constraints — never restate what the name already says.

---

## Testing

Use `bun test` exclusively. Test files are co-located: `<name>.test.ts` next to the source file.

### Unit tests

Test every exported function in `*.animation.ts`, `*.const.ts`, `*.utils.ts` files.

```typescript
import { describe, expect, test } from 'bun:test';
import { computeCameraZ } from './hyper.animation';

describe('computeCameraZ', () => {
  test('returns 0 at scroll 0', () => {
    expect(computeCameraZ(0, 2.5)).toBe(0);
  });
});
```

### Component tests

Test web component lifecycle and attribute behavior:

- `connectedCallback` produces the expected shadow DOM structure.
- `attributeChangedCallback` reacts correctly to observed attribute changes.
- `disconnectedCallback` cleans up event listeners and RAF loops.

Component tests must not rely on visual rendering — test structure and state, not pixels.

### Coverage requirements

- All exported functions: 100% branch coverage.
- Web component lifecycle methods: one test per callback.
- No snapshot tests.

---

## MPA Navigation

All cross-page links use standard `<a href="...">` elements as the accessible and SEO baseline.

Enhance with the **View Transitions API** as progressive enhancement:

```typescript
document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
  link.addEventListener('click', async (e: MouseEvent) => {
    const target = e.currentTarget as HTMLAnchorElement;
    if (target.origin !== location.origin) return;
    if (!document.startViewTransition) return; // fallback: standard navigation
    e.preventDefault();
    document.startViewTransition(async () => {
      const response = await fetch(target.href);
      const html = await response.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');
      document.head.replaceChildren(...Array.from(newDoc.head.childNodes));
      document.body.replaceChildren(...Array.from(newDoc.body.childNodes));
      history.pushState({}, '', target.href);
    });
  });
});
```

- Browsers without `startViewTransition` (FF < 131, Safari < 18) fall back to normal navigation.
- Transitioning elements use the `view-transition-name` CSS property.
- Wrap transition CSS in `@media (prefers-reduced-motion: no-preference)`.

---

## Bun Server Pattern

```typescript
// index.ts — canonical structure
import indexPage from './index.html';

const server = Bun.serve({
  port: Bun.env.PORT ? Number(Bun.env.PORT) : 3000,
  routes: {
    '/': indexPage,
    '/api/example': {
      GET: () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS },
        }),
    },
  },
  development: Bun.env.NODE_ENV !== 'production'
    ? { hmr: true, console: true }
    : undefined,
});
```

- Import HTML pages as modules (`import page from './page.html'`).
- Every `Response` must include `SECURITY_HEADERS`.
- Use `Bun.env` (not `process.env`) for environment variable access.
- Never log secrets or tokens.

---

## Quick Reference: What NOT to Do

| Banned | Use instead |
|--------|-------------|
| `innerHTML =` | `createElement` + `textContent` / `setAttribute` |
| `insertAdjacentHTML()` | DOM APIs |
| `document.write()` | — (forbidden) |
| `eval()` / `new Function()` | — (forbidden) |
| Barrel files (`index.ts`) | Direct file imports |
| `any` type | `unknown` + type narrowing |
| Cross-component imports | Extract to `src/shared/utils/` |
| CDN CSS `<link>` in HTML | Self-host via Bun |
| `npm` / `yarn` / `pnpm` | `bun` |
| Express / Fastify | `Bun.serve()` |
| Inline `<style>` in HTML | `adoptedStyleSheets` or `*.module.css` |
| TypeScript decorators | Plain class methods |
| Default exports from utility files | Named exports |
| Nested BEM (`.a__b__c`) | Max one level deep (`.a__b`) |
| Animating layout properties | `transform` + `opacity` only |
| `tabindex` > 0 | Correct DOM order |
