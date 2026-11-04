# Brief 08: Ad Gallery Section

## Goal
Add the first section **below** the PG Page: a "gallery wall" where ads hang as framed pictures. The user reaches it by scrolling down the page normally.

This is also the first of several stacked sections, so the main job of this brief is to set up a **page stack** that later sections can join without changing what's already built.

## Read first
- [00-README.md](00-README.md). The ground rules apply. OQ-9 to OQ-13 below are settled for this brief except OQ-10's real ad source and OQ-12.
- [03-ui-primitives.md](03-ui-primitives.md) and [`src/styles/tokens.css`](../../src/styles/tokens.css)
- [Mockup: ad gallery](../mockups/ad-gallery-desktop-v1.png). The top of the image is the bottom of the PG Page, which already exists. The pink "Productivity / Social" card at the bottom is the **next** section. Don't build it.

## What the mockup shows (top to bottom)
1. The end of the yellow PG Page, then a thin **white gap**.
2. A **teal band**, roughly 120px tall at 1440px.
3. The **gallery wall**: a light-grey field (the same grey as the timeline panel) holding three framed ads.
4. Another **teal band** of the same height.
5. A white gap, then the next section (out of scope).

The **frames**:
- Each one is a thick olive-brown border, about 5% of the frame's width, around the ad image. There's no mat and no rounded corners.
- The frames are **different sizes and aspect ratios**: a wide landscape piece on the left, a portrait piece in the middle, and a portrait piece on the right.
- They hang **staggered**, salon style. The right frame hangs highest, the left is in the middle, and the middle frame hangs lowest. Spacing between them is uneven: the left two sit close together and the right one has more air.
- The middle frame has a small **caption above it** ("Join us at LACMA") in a small serif. Treat this as the advertiser's tagline. It's optional per ad.

The bright-blue outline around the grey wall is Figma's selection highlight, not part of the design. **Don't build it** (OQ-9, confirmed).

The teal bands belong to the gallery. They work like a ceiling and a floor around the wall, and other sections won't have them (OQ-13, confirmed).

## Architecture

### 1. Page stack (`src/features/page-stack/`)
- `PageStack.tsx` renders the page's sections in order. For now that's `[PGPageSection, AdGallerySection]`. A later section is added by appending one entry.
- Only one `<main>` landmark is allowed. Today `PGPageView` renders `<main>`, so change it to render a `<section aria-labelledby=…>`, and put the `<main>` in `PageStack`.
- Each section is **full-bleed**: it paints its own background edge to edge and centers its content in `max-w-page`. Right now the yellow comes from `body` in `global.css`. Move it onto the PG Page section and give `body` a neutral surface token (`--color-surface-base`, white). That reproduces the white gaps between sections in the mockup.
- `App.tsx` renders `<PageStack />`. The `?primitives` dev route stays as it is.
- Use plain document scroll. Don't add scroll snapping, parallax, or a scroll library. Smooth scrolling must respect `usePrefersReducedMotion`.

### 2. Domain and data
- In `src/domain/types.ts`, add an `Ad` type:
  ```ts
  type Ad = {
    id: string
    advertiser: string        // used in the accessible name
    image: { src: string; alt: string; width: number; height: number } // intrinsic size, so layout never shifts
    caption?: string          // e.g. "Join us at LACMA"
    href: string              // click-through
  }
  ```
- Add `src/data/mock/ads.ts` with a **pool of about 8 mock ads** in a mix of shapes: several around 5:4 landscape, several around 4:5 portrait, and one square. About half should have a caption.
- **Rotation (OQ-10):** each page load shows **3 ads picked at random** from the pool, with no ad appearing twice.
  - Write the selection as a pure function in `src/domain/ads.ts`: `pickAds(pool, count, random = Math.random)`. Passing in the random source lets tests be deterministic. Test it in `ads.test.ts`: no duplicates, returns `min(count, pool.length)` ads, and is stable for a fixed seed.
  - Pick **once**, when the store is created. Then the same three ads stay on screen through re-renders and through toggling goals, and change only on a reload. Don't use `useMemo` in the component for this.
  - The 3 is a named constant (`GALLERY_AD_COUNT`), not a magic number.
- Expose the picked ads through the store with a selector, for example `useGalleryAds()`, the same way the other mock data is exposed. Don't fetch them in the component.
- **Images:** the project owner is supplying the placeholder ad images in `public/ads/`. Use those files. Read each image's real pixel size to fill in `width` and `height`, and write alt text that describes what the image actually shows. If any are missing when you start, make simple abstract SVGs in their place. Don't copy the paintings from the mockup, because they're third-party artwork.

### 3. UI primitive (`src/ui/PictureFrame.tsx`)
- `PictureFrame` takes `children` and an optional `caption` slot, and has no knowledge of ads.
- It draws the border with a frame token. The border thickness scales with the frame width using a `--frame-border` component token based on `cqi` or a percentage. Don't hard-code px values.
- It reserves the image's aspect ratio so nothing shifts while images load.
- Add it to `src/ui/index.ts` and to the `?primitives` preview.

### 4. Section (`src/features/ad-gallery/`)
- `AdGallerySection.tsx` renders the teal band, the wall, and the teal band, and maps ads into a `GalleryWall`.
- `GalleryWall.tsx` owns the **salon layout**. Define it as data, an array of slots like `{ widthFr, offsetY }`, kept in `layout.ts` next to the component the same way the timeline keeps its geometry. Tune the slots against the mockup at 1440px.
  - Each slot sets a frame's **width** and **vertical offset**. The frame's height comes from the ad's own image shape. Because rotation can put a portrait ad where the mockup has a landscape one, every combination of shapes has to look intentional. Check it in the `?primitives` preview, or a dev-only `?gallery` route, with all-landscape, all-portrait, and mixed sets.
  - With the mockup's shapes (landscape, portrait, portrait), it must match the mockup.
  - With fewer than three ads, for example when the pool is too small, center the ads that exist. That isn't in the mockup, but it shouldn't break.
- Each ad is a link (`<a href target="_blank" rel="sponsored noopener noreferrer">`) wrapping the framed image.
  - Accessible name: "Advertisement: {advertiser}" plus the caption if there is one.
  - Hover and focus use the shared `interactive` utility. On hover, a subtle lift (a small translate and shadow) is fine as long as reduced motion turns it off.
- Disclosure: put a **visually-hidden** heading "Sponsored" on the section, and nothing visible, so the page matches the mockup (OQ-11, confirmed). The accessible names above carry the disclosure for each ad.
- Images use `loading="lazy"` and `decoding="async"` and get explicit `width` and `height`. The section sits below the fold, so it must not affect the PG Page's load or Lighthouse score.

### 5. Tokens (in `tokens.css`, using the existing three tiers)
- Primitives: `--palette-teal-500` (about `#00c4bc`), `--palette-olive-700` (about `#7a6a3a`), and `--palette-white`, which already exists. Reuse `--palette-grey-300` for the wall.
- Semantic: `--color-surface-base`, `--color-surface-gallery-trim` (the teal), `--color-surface-gallery-wall`, `--color-frame`, and `--color-text-caption`.
- Font: `--font-caption`, a serif fallback stack, flagged with `TODO(OQ-12)`.
- Tokens only. All colors are eyeballed, so mark them with `TODO(OQ-8)` the same way the existing ones are marked.

## Out of scope
- Real ad serving, rotation weighting or fairness, remembering what a viewer saw last time, targeting, impression or click tracking, and consent. Leave one `// PLACEHOLDER(08)` where an impression hook would go, for example an `onVisible` prop that does nothing yet.
- The next section (the pink "Productivity / Social" card).
- Mobile layouts (ground rule 2). At 1024px the frames may scale down, but they must not overlap.

## Files owned
- `src/features/page-stack/*`, `src/features/ad-gallery/*`, `src/ui/PictureFrame.tsx`, `src/domain/ads.ts` (+ test), `src/data/mock/ads.ts`, and `public/ads/*`.
- Edits allowed: `src/domain/types.ts` (the `Ad` type), the store (the ads slice), `PGPageView.tsx` (`<main>` to `<section>`, plus its own background), `App.tsx`, `tokens.css`, `global.css` (the body background), `src/ui/index.ts`, and `src/dev/PrimitivesPreview.tsx`.

## Acceptance criteria
- [ ] Scrolling past the PG Page shows the white gap, teal band, gallery wall, and teal band. With the mockup's shapes (landscape, portrait, portrait), a side-by-side check against the mockup at 1440px shows matching proportions, stagger, frame thickness, and caption position.
- [ ] Reloading shows a different set of 3 ads (across a few reloads). Within one load, the set never changes, even after toggling goals or using Check All.
- [ ] All-landscape, all-portrait, and mixed sets each look balanced on the wall, with no overlaps or clipping at 1440px or 1024px.
- [ ] The PG Page looks identical to before. Compare screenshots taken before and after. The yellow now comes from the section, not from `body`.
- [ ] Exactly one `<main>`. Each section is a labelled `<section>`.
- [ ] Ads are keyboard-reachable in visual order, come after the PG Page in the tab order, and have accessible names like "Advertisement: …". axe reports no serious or critical issues.
- [ ] Opening an ad opens a new tab with `rel` containing `sponsored`.
- [ ] No layout shift while images load (CLS stays 0 for the section). Lighthouse desktop performance is still ≥ 90.
- [ ] Unit tests cover `pickAds`. RTL tests cover: rendering 1, 2, and 3 ads; accessible names; the caption showing only when it's set; and `PageStack` rendering sections in order.
- [ ] Tokens only. The hex grep from brief 07 is still clean. No new dependencies.
- [ ] `npm run build`, `npm run lint`, and `npm run test` pass.

## Open questions (add to 00-README)
| ID | Question | Status |
|---|---|---|
| OQ-9 | Is the blue outline around the gallery wall a design element, or the Figma selection highlight? | **Resolved:** selection highlight. Not built. |
| OQ-10 | Where do ads come from? How many show at once, and do they rotate between visits? | **Partly resolved:** 3 per load, picked at random from a mock pool. The real ad source is still open. |
| OQ-11 | Does the section need a visible "Sponsored" or "Advertisement" label for disclosure? | **Resolved:** visually-hidden label only. |
| OQ-12 | The caption font: is the small serif in the mockup deliberate, or does each advertiser choose it? | Open. Fallback serif token. |
| OQ-13 | Are the teal bands part of the gallery, like a ceiling and floor, or a divider shared by every section? | **Resolved:** part of the gallery only. |
