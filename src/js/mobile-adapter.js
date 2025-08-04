// mobile-adapter.js - 移动端适配管理器
// 依赖: logger.js, mobile.css, HTML导航结构
// 功能: 设备检测、CSS类应用、导航状态同步、模块过滤、响应式处理
// 全局: window.MobileAdapter

// 移动端适配管理器
class MobileAdapter {
    constructor() {
        // 配置参数
        this.config = {
            mobileBreakpoint: 768, // 移动端断点（像素）
            smallMobileBreakpoint: 480, // 小屏幕移动端断点
        };

        // 状态变量
        this.state = {
            isMobile: false,
            isSmallMobile: false,
            currentWidth: window.innerWidth,
        };

        // DOM元素缓存
        this.elements = {};

        // 初始化
        this.init();
    }

    /**
     * 初始化移动端适配
     */
    init() {
        window.logger?.system('初始化移动端适配');
        
        // 等待DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setup();
            });
        } else {
            this.setup();
        }
    }

    /**
     * 设置移动端适配
     */
    setup() {
        // 缓存DOM元素
        this.cacheElements();
        
        // 检测设备类型
        this.detectDeviceType();
        
        // 应用初始适配
        this.applyAdaptation();
        
        // 添加事件监听
        this.addEventListeners();
        
        // 设置移动端导航
        this.setupMobileNavigation();
        
        // 同步导航状态
        this.syncNavigationState();
        
        window.logger?.system('移动端适配初始化完成');
    }

    /**
     * 缓存常用DOM元素，提高性能
     */
    cacheElements() {
        this.elements = {
            body: document.body,
            header: document.querySelector('header'),
            mobileNav: document.querySelector('.mobile-nav'),
            mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
            sidebar: document.getElementById('sidebar'),
            sidebarCategories: document.querySelectorAll('.category'),
            content: document.querySelector('.content'),
            mainContainer: document.querySelector('.main-container'),
            moduleGrid: document.getElementById('moduleGrid'),
            moduleCards: document.querySelectorAll('.module-card'),
        };

        if (window.logger?.isDevelopment) {
            window.logger.debug('DOM元素缓存完成', {
                mobileNavItems: this.elements.mobileNavItems.length,
                sidebarCategories: this.elements.sidebarCategories.length,
                moduleCards: this.elements.moduleCards.length
            });
        }
    }

    /**
     * 检测设备类型和屏幕方向
     */
    detectDeviceType() {
        const width = window.innerWidth;
        
        // 更新状态
        this.state.currentWidth = width;
        this.state.isMobile = width <= this.config.mobileBreakpoint;
        this.state.isSmallMobile = width <= this.config.smallMobileBreakpoint;
        
        // 记录设备信息
        if (window.logger?.isDevelopment) {
            window.logger.debug(`设备检测: ${width}px, ${this.state.isMobile ? '移动端' : '桌面端'}`);
        }
    }

    /**
     * 应用适配
     */
    applyAdaptation() {
        // 添加设备类型标记到body
        if (this.state.isMobile) {
            this.elements.body.classList.add('mobile-device');
            
            if (this.state.isSmallMobile) {
                this.elements.body.classList.add('small-mobile-device');
            } else {
                this.elements.body.classList.remove('small-mobile-device');
            }
        } else {
            this.elements.body.classList.remove('mobile-device', 'small-mobile-device');
        }
        
        if (window.logger?.isDevelopment) {
            window.logger.debug(`已应用${this.state.isMobile ? '移动端' : '桌面端'}适配`);
        }
    }

    /**
     * 设置移动端导航
     */
    setupMobileNavigation() {
        if (!this.elements.mobileNavItems || this.elements.mobileNavItems.length === 0) {
            window.logger?.warn('未找到移动端导航项');
            return;
        }

        // 为每个移动端导航项添加点击事件
        this.elements.mobileNavItems.forEach((item, index) => {
            // 移除之前可能存在的事件监听器
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // 添加新的事件监听器
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const categoryType = newItem.dataset.category;
                if (window.logger?.isDevelopment) {
                    window.logger.debug(`移动端导航点击: ${categoryType}`);
                }
                
                // 更新移动端导航状态
                this.updateMobileNavState(categoryType);
                
                // 同步PC端侧边栏状态
                this.updateSidebarState(categoryType);
                
                // 过滤模块
                this.filterModules(categoryType);
                
                // 更新内容标题
                this.updateContentTitle(categoryType);
            });
        });

        // 更新缓存的移动端导航项
        this.elements.mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    }

    /**
     * 更新移动端导航状态
     * @param {string} categoryType - 分类类型
     */
    updateMobileNavState(categoryType) {
        this.elements.mobileNavItems.forEach(item => {
            if (item.dataset.category === categoryType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.debug(`移动端导航状态更新: ${categoryType}`);
        }
    }

    /**
     * 更新PC端侧边栏状态
     * @param {string} categoryType - 分类类型
     */
    updateSidebarState(categoryType) {
        this.elements.sidebarCategories.forEach(category => {
            if (category.dataset.category === categoryType) {
                category.classList.add('active');
            } else {
                category.classList.remove('active');
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.debug(`PC端侧边栏状态更新: ${categoryType}`);
        }
    }

    /**
     * 过滤模块卡片
     * @param {string} categoryType - 分类类型
     */
    filterModules(categoryType) {
        let visibleCount = 0;
        
        this.elements.moduleCards.forEach(card => {
            const cardCategory = card.dataset.category;
            
            if (categoryType === 'all') {
                // 显示所有模块
                card.style.display = 'block';
                visibleCount++;
            } else if (categoryType === cardCategory) {
                // 显示匹配的模块
                card.style.display = 'block';
                visibleCount++;
            } else {
                // 隐藏不匹配的模块
                card.style.display = 'none';
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.debug(`模块过滤完成: ${categoryType}, 显示 ${visibleCount} 个模块`);
        }
    }

    /**
     * 更新内容标题
     * @param {string} categoryType - 分类类型
     */
    updateContentTitle(categoryType) {
        const contentTitle = document.querySelector('.content-title');
        const contentSubtitle = document.querySelector('.content-subtitle');
        
        if (!contentTitle || !contentSubtitle) return;
        
        // 标题映射
        const titleMap = {
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
        
        const titleInfo = titleMap[categoryType] || titleMap['all'];
        contentTitle.textContent = titleInfo.title;
        contentSubtitle.textContent = titleInfo.subtitle;
        
        if (window.logger?.isDevelopment) {
            window.logger.debug(`内容标题更新: ${titleInfo.title}`);
        }
    }

    /**
     * 同步导航状态
     */
    syncNavigationState() {
        // 获取PC端当前激活的分类
        let activeCategory = document.querySelector('.category.active');
        let activeCategoryType = 'all'; // 默认为"全部"
        
        if (activeCategory) {
            activeCategoryType = activeCategory.dataset.category;
        } else {
            // 如果没有激活的分类，默认激活"全部"分类
            const allCategory = document.querySelector('.category[data-category="all"]');
            if (allCategory) {
                allCategory.classList.add('active');
                activeCategoryType = 'all';
                if (window.logger?.isDevelopment) {
                    window.logger.debug('默认激活"全部"分类');
                }
            }
        }
        
        // 同步到移动端导航
        this.updateMobileNavState(activeCategoryType);
        
        // 确保模块显示正确
        this.filterModules(activeCategoryType);
        
        // 更新内容标题
        this.updateContentTitle(activeCategoryType);
        
        if (window.logger?.isDevelopment) {
            window.logger.debug(`导航状态同步完成: ${activeCategoryType}`);
        }
    }

    /**
     * 设置PC端侧边栏同步（不影响原有功能）
     */
    setupSidebarSync() {
        // 获取所有PC端侧边栏分类头部
        const sidebarHeaders = document.querySelectorAll('.category-header');
        
        sidebarHeaders.forEach((header, index) => {
            // 不要替换原有的DOM元素，只添加额外的事件监听器
            header.addEventListener('click', () => {
                const category = header.closest('.category');
                if (!category) return;
                
                const categoryType = category.dataset.category;
                if (window.logger?.isDevelopment) {
                    window.logger.debug(`PC端侧边栏点击: ${categoryType}`);
                }
                
                // 延迟执行，确保原有的PC端逻辑先执行
                setTimeout(() => {
                    // 同步到移动端导航
                    this.updateMobileNavState(categoryType);
                    
                    // 确保模块过滤正确执行
                    this.filterModules(categoryType);
                    
                    // 更新内容标题
                    this.updateContentTitle(categoryType);
                }, 50);
            });
        });
    }

    /**
     * 添加事件监听
     */
    addEventListeners() {
        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 监听设备方向变化
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        // 设置PC端侧边栏同步
        this.setupSidebarSync();
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 检测设备类型
        this.detectDeviceType();
        
        // 应用适配
        this.applyAdaptation();
        
        // 重新同步导航状态
        this.syncNavigationState();
    }

    /**
     * 处理设备方向变化
     */
    handleOrientationChange() {
        // 延迟执行，确保方向变化完成
        setTimeout(() => {
            // 检测设备类型
            this.detectDeviceType();
            
            // 应用适配
            this.applyAdaptation();
            
            // 重新同步导航状态
            this.syncNavigationState();
        }, 300);
    }
}

// 创建移动端适配器实例
let mobileAdapter;

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mobileAdapter = new MobileAdapter();
    });
} else {
    mobileAdapter = new MobileAdapter();
}

// 导出移动端适配器（可选，用于其他模块引用）
window.MobileAdapter = MobileAdapter;