/* global $ */
/* exported ResizeController */
/**
 * Controller to help resize sheet-content
 *
 */
function ResizeController(layoutContainer, markerContainer) {
    'use strict';
    var _const = {
        LRESIZE_QUAD: 5,
        MIN_SHEET_WIDTH: 200,
        VISIBLE_OFFSET: 4,
        HOVER_AREA_OFFSET: 20
    };
    var isMarkerVisible = false,
        isMarkerHighlight = false;

    var isChangingSheet = false,
        needUpdateData = true;

    var divs = {};

    var left1, right1, left2, right2;
    var containerWidth, bodyWidth;

    var prevX;
    var startContainerWidth;
    var leftMarker;
    var lastWidth = -1;

    var divNames = ['left-top', 'left-bottom', 'left-quad', 'right-top', 'right-bottom', 'right-quad'];

    //Subscribe on mousemove and mouseup event
    this.init = function () {
        $(document).on('mousemove', mouseMove);
        $(document).on('mouseup', mouseUp);
    };


    function removeMarkers() {
        $.each(divNames, function (index, name) {
            if (divs[name])
                divs[name].remove();
        });
    }

    //Start controller after mousedown on marker
    function start(ev) {
        updateData();

        prevX = ev.pageX;
        startContainerWidth = containerWidth;
        leftMarker = (prevX <= right1);
        $('body').css('user-select', 'none');
        isChangingSheet = true;
    }

    // Apply changes
    function apply() {
        $('body').css('user-select', '');
        isChangingSheet = false;
        /* write width-data into some model*/
    }

    //Update view while drag marker
    function update(ev) {
        if (isChangingSheet) {
            dragMarker(ev);
        } else {
            validateMarker(ev);
        }
    }

    //Check mouse pointer position for show markers on mouse hover. Show marker on hover zone.
    function validateMarker(ev) {
        if (needUpdateData)
            updateData();

        var visible = false;

        if (ev && !visible) {
            if ((ev.pageX >= (left1 - _const.HOVER_AREA_OFFSET) && ev.pageX <= (right1)) ||
                (ev.pageX >= (left2) && ev.pageX <= (right2 + _const.HOVER_AREA_OFFSET)))
                visible = true;
        }

        if (visible) {
            var highlight = isOverMarker(ev);
            if (highlight !== isMarkerHighlight) {
                isMarkerHighlight = highlight;
                highlightMarker(isMarkerHighlight);
            }
        } else {
            if (isMarkerHighlight) {
                isMarkerHighlight = false;
                highlightMarker(isMarkerHighlight);
            }
        }

        if (visible === isMarkerVisible) {
            if (!ev) updateMarker();
            return;
        }

        if (visible) {
            showMarker();
        } else {
            hideMarker();
        }
    }

    // Update data about offset and width content. Set position of left and right marker
    function updateData() {
        var rootRowDom = $('.main-row');
        if (!rootRowDom || !rootRowDom.offset()) return;

        var containerInner = $('.layout-container');
        if (containerInner.length === 0) return;
        var maxWidth = parseInt(containerInner.css('max-width'), 10),
            width = parseInt(containerInner.css('width'), 10);
        containerWidth = width < maxWidth ? width : maxWidth; // use width or css max-width
        bodyWidth = $('body').width();

        var rootOffset = rootRowDom.offset().left;
        var rootWidth = rootRowDom.width();
        var sheetOffset = (rootWidth - containerWidth) / 2;

        var w = 2 * (_const.VISIBLE_OFFSET + _const.LRESIZE_QUAD);
        left1 = Math.max(rootOffset + sheetOffset - w, -_const.VISIBLE_OFFSET);
        right1 = left1 + w;

        right2 = Math.min(rootOffset + rootWidth - sheetOffset + w, bodyWidth + _const.VISIBLE_OFFSET);
        left2 = right2 - w;
        needUpdateData = false;
    }

    function showMarker() {
        isMarkerVisible = true;
        var allDivs = $();
        $.each(divNames, function (index, name) {
            var markerClass = (name.indexOf('quad') === -1) ?
                'layout-editor layout-editor-resize-separator' :
                'layout-editor layout-editor-resize-square';

            divs[name] = $('<div />').addClass(markerClass);

            allDivs = allDivs.add(divs[name]);
        });

        $(allDivs).on('mousedown', mouseDown);
        markerContainer.append(allDivs);

        updateMarker();

        updateClasses('layout-editor-resize-separator-visible', 'layout-editor-resize-square-visible');
    }


    function hideMarker() {
        if (isMarkerVisible) {
            isMarkerVisible = false;

            updateClasses('layout-editor-resize-separator-visible', 'layout-editor-resize-square-visible', true);

            removeMarkers();
        }
    }

    //Update position of markers while drag
    function updateMarker() {
        if (Object.keys(divs).sort().join('') === divNames.sort().join('')) { // Check are there any markers shown
            var body = $('body');
            var bodyOffset = body.offset();
            var bodyHeight = body.height();

            var frameOffset = { left: 0, top: 0 };

            var offset1 = {
                left: left1 + _const.VISIBLE_OFFSET + frameOffset.left + bodyOffset.left,
                top: bodyOffset.top + frameOffset.top
            };

            var offset2 = {
                left: left2 + _const.VISIBLE_OFFSET + frameOffset.left + bodyOffset.left,
                top: bodyOffset.top + frameOffset.top
            };

            var markerHeight = bodyHeight / 2 - _const.LRESIZE_QUAD;

            divs['left-top'].css('left', offset1.left + 'px')
                .css('top', offset1.top + 'px')
                .width(2 * _const.LRESIZE_QUAD)
                .height(markerHeight);

            divs['right-top'].css('left', offset2.left + 'px')
                .css('top', offset2.top + 'px')
                .width(2 * _const.LRESIZE_QUAD)
                .height(markerHeight);

            offset1.top = offset2.top = offset1.top + bodyHeight / 2 + _const.LRESIZE_QUAD;
            divs['left-bottom'].css('left', offset1.left + 'px')
                .css('top', (offset1.top + 1) + 'px')
                .width(2 * _const.LRESIZE_QUAD)
                .height(markerHeight);

            divs['right-bottom'].css('left', offset2.left + 'px')
                .css('top', (offset2.top + 1) + 'px')
                .width(2 * _const.LRESIZE_QUAD)
                .height(markerHeight);

            offset1.top = offset2.top = bodyOffset.top + bodyHeight / 2 - _const.LRESIZE_QUAD + frameOffset.top;
            divs['left-quad'].css('left', offset1.left - (_const.LRESIZE_QUAD + 1) + 'px')
                .css('top', offset1.top + 'px')
                .width(2 * _const.LRESIZE_QUAD)
                .height(2 * _const.LRESIZE_QUAD);

            divs['right-quad'].css('left', offset2.left - (_const.LRESIZE_QUAD + 1) + 'px')
                .css('top', offset2.top + 'px')
                .width(2 * _const.LRESIZE_QUAD)
                .height(2 * _const.LRESIZE_QUAD);
        }
    }

    function dragMarker(ev) {
        if (!ev) return;

        var delta = ev.pageX - prevX;
        if (leftMarker) delta *= -1;
        var width = startContainerWidth + 2 * delta;
        if (width < _const.MIN_SHEET_WIDTH)
            width = _const.MIN_SHEET_WIDTH;

        if (lastWidth === width) return;

        lastWidth = width;

        var layout = $(layoutContainer);
        layout.css('max-width', width + 'px');

        updateData();
        updateMarker();
    }

    //Check mouse cursor over marker
    function isOverMarker(ev) {
        if (!ev) return false;

        var l1 = left1 + _const.VISIBLE_OFFSET;
        var r1 = l1 + 2 * _const.LRESIZE_QUAD;

        var l2 = left2 + _const.VISIBLE_OFFSET;
        var r2 = l2 + 2 * _const.LRESIZE_QUAD;

        return !((ev.pageX < l1 || ev.pageX > r2) || (ev.pageX > r1 && ev.pageX < l2));
    }

    // Highlight marker on hover
    function highlightMarker(show) {
        if (!isMarkerVisible) return;
        if (show) {
            updateClasses('layout-editor-resize-separator-hover', 'layout-editor-resize-square-hover');
        } else {
            updateClasses('layout-editor-resize-separator-hover', 'layout-editor-resize-square-hover', true);
        }
    }

    /* Mouse events*/

    //Mouse move
    function mouseMove(event) {
        update(event);
    }

    //Mouse down on marker
    function mouseDown(ev) {
        start(ev);
    }

    //Mouse up after drag marker
    function mouseUp(event, arg) {
        if (event && isChangingSheet) {
            apply();
        }
    }

    //Update classes for markers
    function updateClasses(separator, square, remove) {

        $.each(divNames, function (index, name) {
            if (divs[name]) {
                var markerClass = (name.indexOf('quad') === -1) ?
                    separator : square;
                if (remove) {
                    divs[name].removeClass(markerClass);
                } else {
                    divs[name].addClass(markerClass);
                }
            }
        });

    }
}
