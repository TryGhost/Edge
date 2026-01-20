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
    var captionEl = container.querySelector('.portfolio-caption');

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

        // Update UI state
        updateCursor();
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
        updateCursor();
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
     * Update cursor based on current position and boundaries
     */
    function updateCursor(mouseX) {
        gallery.classList.remove('cursor-prev', 'cursor-next');

        // If no mouse position provided, don't set a directional cursor
        if (mouseX === undefined) return;

        // First image: always show next cursor
        if (currentIndex === 0) {
            gallery.classList.add('cursor-next');
            return;
        }

        // Last image: always show prev cursor
        if (currentIndex === totalSlides - 1) {
            gallery.classList.add('cursor-prev');
            return;
        }

        // Middle images: cursor based on position
        var galleryRect = gallery.getBoundingClientRect();
        var centerX = galleryRect.left + galleryRect.width / 2;

        if (mouseX < centerX) {
            gallery.classList.add('cursor-prev');
        } else {
            gallery.classList.add('cursor-next');
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
                    updateCursor();
                    updateCaption();
                    preloadAdjacent(i);
                }
                break;
            }
        }
    }

    /**
     * Handle mouse movement - update cursor based on position
     */
    function handleMouseMove(e) {
        updateCursor(e.clientX);
    }

    /**
     * Handle click - navigate based on which side was clicked
     */
    function handleClick(e) {
        // Don't navigate if clicking on caption
        if (e.target.closest('.portfolio-caption')) return;

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

        // Mouse movement for cursor updates
        gallery.addEventListener('mousemove', handleMouseMove, { passive: true });

        // Reset cursor when mouse leaves
        gallery.addEventListener('mouseleave', function() {
            gallery.classList.remove('cursor-prev', 'cursor-next');
        });

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
