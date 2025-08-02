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
                        window.formValidator.initRegisterButtonState();
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

            // 注册成功 - 显示成功状态
            console.log('注册成功:', data.user);
            this.showRegisterSuccess(email);

        } catch (error) {
            // 注册失败 - 显示错误
            console.error('注册失败:', error);

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
                // 处理429错误 - 请求过于频繁
                const match = error.message.match(/after (\d+) seconds/);
                // 按照提取的时间加1秒
                const extractedTime = match ? parseInt(match[1]) : 60;
                const waitTime = extractedTime + 1;
                errorTitle = '请求过于频繁';
                errorMessage = `注册请求过于频繁，请等待 <span class="countdown-timer" id="countdownTimer">${waitTime}</span> 秒。<br><strong>提示：</strong>您的账户可能已创建成功，请先检查邮箱验证邮件。如倒计时结束后仍有问题，建议等待10-15分钟后重试。`;
                
                // 启动倒计时
                this.startCountdown(waitTime);
            } else if (error.message.includes('rate limit')) {
                errorTitle = '请求次数超限';
                errorMessage = '您的注册请求过于频繁，请稍后再试。建议等待几分钟后重新尝试。';
            } else if (error.message.includes('timeout')) {
                errorTitle = '请求超时';
                errorMessage = '网络响应超时，请检查网络连接后重试。';
            } else if (error.message.includes('fetch')) {
                errorTitle = '网络请求失败';
                errorMessage = '无法连接到服务器，请检查网络连接或稍后重试。';
            }

            this.showRegisterError(errorTitle, errorMessage);
        } finally {
            // 恢复按钮状态
            this.setRegisterButtonLoading(false);
        }
    }

    // 设置注册按钮加载状态
    // 设置注册按钮加载状态
    // 设置注册按钮加载状态
    setRegisterButtonLoading(loading) {
        const submitBtn = document.getElementById('registerSubmitBtn');
        const spinner = document.getElementById('registerSpinner');
        const buttonText = document.getElementById('registerButtonText');
        
        console.log('设置按钮加载状态:', loading, {
            submitBtn: !!submitBtn,
            spinner: !!spinner,
            buttonText: !!buttonText
        });

        if (!submitBtn) {
            console.error('找不到注册按钮元素');
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

    // 启动倒计时功能
    startCountdown(seconds) {
        console.log('启动倒计时:', seconds);
        
        const submitBtn = document.getElementById('registerSubmitBtn');
        const buttonText = document.getElementById('registerButtonText');
        
        let remainingTime = seconds;
        
        // 清除可能存在的倒计时
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 隐藏注册按钮
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        
        // 更新提示框中的倒计时
        const updateTimerDisplay = (time) => {
            // 使用更灵活的方式查找倒计时元素
            const timerElement = document.querySelector('.countdown-timer') || document.getElementById('countdownTimer');
            if (timerElement) {
                timerElement.textContent = time;
                console.log('更新倒计时显示:', time);
            } else {
                console.error('找不到倒计时显示元素');
            }
        };
        
        // 初始化显示
        updateTimerDisplay(remainingTime);

        // 启动倒计时
        this.countdownInterval = setInterval(() => {
            remainingTime--;
            console.log('倒计时剩余:', remainingTime);
            
            if (remainingTime > 0) {
                // 更新提示框中的倒计时
                updateTimerDisplay(remainingTime);
            } else {
                // 倒计时结束
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                console.log('倒计时结束');
                
                // 关闭错误提示框
                this.hideRegisterError();
                
                // 显示注册按钮
                if (submitBtn) {
                    submitBtn.style.display = 'block';
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