window.APP_CONFIG = {
    apiBaseUrl: 'https://159.75.91.40:3443'
};

(function() {
    var params = new URLSearchParams(window.location.search);
    var server = params.get('server');
    if (server) {
        var port = params.get('port') || '3000';
        var https = params.get('https') === 'true';
        window.APP_CONFIG.apiBaseUrl = (https ? 'https:' : 'http:') + '//' + server + ':' + port;
    }
    var apiUrl = params.get('api');
    if (apiUrl) {
        window.APP_CONFIG.apiBaseUrl = apiUrl;
    }
})();

(function() {
    var theme = localStorage.getItem('theme') || 'water';
    if (theme === 'water') return;

    var id = 'ink-theme-style';
    var old = document.getElementById(id);
    if (old) old.remove();

    var css;

    if (theme === 'dark') {
        css =
        // ═══ 全局底色 ═══
        'html{background:#121212!important}' +
        'body{background:#121212!important;color:#ccc!important}' +
        'body::before,body::after{display:none!important}' +

        // ═══ 所有容器的白色/浅色背景 → 深色 ═══
        '.ink-header,header{background:#1e1e2e!important;border-color:#2a2a3c!important}' +
        '.ink-card,.card,[class*="card"]{background:#1e1e2e!important;border-color:#2a2a3c!important;box-shadow:0 2px 12px rgba(0,0,0,0.4)!important}' +
        '.ink-tab-bar,nav[class*="tab"]{background:#1a1a2a!important;border-color:#2a2a3c!important}' +
        '.modal-content,.modal-body{background:#1e1e2e!important;border-color:#2a2a3c!important}' +
        '.modal{background:rgba(0,0,0,0.65)!important}' +
        '.modal-header{border-color:#2a2a3c!important}' +

        // ═══ 输入框 ═══
        'input,select,textarea{background:#262638!important;color:#ccc!important;border-color:#333350!important}' +
        'input::placeholder,textarea::placeholder{color:#666!important}' +
        'input:focus,select:focus,textarea:focus{background:#2e2e42!important;border-color:#556!important;color:#e0e0e0!important}' +
        '.form-group label,.form-group>span{color:#999!important}' +

        // ═══ 文字层级 ═══
        '.header-title{color:#e8e8e8!important}.header-title::after{opacity:0.12!important}' +
        '.header-links a{color:#888!important}.header-links a:hover{color:#d0d0d0!important}' +
        '.ink-title,label,.section-header{color:#999!important}' +
        'h1,h2,h3,h4{color:#d0d0d0!important}' +
        '.setting-label,.budget-name,.account-name{color:#d0d0d0!important}' +
        '.setting-desc,.budget-remaining,.account-type{color:#777!important}' +
        '.ink-balance{color:#e8e8e8!important}' +

        // ═══ 按钮 ═══
        '.ink-btn-primary{background:#4a6fa5!important;color:#fff!important;border-color:transparent!important}' +
        '.ink-btn-primary:hover{background:#5a7fb5!important}' +
        '.ink-btn-secondary{background:#2a2a3c!important;color:#bbb!important}' +
        '.ink-btn-secondary:hover{background:#353550!important;color:#ddd!important}' +
        '.ink-btn-danger{background:#a54242!important;color:#fff!important}' +
        '.ink-btn-danger:hover{background:#c55454!important}' +
        '.ink-btn-outline{color:#999!important;border-color:#444!important;background:transparent!important}' +
        '.ink-btn-outline:hover{border-color:#888!important;color:#ccc!important}' +
        '.ink-btn-sm{color:#777!important}' +
        '.ink-btn-sm:hover{color:#e57373!important;background:rgba(229,115,115,0.1)!important}' +

        // ═══ 底栏 ═══
        '.ink-tab-item{color:#666!important}.ink-tab-item.active{color:#c8c8c8!important}' +
        '.ink-tab-icon{opacity:0.65!important}' +

        // ═══ 链接 ═══
        'a{color:#8899cc!important}a:hover{color:#aabbdd!important}' +

        // ═══ 设置页 ═══
        '.setting-row{border-color:#2a2a3c!important}' +
        '.theme-chip{color:#bbb!important}' +
        '.theme-chip.water{background:#2a2a3c!important;color:#bbb!important}' +
        '.theme-chip.light{background:#2a2a3c!important;color:#bbb!important}' +
        '.theme-chip.dark{background:#444!important;color:#e0e0e0!important}' +
        '.theme-chip.active{border-color:#8899cc!important}' +
        '.lang-chip{color:#999!important;background:#262638!important}' +
        '.lang-chip.active{border-color:#8899cc!important;color:#d0d0d0!important}' +

        // ═══ 登录 ═══
        '.ink-login-card,.login-section,.login-card{background:#1e1e2e!important;border-color:#2a2a3c!important}' +
        '.ink-login-logo{color:#e8e8e8!important}' +
        '.ink-login-subtitle{color:#888!important}' +
        '.ink-login-btn{background:#4a6fa5!important;color:#fff!important}' +
        '.ink-login-btn.alt{background:#2a2a3c!important;color:#bbb!important}' +
        '.ink-input{background:#262638!important;color:#ccc!important;border-color:#333350!important}' +
        '.ink-input:focus{background:#2e2e42!important;border-color:#556!important;color:#e0e0e0!important}' +
        '.divider{opacity:0.12!important}' +
        '.login-hint{color:#666!important}' +

        // ═══ 弹窗 ═══
        '.modal-title{color:#d8d8d8!important}' +
        '.modal-close{color:#777!important}' +
        '.modal-body{color:#aaa!important}' +

        // ═══ 预算 ═══
        '.total-budget{background:linear-gradient(135deg,#3a3a55,#4a4a65)!important}' +
        '.total-budget-label{color:#bbb!important}' +
        '.total-budget-amount{color:#fff!important}' +
        '.total-budget-progress{background:rgba(255,255,255,0.10)!important}' +
        '.budget-card,.budget-card *{background:#262638!important;border-color:#2a2a3c!important}' +
        '.budget-card .budget-name{color:#ccc!important}' +
        '.budget-card .budget-spent{color:#d8d8d8!important}' +
        '.budget-progress{background:#333!important}' +

        // ═══ 月份/日历 ═══
        '.month-display{color:#d8d8d8!important}' +
        '.month-nav{background:#262638!important;color:#aaa!important;border-color:#333350!important}' +
        '.calendar-day{color:#aaa!important}' +
        '.calendar-day:hover{background:#2a2a3c!important}' +
        '.calendar-day.today{background:#4a6fa5!important;color:#fff!important}' +
        '.calendar-day.selected{background:#3a5a8a!important;color:#fff!important}' +
        '.calendar-grid{color:#aaa!important}' +

        // ═══ 空状态 ═══
        '.empty-state{color:#777!important}' +
        '.empty-state p{color:#777!important}' +
        '.empty-state-icon{opacity:0.3!important}' +

        // ═══ 筛选/切换 ═══
        '.filter-btn{background:#262638!important;color:#888!important;border-color:#333350!important}' +
        '.filter-btn.active,.filter-btn[class*="active"]{background:#4a6fa5!important;color:#fff!important}' +
        '.type-tabs button{color:#888!important;background:transparent!important}' +
        '.type-tabs button.active{color:#d0d0d0!important}' +
        '.type-toggle button{background:#262638!important;color:#888!important;border-color:#333350!important}' +
        '.type-toggle button.active{background:#4a6fa5!important;color:#fff!important}' +

        // ═══ 记录列表 / 账户列表 ═══
        '[class*="record-item"],[class*="account-item"],[class*="list-item"]{background:#262638!important;border-color:#2a2a3c!important;color:#ccc!important}' +
        '[class*="record-list"]{background:transparent!important}' +
        '.records-section{background:transparent!important}' +

        // ═══ 记账页 ═══
        '.quick-cat{background:#262638!important;color:#aaa!important}' +
        '.quick-cat:hover{background:#2e2e42!important}' +
        '.quick-add-section{background:transparent!important}' +
        '.parse-result{background:#262638!important;color:#ccc!important;border-color:#2a2a3c!important}' +

        // ═══ Toast ═══
        '.toast{background:#e0e0e0!important;color:#121212!important}' +

        // ═══ 进度条 ═══
        '.total-budget-progress-bar,.budget-progress-bar{background:#8899cc!important}' +

        // ═══ 选中 ═══
        '::selection{background:#4a6fa5!important;color:#fff!important}' +

        // ═══ 杂项 ═══
        '.account-selector{background:#2a2a3c!important;color:#c0c0c0!important}' +
        '.share-link-box{background:#262638!important;color:#aaa!important;border-color:#333!important}' +
        '.account-chips *{color:#ccc!important}' +
        '.account-icon{background:#2a2a3c!important}' +
        '.budget-icon{background:#2a2a3c!important}' +

        // ═══ 扫尾：强制所有 div 内无白色背景 ═══
        'div,section,form,table,td,th,li,ul,ol,dl,dt,dd,fieldset,legend,figure,figcaption,details,summary,article,aside,footer,main,nav' +
        '{background-color:transparent!important;border-color:#2a2a3c!important}' +
        // 但 .ink-card, .ink-header, .modal-content, .ink-tab-bar 恢复深色背景
        '.ink-card, .ink-card *{background-color:#1e1e2e!important}' +
        '.ink-card .budget-card, .ink-card .budget-card *{background-color:#262638!important}' +
        '.ink-header{background-color:#1e1e2e!important}' +
        '.ink-tab-bar{background-color:#1a1a2a!important}' +
        '.modal-content{background-color:#1e1e2e!important}' +
        'input,select,textarea{background-color:#262638!important}' +
        '.ink-btn-primary{background-color:#4a6fa5!important}' +
        '.ink-btn-secondary{background-color:#2a2a3c!important}' +
        '.ink-btn-danger{background-color:#a54242!important}' +
        '.total-budget{background:linear-gradient(135deg,#3a3a55,#4a4a65)!important}' +

        // ═══ 页面切换动画 (ink-transition) ═══
        '.ink-transition-overlay{background:#121212!important;opacity:0!important;transition:none!important}' +
        '.ink-transition-overlay.active{opacity:1!important;transition:none!important;backdrop-filter:blur(8px)!important}' +
        '.ink-logo{color:#d8d8d8!important}' +
        '.ink-splash{background:radial-gradient(circle,rgba(140,160,200,0.7) 0%,rgba(140,160,200,0.3) 50%,transparent 70%)!important}' +
        '.ink-ripple-effect{background:radial-gradient(circle,rgba(140,160,200,0.25) 0%,transparent 70%)!important}' +
        '.ink-tab-item::before,.header-links a::before,.back-btn::before,.ink-btn::before{background:radial-gradient(circle,rgba(140,160,200,0.15) 0%,transparent 70%)!important}' +
        '.ink-drip{background:radial-gradient(circle,rgba(140,160,200,0.5) 0%,transparent 70%)!important}' +
        '.ink-divider::before{background:#1e1e2e!important;color:rgba(200,200,220,0.3)!important}' +
        '.ink-divider{background:linear-gradient(90deg,transparent,rgba(200,200,220,0.12),rgba(200,200,220,0.25),rgba(200,200,220,0.12),transparent)!important}' +
        '.ink-shadow{box-shadow:0 2px 8px rgba(0,0,0,0.2),0 4px 16px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.05)!important}' +
        '.ink-card-inner{box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),0 2px 12px rgba(0,0,0,0.2)!important}' +
        '.ink-card:hover{box-shadow:0 8px 30px rgba(0,0,0,0.3)!important}' +
        '.ink-border{border-color:rgba(200,200,220,0.08)!important}' +
        '.ink-border::before{border-color:rgba(200,200,220,0.06)!important}' +
        '.ink-wash::before{background:radial-gradient(ellipse at center,rgba(200,200,220,0.02) 0%,transparent 70%)!important}' +
        '.ink-tag{background:linear-gradient(135deg,rgba(200,200,220,0.06),rgba(200,200,220,0.03))!important;border-color:rgba(200,200,220,0.1)!important;color:#aaa!important}' +
        '.ink-tooltip{background:#1e1e2e!important;border-color:rgba(200,200,220,0.1)!important;box-shadow:0 4px 20px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)!important}' +
        '.ink-text{color:#ccc!important}' +
        '.ink-number{color:#ddd!important}' +
        '.ink-accent{color:#8899cc!important}' +
        '.ink-accent-bg{background-color:rgba(200,200,220,0.08)!important}' +
        '.ink-input:focus{box-shadow:0 0 0 2px rgba(140,160,200,0.12),0 4px 20px rgba(0,0,0,0.2)!important;border-color:rgba(200,200,220,0.25)!important}';
    }

    else if (theme === 'light') {
        css =
        'html{background:#f0f2f5!important}' +
        'body{background:#f0f2f5!important}' +
        'body::before,body::after{display:none!important}' +
        '.ink-header{background:#fff!important;border-color:#e4e6ea!important}' +
        '.header-title{color:#1a1a1a!important}' +
        '.header-links a{color:#888!important}.header-links a:hover{color:#333!important}' +
        '.account-selector{background:#f5f6f8!important;color:#333!important}' +
        '.ink-card{background:#fff!important;border-color:#e8eaef!important;box-shadow:0 1px 6px rgba(0,0,0,0.05)!important}' +
        '.ink-title{color:#888!important}' +
        '.ink-tab-bar{background:#fff!important;border-color:#e4e6ea!important}' +
        '.ink-tab-item{color:#bbb!important}.ink-tab-item.active{color:#333!important}' +
        '.setting-row{border-color:#f0f1f4!important}' +
        '.setting-label{color:#333!important}' +
        '.setting-desc{color:#aaa!important}' +
        'input,select,textarea{background:#f5f6f8!important;color:#333!important;border-color:#e4e6ea!important}' +
        'input:focus,select:focus,textarea:focus{background:#fff!important;border-color:#aaa!important;color:#111!important}' +
        '.form-group label{color:#888!important}' +
        '.ink-btn-primary{background:#3b5998!important;color:#fff!important}' +
        '.ink-btn-secondary{background:#f0f2f5!important;color:#555!important}' +
        '.ink-btn-danger{background:#d94545!important;color:#fff!important}' +
        '.ink-btn-outline{color:#666!important;border-color:#ddd!important}' +
        '.ink-btn-outline:hover{border-color:#999!important;color:#333!important}' +
        '.modal{background:rgba(0,0,0,0.3)!important}' +
        '.modal-content{background:#fff!important}' +
        '.modal-header{border-color:#f0f1f4!important}' +
        '.modal-title{color:#333!important}' +
        '.modal-body{color:#666!important}' +
        '.toast{background:#333!important;color:#fff!important}' +
        '.theme-chip{color:#666!important}' +
        '.theme-chip.water{background:#f8f7f5!important;color:#333!important}' +
        '.theme-chip.light{background:#f0f2f5!important;color:#333!important}' +
        '.theme-chip.dark{background:#333!important;color:#fff!important}' +
        '.theme-chip.active{border-color:#3b5998!important}' +
        '.lang-chip{color:#666!important;background:#f5f6f8!important}' +
        '.lang-chip.active{border-color:#3b5998!important;color:#333!important}' +
        'a{color:#666!important}a:hover{color:#333!important}' +
        '.total-budget{background:linear-gradient(135deg,#3b5998,#5575b5)!important}' +
        '.total-budget-label{color:rgba(255,255,255,0.9)!important}' +
        '.total-budget-amount{color:#fff!important}' +
        '.budget-card{background:#fafbfc!important;border-color:#f0f1f4!important}' +
        '.budget-name{color:#333!important}' +
        '.budget-spent{color:#333!important}' +
        '.month-display{color:#333!important}' +
        '.month-nav{background:#f5f6f8!important;color:#666!important;border-color:#e4e6ea!important}' +
        '.empty-state{color:#ccc!important}' +
        '.calendar-day{color:#555!important}' +
        '.calendar-day.today{background:#3b5998!important;color:#fff!important}' +
        '.filter-btn{background:#f5f6f8!important;color:#888!important;border-color:#e4e6ea!important}' +
        '.filter-btn.active{background:#3b5998!important;color:#fff!important}' +
        '.type-tabs button,.type-toggle button{background:#f5f6f8!important;color:#888!important}' +
        '.type-tabs button.active,.type-toggle button.active{background:#3b5998!important;color:#fff!important}' +
        '.ink-login-card{background:#fff!important}' +
        '.ink-login-logo{color:#333!important}' +
        '.ink-login-btn{background:#3b5998!important;color:#fff!important}' +
        '.ink-login-btn.alt{background:#f0f2f5!important;color:#555!important}' +
        '.ink-input{background:#f5f6f8!important;color:#333!important;border-color:#e4e6ea!important}' +
        '.ink-input:focus{background:#fff!important;border-color:#aaa!important}' +
        '::selection{background:#3b5998!important;color:#fff!important}';
    }

    if (css) {
        var style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ═══ JS 后处理：扫描 DOM 清除硬编码白色 ═══
    if (theme === 'dark') {
        var whitelist = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'HTML', 'BODY', 'SCRIPT', 'STYLE'];
        function isWhite(c) {
            if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') return false;
            if (c === '#fff' || c === '#ffffff' || c === '#FFF' || c === '#FFFFFF') return true;
            if (c.indexOf('rgb(255, 255, 255') === 0 || c.indexOf('rgb(255,255,255') === 0) return true;
            if (c.indexOf('rgba(255, 255, 255') === 0 || c.indexOf('rgba(255,255,255') === 0) return true;
            return false;
        }
        function isLight(c) {
            if (!c || c === 'transparent') return false;
            if (c === '#fafafa' || c === '#FAFAFA' || c === '#f5f5f5' || c === '#F5F5F5' ||
                c === '#f8f7f5' || c === '#F8F7F5' || c === '#f0f0f0' || c === '#F0F0F0' ||
                c === '#eee' || c === '#EEE' || c === '#f9f9f9' || c === '#F9F9F9' ||
                c === '#f4f4f4' || c === '#F4F4F4' || c === '#fcfcfc' || c === '#FCFCFC') return true;
            if (c.indexOf('rgb(24') === 0 || c.indexOf('rgb(25') === 0) return false;
            if (c.indexOf('rgb(240') === 0 || c.indexOf('rgb(245') === 0 || c.indexOf('rgb(250') === 0) return true;
            return false;
        }
        function isLightBorder(c) {
            if (!c) return false;
            return c === '#eee' || c === '#EEE' || c === '#f0f0f0' || c === '#F0F0F0' ||
                   c === '#f5f5f5' || c === '#F5F5F5' || c === '#ddd' || c === '#DDD' ||
                   c === '#e0e0e0' || c === '#E0E0E0' || c === '#e8e8e8' || c === '#E8E8E8';
        }
        function toDarkBg() { return '#1e1e2e'; }
        function toDarkBorder() { return '#2a2a3c'; }
        function toDarkText() { return '#ccc'; }

        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function patchDOM() {
                var all = document.querySelectorAll('*');
                for (var i = 0; i < all.length; i++) {
                    var el = all[i];
                    if (whitelist.indexOf(el.tagName) >= 0) continue;
                    var st = el.style;
                    var bg = (st.backgroundColor || st.background || '').toLowerCase().replace(/\s/g, '');
                    var bd = (st.borderColor || '').toLowerCase().replace(/\s/g, '');
                    var cl = (st.color || '').toLowerCase().replace(/\s/g, '');

                    if (isWhite(bg) || isLight(bg)) {
                        st.backgroundColor = toDarkBg();
                    }
                    if (isLightBorder(bd)) {
                        st.borderColor = toDarkBorder();
                    }
                    if (bg && (bg === '#333' || bg === '#333333' || bg === 'rgb(51,51,51)')) {
                        st.color = toDarkText();
                    }
                }
                // 第二轮：修正卡片内需要保留深色的子元素
                var cards = document.querySelectorAll('.ink-card,.budget-card,.modal-content');
                for (var j = 0; j < cards.length; j++) {
                    var c = cards[j].style;
                    if (!c.backgroundColor || isWhite(c.backgroundColor) || isLight(c.backgroundColor)) {
                        c.backgroundColor = toDarkBg();
                    }
                }
            }, 200);
        });
    }
})();
