# Building book-like photography portfolios for the web

Modern web technologies have fundamentally transformed what's achievable for photography presentation, making professional-quality "book-like" portfolios accessible to hobbyist coders with the right techniques. **CSS scroll-snap now provides native, hardware-accelerated horizontal gallery navigation** without JavaScript, while modern image formats like AVIF deliver **50% smaller files than JPEG** with superior quality. The key architectural decision is whether to prioritize the contemplative, deliberate pacing of horizontal navigation (ideal for curated portfolios) or the familiar vertical scrolling users expect. This report provides a complete technical blueprint for implementing either approach, with specific attention to performance optimization for high-resolution photography.

## Native lazy loading has replaced JavaScript for most use cases

Browser support for native lazy loading via `loading="lazy"` reached **universal modern browser coverage** in 2024, fundamentally changing the lazy loading landscape. The attribute triggers loading when images approach the viewport—Chrome uses approximately **1,250px on 4G and 2,500px on 3G connections** as threshold distances. Implementation requires only adding the attribute alongside explicit dimensions:

```html
<img src="photo.jpg" loading="lazy" alt="Description" width="800" height="600">
```

The critical exception: **never lazy-load LCP (Largest Contentful Paint) images**—typically the hero or first visible image. Instead, use `fetchpriority="high"` on these elements, which gained broad support in 2024-2025 (Chrome 102+, Safari 17.2+, Firefox 132+) and delivers **4-20% LCP improvements** in real-world testing.

JavaScript-based lazy loading via Intersection Observer remains valuable when you need custom threshold distances, loading animations, or must support legacy browsers. The pattern uses `rootMargin` to control when loading begins:

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
}, { rootMargin: '200px 0px' });
```

Libraries like **lazysizes (~3.4KB)** and **vanilla-lazyload (~2.5KB)** add responsive image support and automatic native fallback, though for new projects, native loading covers most needs.

## Responsive images require three coordinated techniques

The responsive image system uses `srcset` for resolution switching, `sizes` to communicate layout intent, and `<picture>` for format selection and art direction. For photography portfolios serving high-resolution images, the recommended breakpoints are **640, 1024, 1600, and 2400 pixels**, with 2560px as the practical maximum (larger provides diminishing returns).

The format fallback chain should prioritize **AVIF → WebP → JPEG**. AVIF achieves roughly **50% smaller files than JPEG and 20% smaller than WebP**, with full Baseline 2024 browser support (Chrome 85+, Firefox 93+, Safari 16+). JPEG XL shows promise but remains Safari-only until Chromium ships pending support:

```html
<picture>
  <source type="image/avif" srcset="photo-800.avif 800w, photo-1600.avif 1600w, photo-2400.avif 2400w" sizes="100vw">
  <source type="image/webp" srcset="photo-800.webp 800w, photo-1600.webp 1600w, photo-2400.webp 2400w" sizes="100vw">
  <img src="photo-1600.jpg" srcset="photo-800.jpg 800w, photo-1600.jpg 1600w, photo-2400.jpg 2400w" 
       sizes="100vw" alt="Description" width="1600" height="1067" loading="lazy">
</picture>
```

Progressive JPEGs render in multiple passes (blurry to sharp) rather than top-to-bottom, creating better perceived loading for large hero images. Generate responsive sets using Sharp in Node.js—it's **4-5x faster than ImageMagick** and powers most SSG image plugins.

## CSS techniques eliminate layout shift and enable native carousels

Three CSS properties form the foundation of modern image presentation. **`object-fit: cover`** crops images to fill containers while maintaining aspect ratio—essential for grid layouts. **`aspect-ratio: 3 / 2`** reserves space before images load, preventing Cumulative Layout Shift (CLS). **`scroll-snap`** enables native carousel behavior without JavaScript:

```css
.gallery {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.gallery > * {
  flex: 0 0 100vw;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}
```

The `scroll-snap-type: mandatory` property forces snapping to each slide, creating the deliberate pacing essential for photography presentation. Combined with `-webkit-overflow-scrolling: touch` for iOS momentum, this provides hardware-accelerated horizontal scrolling matching native app performance.

For layout stability, always include `width` and `height` attributes on images, then apply `height: auto` in CSS—this allows browsers to calculate aspect ratio before image download, achieving the **<0.1 CLS target** for Core Web Vitals.

## Horizontal navigation creates book-like viewing experiences

The horizontal scroll paradigm mimics physical book and magazine presentation, forcing deliberate engagement with each image. CSS scroll-snap handles the core behavior natively, but complete implementation requires keyboard navigation, mouse wheel conversion, and touch gesture support:

```javascript
// Keyboard navigation
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowRight': navigateToSlide(currentIndex + 1); break;
    case 'ArrowLeft': navigateToSlide(currentIndex - 1); break;
    case 'Escape': closeLightbox(); break;
  }
});

// Convert vertical mouse wheel to horizontal scroll
gallery.addEventListener('wheel', (e) => {
  e.preventDefault();
  gallery.scrollLeft += e.deltaY;
}, { passive: false });
```

The trade-offs are significant: horizontal scrolling **violates desktop user expectations** and creates accessibility challenges—screen readers navigate vertically by default. Touch devices feel natural with horizontal swipe, but desktop users with mice find it disorienting. The recommended pattern uses horizontal navigation within individual project pages while maintaining vertical navigation for project listings.

Auto-hiding UI enhances the immersive experience. A **2-second idle timeout** is standard for hiding controls:

```javascript
let idleTimer = setTimeout(hideUI, 2000);
['mousemove', 'keydown', 'touchstart'].forEach(event => {
  document.addEventListener(event, () => {
    showUI();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hideUI, 2000);
  });
});
```

## PhotoSwipe and CSS scroll-snap lead the library landscape

For lightbox functionality, **PhotoSwipe v5** represents the gold standard—it delivers **~15% smaller bundles than v4**, ES module architecture, and exceptional touch gesture handling with spring-based physics animations. The MIT license eliminates commercial concerns. Implementation is straightforward:

```javascript
import Lightbox from 'photoswipe/lightbox';
const lightbox = new Lightbox({
  gallery: '#gallery',
  children: 'a',
  pswpModule: () => import('photoswipe')
});
lightbox.init();
```

**GLightbox (~11KB)** offers a lighter alternative when video support and simplicity matter more than advanced zoom features. Both are MIT-licensed, unlike lightGallery and Fancybox which require commercial licenses for business use.

For carousels, **Embla Carousel (~6KB)** provides the best performance-to-size ratio with physics-based animations and excellent swipe precision. **Swiper** dominates in feature breadth with 20+ modules and an unusual CSS scroll-snap mode that uses native snapping with JavaScript controls. Both are MIT-licensed.

The critical question—CSS scroll-snap versus JavaScript carousels—has a clear answer: **start with CSS scroll-snap, add JavaScript only for specific needs**. Pure CSS handles basic horizontal galleries, touch gestures, and smooth scrolling without any JavaScript payload. JavaScript becomes necessary for autoplay, infinite looping, thumbnail synchronization, complex ARIA announcements, and analytics tracking.

## Static site generators automate responsive image generation

For self-hosted portfolios, **Astro, Eleventy, and Hugo** each offer compelling approaches to build-time image optimization. All three generate multiple sizes and formats automatically, eliminating the need for runtime CDN processing.

**Eleventy** with the @11ty/eleventy-img plugin provides the most flexible approach:

```javascript
const Image = require("@11ty/eleventy-img");
async function imageShortcode(src, alt) {
  let metadata = await Image(src, {
    widths: [640, 1200, 2400],
    formats: ["avif", "webp", "jpeg"],
    outputDir: "./dist/img/"
  });
  return Image.generateHTML(metadata, { alt, loading: "lazy" });
}
```

**Hugo** offers the fastest build times with built-in Go-based image processing. **Astro** provides the most modern architecture with Islands architecture for partial hydration—ideal when you need React or Vue components for specific interactive features without shipping framework JavaScript site-wide.

For hobbyist deployment, generate images at build time rather than using CDN transformation. This eliminates ongoing costs and works offline. Consider CDN services (Cloudinary, Imgix, ImageKit) only for user-uploaded content or galleries exceeding thousands of images where build times become problematic.

## LQIP and blur-up techniques smooth the loading experience

Low Quality Image Placeholders create smooth transitions from loading to loaded states. The most effective technique embeds a **tiny (~300-600 byte) base64-encoded WebP** as a blurred background, then fades in the full-resolution image:

```html
<div class="image-wrapper">
  <img class="placeholder" src="data:image/webp;base64,..." alt="">
  <img class="full-image" data-src="photo-full.jpg" alt="Description">
</div>
```

```css
.placeholder {
  filter: blur(20px);
  transform: scale(1.1); /* Hide blur edges */
}

.full-image {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.full-image.loaded {
  opacity: 1;
}
```

BlurHash and ThumbHash encode images into ~20-30 character strings requiring JavaScript decode—useful for SPAs but overkill for static portfolios where inline tiny images work better.

For CDN-hosted images, **Cloudinary** offers the most comprehensive feature set including automatic format negotiation and AI-powered cropping. **ImageKit** provides simpler pricing with generous free tiers (**20GB bandwidth/month**). Both support URL-based transformations: `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1600/photo.jpg` automatically serves AVIF or WebP based on browser support.

## Replicating professional portfolio platforms requires coordinated techniques

The technical architecture of platforms like APhotoFolio combines several key patterns: CSS scroll-snap for core navigation, JavaScript for keyboard/wheel handling, IntersectionObserver for lazy loading with **2-image lookahead preloading**, and auto-hiding UI with 2-second idle timeout.

The complete implementation structure:

```html
<main class="gallery-container" role="region" aria-label="Photo gallery">
  <article class="slide" data-slug="photo-1">
    <picture>
      <source type="image/avif" srcset="photo1.avif">
      <source type="image/webp" srcset="photo1.webp">
      <img src="photo1.jpg" alt="Description" loading="lazy" decoding="async">
    </picture>
  </article>
</main>
```

```css
.gallery-container {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  height: 100vh;
  -webkit-overflow-scrolling: touch;
}

.slide {
  flex: 0 0 100vw;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

Professional platforms recommend **1860×1140px images for standard displays and 2500×1700px for 4K/5K**, with file sizes between **550-875KB per image**. Use sRGB color profiles—modern browsers now respect embedded profiles.

URL routing maintains browser history for each image using History API `pushState`, enabling sharing direct links to specific images within galleries. Preload adjacent images during idle time using `<link rel="prefetch">` or programmatic image loading to ensure instant transitions.

## The optimal implementation path for hobbyist coders

The recommended stack balances capability against complexity: **Eleventy or Hugo for static generation, CSS scroll-snap for horizontal navigation, PhotoSwipe for lightbox functionality, and build-time image processing with Sharp**. This combination requires minimal JavaScript knowledge while delivering professional results.

Start with accessibility: semantic HTML using `<figure>` and `<figcaption>`, proper `alt` text, and keyboard navigation from day one. Add CSS scroll-snap for the gallery foundation—this works without JavaScript and provides excellent mobile performance. Layer PhotoSwipe for fullscreen viewing and advanced touch gestures. Finally, implement LQIP placeholders and preloading for polished loading states.

The build-versus-buy decision favors building: hosted platforms like Format, Squarespace, and APhotoFolio charge monthly fees and limit customization. A self-hosted Eleventy or Hugo site costs only domain registration and commodity hosting (~$5/month for Netlify, Vercel, or Cloudflare Pages offers generous free tiers). You retain complete control over presentation, sequencing, and the viewing experience—the deliberate curation that distinguishes photography portfolios from image dumps.

The most important insight: **CSS scroll-snap fundamentally changed what's possible without JavaScript**. The horizontal gallery experience that once required complex carousel libraries now works natively in all browsers, with hardware-accelerated performance matching native apps. Build on this foundation, add JavaScript selectively for specific enhancements, and you'll achieve professional-quality results with maintainable code.