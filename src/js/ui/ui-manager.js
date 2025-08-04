// ui-manager.js - UI交互管理模块
// 功能: 分类筛选、模块卡片交互、响应式布局、隐私同意管理、搜索功能
// 依赖: DOM操作，与HTML结构紧密相关
// 全局: window.uiManager

class UIManager {
    constructor() {
        this.currentFilter = 'all';
        this.isMobileMenuOpen = false;
        this.privacyConsentKey = 'omvian_privacy_consent';
        this.privacyConsentVersion = '1.0';
    }

    // 初始化UI管理器
    init() {
        this.setupCategoryListeners();
        this.setupModuleCardListeners();
        this.setupMobileMenu();
        this.setupResponsiveHandlers();
        this.initPrivacyConsent();
    }

    // 初始化隐私同意功能
    initPrivacyConsent() {
        // 检查是否需要显示隐私同意横幅
        if (this.shouldShowPrivacyConsent()) {
            // 延迟显示，确保页面完全加载
            setTimeout(() => {
                this.showPrivacyConsent();
            }, 1000);
        }
    }

    // 检查是否应该显示隐私同意横幅
    shouldShowPrivacyConsent() {
        // 检查是否已有隐私同意记录
        const consent = localStorage.getItem(this.privacyConsentKey);
        if (consent) {
            try {
                const consentData = JSON.parse(consent);
                // 如果版本匹配，不显示横幅
                if (consentData.version === this.privacyConsentVersion) {
                    return false;
                }
            } catch (error) {
                window.logger?.warn('隐私同意数据解析失败:', error);
            }
        }

        // 检查是否有用户数据（如果用户已登录，说明不是首次访问）
        const userData = localStorage.getItem('user_data');
        const authState = localStorage.getItem('omvian_auth_state');
        
        // 如果用户已登录或有认证状态，不显示隐私横幅
        if (userData || authState) {
            // 自动设置隐私同意（因为用户已经在使用服务）
            this.setPrivacyConsent({
                necessary: true,
                functional: true,
                analytics: true,
                personalization: true
            });
            return false;
        }

        return true;
    }

    // 显示隐私同意横幅
    showPrivacyConsent() {
        // 创建隐私同意横幅
        const banner = document.createElement('div');
        banner.id = 'privacyConsentBanner';
        banner.className = 'privacy-consent-banner';
        
        banner.innerHTML = `
            <div class="privacy-banner-content">
                <div class="privacy-banner-text">
                    <h3>让您的浏览体验更顺畅</h3>
                    <p>为了让您的浏览体验更顺畅，我们会使用一种叫 <strong>Cookie</strong> 的技术。它可以帮助您保持登录状态、记住您的偏好（比如语言或主题），还能帮我们了解哪些功能最受欢迎，以便不断优化网站。您可以选择<strong>接受所有</strong> Cookie，也可以通过"管理设置"只开启必要的部分。</p>
                    <p class="privacy-link-text">想了解更多？欢迎查看我们的：<a href="pages/privacy/privacy.html" target="_blank" style="color: #BB86FC; text-decoration: underline; font-weight: 500;">隐私声明</a></p>
                </div>
                <div class="privacy-banner-actions">
                    <button id="acceptAllBtn" class="privacy-btn privacy-btn-accept">我接受</button>
                    <button id="rejectAllBtn" class="privacy-btn privacy-btn-reject">全部拒绝</button>
                    <button id="manageSettingsBtn" class="privacy-btn privacy-btn-manage">管理设置</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // 绑定事件
        this.bindPrivacyEvents();
    }

    // 绑定隐私横幅事件
    bindPrivacyEvents() {
        const acceptBtn = document.getElementById('acceptAllBtn');
        const rejectBtn = document.getElementById('rejectAllBtn');
        const manageBtn = document.getElementById('manageSettingsBtn');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.setPrivacyConsent({
                    necessary: true,
                    functional: true,
                    analytics: true,
                    personalization: true
                });
                this.hidePrivacyBanner();
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                this.setPrivacyConsent({
                    necessary: true,
                    functional: false,
                    analytics: false,
                    personalization: false
                });
                this.hidePrivacyBanner();
            });
        }

        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                this.showPrivacySettings();
            });
        }
    }

    // 设置隐私同意
    setPrivacyConsent(settings) {
        const consentData = {
            version: this.privacyConsentVersion,
            timestamp: new Date().toISOString(),
            settings: settings
        };

        localStorage.setItem(this.privacyConsentKey, JSON.stringify(consentData));
        
        // 应用隐私设置
        this.applyPrivacySettings(settings);
    }

    // 应用隐私设置
    applyPrivacySettings(settings) {
        // 确保Cookie管理器已加载
        if (!window.cookieManager) {
            window.logger?.error('Cookie管理器未加载，无法应用隐私设置');
            return;
        }

        if (window.logger?.isDevelopment) {
            window.logger.cookie('应用隐私设置', settings);
        }

        // 更新Cookie管理器的同意设置
        window.cookieManager.updateConsentSettings(settings);
        
        // 根据用户选择启用/禁用对应的Cookie
        if (settings.analytics) {
            window.cookieManager.enableAnalyticsCookies();
        } else {
            window.cookieManager.disableAnalyticsCookies();
        }

        if (settings.personalization) {
            window.cookieManager.enablePersonalizationCookies();
        } else {
            window.cookieManager.disablePersonalizationCookies();
        }

        if (settings.functional) {
            window.cookieManager.enableFunctionalCookies();
        } else {
            window.cookieManager.disableFunctionalCookies();
        }

        // 显示当前Cookie状态（仅开发环境）
        const cookieStatus = window.cookieManager.getCookieStatus();
        if (window.logger?.isDevelopment) {
            window.logger.debug('当前Cookie状态', cookieStatus);
        }
    }

    // 隐藏隐私横幅
    hidePrivacyBanner() {
        const banner = document.getElementById('privacyConsentBanner');
        
        if (banner) {
            banner.classList.add('privacy-banner-hiding');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    // 显示隐私设置详情
    showPrivacySettings() {
        // 创建隐私设置模态框
        const modal = document.createElement('div');
        modal.className = 'privacy-settings-modal';
        modal.innerHTML = `
            <div class="privacy-settings-content">
                <div class="privacy-settings-header">
                    <h3>隐私设置</h3>
                    <button class="close-btn" id="closePrivacySettings">×</button>
                </div>
                <div class="privacy-settings-body">
                    <div class="privacy-category">
                        <h4>必要功能</h4>
                        <p>网站正常运行所必需的功能，无法禁用。</p>
                        <label class="privacy-switch">
                            <input type="checkbox" checked disabled>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="privacy-category">
                        <h4>功能性增强</h4>
                        <p>记住您的偏好设置，提供更好的用户体验。</p>
                        <label class="privacy-switch">
                            <input type="checkbox" id="functionalToggle" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="privacy-category">
                        <h4>使用分析</h4>
                        <p>帮助我们了解网站使用情况，改进服务质量。</p>
                        <label class="privacy-switch">
                            <input type="checkbox" id="analyticsToggle" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="privacy-category">
                        <h4>个性化设置</h4>
                        <p>根据您的使用习惯提供个性化内容和推荐。</p>
                        <label class="privacy-switch">
                            <input type="checkbox" id="personalizationToggle" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="privacy-settings-footer">
                    <a href="pages/privacy/privacy.html" target="_blank" class="privacy-policy-link">查看完整隐私政策</a>
                    <div class="privacy-settings-actions">
                        <button id="rejectAllPrivacySettings" class="privacy-btn privacy-btn-reject">全部拒绝</button>
                        <button id="acceptPrivacySettings" class="privacy-btn privacy-btn-accept">我接受</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        this.bindPrivacySettingsEvents(modal);
    }

    // 绑定隐私设置事件
    bindPrivacySettingsEvents(modal) {
        const closeBtn = modal.querySelector('#closePrivacySettings');
        const acceptBtn = modal.querySelector('#acceptPrivacySettings');
        const rejectBtn = modal.querySelector('#rejectAllPrivacySettings');
        
        const closeModal = () => {
            modal.remove();
            // 不要自动关闭横幅，只关闭设置弹窗
        };
        
        closeBtn.addEventListener('click', closeModal);
        
        // "我接受" - 根据用户当前选择的设置进行保存
        acceptBtn.addEventListener('click', () => {
            const settings = {
                necessary: true,
                functional: modal.querySelector('#functionalToggle').checked,
                analytics: modal.querySelector('#analyticsToggle').checked,
                personalization: modal.querySelector('#personalizationToggle').checked
            };
            
            this.setPrivacyConsent(settings);
            closeModal();
            
            if (window.showSuccess) {
                window.showSuccess('隐私设置已保存');
            }
        });
        
        // "全部拒绝" - 只保留必要Cookie，拒绝所有可选Cookie
        rejectBtn.addEventListener('click', () => {
            const settings = {
                necessary: true,
                functional: false,
                analytics: false,
                personalization: false
            };
            
            this.setPrivacyConsent(settings);
            closeModal();
            
            if (window.showInfo) {
                window.showInfo('已拒绝所有非必要Cookie');
            }
        });
        
        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // 设置分类点击事件
    setupCategoryListeners() {
        // 分类标题点击事件
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.parentElement;
                const categoryType = category.getAttribute('data-category');
                
                // 主要分类处理 - 直接显示对应模块
                if (['movie', 'music', 'tech', 'life'].includes(categoryType)) {
                    // 移除所有分类项的活动状态
                    document.querySelectorAll('.category-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // 显示对应分类的所有模块
                    this.filterModules(categoryType);
                } else if (categoryType === 'all') {
                    // 全部分类特殊处理 - 显示所有模块
                    document.querySelectorAll('.category-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // 显示所有模块
                    this.filterModules('all');
                } else {
                    // 其他分类保持原有行为 - 展开/折叠子菜单
                    category.classList.toggle('expanded');
                }
            });
        });

        // 分类项点击事件
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止事件冒泡
                
                // 移除所有活动状态
                document.querySelectorAll('.category-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                // 添加当前活动状态
                item.classList.add('active');

                // 获取筛选类别
                const filter = item.getAttribute('data-filter');
                this.filterModules(filter);
            });
        });
    }

    // 筛选模块卡片
    filterModules(filter) {
        const modules = document.querySelectorAll('.module-card');
        this.currentFilter = filter;

        if (filter === 'all') {
            // 显示所有模块
            modules.forEach(module => {
                module.style.display = 'flex';
                module.classList.add('fade-in');
            });
        } else {
            // 检查是否为分类筛选
            const isCategory = ['movie', 'music', 'tech', 'life'].includes(filter);

            if (isCategory) {
                // 显示该分类下的所有模块
                modules.forEach(module => {
                    if (module.getAttribute('data-category') === filter) {
                        module.style.display = 'flex';
                        module.classList.add('fade-in');
                    } else {
                        module.style.display = 'none';
                        module.classList.remove('fade-in');
                    }
                });
            } else {
                // 显示特定模块
                modules.forEach(module => {
                    if (module.getAttribute('data-module') === filter) {
                        module.style.display = 'flex';
                        module.classList.add('fade-in');
                    } else {
                        module.style.display = 'none';
                        module.classList.remove('fade-in');
                    }
                });
            }
        }

        // 更新内容标题
        this.updateContentTitle(filter);
    }

    // 更新内容区域标题
    updateContentTitle(filter) {
        const contentTitle = document.querySelector('.content-title');
        const contentSubtitle = document.querySelector('.content-subtitle');

        if (!contentTitle) return;

        const filterTitles = {
            'all': {
                title: '全部模块',
                subtitle: '探索所有可用的功能模块'
            },
            'review': {
                title: '测评中心',
                subtitle: '专业的影视作品评分和评论系统'
            },
            'psychology': {
                title: '心理测试',
                subtitle: '了解您的性格特点和心理状态'
            }
        };

        const titleInfo = filterTitles[filter] || filterTitles['all'];
        
        contentTitle.textContent = titleInfo.title;
        if (contentSubtitle) {
            contentSubtitle.textContent = titleInfo.subtitle;
        }
    }

    // 设置模块卡片点击事件
    setupModuleCardListeners() {
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 如果点击的是链接，不处理卡片点击
                if (e.target.closest('.module-link')) {
                    return;
                }

                const moduleTitle = card.querySelector('.module-title').textContent;
                const moduleCategory = card.getAttribute('data-category');
                const module = card.getAttribute('data-module');

                if (window.logger?.isDevelopment) {
                    window.logger.debug('打开模块', { title: moduleTitle, category: moduleCategory, id: module });
                }

                // 添加点击动画效果
                card.classList.add('clicked');
                setTimeout(() => {
                    card.classList.remove('clicked');
                }, 200);

                // 实际跳转到对应的子页面
                const moduleLink = card.querySelector('.module-link');
                if (moduleLink && moduleLink.href) {
                    // 使用模块链接中的href进行跳转
                    window.location.href = moduleLink.href;
                } else {
                    // 备用跳转方案：根据模块类型构建路径
                    let targetUrl = '';
                    if (module === 'review') {
                        targetUrl = 'pages/review/review.html';
                    } else if (module === 'mbti') {
                        targetUrl = 'pages/mbti/mbti.html';
                    } else {
                        // 通用路径构建
                        targetUrl = `pages/${module}/${module}.html`;
                    }
                    
                    if (targetUrl) {
                        window.location.href = targetUrl;
                    } else {
                        window.showInfo(`即将跳转到 ${moduleTitle} 模块`);
                    }
                }
            });

            // 添加悬停效果
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover');
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover');
            });
        });
    }

    // 设置移动端菜单
    setupMobileMenu() {
        // 移除菜单切换按钮创建代码，因为不需要汉堡菜单

        // 移动端菜单相关代码已移除，因为不需要汉堡菜单功能
    }

    // 设置响应式处理
    setupResponsiveHandlers() {
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 初始化时执行一次
        this.handleResize();
    }

    // 处理窗口大小变化
    handleResize() {
        // 更新卡片网格布局
        this.updateCardGridLayout();
    }

    // 更新卡片网格布局
    updateCardGridLayout() {
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid) return;

        const screenWidth = window.innerWidth;
        
        // 根据屏幕宽度调整网格列数，保持固定280px尺寸
        if (screenWidth >= 1200) {
            cardGrid.style.gridTemplateColumns = 'repeat(auto-fill, 280px)';
        } else if (screenWidth >= 768) {
            cardGrid.style.gridTemplateColumns = 'repeat(auto-fill, 280px)';
        } else {
            cardGrid.style.gridTemplateColumns = '280px';
        }
    }

    // 添加页面滚动效果
    setupScrollEffects() {
        let lastScrollTop = 0;
        const header = document.querySelector('header');

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // 向下滚动时隐藏头部，向上滚动时显示
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }

            lastScrollTop = scrollTop;
        });
    }

    // 添加搜索功能
    setupSearch() {
        // 创建搜索框
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="searchInput" placeholder="搜索模块..." class="search-input">
            <i class="material-icons search-icon">search</i>
        `;

        // 插入到内容头部
        const contentHeader = document.querySelector('.content-header');
        if (contentHeader) {
            contentHeader.appendChild(searchContainer);
        }

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchModules(e.target.value);
            });
        }
    }

    // 搜索模块
    searchModules(query) {
        const modules = document.querySelectorAll('.module-card');
        const searchQuery = query.toLowerCase().trim();

        if (!searchQuery) {
            // 如果搜索为空，恢复当前筛选状态
            this.filterModules(this.currentFilter);
            return;
        }

        modules.forEach(module => {
            const title = module.querySelector('.module-title').textContent.toLowerCase();
            const description = module.querySelector('.module-description').textContent.toLowerCase();
            const category = module.querySelector('.module-category').textContent.toLowerCase();

            const isMatch = title.includes(searchQuery) || 
                          description.includes(searchQuery) || 
                          category.includes(searchQuery);

            if (isMatch) {
                module.style.display = 'flex';
                module.classList.add('fade-in');
            } else {
                module.style.display = 'none';
                module.classList.remove('fade-in');
            }
        });
    }

    // 获取当前筛选状态
    getCurrentFilter() {
        return this.currentFilter;
    }

    // 获取移动菜单状态
    isMobileMenuOpened() {
        return this.isMobileMenuOpen;
    }
}

// 创建全局UI管理器实例
window.uiManager = new UIManager();