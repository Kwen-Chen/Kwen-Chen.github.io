(function() {
    var lang = localStorage.getItem('site-lang') || 'en';

    // Apply immediately to prevent flash of wrong language
    var html = document.documentElement;
    html.className = html.className.replace(/lang-active-\w+/g, '').trim() + ' lang-active-' + lang;
    html.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    // Update toggle switch visual state
    function updateToggle() {
        var current = localStorage.getItem('site-lang') || 'en';
        var enLabel = document.getElementById('lang-toggle-en');
        var zhLabel = document.getElementById('lang-toggle-zh');
        if (enLabel && zhLabel) {
            if (current === 'en') {
                enLabel.classList.add('lang-toggle-active');
                zhLabel.classList.remove('lang-toggle-active');
            } else {
                zhLabel.classList.add('lang-toggle-active');
                enLabel.classList.remove('lang-toggle-active');
            }
        }
    }

    window.toggleLanguage = function(targetLang) {
        localStorage.setItem('site-lang', targetLang);

        // If on a single-language blog post with a lang_pair, navigate to the paired post
        var body = document.body;
        var pageLang = body.getAttribute('data-page-lang');
        var langPair = body.getAttribute('data-lang-pair');
        if (pageLang && langPair && targetLang !== pageLang) {
            window.location.href = langPair;
            return;
        }

        var html = document.documentElement;
        html.className = html.className.replace(/lang-active-\w+/g, '').trim() + ' lang-active-' + targetLang;
        html.setAttribute('lang', targetLang === 'zh' ? 'zh-CN' : 'en');
        updateToggle();
    };

    // Initialize toggle visual on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateToggle);
    } else {
        updateToggle();
    }
})();
