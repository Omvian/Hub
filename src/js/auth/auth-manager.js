// auth-manager.js
// 认证管理模块 - 负责用户登录、注册、会话管理等功能

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
    }

    // 初始化认证管理器
    init() {
        this.setupAuthListeners();
        this.checkUserSession();
    }

    // 检查用户会话
    async checkUserSession() {
        if (!window.configManager.isReady()) return;

        const supabase = window.configManager.getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            this.updateAuthUI(session.user);
            this.notifyAuthChange(session.user);
        }
    }

    // 设置认证相关监听器
    setupAuthListeners() {
        // 登录按钮点击事件
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'block';
                    if (window.formValidator) {
                        window.formValidator.clearFormValidation('loginForm');
                    }
                }
            });
        }

        // 注册按钮点击事件
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                const overlay = document.getElementById('registerOverlay');
                if (overlay) {
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    if (window.formValidator) {
                        window.formValidator.clearFormValidation('registerForm');
                    }
                }
            });
        }

        // 注册界面关闭按钮
        const registerCloseBtn = document.getElementById('registerCloseBtn');
        if (registerCloseBtn) {
            registerCloseBtn.addEventListener('click', () => {
                this.closeRegisterOverlay();
            });
        }

        // 点击注册界面外部关闭
        const registerOverlay = document.getElementById('registerOverlay');
        if (registerOverlay) {
            registerOverlay.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeRegisterOverlay();
                }
            });
        }

        // 关闭登录模态框
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });

        // 点击登录模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        // 注册表单提交
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                this.handleRegister(e);
            });
        }
    }

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();

        // 验证表单
        if (!window.formValidator.validateLoginForm()) {
            return;
        }

        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 设置按钮加载状态
        window.buttonManager.setButtonLoading('loginSubmitBtn', true);

        try {
            const supabase = window.configManager.getSupabase();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // 登录成功
            console.log('登录成功:', data.user);
            window.showSuccess('登录成功！正在跳转...');

            this.currentUser = data.user;
            this.notifyAuthChange(data.user);

            // 更新UI显示用户已登录
            setTimeout(() => {
                this.updateAuthUI(data.user);
                document.getElementById('loginModal').style.display = 'none';
            }, 1500);

        } catch (error) {
            // 登录失败
            console.error('登录失败:', error);

            let errorMessage = '登录失败: ';
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = '邮箱或密码错误，请检查后重试。';
                window.formValidator.showFieldError('username', '邮箱或密码错误');
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = '邮箱尚未验证，请查收验证邮件。';
            } else {
                errorMessage = error.message || '未知错误，请稍后重试。';
            }

            window.showError(errorMessage);
        } finally {
            // 恢复按钮状态
            window.buttonManager.setButtonLoading('loginSubmitBtn', false);
        }
    }

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();

        // 验证表单
        if (!window.formValidator.validateRegisterForm()) {
            return;
        }

        const email = document.getElementById('regEmail').value;
        const nickname = document.getElementById('regNickname').value;
        const password = document.getElementById('regPassword').value;

        // 设置按钮加载状态
        window.buttonManager.setButtonLoading('registerSubmitBtn', true);

        try {
            const supabase = window.configManager.getSupabase();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: nickname
                    }
                }
            });

            if (error) throw error;

            // 注册成功
            console.log('注册成功:', data.user);
            window.showSuccess('注册成功！验证邮件已发送到您的邮箱，请查收并验证邮箱。');

            // 关闭注册界面
            setTimeout(() => {
                this.closeRegisterOverlay();
                document.getElementById('registerForm').reset();
                window.formValidator.clearFormValidation('registerForm');
            }, 3000);

        } catch (error) {
            // 注册失败
            console.error('注册失败:', error);

            let errorMessage = '注册失败: ';
            if (error.message.includes('already registered')) {
                errorMessage = '该邮箱已被注册，请使用其他邮箱或尝试登录。';
                window.formValidator.showFieldError('regEmail', '该邮箱已被注册');
            } else {
                errorMessage = error.message || '未知错误，请稍后重试。';
            }

            window.showError(errorMessage);
        } finally {
            // 恢复按钮状态
            window.buttonManager.setButtonLoading('registerSubmitBtn', false);
        }
    }

    // 用户登出
    async logout() {
        try {
            const supabase = window.configManager.getSupabase();
            await supabase.auth.signOut();
            console.log('退出成功');
            
            this.currentUser = null;
            this.notifyAuthChange(null);
            
            // 重新加载页面
            location.reload();
        } catch (error) {
            console.error('退出失败:', error);
            window.showError('退出失败，请稍后重试');
        }
    }

    // 关闭注册界面
    closeRegisterOverlay() {
        const overlay = document.getElementById('registerOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 更新认证UI
    updateAuthUI(user) {
        const authButtons = document.querySelector('.auth-buttons');

        if (user) {
            // 用户已登录
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('registerBtn').style.display = 'none';

            // 移除可能存在的用户信息
            const existingUserInfo = document.querySelector('.user-info');
            if (existingUserInfo) {
                existingUserInfo.remove();
            }

            // 添加用户信息显示
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span>欢迎, ${user.user_metadata?.display_name || user.email}</span>
                <button id="logoutBtn" class="btn btn-secondary">退出</button>
            `;

            authButtons.appendChild(userInfo);

            // 添加退出按钮事件
            document.getElementById('logoutBtn').addEventListener('click', () => {
                this.logout();
            });
        } else {
            // 用户未登录
            document.getElementById('loginBtn').style.display = 'block';
            document.getElementById('registerBtn').style.display = 'block';
            
            // 移除用户信息显示
            const userInfo = document.querySelector('.user-info');
            if (userInfo) {
                userInfo.remove();
            }
        }
    }

    // 添加认证状态变化回调
    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    // 通知认证状态变化
    notifyAuthChange(user) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('认证状态变化回调执行失败:', error);
            }
        });
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查用户是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }

    // 添加通用遮罩效果
    disableAuthButtons() {
        const authButtons = document.querySelector('.auth-buttons');
        
        // 如果找不到认证按钮容器，直接返回
        if (!authButtons) {
            console.warn('未找到认证按钮容器 (.auth-buttons)，跳过遮罩设置');
            return;
        }

        // 创建通用遮罩层
        let overlay = document.getElementById('authOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'authOverlay';
            overlay.className = 'auth-overlay';
            
            // 创建警告内容
            const warning = document.createElement('div');
            warning.className = 'auth-warning';
            warning.innerHTML = '<i class="material-icons warning-icon">warning</i><span>账号功能暂不可用</span>';
            
            overlay.appendChild(warning);
            authButtons.appendChild(overlay);
        }
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();