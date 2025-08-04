// auth-manager.js - 用户认证管理核心模块
// 依赖: config-manager.js, notification-manager.js, form-validator.js, button-state-manager.js
// 功能: 用户登录/注册/登出、会话管理、UI状态更新、错误处理
// 全局: window.authManager

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.lastRegisterAttempt = null; // 记录上次注册尝试时间
        this.isInCooldown = false; // 是否在冷却期
        this.hiddenCooldownTimer = null; // 隐藏的冷却期定时器
        this.storageKey = 'omvian_auth_state'; // 跨页面同步存储键
        this.syncListeners = []; // 跨页面同步监听器
        this.cookieName = 'omvian_auth'; // 自动登录Cookie名称
        this.cookieExpireDays = 30; // Cookie有效期（天）
    }

    // 初始化认证管理器
    init() {
        this.setupAuthListeners();
        this.setupCrossPageSync(); // 设置跨页面同步
        this.checkUserSession();
        this.checkAuthCookie(); // 检查自动登录Cookie
    }
    
    // 设置认证Cookie
    setAuthCookie(user) {
        if (!user) return;
        
        try {
            // 创建用户数据对象，只保存必要信息
            const userData = {
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.display_name
            };
            
            // 设置Cookie过期时间
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + this.cookieExpireDays);
            
            // 创建Cookie字符串
            const cookieValue = encodeURIComponent(JSON.stringify(userData));
            const cookieString = `${this.cookieName}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
            
            // 设置Cookie
            document.cookie = cookieString;
            
            if (window.logger?.isDevelopment) {
                window.logger.debug('已设置自动登录Cookie，有效期：', this.cookieExpireDays, '天');
            }
        } catch (error) {
            window.logger?.error('设置认证Cookie失败:', error);
        }
    }
    
    // 获取认证Cookie
    getAuthCookie() {
        try {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === this.cookieName && value) {
                    return JSON.parse(decodeURIComponent(value));
                }
            }
        } catch (error) {
            window.logger?.error('读取认证Cookie失败:', error);
        }
        return null;
    }
    
    // 清除认证Cookie
    clearAuthCookie() {
        try {
            // 设置过期时间为过去的时间，使Cookie立即失效
            document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
            
            if (window.logger?.isDevelopment) {
                window.logger.debug('已清除自动登录Cookie');
            }
        } catch (error) {
            window.logger?.error('清除认证Cookie失败:', error);
        }
    }
    
    // 检查自动登录Cookie
    checkAuthCookie() {
        // 如果已经登录，不需要检查Cookie
        if (this.currentUser) return;
        
        const cookieData = this.getAuthCookie();
        if (cookieData) {
            if (window.logger?.isDevelopment) {
                window.logger.debug('发现自动登录Cookie，尝试恢复登录状态');
            }
            
            // 使用Cookie中的用户数据恢复登录状态
            this.currentUser = cookieData;
            this.setCrossPageAuthState(cookieData);
            this.updateAuthUI(cookieData);
            this.notifyAuthChange(cookieData);
            
            if (window.logger?.isDevelopment) {
                window.logger.debug('已通过Cookie恢复登录状态');
            }
        }
    }

    // 设置跨页面同步
    setupCrossPageSync() {
        // 监听localStorage变化，实现跨页面同步
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.handleCrossPageAuthChange();
            }
        });

        // 监听页面可见性变化，确保状态同步
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handleCrossPageAuthChange();
            }
        });

        // 定期更新活跃时间
        setInterval(() => {
            if (this.isLoggedIn()) {
                this.updateLastActive();
            }
        }, 60000); // 每分钟更新一次
    }

    // 处理跨页面认证状态变化
    handleCrossPageAuthChange() {
        const storedState = this.getCrossPageAuthState();
        if (storedState && storedState.user) {
            // 有存储的登录状态且当前未登录
            if (!this.currentUser) {
                this.currentUser = storedState.user;
                this.updateAuthUI(storedState.user);
                this.notifyAuthChange(storedState.user);
            }
        } else {
            // 没有存储的登录状态但当前已登录
            if (this.currentUser) {
                this.currentUser = null;
                this.updateAuthUI(null);
                this.notifyAuthChange(null);
            }
        }
    }

    // 获取跨页面认证状态
    getCrossPageAuthState() {
        try {
            const state = localStorage.getItem(this.storageKey);
            return state ? JSON.parse(state) : null;
        } catch (error) {
            window.logger?.error('获取跨页面认证状态失败:', error);
            return null;
        }
    }

    // 设置跨页面认证状态
    setCrossPageAuthState(user) {
        try {
            if (user) {
                const state = {
                    user: user,
                    loginTime: Date.now(),
                    lastActive: Date.now()
                };
                localStorage.setItem(this.storageKey, JSON.stringify(state));
            } else {
                localStorage.removeItem(this.storageKey);
            }
        } catch (error) {
            window.logger?.error('设置跨页面认证状态失败:', error);
        }
    }

    // 更新最后活跃时间
    updateLastActive() {
        const state = this.getCrossPageAuthState();
        if (state) {
            state.lastActive = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        }
    }

    // 检查用户会话
    async checkUserSession() {
        if (!window.configManager.isReady()) return;

        const supabase = window.configManager.getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // 验证用户是否仍然存在于 Supabase 中
            try {
                const { data: user, error } = await supabase.auth.getUser();
                if (error || !user.user) {
                    // 用户不存在，清除所有缓存
                    if (window.logger?.isDevelopment) {
                        window.logger.info('用户已被删除，清除本地缓存');
                    }
                    this.clearAllAuthCache();
                    return;
                }
                
                this.currentUser = session.user;
                this.updateAuthUI(session.user);
                this.notifyAuthChange(session.user);
            } catch (error) {
                window.logger?.error('验证用户状态失败:', error);
                this.clearAllAuthCache();
            }
        } else {
            // 没有 Supabase 会话，但检查是否有本地用户数据
            const localUserData = localStorage.getItem('user_data');
            if (localUserData) {
                try {
                    const userData = JSON.parse(localUserData);
                    if (window.logger?.isDevelopment) {
                        window.logger.info('没有 Supabase 会话，但找到本地用户数据，保持登录状态');
                    }
                    this.currentUser = userData;
                    this.updateAuthUI(userData);
                    this.notifyAuthChange(userData);
                    return; // 重要：找到本地数据后直接返回，不执行清除缓存
                } catch (error) {
                    window.logger?.error('解析本地用户数据失败:', error);
                    // 解析失败时才清除缓存
                    if (window.logger?.isDevelopment) {
                        window.logger.info('本地用户数据解析失败，清除缓存');
                    }
                    this.clearAllAuthCache();
                    return;
                }
            }
            
            // 检查是否有自动登录Cookie
            const cookieData = this.getAuthCookie();
            if (cookieData) {
                if (window.logger?.isDevelopment) {
                    window.logger.info('没有会话但找到自动登录Cookie，恢复登录状态');
                }
                this.currentUser = cookieData;
                this.updateAuthUI(cookieData);
                this.notifyAuthChange(cookieData);
                // 同步到localStorage，确保跨页面同步
                this.setCrossPageAuthState(cookieData);
                return;
            }
            
            // 既没有会话也没有本地数据和Cookie，才清除缓存
            if (window.logger?.isDevelopment) {
                window.logger.info('没有会话且没有本地用户数据和Cookie，清除缓存');
            }
            this.clearAllAuthCache();
        }
    }

    // 设置认证相关监听器
    setupAuthListeners() {
        // 登录按钮点击事件
        // 登录按钮点击事件
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                    loginModal.classList.add('show');
                    if (window.formValidator) {
                        window.formValidator.clearFormValidation('loginForm');
                    }
                    // 清除登录错误提示
                    this.hideLoginError();
                    // 初始化登录按钮状态
                    this.initLoginButtonState();
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
                        window.formValidator.initRegisterButtonState();
                    }
                }
            });
        }

        // 优化注册界面外部点击关闭逻辑
        const registerOverlay = document.getElementById('registerOverlay');
        if (registerOverlay) {
            let isDragging = false;
            let dragStarted = false;
            
            // 监听鼠标按下事件
            registerOverlay.addEventListener('mousedown', (e) => {
                if (e.target === e.currentTarget) {
                    dragStarted = true;
                    isDragging = false;
                }
            });
            
            // 监听鼠标移动事件
            registerOverlay.addEventListener('mousemove', (e) => {
                if (dragStarted) {
                    isDragging = true;
                }
            });
            
            // 监听鼠标松开事件
            registerOverlay.addEventListener('mouseup', (e) => {
                if (e.target === e.currentTarget && dragStarted && !isDragging) {
                    this.closeRegisterOverlay();
                }
                dragStarted = false;
                isDragging = false;
            });
            
            // 监听鼠标离开事件
            registerOverlay.addEventListener('mouseleave', () => {
                dragStarted = false;
                isDragging = false;
            });
        }

        // 关闭登录模态框
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });

        // 注册弹窗关闭按钮
        const registerCloseBtn = document.querySelector('.register-overlay-close');
        if (registerCloseBtn) {
            registerCloseBtn.addEventListener('click', () => {
                this.closeRegisterOverlay();
            });
        }

        // 优化登录模态框外部点击关闭逻辑 - 参照注册弹窗的拖拽检测
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            let isDragging = false;
            let dragStarted = false;
            
            // 监听鼠标按下事件
            loginModal.addEventListener('mousedown', (e) => {
                if (e.target === e.currentTarget) {
                    dragStarted = true;
                    isDragging = false;
                }
            });
            
            // 监听鼠标移动事件
            loginModal.addEventListener('mousemove', (e) => {
                if (dragStarted) {
                    isDragging = true;
                }
            });
            
            // 监听鼠标松开事件
            loginModal.addEventListener('mouseup', (e) => {
                if (e.target === e.currentTarget && dragStarted && !isDragging) {
                    loginModal.style.display = 'none';
                    loginModal.classList.remove('show');
                }
                dragStarted = false;
                isDragging = false;
            });
            
            // 监听鼠标离开事件
            loginModal.addEventListener('mouseleave', () => {
                dragStarted = false;
                isDragging = false;
            });
        }

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

        // 防止重复提交
        const submitBtn = document.getElementById('loginSubmitBtn');
        if (submitBtn && submitBtn.disabled) {
            return;
        }

        // 验证表单
        if (!window.formValidator.validateLoginForm()) {
            return;
        }

        const emailInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        
        if (!emailInput || !passwordInput) {
            window.logger?.error('找不到登录表单元素');
            this.showLoginError('系统错误', '登录表单元素未找到，请刷新页面重试。');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

        // 额外的客户端验证
        if (!email || !password) {
            this.showLoginError('输入错误', '请输入邮箱和密码。');
            return;
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showLoginError('邮箱格式错误', '请输入有效的邮箱地址。');
            window.formValidator.showFieldError('username', '邮箱格式不正确');
            return;
        }

        // 验证密码长度
        if (password.length < 6 || password.length > 20) {
            this.showLoginError('密码格式错误', '密码长度应为6-20位字符。');
            return;
        }

        if (window.logger?.isDevelopment) {
            window.logger.auth('开始登录验证', { email, passwordLength: password.length });
        }

        // 设置按钮加载状态
        if (window.buttonStateManager) {
            window.buttonStateManager.setLoading('loginSubmitBtn', true);
        } else {
            // 备用方案：直接设置按钮状态
            if (submitBtn) {
                submitBtn.disabled = true;
                const spinner = document.getElementById('loginSpinner');
                const buttonText = document.getElementById('loginButtonText');
                if (spinner) spinner.style.display = 'inline-block';
                if (buttonText) buttonText.textContent = '登录中...';
            }
        }

        try {
            const supabase = window.configManager.getSupabase();
            
            if (!supabase) {
                throw new Error('Supabase 客户端未初始化');
            }

            if (window.logger?.isDevelopment) {
                window.logger.auth('调用 Supabase 登录接口');
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // 登录成功
            if (window.logger?.isDevelopment) {
                window.logger.auth('登录成功');
            }
            window.showSuccess('登录成功！正在跳转...');

            this.currentUser = data.user;
            this.setCrossPageAuthState(data.user); // 同步到localStorage
            this.notifyAuthChange(data.user);

            // 如果勾选了自动登录，设置Cookie
            if (rememberMe) {
                this.setAuthCookie(data.user);
                if (window.logger?.isDevelopment) {
                    window.logger.auth('已设置自动登录Cookie');
                }
                
                // 在登录成功且设置Cookie后显示通知
                // 使用更健壮的通知显示方法，确保通知系统已初始化
                this.showAutoLoginNotification();
            }

            // 更新UI显示用户已登录
            setTimeout(() => {
                this.updateAuthUI(data.user);
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'none';
                    loginModal.classList.remove('show');
                }
            }, 1500);

        } catch (error) {
            // 登录失败
            window.logger?.error('登录失败', {
                message: error.message,
                status: error.status,
                code: error.code,
                name: error.name
            });

            // 智能错误处理
            if (error.message.includes('Invalid login credentials') || error.code === 'invalid_credentials') {
                this.showLoginError('登录失败', '邮箱或密码错误，或邮箱尚未验证。请检查登录信息，如果是新注册用户请先验证邮箱。');
            } else if (error.message.includes('Email not confirmed')) {
                this.showLoginError('邮箱验证提醒', '邮箱尚未验证，请查收验证邮件完成验证后再登录。');
            } else if (error.message.includes('Invalid email')) {
                this.showLoginError('登录失败', '邮箱格式不正确，请检查后重试。');
                window.formValidator.showFieldError('username', '邮箱格式不正确');
            } else if (error.status === 400) {
                this.showLoginError('请求错误', '登录请求格式错误，请检查邮箱和密码格式是否正确。');
            } else if (error.status === 429) {
                this.showLoginError('请求过于频繁', '登录尝试过于频繁，请稍后再试。');
            } else {
                this.showLoginError('登录失败', `${error.message || '未知错误，请稍后重试。'}`);
            }
        } finally {
            // 恢复按钮状态
            window.buttonStateManager.setLoading('loginSubmitBtn', false);
        }
    }

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();

        // 防止重复提交
        const submitBtn = document.getElementById('registerSubmitBtn');
        if (submitBtn && submitBtn.disabled) {
            return;
        }

        // 检查是否在冷却期内
        if (this.isInCooldown) {
            const remainingTime = Math.ceil((this.lastRegisterAttempt + 60000 - Date.now()) / 1000);
            if (remainingTime > 0) {
                // 在冷却期内再次尝试，显示请求频繁提示
                this.showRegisterError('请求过于频繁', 
                    `注册请求过于频繁，请等待 <span class="countdown-timer" id="countdownTimer">${remainingTime}</span> 秒后再次尝试。`);
                this.startCountdown(remainingTime);
                return;
            } else {
                // 冷却期结束
                this.isInCooldown = false;
                this.lastRegisterAttempt = null;
            }
        }

        // 验证表单
        if (!window.formValidator.validateRegisterForm()) {
            return;
        }

        const email = document.getElementById('regEmail').value;
        const nickname = document.getElementById('regNickname').value;
        const password = document.getElementById('regPassword').value;

        // 设置按钮加载状态
        this.setRegisterButtonLoading(true);
        this.hideRegisterError();

        try {
            // 首先检查邮箱是否可用
            const emailCheck = await window.formValidator.checkEmailAvailability(email);
            
            if (!emailCheck.available) {
                this.showRegisterError('邮箱验证失败', emailCheck.error);
                return;
            }

            // 邮箱可用，继续注册
            const supabase = window.configManager.getSupabase();
            
            // 根据当前环境确定重定向URL
            // 根据当前环境确定重定向URL
            // 强制使用正确的重定向URL
            const redirectUrl = 'https://omvian.github.io/Hub/tools/redirect.html';
            if (window.logger?.isDevelopment) {
                window.logger.debug('强制使用重定向页面:', redirectUrl);
            }
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        display_name: nickname
                    }
                }
            });

            if (error) throw error;

            // 注册成功 - 显示成功状态
            if (window.logger?.isDevelopment) {
                window.logger.auth('注册成功');
            }
            this.showRegisterSuccess(email);

        } catch (error) {
            // 注册失败 - 显示错误
            window.logger?.error('注册失败:', error);

            let errorTitle = '注册失败';
            let errorMessage = '未知错误，请稍后重试。';
            
            if (error.message.includes('already registered')) {
                errorTitle = '邮箱已被注册';
                errorMessage = '该邮箱已被注册，请使用其他邮箱或尝试登录。';
            } else if (error.message.includes('Invalid email')) {
                errorTitle = '邮箱格式错误';
                errorMessage = '请输入有效的邮箱地址。';
            } else if (error.message.includes('Password')) {
                errorTitle = '密码不符合要求';
                errorMessage = '密码长度至少为6位，请重新设置。';
            } else if (error.message.includes('network')) {
                errorTitle = '网络连接异常';
                errorMessage = '请检查网络连接后重试。';
            } else if (error.message.includes('you can only request this after')) {
                // 智能429错误处理
                // 智能429错误处理
                if (!this.isInCooldown) {
                    // 第一次遇到429错误 - 关闭注册弹窗，显示邮箱验证提示
                    this.isInCooldown = true;
                    this.lastRegisterAttempt = Date.now();
                    
                    // 关闭注册弹窗
                    this.hideRegisterOverlay();
                    
                    // 显示邮箱验证提示框
                    this.showEmailVerificationModal(email);
                    
                    // 启动60秒隐藏冷却期
                    this.hiddenCooldownTimer = setTimeout(() => {
                        this.isInCooldown = false;
                        this.lastRegisterAttempt = null;
                        if (window.logger?.isDevelopment) {
                            window.logger.debug('隐藏冷却期结束');
                        }
                    }, 60000);
                    
                    // 直接返回，不显示错误提示
                    return;
                } else {
                    // 冷却期内再次尝试 - 显示标准错误提示
                    const remainingTime = Math.ceil((this.lastRegisterAttempt + 60000 - Date.now()) / 1000);
                    errorTitle = '请求过于频繁';
                    errorMessage = `注册请求过于频繁，请等待 <span class="countdown-timer" id="countdownTimer">${remainingTime}</span> 秒后再次尝试。`;
                    
                    // 启动倒计时
                    this.startCountdown(remainingTime);
                }
            }

            // 只有非429错误才显示错误提示
            if (!error.message.includes('you can only request this after')) {
                this.showRegisterError(errorTitle, errorMessage);
            }
        } finally {
            // 恢复按钮状态
            this.setRegisterButtonLoading(false);
        }
    }

    // 启动隐藏的冷却期
    startHiddenCooldown(seconds) {
        if (window.logger?.isDevelopment) {
            window.logger.debug('启动隐藏冷却期:', seconds, '秒');
        }
        
        this.isInCooldown = true;
        this.lastRegisterAttempt = Date.now();
        
        // 清除之前的隐藏定时器
        if (this.hiddenCooldownTimer) {
            clearTimeout(this.hiddenCooldownTimer);
        }
        
        // 启动隐藏冷却期定时器
        this.hiddenCooldownTimer = setTimeout(() => {
            if (window.logger?.isDevelopment) {
                window.logger.debug('隐藏冷却期结束');
            }
            this.isInCooldown = false;
            this.lastRegisterAttempt = null;
            this.hiddenCooldownTimer = null;
        }, seconds * 1000);
    }

    // 设置注册按钮加载状态
    setRegisterButtonLoading(loading) {
        const submitBtn = document.getElementById('registerSubmitBtn');
        const spinner = document.getElementById('registerSpinner');
        const buttonText = document.getElementById('registerButtonText');
        
        if (window.logger?.isDevelopment) {
            window.logger.debug('设置按钮加载状态:', loading, {
                submitBtn: !!submitBtn,
                spinner: !!spinner,
                buttonText: !!buttonText
            });
        }

        if (!submitBtn) {
            if (window.logger?.isDevelopment) {
                window.logger.error('找不到注册按钮元素');
            }
            return;
        }

        if (loading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            if (spinner) spinner.style.display = 'inline-block';
            if (buttonText) buttonText.textContent = '正在创建账户';
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            if (spinner) spinner.style.display = 'none';
            if (buttonText) buttonText.textContent = '注册';
        }
    }

    // 显示注册错误
    showRegisterError(title, message) {
        // 移除可能存在的错误面板
        const existingError = document.querySelector('.register-error-panel');
        if (existingError) {
            existingError.remove();
        }

        // 创建错误面板
        const errorPanel = document.createElement('div');
        errorPanel.className = 'register-error-panel show';
        errorPanel.innerHTML = `
            <div class="register-error-content">
                <i class="material-icons register-error-icon">error</i>
                <div class="register-error-text">
                    <div class="register-error-title">${title}</div>
                    <div class="register-error-message">${message}</div>
                </div>
            </div>
        `;

        // 插入到标题和第一个表单组之间
        const registerForm = document.getElementById('registerForm');
        const firstFormGroup = registerForm.querySelector('.form-group');
        registerForm.insertBefore(errorPanel, firstFormGroup);
    }

    // 隐藏注册错误
    hideRegisterError() {
        const errorPanel = document.querySelector('.register-error-panel');
        if (errorPanel) {
            errorPanel.remove();
        }
    }

    // 显示注册成功状态
    showRegisterSuccess(email) {
        const registerContent = document.querySelector('.register-overlay-content');
        if (!registerContent) return;

        // 清空当前内容
        registerContent.innerHTML = `
            <div class="register-success-panel">
                <i class="material-icons register-success-icon">mark_email_read</i>
                <div class="register-success-title">注册成功！</div>
                <div class="register-success-message">
                    验证邮件已发送到您的邮箱，请查收并点击邮件中的验证链接完成注册。
                </div>
                <div class="register-success-email">${email}</div>
                <div class="register-success-tips">
                    <div class="register-success-tips-title">
                        <i class="material-icons">lightbulb</i>
                        <span>温馨提示</span>
                    </div>
                    <ul class="register-success-tips-list">
                        <li>
                            <i class="material-icons">schedule</i>
                            <span>验证邮件可能需要几分钟才能到达</span>
                        </li>
                        <li>
                            <i class="material-icons">folder</i>
                            <span>请检查垃圾邮件文件夹</span>
                        </li>
                        <li>
                            <i class="material-icons">refresh</i>
                            <span>验证完成后请刷新页面重新登录</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;

        // 5秒后自动关闭
        setTimeout(() => {
            this.closeRegisterOverlay();
        }, 8000);
    }

    // 启动倒计时功能（用于显示的倒计时）
    startCountdown(seconds) {
        if (window.logger?.isDevelopment) {
            window.logger.debug('启动显示倒计时:', seconds);
        }
        
        const submitBtn = document.getElementById('registerSubmitBtn');
        const buttonText = document.getElementById('registerButtonText');
        
        let remainingTime = seconds;
        
        // 清除可能存在的倒计时
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 隐藏注册按钮 - 使用CSS类而不是内联样式
        if (submitBtn) {
            submitBtn.classList.add('form-hidden');
            submitBtn.classList.remove('form-visible');
        }
        
        // 更新提示框中的倒计时
        const updateTimerDisplay = (time) => {
            const timerElement = document.querySelector('.countdown-timer') || document.getElementById('countdownTimer');
            if (timerElement) {
                timerElement.textContent = time;
                if (window.logger?.isDevelopment) {
                    window.logger.debug('更新倒计时显示:', time);
                }
            } else {
                if (window.logger?.isDevelopment) {
                    window.logger.error('找不到倒计时显示元素');
                }
            }
        };
        
        // 初始化显示
        updateTimerDisplay(remainingTime);

        // 启动倒计时
        this.countdownInterval = setInterval(() => {
            remainingTime--;
            if (window.logger?.isDevelopment) {
                window.logger.debug('倒计时剩余:', remainingTime);
            }
            
            if (remainingTime > 0) {
                // 更新提示框中的倒计时
                updateTimerDisplay(remainingTime);
            } else {
                // 倒计时结束
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                if (window.logger?.isDevelopment) {
                    window.logger.debug('倒计时结束');
                }
                
                // 关闭错误提示框
                this.hideRegisterError();
                
                // 显示注册按钮 - 使用CSS类而不是内联样式
                if (submitBtn) {
                    submitBtn.classList.remove('form-hidden');
                    submitBtn.classList.add('form-visible');
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('disabled');
                }
                
                // 恢复按钮文字
                if (buttonText) {
                    buttonText.textContent = '注册';
                }
            }
        }, 1000);
    }

    // 清除倒计时
    clearCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.hiddenCooldownTimer) {
            clearTimeout(this.hiddenCooldownTimer);
            this.hiddenCooldownTimer = null;
        }
        this.isInCooldown = false;
        this.lastRegisterAttempt = null;
    }

    // 清除所有认证缓存
    clearAllAuthCache() {
        if (window.logger?.isDevelopment) {
            window.logger.debug('清除所有认证缓存');
        }
        
        // 清除当前实例状态
        this.currentUser = null;
        
        // 清除 localStorage 中的所有认证相关数据
        const keysToRemove = [
            'supabase.auth.token',
            'sb-nqfxyrmhjmxjhcizwlwu-auth-token',
            'user_data',
            this.storageKey, // omvian_auth_state
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            if (window.logger?.isDevelopment) {
                window.logger.debug(`已清除缓存: ${key}`);
            }
        });
        
        // 清除 sessionStorage
        sessionStorage.clear();
        
        // 清除自动登录Cookie
        this.clearAuthCookie();
        
        // 更新UI状态
        this.updateAuthUI(null);
        this.notifyAuthChange(null);
        
        if (window.logger?.isDevelopment) {
            window.logger.debug('所有认证缓存已清除');
        }
    }

    // 用户登出
    async logout() {
        try {
            const supabase = window.configManager.getSupabase();
            await supabase.auth.signOut();
            if (window.logger?.isDevelopment) {
                window.logger.debug('退出成功');
            }
            
            // 清除所有缓存
            this.clearAllAuthCache();
            
            // 清除自动登录Cookie
            this.clearAuthCookie();
            
            // 重新加载页面
            location.reload();
        } catch (error) {
            if (window.logger?.isDevelopment) {
                window.logger.error('退出失败:', error);
            }
            window.showError('退出失败，请稍后重试');
        }
    }

    // 关闭注册界面
    closeRegisterOverlay() {
        const overlay = document.getElementById('registerOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // 清除倒计时
        this.clearCountdown();
        
        // 重置表单
        if (window.formValidator) {
            window.formValidator.clearFormValidation('registerForm');
            window.formValidator.initRegisterButtonState();
        }
        
        // 重置表单内容
        const form = document.getElementById('registerForm');
        if (form) {
            form.reset();
        }
        
        // 隐藏错误面板
        this.hideRegisterError();
        
        // 重置按钮状态
        this.setRegisterButtonLoading(false);
    }

    // 更新认证UI
    updateAuthUI(user) {
        // 使用新的认证同步管理器
        if (window.authSyncManager) {
            const userData = user ? {
                nickname: user.user_metadata?.display_name,
                email: user.email,
                id: user.id
            } : null;
            
            // 广播认证状态变化到所有页面
            window.authSyncManager.broadcastAuthChange(userData);
            
            if (window.logger?.isDevelopment) {
                window.logger.debug('认证状态已通过同步管理器更新:', userData ? '已登录' : '已登出');
            }
        } else {
            // 备用方案：使用原有的同步机制
            this.updateAuthUILegacy(user);
        }
    }

    // 备用的认证UI更新方法
    updateAuthUILegacy(user) {
        const authHeader = document.querySelector('auth-header');
        
        if (user) {
            const userData = {
                nickname: user.user_metadata?.display_name,
                email: user.email,
                id: user.id
            };
            
            localStorage.setItem('user_data', JSON.stringify(userData));
            this.setCrossPageAuthState(user);
            
            if (authHeader && typeof authHeader.setAuthState === 'function') {
                authHeader.setAuthState(true, userData);
            }
        } else {
            localStorage.removeItem('user_data');
            this.setCrossPageAuthState(null);
            
            if (authHeader && typeof authHeader.setAuthState === 'function') {
                authHeader.setAuthState(false);
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
                if (window.logger?.isDevelopment) {
                    window.logger.error('认证状态变化回调执行失败:', error);
                }
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
            if (window.logger?.isDevelopment) {
                window.logger.warn('未找到认证按钮容器 (.auth-buttons)，跳过遮罩设置');
            }
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

    // 显示邮箱验证提示框
    showEmailVerificationModal(email) {
        const modal = document.getElementById('emailVerificationModal');
        const emailDisplay = document.getElementById('verificationEmailDisplay');
        
        if (modal && emailDisplay) {
            // 设置邮箱地址
            emailDisplay.textContent = email;
            
            // 显示模态框
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            // 绑定关闭按钮事件
            const closeBtn = document.getElementById('emailVerificationCloseBtn');
            if (closeBtn) {
                closeBtn.onclick = () => this.hideEmailVerificationModal();
            }
            
            // 点击背景关闭
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.hideEmailVerificationModal();
                }
            };
        }
    }

    // 隐藏邮箱验证提示框
    hideEmailVerificationModal() {
        const modal = document.getElementById('emailVerificationModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            
            // 移除事件监听器
            modal.onclick = null;
            const closeBtn = document.getElementById('emailVerificationCloseBtn');
            if (closeBtn) {
                closeBtn.onclick = null;
            }
        }
    }
    
    // 显示自动登录通知 - 确保通知系统已初始化
    showAutoLoginNotification() {
        const message = '自动登录已启用，下次访问将自动登录';
        const duration = 5000;
        
        // 直接使用alert显示通知，确保100%能看到
        alert(message);
        
        // 同时尝试使用通知系统显示更美观的通知
        if (typeof window.showInfo === 'function') {
            try {
                window.showInfo(message, duration);
                if (window.logger?.isDevelopment) {
                    window.logger.debug('已显示自动登录通知');
                }
            } catch (error) {
                if (window.logger?.isDevelopment) {
                    window.logger.error('显示通知失败:', error);
                }
            }
        }
    }
    
    // 创建备用通知 - 当通知系统不可用时使用
    createFallbackNotification(message) {
        try {
            // 检查是否已存在备用通知
            let fallbackNotification = document.getElementById('fallbackNotification');
            if (fallbackNotification) {
                fallbackNotification.remove();
            }
            
            // 创建备用通知元素
            fallbackNotification = document.createElement('div');
            fallbackNotification.id = 'fallbackNotification';
            fallbackNotification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #2196F3;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 9999;
                font-size: 14px;
                max-width: 300px;
                animation: fadeIn 0.3s ease-out;
            `;
            
            fallbackNotification.textContent = message;
            document.body.appendChild(fallbackNotification);
            
            // 5秒后自动移除
            setTimeout(() => {
                if (fallbackNotification.parentNode) {
                    fallbackNotification.style.animation = 'fadeOut 0.3s ease-in';
                    setTimeout(() => {
                        if (fallbackNotification.parentNode) {
                            fallbackNotification.parentNode.removeChild(fallbackNotification);
                        }
                    }, 300);
                }
            }, 5000);
            
            // 添加必要的动画样式
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(20px); }
                }
            `;
            document.head.appendChild(style);
            
        } catch (error) {
            if (window.logger?.isDevelopment) {
                window.logger.error('创建备用通知失败:', error);
            }
        }
    }

    // 隐藏注册弹窗
    hideRegisterOverlay() {
        const overlay = document.getElementById('registerOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // 显示登录错误
    showLoginError(title, message) {
        // 移除可能存在的错误面板
        const existingError = document.querySelector('.login-error-panel');
        if (existingError) {
            existingError.remove();
        }

        // 创建错误面板
        const errorPanel = document.createElement('div');
        errorPanel.className = 'login-error-panel show';
        errorPanel.innerHTML = `
            <div class="login-error-content">
                <i class="material-icons login-error-icon">error</i>
                <div class="login-error-text">
                    <div class="login-error-title">${title}</div>
                    <div class="login-error-message">${message}</div>
                </div>
            </div>
        `;

        // 插入到标题和第一个表单组之间
        const loginForm = document.getElementById('loginForm');
        const firstFormGroup = loginForm.querySelector('.form-group');
        loginForm.insertBefore(errorPanel, firstFormGroup);
        
        // 确保登录按钮保持可用状态
        if (window.buttonStateManager) {
            window.buttonStateManager.showButton('loginSubmitBtn');
            window.buttonStateManager.setDisabled('loginSubmitBtn', false);
        }
    }

    // 隐藏登录错误
    hideLoginError() {
        const errorPanel = document.querySelector('.login-error-panel');
        if (errorPanel) {
            errorPanel.remove();
        }
    }

    // 初始化登录按钮状态
    initLoginButtonState() {
        const submitBtn = document.getElementById('loginSubmitBtn');
        const emailInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberMeCheckbox = document.getElementById('rememberMe');

        if (!submitBtn || !emailInput || !passwordInput) return;

        // 初始隐藏登录按钮 - 使用按钮状态管理器
        if (window.buttonStateManager) {
            window.buttonStateManager.hideButton('loginSubmitBtn');
        }

        // 从cookie中恢复自动登录勾选状态
        if (rememberMeCheckbox) {
            try {
                const rememberMeState = this.getRememberMeState();
                rememberMeCheckbox.checked = rememberMeState === 'true';
            } catch (error) {
                if (window.logger?.isDevelopment) {
                    window.logger.error('恢复自动登录状态失败:', error);
                }
            }
            
            // 监听勾选状态变化，保存到cookie
            rememberMeCheckbox.addEventListener('change', () => {
                this.saveRememberMeState(rememberMeCheckbox.checked);
            });
        }

        // 监听邮箱输入变化
        emailInput.addEventListener('input', () => {
            this.updateLoginButtonVisibility();
        });
        
        // 设置密码验证逻辑
        this.setupLoginPasswordValidation();
        
        // 初始检查
        this.updateLoginButtonVisibility();
    }
    
    // 保存自动登录勾选状态到cookie
    saveRememberMeState(state) {
        try {
            // 设置Cookie过期时间为30天
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            
            // 创建Cookie字符串
            const cookieString = `omvian_remember_me=${state}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
            
            // 设置Cookie
            document.cookie = cookieString;
            
            if (window.logger?.isDevelopment) {
                window.logger.debug('已保存自动登录勾选状态:', state);
            }
        } catch (error) {
            if (window.logger?.isDevelopment) {
                window.logger.error('保存自动登录勾选状态失败:', error);
            }
        }
    }
    
    // 从cookie中获取自动登录勾选状态
    getRememberMeState() {
        try {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'omvian_remember_me') {
                    return value;
                }
            }
        } catch (error) {
            if (window.logger?.isDevelopment) {
                window.logger.error('读取自动登录勾选状态失败:', error);
            }
        }
        return 'false'; // 默认不勾选
    }

    // 设置登录密码框验证逻辑
    setupLoginPasswordValidation() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        // 密码验证逻辑 - 和注册弹窗保持一致
        const validatePassword = () => {
            const value = passwordInput.value.trim();
            const formGroup = passwordInput.closest('.form-group');
            
            // 移除之前的验证状态
            passwordInput.classList.remove('valid', 'invalid');
            if (formGroup) {
                formGroup.classList.remove('valid', 'invalid');
            }
            
            if (value.length === 0) {
                // 空值时保持中性状态
                return false;
            } else if (value.length >= 6 && value.length <= 20) {
                // 密码长度符合要求 - 显示绿色
                passwordInput.classList.add('valid');
                if (formGroup) {
                    formGroup.classList.add('valid');
                }
                return true;
            } else {
                // 密码长度不符合要求 - 显示红色
                passwordInput.classList.add('invalid');
                if (formGroup) {
                    formGroup.classList.add('invalid');
                }
                return false;
            }
        };

        // 监听输入变化
        passwordInput.addEventListener('input', () => {
            validatePassword();
            this.updateLoginButtonVisibility();
        });

        // 失去焦点时验证
        passwordInput.addEventListener('blur', () => {
            validatePassword();
            this.updateLoginButtonVisibility();
        });
    }

    // 更新登录按钮显示状态
    updateLoginButtonVisibility() {
        const submitBtn = document.getElementById('loginSubmitBtn');
        const emailInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (!submitBtn || !emailInput || !passwordInput) return;

        const hasValidEmail = emailInput.value.trim().length > 0;
        const passwordValue = passwordInput.value.trim();
        const hasValidPassword = passwordValue.length >= 6 && passwordValue.length <= 20;
        
        if (hasValidEmail && hasValidPassword) {
            if (window.buttonStateManager) {
                window.buttonStateManager.showButton('loginSubmitBtn');
            }
        } else {
            if (window.buttonStateManager) {
                window.buttonStateManager.hideButton('loginSubmitBtn');
            }
        }
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();
