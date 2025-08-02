// ui-manager.js
// UI交互管理模块 - 负责页面交互、分类筛选、模块卡片等UI功能

class UIManager {
    constructor() {
        this.currentFilter = 'all';
        this.isMobileMenuOpen = false;
    }

    // 初始化UI管理器
    init() {
        this.setupCategoryListeners();
        this.setupModuleCardListeners();
        this.setupMobileMenu();
        this.setupResponsiveHandlers();
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
                title: '欢迎来到 OmvianHub',
                subtitle: '探索您感兴趣的各个领域内容'
            },
            'movie': {
                title: '影视内容',
                subtitle: '发现精彩的电影、电视剧和综艺节目'
            },
            'music': {
                title: '音乐世界',
                subtitle: '聆听美妙的音乐，发现优秀的艺术家'
            },
            'tech': {
                title: '科技前沿',
                subtitle: '了解最新的科技产品和技术趋势'
            },
            'life': {
                title: '生活方式',
                subtitle: '享受美好生活，发现生活中的乐趣'
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

                console.log('打开模块:', moduleTitle, '分类:', moduleCategory, '模块ID:', module);

                // 添加点击动画效果
                card.classList.add('clicked');
                setTimeout(() => {
                    card.classList.remove('clicked');
                }, 200);

                // 实际应用中，这里应该跳转到对应的子页面
                // 例如: window.location.href = `${moduleCategory}/${module}.html`;

                // 模拟跳转提示
                window.showInfo(`即将跳转到 ${moduleTitle} 模块`);
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
        // 创建菜单切换按钮
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="material-icons">menu</i>';
        menuToggle.setAttribute('aria-label', '切换菜单');

        // 插入到头部
        const header = document.querySelector('header');
        const logo = document.querySelector('.logo');
        if (header && logo) {
            header.insertBefore(menuToggle, logo.nextSibling);
        }

        // 菜单切换事件
        menuToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // 点击侧边栏外部关闭菜单
        // 点击侧边栏外部关闭菜单
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar) return; // 如果侧边栏不存在，直接返回
            
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isMenuToggle = e.target.closest('.menu-toggle');

            if (!isClickInsideSidebar && !isMenuToggle && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    // 切换移动端菜单
    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    // 打开移动端菜单
    openMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.querySelector('.menu-toggle');

        if (sidebar) {
            sidebar.classList.add('open');
            document.body.classList.add('menu-open');
            this.isMobileMenuOpen = true;

            // 更新按钮图标
            if (menuToggle) {
                menuToggle.innerHTML = '<i class="material-icons">close</i>';
            }
        }
    }

    // 关闭移动端菜单
    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.querySelector('.menu-toggle');

        if (sidebar) {
            sidebar.classList.remove('open');
            document.body.classList.remove('menu-open');
            this.isMobileMenuOpen = false;

            // 更新按钮图标
            if (menuToggle) {
                menuToggle.innerHTML = '<i class="material-icons">menu</i>';
            }
        }
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
        const isMobile = window.innerWidth <= 768;

        // 如果从移动端切换到桌面端，关闭移动菜单
        if (!isMobile && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }

        // 更新卡片网格布局
        this.updateCardGridLayout();
    }

    // 更新卡片网格布局
    updateCardGridLayout() {
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid) return;

        const screenWidth = window.innerWidth;
        
        // 根据屏幕宽度调整网格列数
        if (screenWidth >= 1200) {
            cardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
        } else if (screenWidth >= 768) {
            cardGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        } else {
            cardGrid.style.gridTemplateColumns = '1fr';
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