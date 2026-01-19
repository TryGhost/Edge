# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a photography portfolio website built on the **Ghost Edge theme** - Ghost's official photography-focused theme. The goal is to create book-like horizontal gallery experiences for showcasing photography work.

## Build Commands

```bash
# Install dependencies
yarn

# Development: build + watch for changes + livereload
yarn dev

# Run theme validation (gscan)
yarn test

# Package theme into dist/edge.zip for upload to Ghost
yarn zip
```

## Architecture

For all Ghost handlebar or architecture, refer to the full documentation: https://docs.ghost.org/llms.txt
Best practices for modern photography web portfolios are detailed in @docs/web-portfolio-best-practices.md

### Ghost Theming Fundamentals

- **Handlebars templating** - Templates use `.hbs` extension with Ghost's Handlebars helpers
- **Ghost's `{{content}}` renders galleries as monolithic HTML** - Cannot restructure individual gallery images via Handlebars; must use CSS/JS enhancement
- **Image handling via `{{img_url}}`** - Requires a `size` parameter when using `format` for WebP/AVIF conversion

### File Structure

```
├── default.hbs          # Base layout (includes header, footer, PhotoSwipe container)
├── index.hbs            # Homepage with masonry grid feed
├── post.hbs             # Individual post/project pages
├── page.hbs             # Static pages
├── partials/
│   ├── loop.hbs         # Post card in feed (srcset, lightbox trigger, caption)
│   ├── feature-image.hbs
│   ├── pswp.hbs         # PhotoSwipe v4 DOM structure
│   └── icons/           # SVG icon partials
├── assets/
│   ├── css/screen.css   # CSS entry point (imports all partials)
│   ├── js/main.js       # Masonry initialization + PhotoSwipe setup
│   └── built/           # Compiled CSS/JS output (gitignored)
```

### CSS Architecture

Entry point is `assets/css/screen.css` which imports:
1. `@tryghost/shared-theme-assets` - Ghost's base styles
2. Theme-specific modules in `assets/css/` subdirectories

PostCSS compiles to `assets/built/screen.css` with autoprefixer and cssnano.

### JavaScript

- **jQuery** loaded from CDN
- **Masonry.js** for responsive grid layout on index
- **PhotoSwipe v4** (legacy) for lightbox functionality
- **imagesLoaded** and **pagination** from `@tryghost/shared-theme-assets`

Main JS initializes masonry grid and configures PhotoSwipe with dynamic image dimension loading.

### Image Sizes (package.json)

```
xs: 150w | s: 300w | m: 750w | l: 1140w | xl: 1920w
```

For LQIP/blur-up, consider adding `xxs: 30w`.

## Key Ghost Concepts

### Custom Settings

Exposed in Ghost Admin via `package.json` → `config.custom`:
- `navigation_layout`: Logo position options
- `title_font` / `body_font`: Serif vs sans-serif
- `show_related_posts` / `related_posts_title`

Access in templates via `@custom.setting_name`.

### Custom Templates

Create `custom-{name}.hbs` files to add page template options in Ghost Admin.

### Routes Configuration

Use `routes.yaml` for portfolio category collections:
```yaml
collections:
  /landscape/:
    filter: primary_tag:landscape
```

## Content Creation Strategy

For photography portfolios where **image sequencing is critical**, how you add images in the Ghost editor matters.

### Image Cards vs Gallery Cards

| Approach | Control | Best For |
|----------|---------|----------|
| **Image cards** (one per image) | Full sequencing control | Portfolio projects, curated sequences |
| **Gallery cards** (batch upload) | Ghost decides layout | Behind-the-scenes, contact sheets |

### Recommended: Use Image Cards for Portfolios

Add images one at a time using the Image card (`/image` in editor). This gives you:

- **Exact sequencing** - images appear in the order you place them
- **Per-image captions** - each image can have its own caption/alt text
- **Simpler CSS transformation** - each image is a separate `<figure>` element
- **No layout surprises** - Ghost won't rearrange images based on aspect ratios

**Trade-off**: More clicks in the editor, but full control over the viewing experience.

### When to Use Gallery Cards

Gallery cards are fine for:
- Supplementary image grids where order doesn't matter
- Quick "proof sheet" style displays
- Behind-the-scenes or process documentation

**Limitation**: Ghost automatically arranges gallery images into rows based on aspect ratios. You cannot control which images appear on which row.

### HTML Output Reference

**Image card** produces:
```html
<figure class="kg-card kg-image-card">
  <img src="..." alt="..." width="..." height="..." loading="lazy">
  <figcaption>Optional caption</figcaption>
</figure>
```

**Gallery card** produces:
```html
<figure class="kg-card kg-gallery-card">
  <div class="kg-gallery-container">
    <div class="kg-gallery-row">
      <div class="kg-gallery-image"><img ...></div>
      <!-- Ghost decides grouping -->
    </div>
  </div>
</figure>
```

## Photography Portfolio Enhancement Patterns

### Transforming Content to Horizontal Scroll

Two approaches depending on whether you used Image cards or Gallery cards:

**For consecutive Image cards** (recommended approach):
```css
/* Wrap post content in horizontal scroll container */
.gh-content {
    display: flex;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
}
.kg-image-card {
    flex: 0 0 100vw;
    scroll-snap-align: center;
}
.kg-image-card img {
    width: 100%;
    height: 100vh;
    object-fit: contain;
}
```

**For Gallery cards** (if you must use them):
```css
.kg-gallery-container {
    display: flex;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
}
.kg-gallery-row { display: contents; }
.kg-gallery-image {
    flex: 0 0 100%;
    scroll-snap-align: center;
}
```

### PhotoSwipe v5 Integration

Current theme uses PhotoSwipe v4. For v5 upgrade, Ghost gallery images lack anchor wrappers - use `dataSource` initialization pattern:
```javascript
const lightbox = new PhotoSwipeLightbox({
    dataSource: images.map(el => ({
        src: el.getAttribute('src'),
        width: el.getAttribute('width'),
        height: el.getAttribute('height')
    })),
    pswpModule: PhotoSwipe
});
```

### Responsive Images with Modern Formats

```handlebars
<picture>
  <source type="image/avif"
    srcset="{{img_url feature_image size="s" format="avif"}} 300w,
            {{img_url feature_image size="l" format="avif"}} 1140w">
  <source type="image/webp"
    srcset="{{img_url feature_image size="s" format="webp"}} 300w,
            {{img_url feature_image size="l" format="webp"}} 1140w">
  <img src="{{img_url feature_image size="l"}}" ...>
</picture>
```

## Performance Notes

- Never lazy-load LCP (first visible) images
- Use `fetchpriority="high"` on hero images
- Ghost auto-adds `loading="lazy"`, `width`, `height` to gallery images
- Exclude unused card assets in `package.json`:
  ```json
  "card_assets": { "exclude": ["audio", "bookmark", "nft", "product", "video"] }
  ```