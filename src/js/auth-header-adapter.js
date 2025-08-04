// auth-header-adapter.js - 认证头部组件适配器
// 依赖: auth-header.js, authManager, formValidator, showError
// 功能: 组件事件转发、状态同步、模态框管理、DOM监听
// 全局: window.authHeaderAdapter

class AuthHeaderAdapter {
    constructor() {
        this.isInitialized = false;
        this.authHeaders = [];
    }

    init() {
        if (this.isInitialized) return;

        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAdapters());
        } else {
            this.setupAdapters();
        }

        this.isInitialized = true;
    }

    setupAdapters() {
        // 查找所有auth-header组件
        const authHeaders = document.querySelectorAll('auth-header');
        
        authHeaders.forEach(header => {
            this.setupHeaderAdapter(header);
        });

        // 监听动态添加的auth-header组件
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'AUTH-HEADER') {
                            this.setupHeaderAdapter(node);
                        } else {
                            const headers = node.querySelectorAll('auth-header');
                            headers.forEach(header => this.setupHeaderAdapter(header));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupHeaderAdapter(header) {
        if (header.dataset.adapterSetup) return; // 避免重复设置
        header.dataset.adapterSetup = 'true';

        // 监听登录点击事件
        header.addEventListener('auth-login-click', (e) => {
            this.handleLoginClick(e);
        });

        // 监听注册点击事件
        header.addEventListener('auth-register-click', (e) => {
            this.handleRegisterClick(e);
        });

        // 监听登出点击事件
        header.addEventListener('auth-logout-click', (e) => {
            this.handleLogoutClick(e);
        });

        this.authHeaders.push(header);
    }

    handleLoginClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // 只在开发环境输出调试日志
        if (window.logger?.isDevelopment) {
            window.logger.debug('登录按钮被点击');
        }

        // 方法1：直接调用authManager的方法（如果存在）
        if (window.authManager && typeof window.authManager.showLoginModal === 'function') {
            window.authManager.showLoginModal();
            return;
        }

        // 方法2：触发现有的登录模态框
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'flex';
            loginModal.classList.add('show');
            
            // 清除表单验证
            if (window.formValidator) {
                window.formValidator.clearFormValidation('loginForm');
            }
            
            // 清除登录错误提示
            if (window.authManager) {
                window.authManager.hideLoginError();
                window.authManager.initLoginButtonState();
            }

        } else {
            // 错误日志在生产环境也会输出
            window.logger?.error('未找到登录模态框元素');
            // 简洁明确的错误提示：网站账号系统问题
            if (window.showError) {
                window.showError('<span class="error-code">[错误101]</span> 账号系统异常，无法打开登录窗口。如刷新后依然有问题，请联系我们。', 5000);
            } else {
                // 如果通知系统不可用，使用原生alert
                alert('[错误101] 账号系统异常，无法打开登录窗口。如刷新后依然有问题，请联系我们。');
            }
        }
    }

    handleRegisterClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // 只在开发环境输出调试日志
        if (window.logger?.isDevelopment) {
            window.logger.debug('注册按钮被点击');
        }

        // 方法1：直接调用authManager的方法（如果存在）
        if (window.authManager && typeof window.authManager.showRegisterModal === 'function') {
            window.authManager.showRegisterModal();
            return;
        }

        // 方法2：触发现有的注册界面
        const registerOverlay = document.getElementById('registerOverlay');
        if (registerOverlay) {
            // 先移除active类，确保重新添加时能触发显示
            registerOverlay.classList.remove('active');
            // 使用setTimeout确保DOM更新完成
            setTimeout(() => {
                registerOverlay.style.display = 'flex';
                registerOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 10);
            
            // 清除表单验证
            if (window.formValidator) {
                window.formValidator.clearFormValidation('registerForm');
                window.formValidator.initRegisterButtonState();
            }
        } else {
            // 错误日志在生产环境也会输出
            window.logger?.error('未找到注册覆盖层元素');
            // 简洁明确的错误提示：网站账号系统问题
            if (window.showError) {
                window.showError('<span class="error-code">[错误102]</span> 账号系统异常，无法打开注册窗口。如刷新后依然有问题，请联系我们。', 5000);
            } else {
                // 如果通知系统不可用，使用原生alert
                alert('[错误102] 账号系统异常，无法打开注册窗口。如刷新后依然有问题，请联系我们。');
            }
        }
    }

    handleLogoutClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // 调用现有的登出方法
        if (window.authManager) {
            window.authManager.logout();
        }
    }

    // 更新所有auth-header组件的状态
    updateAllHeaders(user) {
        // 只在开发环境输出调试日志
        if (window.logger?.isDevelopment) {
            window.logger.debug('开始更新认证组件状态', { count: this.authHeaders.length });
        }
        
        this.authHeaders.forEach((header, index) => {
            // 检查组件是否仍然存在于DOM中
            if (!document.contains(header)) {
                return;
            }
            
            // 使用正确的方法名 setAuthState
            if (typeof header.setAuthState === 'function') {
                header.setAuthState(true, user);
            } else {
                // 错误日志在生产环境也会输出
                window.logger?.error(`认证组件 ${index + 1} 缺少 setAuthState 方法`);
            }
        });
        
        // 只在开发环境输出调试日志
        if (window.logger?.isDevelopment) {
            window.logger.debug('认证组件状态更新完成');
        }
    }

    // 获取当前用户
    getCurrentUser() {
        if (window.authManager) {
            return window.authManager.getCurrentUser();
        }
        return null;
    }

    // 检查是否已登录
    isLoggedIn() {
        if (window.authManager) {
            return window.authManager.isLoggedIn();
        }
        return false;
    }
}

// 创建全局适配器实例
window.authHeaderAdapter = new AuthHeaderAdapter();

// 自动初始化
window.authHeaderAdapter.init();

// 使用新的认证同步管理器
if (window.authSyncManager) {
    window.authSyncManager.onAuthChange((user) => {
        window.authHeaderAdapter.updateAllHeaders(user);
    });
} else {
    // 等待认证同步管理器加载
    const checkAuthSyncManager = () => {
        if (window.authSyncManager) {
            window.authSyncManager.onAuthChange((user) => {
                window.authHeaderAdapter.updateAllHeaders(user);
            });
        } else {
            setTimeout(checkAuthSyncManager, 100);
        }
    };
    checkAuthSyncManager();
}

// 备用：如果同步管理器不可用，使用原有的认证管理器
if (!window.authSyncManager && window.authManager) {
    window.authManager.onAuthChange((user) => {
        window.authHeaderAdapter.updateAllHeaders(user);
    });
}
