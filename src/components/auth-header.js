// auth-header.js - 认证头部Web Component组件
// 依赖: auth-header-adapter.js, localStorage认证数据
// 功能: 登录/注册按钮、用户信息显示、下拉菜单、状态同步、Shadow DOM封装
// 标签: <auth-header>

class AuthHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentUser = null;
        this.isLoggedIn = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    render() {
        // 完全按照原本的 auth-buttons 样式设计
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                
                /* 完全复制原本的 auth-buttons 样式 */
                .auth-buttons {
                    position: relative;
                    display: inline-flex;
                    background: rgba(30, 30, 40, 0.6);
                    padding: 6px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    gap: 4px;
                }

                .auth-buttons .btn {
                    border-radius: 8px;
                    padding: 10px 18px;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 75px;
                    justify-content: center;
                    text-decoration: none;
                }

                /* 统一的按钮基础样式 - 完全按照原本设计 */
                .btn-primary,
                .btn-secondary {
                    background: rgba(187, 134, 252, 0.1);
                    color: #BB86FC;
                    border: 1px solid rgba(187, 134, 252, 0.2);
                }

                /* 悬停效果 - 完全按照原本设计 */
                .auth-buttons .btn:not(:disabled):hover {
                    background: rgba(187, 134, 252, 0.2);
                    border-color: rgba(187, 134, 252, 0.4);
                    color: #ffffff;
                    transform: translateY(-1px);
                }

                /* 激活效果 - 完全按照原本设计 */
                .auth-buttons .btn:not(:disabled):active {
                    transform: translateY(0);
                    background: rgba(187, 134, 252, 0.15);
                }

                /* 按钮图标样式 */
                .auth-buttons .btn i {
                    font-size: 16px;
                }

                /* 用户信息样式 */
                .user-info {
                    position: relative;
                    display: inline-flex;
                    background: rgba(30, 30, 40, 0.6);
                    padding: 6px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .user-info:hover {
                    background: rgba(30, 30, 40, 0.8);
                    border-color: rgba(187, 134, 252, 0.3);
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #BB86FC, #A876E8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #121212;
                    font-weight: bold;
                    font-size: 14px;
                }

                .user-name {
                    color: #BB86FC;
                    font-size: 14px;
                    font-weight: 500;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dropdown-arrow {
                    color: rgba(187, 134, 252, 0.7);
                    font-size: 12px;
                    transition: transform 0.3s ease;
                }

                .user-info.open .dropdown-arrow {
                    transform: rotate(180deg);
                }

                /* 下拉菜单样式 */
                .user-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    background: rgba(30, 30, 40, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 8px 0;
                    min-width: 180px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(15px);
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .user-dropdown.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                }

                .dropdown-item:hover {
                    background: rgba(187, 134, 252, 0.1);
                    color: #BB86FC;
                }

                .dropdown-item i {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                }

                .dropdown-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 8px 0;
                }

                /* 隐藏状态 */
                .hidden {
                    display: none !important;
                }

                /* 响应式设计 */
                @media (max-width: 768px) {
                    .auth-buttons {
                        padding: 4px;
                    }
                    
                    .auth-buttons .btn {
                        padding: 8px 14px;
                        font-size: 13px;
                        min-width: 65px;
                    }
                    
                    .user-name {
                        max-width: 80px;
                    }
                }
            </style>
            
            <div class="auth-container">
                <!-- 初始状态：隐藏所有按钮，直到确认登录状态 -->
                <div class="auth-buttons hidden" id="authButtons">
                    <button class="btn btn-secondary" id="loginBtn">
                        <i class="fas fa-sign-in-alt"></i>
                        登录
                    </button>
                    <button class="btn btn-primary" id="registerBtn">
                        <i class="fas fa-user-plus"></i>
                        注册
                    </button>
                </div>
                
                <!-- 已登录状态：显示用户信息 -->
                <div class="user-info hidden" id="userInfo">
                    <div class="user-avatar" id="userAvatar">U</div>
                    <span class="user-name" id="userName">用户</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                    
                    <!-- 下拉菜单 -->
                    <div class="user-dropdown" id="userDropdown">
                        <button class="dropdown-item" id="profileBtn">
                            <i class="fas fa-user"></i>
                            个人资料
                        </button>
                        <button class="dropdown-item" id="settingsBtn">
                            <i class="fas fa-cog"></i>
                            设置
                        </button>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            退出登录
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const loginBtn = this.shadowRoot.getElementById('loginBtn');
        const registerBtn = this.shadowRoot.getElementById('registerBtn');
        const userInfo = this.shadowRoot.getElementById('userInfo');
        const userDropdown = this.shadowRoot.getElementById('userDropdown');
        const logoutBtn = this.shadowRoot.getElementById('logoutBtn');
        const profileBtn = this.shadowRoot.getElementById('profileBtn');
        const settingsBtn = this.shadowRoot.getElementById('settingsBtn');

        // 登录按钮点击事件
        loginBtn?.addEventListener('click', () => {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header组件：登录按钮被点击');
            }
            this.dispatchEvent(new CustomEvent('auth-login-click', {
                bubbles: true,
                detail: { action: 'login' }
            }));
        });

        // 注册按钮点击事件
        registerBtn?.addEventListener('click', () => {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header组件：注册按钮被点击');
            }
            this.dispatchEvent(new CustomEvent('auth-register-click', {
                bubbles: true,
                detail: { action: 'register' }
            }));
        });

        // 用户信息点击事件（切换下拉菜单）
        userInfo?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userInfo.classList.contains('open');
            
            if (isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        });

        // 退出登录
        logoutBtn?.addEventListener('click', () => {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header组件：退出登录按钮被点击');
            }
            this.dispatchEvent(new CustomEvent('auth-logout-click', {
                bubbles: true,
                detail: { action: 'logout' }
            }));
            this.closeDropdown();
        });

        // 个人资料
        profileBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('profile-click', {
                bubbles: true,
                detail: { action: 'profile' }
            }));
            this.closeDropdown();
        });

        // 设置
        settingsBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('settings-click', {
                bubbles: true,
                detail: { action: 'settings' }
            }));
            this.closeDropdown();
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', () => {
            this.closeDropdown();
        });

        // 禁用存储监听，完全依赖适配器的状态更新
        // 这样避免了与 auth-header-adapter 的状态冲突
        /*
        window.addEventListener('storage', (e) => {
            if (e.key === 'supabase.auth.token' || e.key === 'user_data' || e.key === 'omvian_auth_state') {
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 检测到认证状态变化', e.key);
                }
                this.checkAuthStatus();
            }
        });
        */

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 页面重新可见，检查认证状态');
                }
                this.checkAuthStatus();
            }
        });

        // 监听页面加载完成
        window.addEventListener('load', () => {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header: 页面加载完成，检查认证状态');
            }
            this.checkAuthStatus();
        });

        // 定期检查认证状态（每30秒）
        setInterval(() => {
            this.checkAuthStatus();
        }, 30000);
    }

    openDropdown() {
        const userInfo = this.shadowRoot.getElementById('userInfo');
        const userDropdown = this.shadowRoot.getElementById('userDropdown');
        
        userInfo?.classList.add('open');
        userDropdown?.classList.add('show');
    }

    closeDropdown() {
        const userInfo = this.shadowRoot.getElementById('userInfo');
        const userDropdown = this.shadowRoot.getElementById('userDropdown');
        
        userInfo?.classList.remove('open');
        userDropdown?.classList.remove('show');
    }

    checkAuthStatus() {
        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: checkAuthStatus 被调用');
        }
        
        // 从localStorage检查登录状态
        const authData = localStorage.getItem('supabase.auth.token');
        const userData = localStorage.getItem('user_data');
        
        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: checkAuthStatus 检查存储数据', {
                authData: !!authData,
                userData: !!userData,
                authDataValue: authData ? authData.substring(0, 50) + '...' : null,
                userDataValue: userData
            });
        }
        
        // 只要有用户数据就认为是登录状态，不需要同时检查 authData
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: checkAuthStatus 解析用户数据成功', user);
                }
                this.updateUserState(true, user);
            } catch (error) {
                window.logger?.error('auth-header: checkAuthStatus 解析用户数据失败:', error);
                // 解析失败时也不要立即设置为未登录，等待适配器处理
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: checkAuthStatus 解析失败，等待适配器状态更新');
                }
                
                // 解析失败时，显示登录按钮
                setTimeout(() => {
                    const authButtons = this.shadowRoot.getElementById('authButtons');
                    if (authButtons && authButtons.classList.contains('hidden')) {
                        authButtons.classList.remove('hidden');
                        if (window.logger?.isDevelopment) {
                            window.logger.debug('auth-header: 解析失败后显示登录按钮');
                        }
                    }
                }, 1000); // 延迟1秒显示，给适配器一些处理时间
            }
        } else {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header: checkAuthStatus 未找到用户数据，等待适配器状态更新');
            }
            
            // 未找到用户数据时，延迟显示登录按钮
            setTimeout(() => {
                const authButtons = this.shadowRoot.getElementById('authButtons');
                if (authButtons && authButtons.classList.contains('hidden')) {
                    authButtons.classList.remove('hidden');
                    if (window.logger?.isDevelopment) {
                        window.logger.debug('auth-header: 未找到用户数据后显示登录按钮');
                    }
                }
            }, 1000); // 延迟1秒显示，给适配器一些处理时间
        }
    }

    updateUserState(isLoggedIn, user = null) {
        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: updateUserState 开始执行', { isLoggedIn, user });
        }
        
        this.isLoggedIn = isLoggedIn;
        this.currentUser = user;

        const authButtons = this.shadowRoot.getElementById('authButtons');
        const userInfo = this.shadowRoot.getElementById('userInfo');
        const userName = this.shadowRoot.getElementById('userName');
        const userAvatar = this.shadowRoot.getElementById('userAvatar');

        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: DOM元素查找结果', {
                authButtons: !!authButtons,
                userInfo: !!userInfo,
                userName: !!userName,
                userAvatar: !!userAvatar
            });
        }

        if (isLoggedIn && user) {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header: 用户已登录，更新UI状态');
            }
            
            // 显示用户信息，隐藏登录注册按钮
            if (authButtons) {
                authButtons.classList.add('hidden');
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 隐藏登录注册按钮');
                }
            }
            
            if (userInfo) {
                userInfo.classList.remove('hidden');
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 显示用户信息');
                }
            }
            
            // 更新用户信息
            if (userName) {
                const displayName = user.nickname || user.email || '用户';
                userName.textContent = displayName;
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 更新用户名称为:', displayName);
                }
            }
            
            if (userAvatar) {
                const displayName = user.nickname || user.email || '用户';
                const avatarText = displayName.charAt(0).toUpperCase();
                userAvatar.textContent = avatarText;
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 更新用户头像为:', avatarText);
                }
            }
            
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header: 用户状态更新完成');
            }
        } else {
            if (window.logger?.isDevelopment) {
                window.logger.debug('auth-header: 用户未登录，显示登录注册按钮');
            }
            
            // 显示登录注册按钮，隐藏用户信息
            if (authButtons) {
                authButtons.classList.remove('hidden');
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 显示登录注册按钮');
                }
            }
            
            if (userInfo) {
                userInfo.classList.add('hidden');
                if (window.logger?.isDevelopment) {
                    window.logger.debug('auth-header: 隐藏用户信息');
                }
            }
            
            this.closeDropdown();
        }
        
        // 验证最终状态
        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: 最终DOM状态', {
                authButtonsHidden: authButtons?.classList.contains('hidden'),
                userInfoHidden: userInfo?.classList.contains('hidden'),
                userNameText: userName?.textContent,
                userAvatarText: userAvatar?.textContent
            });
        }
    }

    // 公共方法：手动更新状态
    setAuthState(isLoggedIn, user = null) {
        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: setAuthState 被调用', { isLoggedIn, user });
        }
        
        // 如果是 Supabase 用户对象，需要转换格式
        let processedUser = null;
        if (isLoggedIn && user) {
            // 检查是否是 Supabase 用户对象
            if (user.email && user.user_metadata) {
                processedUser = {
                    id: user.id,
                    email: user.email,
                    nickname: user.user_metadata.nickname || user.user_metadata.display_name || user.email.split('@')[0]
                };
            } else if (user.email) {
                // 已经是处理过的用户对象
                processedUser = user;
            }
        }
        
        if (window.logger?.isDevelopment) {
            window.logger.debug('auth-header: 处理后的用户数据', processedUser);
        }
        this.updateUserState(isLoggedIn, processedUser);
    }

    // 公共方法：获取当前状态
    getAuthState() {
        return {
            isLoggedIn: this.isLoggedIn,
            user: this.currentUser
        };
    }
}

// 注册自定义元素
customElements.define('auth-header', AuthHeader);