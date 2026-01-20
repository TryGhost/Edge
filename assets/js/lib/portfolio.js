/**
 * Portfolio - Horizontal Scroll Gallery
 * Handles keyboard navigation, wheel conversion, and preloading
 */
(function() {
    'use strict';

    // Only run on portfolio template pages
    var container = document.querySelector('.portfolio-container');
    if (!container) return;

    // DOM elements
    var gallery = container.querySelector('.portfolio-gallery');
    var slides = gallery.querySelectorAll('.kg-image-card');
    var prevBtn = container.querySelector('.portfolio-nav-prev');
    var nextBtn = container.querySelector('.portfolio-nav-next');
    var captionEl = container.querySelector('.portfolio-caption');

    // State
    var currentIndex = 0;
    var totalSlides = slides.length;

    /**
     * Initialize portfolio
     */
    function init() {
        if (totalSlides === 0) return;

        // Handle first image - remove lazy loading for LCP
        handleFirstImage();

        // Preload adjacent images
        preloadAdjacent(currentIndex);

        // Update UI state
        updateNavButtons();
        updateCaption();

        // Bind events
        bindEvents();
    }

    /**
     * Remove lazy loading from first image for LCP optimization
     */
    function handleFirstImage() {
        var firstSlide = slides[0];
        if (!firstSlide) return;

        var img = firstSlide.querySelector('img');
        if (img) {
            img.removeAttribute('loading');
            img.setAttribute('fetchpriority', 'high');
            if (img.decode) {
                img.decode().catch(function() {});
            }
        }
    }

    /**
     * Preload images adjacent to current slide
     */
    function preloadAdjacent(index) {
        // Preload next 2 images
        [1, 2].forEach(function(offset) {
            var nextIndex = index + offset;
            if (nextIndex < totalSlides) {
                preloadImage(slides[nextIndex]);
            }
        });

        // Preload previous image
        if (index > 0) {
            preloadImage(slides[index - 1]);
        }
    }

    /**
     * Preload a single slide's image
     */
    function preloadImage(slide) {
        if (!slide) return;

        var img = slide.querySelector('img');
        if (!img || img.complete) return;

        if (img.hasAttribute('loading')) {
            img.removeAttribute('loading');
        }
    }

    /**
     * Navigate to a specific slide index
     */
    function navigateToSlide(index) {
        index = Math.max(0, Math.min(index, totalSlides - 1));

        if (index === currentIndex) return;

        var targetSlide = slides[index];
        if (!targetSlide) return;

        targetSlide.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        currentIndex = index;
        updateNavButtons();
        updateCaption();
        preloadAdjacent(index);
    }

    /**
     * Navigate relative to current position
     */
    function navigate(direction) {
        navigateToSlide(currentIndex + direction);
    }

    /**
     * Update navigation button states
     */
    function updateNavButtons() {
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex === totalSlides - 1;
        }
    }

    /**
     * Update caption from current slide's figcaption
     */
    function updateCaption() {
        if (!captionEl) return;

        var currentSlide = slides[currentIndex];
        var figcaption = currentSlide ? currentSlide.querySelector('figcaption') : null;
        var captionText = figcaption ? figcaption.textContent.trim() : '';

        captionEl.textContent = captionText;
    }

    /**
     * Sync current index from scroll position
     */
    function handleScroll() {
        var galleryRect = gallery.getBoundingClientRect();
        var centerX = galleryRect.left + galleryRect.width / 2;

        for (var i = 0; i < totalSlides; i++) {
            var slideRect = slides[i].getBoundingClientRect();
            if (slideRect.left <= centerX && slideRect.right >= centerX) {
                if (i !== currentIndex) {
                    currentIndex = i;
                    updateNavButtons();
                    updateCaption();
                    preloadAdjacent(i);
                }
                break;
            }
        }
    }

    /**
     * Convert vertical wheel to horizontal scroll
     */
    function handleWheel(e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            gallery.scrollLeft += e.deltaY;
        }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeydown(e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                navigate(1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                navigate(-1);
                break;
            case 'Home':
                e.preventDefault();
                navigateToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                navigateToSlide(totalSlides - 1);
                break;
        }
    }

    /**
     * Bind all event listeners
     */
    function bindEvents() {
        // Navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigate(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigate(1);
            });
        }

        // Scroll sync (throttled)
        var scrollTimeout;
        gallery.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 100);
        }, { passive: true });

        // Wheel to horizontal conversion
        gallery.addEventListener('wheel', handleWheel, { passive: false });

        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
