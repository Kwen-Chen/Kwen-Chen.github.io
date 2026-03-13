(function () {
    var preview = document.createElement('img');
    preview.className = 'pub-zoom-preview';
    document.body.appendChild(preview);

    function getFullSrc(img) {
        return img.getAttribute('data-src') || img.src;
    }

    function onEnter(e) {
        var img = e.currentTarget;
        preview.src = getFullSrc(img);
        preview.style.display = 'block';
    }

    function onMove(e) {
        var previewRect = preview.getBoundingClientRect();
        var pw = previewRect.width || 400;
        var ph = previewRect.height || 300;

        // Position to the right of cursor
        var left = e.clientX + 20;
        var top = e.clientY - ph / 2;

        // Flip to left if overflowing right edge
        if (left + pw > window.innerWidth) {
            left = e.clientX - pw - 20;
        }
        // Keep within vertical bounds
        if (top < 5) top = 5;
        if (top + ph > window.innerHeight - 5) {
            top = window.innerHeight - ph - 5;
        }

        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
    }

    function onLeave() {
        preview.style.display = 'none';
    }

    function bind() {
        var imgs = document.querySelectorAll('.pub-cover-zoom');
        for (var i = 0; i < imgs.length; i++) {
            imgs[i].addEventListener('mouseenter', onEnter);
            imgs[i].addEventListener('mousemove', onMove);
            imgs[i].addEventListener('mouseleave', onLeave);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();
