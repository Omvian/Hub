// OmvianReview 子页面脚本 - 影视作品评论展示页面
/* 
 * ⚠️  修改此文件前必须阅读以下文档：
 * - .docs/js-architecture.md - JavaScript架构指南
 * 
 * 🎯 此文件职责：
 * - 影视作品的筛选、搜索和展示功能
 * - 分类标签切换和多维度筛选器
 * - 卡片交互（收藏、分享、查看详情）
 * - 搜索功能和结果动态更新
 * - 加载更多内容和滚动优化
 * 
 * 🔗 依赖关系：
 * - 无外部JS依赖，独立运行的子页面脚本
 * - 依赖pages/review/review.html的DOM结构
 * - 依赖pages/review/review.css的样式定义
 * - 使用简化版通知系统（不依赖主站notification-manager）
 * 
 * ⚠️ 重要提醒：
 * - 包含完整的影视作品筛选和搜索逻辑
 * - 支持键盘快捷键（Ctrl+K搜索，ESC清空）
 * - 具有滚动优化和页面性能优化
 * - 此文件为子页面独立脚本，修改不影响主站功能
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 OmvianReview 页面加载完成');
    
    // 延迟初始化，确保所有脚本都已加载
    setTimeout(() => {
        // 初始化认证系统
        initializeAuthSystem();
        
        // 初始化页面功能
        initializeFilters();
        initializeSearch();
        initializeCards();
        initializeLoadMore();
    }, 500);
});

// 初始化认证系统
function initializeAuthSystem() {
    try {
        console.log('🔧 开始初始化Review页面认证系统');
        
        // 检查是否为本地文件环境
        const isLocalFile = window.location.protocol === 'file:';
        if (isLocalFile) {
            console.log('⚠️ 检测到本地文件环境，使用简化认证模式');
            initializeLocalAuthSystem();
            return;
        }
        
        // 检查必要的全局对象是否存在
        if (typeof window.authManager === 'undefined') {
            console.error('❌ authManager 未找到');
            return;
        }
        
        if (typeof window.configManager === 'undefined') {
            console.error('❌ configManager 未找到');
            return;
        }
        
        // 等待配置管理器准备就绪（添加超时机制）
        let configWaitCount = 0;
        const maxConfigWait = 100; // 最多等待10秒
        
        const waitForConfig = () => {
            configWaitCount++;
            
            if (window.configManager && window.configManager.isReady()) {
                console.log('✅ 配置管理器已就绪，初始化认证系统');
                
                // 初始化认证管理器
                window.authManager.init();
                
                // 初始化其他管理器
                if (window.uiManager) {
                    window.uiManager.init();
                }
                
                if (window.formValidator) {
                    window.formValidator.init();
                }
                
                console.log('✅ Review页面认证系统初始化完成');
            } else if (configWaitCount >= maxConfigWait) {
                console.warn('⚠️ 配置管理器等待超时，切换到本地模式');
                initializeLocalAuthSystem();
            } else {
                console.log(`⏳ 等待配置管理器准备就绪... (${configWaitCount}/${maxConfigWait})`);
                setTimeout(waitForConfig, 100);
            }
        };
        
        waitForConfig();
        
    } catch (error) {
        console.error('❌ 认证系统初始化失败:', error);
        // 如果初始化失败，尝试本地模式
        initializeLocalAuthSystem();
    }
}

// 本地文件环境的简化认证系统
function initializeLocalAuthSystem() {
    console.log('🏠 初始化本地文件认证系统');
    
    // 设置基本的模态框事件监听器
    setupLocalModalEvents();
    
    // 显示本地环境提示 - 使用全局通知系统
    setTimeout(() => {
        if (window.showWarning) {
            window.showWarning('当前为本地文件模式，认证功能受限');
        } else {
            console.warn('当前为本地文件模式，认证功能受限');
        }
    }, 2000);
    
    console.log('✅ 本地认证系统初始化完成');
}

// 设置本地模态框事件
function setupLocalModalEvents() {
    // 登录模态框关闭事件
    const loginModal = document.getElementById('loginModal');
    const loginCloseBtn = loginModal?.querySelector('.close');
    
    if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            console.log('🔒 登录模态框已关闭');
        });
    }
    
    // 点击模态框外部关闭
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
                console.log('🔒 登录模态框已关闭（点击外部）');
            }
        });
    }
    
    // 注册模态框关闭事件
    const registerOverlay = document.getElementById('registerOverlay');
    const registerCloseBtn = document.getElementById('registerCloseBtn');
    
    if (registerCloseBtn) {
        registerCloseBtn.addEventListener('click', () => {
            registerOverlay.style.display = 'none';
            console.log('📝 注册模态框已关闭');
        });
    }
    
    // 登录表单提交事件（本地模式下显示提示）
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 使用全局通知系统
            if (window.showInfo) {
                window.showInfo('本地文件模式下无法进行真实登录，请部署到服务器环境');
            } else {
                showSimpleNotification('本地文件模式下无法进行真实登录，请部署到服务器环境', 'info');
            }
            console.log('ℹ️ 本地模式登录尝试');
        });
    }
    
    // 注册表单提交事件（本地模式下显示提示）
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 使用全局通知系统
            if (window.showInfo) {
                window.showInfo('本地文件模式下无法进行真实注册，请部署到服务器环境');
            } else {
                showSimpleNotification('本地文件模式下无法进行真实注册，请部署到服务器环境', 'info');
            }
            console.log('ℹ️ 本地模式注册尝试');
        });
    }
    
    console.log('🎛️ 本地模态框事件监听器已设置');
}

// 筛选功能初始化
function initializeFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const filterSelects = document.querySelectorAll('.filter-select');
    
    // 分类标签切换
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有活动状态
            filterTabs.forEach(t => t.classList.remove('active'));
            // 添加当前活动状态
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterReviews(category);
        });
    });
    
    // 下拉筛选器
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            applyAllFilters();
        });
    });
}

// 搜索功能初始化
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase().trim();
            searchReviews(searchTerm);
        }, 300);
    });
}

// 卡片交互初始化
function initializeCards() {
    const reviewCards = document.querySelectorAll('.review-card');
    
    reviewCards.forEach(card => {
        // 卡片点击事件
        card.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发卡片点击
            if (e.target.closest('.review-actions')) return;
            
            const title = this.querySelector('.review-title').textContent;
            console.log(`点击了影视作品: ${title}`);
            // 这里可以添加跳转到详情页的逻辑
        });
        
        // 收藏按钮
        const favoriteBtn = card.querySelector('.btn-icon[title="收藏"]');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFavorite(this);
            });
        }
        
        // 分享按钮
        const shareBtn = card.querySelector('.btn-icon[title="分享"]');
        if (shareBtn) {
            shareBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                shareReview(card);
            });
        }
        
        // 查看详情按钮
        const detailBtn = card.querySelector('.btn-secondary');
        if (detailBtn) {
            detailBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                viewDetails(card);
            });
        }
    });
}

// 加载更多功能初始化
function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreReviews();
        });
    }
}

// 筛选影视作品
function filterReviews(category) {
    const reviewCards = document.querySelectorAll('.review-card');
    
    reviewCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
            // 添加淡入动画
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 100);
        } else {
            card.style.display = 'none';
        }
    });
    
    updateResultsCount();
}

// 应用所有筛选条件
function applyAllFilters() {
    const activeTab = document.querySelector('.filter-tab.active');
    const category = activeTab ? activeTab.dataset.category : 'all';
    const genre = document.getElementById('genreFilter').value;
    const year = document.getElementById('yearFilter').value;
    const rating = document.getElementById('ratingFilter').value;
    
    const reviewCards = document.querySelectorAll('.review-card');
    
    reviewCards.forEach(card => {
        let shouldShow = true;
        
        // 分类筛选
        if (category !== 'all' && card.dataset.category !== category) {
            shouldShow = false;
        }
        
        // 类型筛选
        if (genre && card.dataset.genre !== genre) {
            shouldShow = false;
        }
        
        // 年份筛选
        if (year && card.dataset.year !== year) {
            shouldShow = false;
        }
        
        // 评分筛选
        if (rating) {
            const cardRating = parseFloat(card.dataset.rating);
            const minRating = parseFloat(rating.replace('+', ''));
            if (cardRating < minRating) {
                shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
    
    updateResultsCount();
}

// 搜索影视作品
function searchReviews(searchTerm) {
    const reviewCards = document.querySelectorAll('.review-card');
    
    reviewCards.forEach(card => {
        const title = card.querySelector('.review-title').textContent.toLowerCase();
        const summary = card.querySelector('.review-summary').textContent.toLowerCase();
        
        if (searchTerm === '' || title.includes(searchTerm) || summary.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    updateResultsCount();
}

// 更新结果数量显示
function updateResultsCount() {
    const visibleCards = document.querySelectorAll('.review-card[style*="display: block"], .review-card:not([style*="display: none"])');
    const totalCards = document.querySelectorAll('.review-card');
    
    console.log(`显示 ${visibleCards.length} / ${totalCards.length} 个影视作品`);
}

// 切换收藏状态
function toggleFavorite(btn) {
    const icon = btn.querySelector('i');
    const isFavorited = icon.textContent === 'favorite';
    
    if (isFavorited) {
        icon.textContent = 'favorite_border';
        btn.style.color = 'var(--text-secondary)';
        window.showInfo && window.showInfo('已取消收藏');
    } else {
        icon.textContent = 'favorite';
        btn.style.color = '#ff4757';
        window.showSuccess && window.showSuccess('已添加到收藏');
    }
}

// 分享影视作品
function shareReview(card) {
    const title = card.querySelector('.review-title').textContent;
    const rating = card.querySelector('.review-rating span').textContent;
    
    const shareText = `推荐一部好作品：${title} (评分: ${rating})`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: shareText,
            url: window.location.href
        }).then(() => {
            window.showSuccess && window.showSuccess('分享成功');
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

// 查看详情
function viewDetails(card) {
    const title = card.querySelector('.review-title').textContent;
    window.showInfo && window.showInfo(`正在加载《${title}》的详细信息...`);
    
    // 这里可以添加跳转到详情页或打开模态框的逻辑
    setTimeout(() => {
        window.showWarning && window.showWarning('详情页面开发中，敬请期待');
    }, 1000);
}

// 加载更多影视作品
function loadMoreReviews() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const originalText = loadMoreBtn.innerHTML;
    
    // 显示加载状态
    loadMoreBtn.innerHTML = '<i class="material-icons">hourglass_empty</i>加载中...';
    loadMoreBtn.disabled = true;
    
    // 模拟加载延迟
    setTimeout(() => {
        // 这里可以添加实际的数据加载逻辑
        window.showInfo && window.showInfo('暂无更多内容');
        
        // 恢复按钮状态
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;
    }, 1500);
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            window.showSuccess && window.showSuccess('已复制到剪贴板');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// 备用复制方法
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        window.showSuccess && window.showSuccess('已复制到剪贴板');
    } catch (err) {
        window.showError && window.showError('复制失败，请手动复制');
    }
    
    document.body.removeChild(textArea);
}

// 简化版通知函数（备用方案）
function showSimpleNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `simple-notification ${type}`;
    notification.textContent = message;
    
    // 添加样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // 根据类型设置背景色
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.background = colors[type] || colors.info;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 使用全局通知系统（优先）或简化版通知函数（备用）
// 优先使用 window.showSuccess, window.showError, window.showInfo, window.showWarning
// 这些函数由 notification-manager.js 提供，具有更美观的效果

// 页面滚动优化
let ticking = false;

function updateScrollEffects() {
    const scrollY = window.scrollY;
    const header = document.querySelector('.subpage-header');
    
    if (scrollY > 50) {
        header.style.background = 'rgba(26, 26, 26, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)';
        header.style.backdropFilter = 'blur(10px)';
    }
    
    ticking = false;
}

window.addEventListener('scroll', function() {
    if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
    }
});

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K 聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // ESC 清空搜索
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput === document.activeElement) {
            searchInput.value = '';
            searchInput.blur();
            searchReviews('');
        }
    }
});

console.log('🎬 OmvianReview 脚本初始化完成');