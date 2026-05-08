// 水墨风格页面过渡动画

class InkTransition {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        // 创建过渡遮罩层
        this.createOverlay();
        
        // 为所有导航链接添加点击事件
        this.setupNavigation();
        
        // 为按钮添加水墨波纹效果
        this.setupRippleEffect();
        
        // 页面加载完成后显示内容
        this.showPageContent();
        
        // 随机生成水墨滴落效果
        this.createRandomDrips();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'ink-transition-overlay';
        this.overlay.innerHTML = `
            <div class="ink-splash-container">
                <div class="ink-splash"></div>
                <div class="ink-splash"></div>
                <div class="ink-splash"></div>
                <div class="ink-logo">墨记</div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    setupNavigation() {
        // 拦截所有导航链接点击
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.href.startsWith('javascript:')) {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && href.endsWith('.html')) {
                    e.preventDefault();
                    this.navigateTo(href);
                }
            }
        });
    }

    navigateTo(url) {
        // 显示过渡动画
        this.showOverlay();
        
        // 延迟跳转让动画播放
        setTimeout(() => {
            window.location.href = url;
        }, 800);
    }

    showOverlay() {
        // 重置动画
        const splashElements = this.overlay.querySelectorAll('.ink-splash');
        splashElements.forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // 触发重排
            el.style.animation = null;
        });
        
        const logo = this.overlay.querySelector('.ink-logo');
        logo.style.animation = 'none';
        logo.offsetHeight;
        logo.style.animation = null;
        
        // 显示遮罩层
        this.overlay.classList.add('active');
    }

    showPageContent() {
        // 为主内容添加淡入动画
        const mainContent = document.querySelector('.main-content') || 
                           document.getElementById('mainContent') ||
                           document.body.firstElementChild;
        
        if (mainContent) {
            mainContent.classList.add('ink-page-content');
        }
    }

    setupRippleEffect() {
        // 为所有按钮添加水墨波纹效果
        const buttons = document.querySelectorAll('.ink-btn, .back-btn, .copy-btn, .action-btn');
        
        buttons.forEach(button => {
            button.classList.add('ink-ripple');
            
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
    }

    createRipple(e, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ink-ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        // 移除波纹元素
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    createRandomDrips() {
        // 页面加载时随机生成几个水墨滴落效果
        const createDrip = () => {
            const drip = document.createElement('div');
            drip.className = 'ink-drip';
            drip.style.left = Math.random() * 100 + '%';
            drip.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(drip);
            
            // 动画结束后移除
            setTimeout(() => {
                drip.remove();
            }, 1500);
        };
        
        // 初始创建3个
        for (let i = 0; i < 3; i++) {
            setTimeout(createDrip, i * 200);
        }
        
        // 每隔一段时间随机创建
        setInterval(() => {
            if (Math.random() > 0.7) {
                createDrip();
            }
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new InkTransition();
});

// 监听页面离开事件，显示过渡动画
window.addEventListener('beforeunload', (e) => {
    const overlay = document.querySelector('.ink-transition-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
});
