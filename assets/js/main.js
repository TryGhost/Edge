$(function () {
    'use strict';
    feed();
    renderPagination();
});

function feed() {
    'use strict';

    var grid = document.querySelector('.post-feed');
    if (!grid) return;
    var masonry;


    let numberPagination = $('.numbers-pagination');
    let page;
    if (numberPagination && numberPagination.length) {
        page = numberPagination.data("page");
    }

    imagesLoaded(grid, function () {
        masonry = new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-sizer',
            stamp: '.related-title',
            hiddenStyle: {transform: 'translateY(50px)', opacity: 0},
            visibleStyle: {transform: 'translateY(0)', opacity: 1},
        });

        masonry.on('layoutComplete', function () {
            grid.classList.add('initialized');
        });

        masonry.layout();

        function callback(items, loadNextPage) {
            if (numberPagination && numberPagination.length) {
                page++;
                numberPagination.data("page", page);
                renderPagination();
            }
            imagesLoaded(items, function (loaded) {
                masonry.appended(items);
                masonry.layout();
                loaded.elements.forEach(function (item) {
                    item.style.visibility = 'visible';
                });
                loadNextPage();
            });
        }

        pagination(true, callback, true);
    });

    pswp(
        '.post-feed',
        '.post',
        '.post-lightbox',
        '.post-caption',
        '.post-link',
        false
    );
}

function pswp(container, element, trigger, caption, postLink, isGallery) {
    var parseThumbnailElements = function (el) {
        var items = [],
            gridEl,
            linkEl,
            item;

        $(el)
            .find(element)
            .each(function (i, v) {
                gridEl = $(v);
                linkEl = gridEl.find(trigger);

                item = {
                    src: isGallery
                        ? gridEl.find('img').attr('src')
                        : linkEl.attr('href'),
                    w: 0,
                    h: 0,
                };

                if (caption && gridEl.find(caption).length) {
                    item.title = gridEl.find(caption).html();
                }

                items.push(item);
            });

        return items;
    };

    var openPhotoSwipe = function (index, galleryElement) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        options = {
            closeOnScroll: false,
            history: false,
            index: index,
            shareEl: false,
            showAnimationDuration: 0,
            showHideOpacity: true,
        };

        gallery = new PhotoSwipe(
            pswpElement,
            PhotoSwipeUI_Default,
            items,
            options
        );
        gallery.listen('gettingData', function (index, item) {
            if (item.w < 1 || item.h < 1) {
                // unknown size
                var img = new Image();
                img.onload = function () {
                    // will get size after load
                    item.w = this.width; // set image width
                    item.h = this.height; // set image height
                    gallery.updateSize(true); // reinit Items
                };
                img.src = item.src; // let's download image
            }
        });
        gallery.init();
    };

    var onThumbnailsClick = function (e) {
        e.preventDefault();

        var index = $(e.target)
            .closest(container)
            .find(element)
            .index($(e.target).closest(element));
        var clickedGallery = $(e.target).closest(container);

        openPhotoSwipe(index, clickedGallery[0]);

        return false;
    };

    $(container).on('click', trigger, function (e) {
        onThumbnailsClick(e);
    });

    if ($(container).hasClass('post-feed_mode_gallery')) {
        $(container).on('click', postLink, function (e) {
            onThumbnailsClick(e);
        });
    }
}

function renderPagination() {
    let numberPagination = $('.numbers-pagination');
    if (!numberPagination || !numberPagination.length) {
        return;
    }
    let page = numberPagination.data('page');
    let total = numberPagination.data('total');
    let isSmall = false;

    let leftArrow = $('.numbers-pagination__left');
    let rightArrow = $('.numbers-pagination__right');
    if (leftArrow && leftArrow.length) {
        if (page === 1) {
            leftArrow.addClass("numbers-pagination__el_disabled");
        } else {
            leftArrow.removeClass("numbers-pagination__el_disabled");
        }
    }

    if (rightArrow && rightArrow.length) {
        if (page === total) {
            rightArrow.addClass("numbers-pagination__el_disabled");
        } else {
            rightArrow.removeClass("numbers-pagination__el_disabled");
        }
    }

    let pagingElements = rebuildPagination(page, total, isSmall);

    let pagingHtmlNodes = pagingElements.map((el, i, arr) => {
        let node = document.createElement('a')
        node.classList.add('numbers-pagination__el');
        let hrefValue = el === '...' ?  '/page/' + Math.round((arr[i+1] + arr[i-1])/2) : '/page/' + el;
        node.setAttribute('href', hrefValue);
        node.innerText = el;
        return node;
    });
    let activeNodeIndex = pagingElements.indexOf(page);
    let activeNode = pagingHtmlNodes[activeNodeIndex];
    activeNode.removeAttribute("href");
    activeNode.classList.add('numbers-pagination__el_active');

    let numbersBlock = $('.numbers-pagination__pages');
    numbersBlock.empty();
    pagingHtmlNodes.forEach(n => numbersBlock.append(n));
}

function rebuildPagination(page, total, isSmallScreen = false) {
    let numberElCount = isSmallScreen ? 7 : 7;
    // let numberElCount = isSmallScreen ? 5 : 9;
    let hasNext = page !== total;
    let hasPrev = page !== 1;

    if (total <= numberElCount) {
        return fillIntegerArray(total);
    }

    let arr = [];
    arr.push(page);

    let i = 0;
    let tmp;
    while (arr.length < (tmp = numberElCount - (+hasNext) - (+hasPrev) - (+isLeftNotFilled(page, i)) - (+isRightNotFilled(page, i, total)))) {
        i++;
        if (isLeftNotFilled(page, i-1)) {
            arr.unshift(page - i);
        }

        if (isRightNotFilled(page, i-1, total)) {
            arr.push(page + i);
        }
    }

    if (isLeftNotFilled(page, i)) {
        if (isLeftNotFilled(page, i+1)) {
            arr.unshift("...");
        } else {
            arr.unshift(page - (i + 1));
        }
    }
    if (isRightNotFilled(page, i, total)) {
        if (isRightNotFilled(page, i+1, total)) {
            arr.push("...");
        } else {
            arr.push(page + (i + 1));
        }
    }
    if (hasPrev) {
        arr.unshift(1);
    }
    if (hasNext) {
        arr.push(total);
    }
    return arr;
}

function fillIntegerArray(n) {
    let arr = [];
    for(let i = 1; i <= n; i++) {
        arr.push(i);
    }
    return arr;
}
function isLeftNotFilled(page, i) {
    return page - i > 2;
}

function isRightNotFilled(page, i, total) {
    return page + i < total - 1;
}
