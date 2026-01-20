/**
 * Portfolio - Horizontal Scroll Gallery
 * Handles cursor-based navigation, keyboard, wheel, and preloading
 */
(function() {
    'use strict';

    // Only run on portfolio template pages
    var container = document.querySelector('.portfolio-container');
    if (!container) return;

    // DOM elements
    var gallery = container.querySelector('.portfolio-gallery');
    var slides = gallery.querySelectorAll('.kg-image-card');

    // State
    var currentIndex = 0;
    var totalSlides = slides.length;
    var scrollTimeout;

    /**
     * Initialize portfolio
     */
    function init() {
        if (totalSlides === 0) return;

        // Handle first image - remove lazy loading for LCP
        handleFirstImage();

        // CSS scroll-snap handles centering the first image

        // Preload adjacent images
        preloadAdjacent(currentIndex);

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
        preloadAdjacent(index);
    }

    /**
     * Navigate relative to current position
     */
    function navigate(direction) {
        navigateToSlide(currentIndex + direction);
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
                    preloadAdjacent(i);
                }
                break;
            }
        }
    }

    /**
     * Handle click - navigate based on which side was clicked
     */
    function handleClick(e) {
        // First image: always go forward
        if (currentIndex === 0) {
            navigate(1);
            return;
        }

        // Last image: always go back
        if (currentIndex === totalSlides - 1) {
            navigate(-1);
            return;
        }

        // Middle images: left half goes back, right half goes forward
        var galleryRect = gallery.getBoundingClientRect();
        var centerX = galleryRect.left + galleryRect.width / 2;

        if (e.clientX < centerX) {
            navigate(-1);
        } else {
            navigate(1);
        }
    }

    /**
     * Handle wheel - convert vertical to horizontal (no snap)
     */
    function handleWheel(e) {
        e.preventDefault();
        gallery.style.scrollSnapType = 'none';
        gallery.scrollLeft += e.deltaY;
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
        // Scroll sync (throttled)
        gallery.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 150);
        }, { passive: true });

        // Click navigation
        gallery.addEventListener('click', handleClick);

        // Wheel navigation (discrete)
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
