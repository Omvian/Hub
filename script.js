// script.js
// Github Page配置Supabase需要在仓库机密创建SUPABASE_KEY和SUPABASE_URL，再赋值时必须加""双引号
// Supabase 配置 - 使用 let 而不是 const，以便在本地环境中重新赋值
let supabaseConfig = {
    url: "%%SUPABASE_URL%%",
    key: "%%SUPABASE_KEY%%"
};

// 初始化 Supabase
let supabase;
let isSupabaseReady = false;

// 统一环境检测函数
function isLocalEnvironment() {
    // 检测常见本地环境标识
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isFileProtocol = window.location.protocol === 'file:';
    const isPrivateIP = window.location.hostname.includes('192.168.') || 
                        window.location.hostname.includes('10.') || 
                        window.location.hostname.includes('172.');
    const isMobileLocal = window.innerWidth < 768 && (isLocalhost || isPrivateIP);
    
    console.log('环境检测 - localhost:', isLocalhost);
    console.log('环境检测 - file协议:', isFileProtocol);
    console.log('环境检测 - 私有IP:', isPrivateIP);
    console.log('环境检测 - 移动设备本地:', isMobileLocal);
    
    return isLocalhost || isFileProtocol || isPrivateIP || isMobileLocal;
}

// 检查 Supabase 配置是否有效
function isSupabaseConfigValid(config) {
    console.log('检查配置有效性...');
    console.log('配置URL:', config.url);
    console.log('配置Key:', config.key ? config.key.substring(0, 10) + '...' : '未设置');
    console.log('当前URL:', window.location.href);
    console.log('当前主机名:', window.location.hostname);
    console.log('当前协议:', window.location.protocol);
    console.log('屏幕宽度:', window.innerWidth);

    const isLocal = isLocalEnvironment();
    const isProduction = !isLocal;
    console.log('环境检测 - 本地环境:', isLocal);
    console.log('环境检测 - 生产环境:', isProduction);

    if (isProduction) {
        // 生产环境：只要不包含占位符就认为有效
        if (!config.url.includes('%%') && !config.key.includes('%%')) {
            console.log('生产环境配置有效');
            return true;
        } else {
            console.warn('生产环境配置包含占位符');
            console.warn('URL占位符检查:', config.url.includes('%%'));
            console.warn('Key占位符检查:', config.key.includes('%%'));
            return false;
        }
    }

    // 检查是否是占位符
    if (config.url.includes('%%') || config.key.includes('%%')) {
        console.warn('配置包含占位符，未替换');
        return false;
    }

    // 检查基本格式
    if (!config.url.startsWith('https://') || config.key.length < 20) {
        console.warn('配置格式无效');
        return false;
    }

    console.log('配置有效');
    return true;
}

// 等待本地配置加载完成
function waitForLocalConfig(callback) {
    // 检查是否为本地环境
    const isLocal = isLocalEnvironment();

    console.log('环境检查:', isLocal ? '本地环境' : '生产环境');

    if (!isLocal) {
        // 非本地环境，直接执行回调
        console.log('非本地环境，跳过配置文件加载');
        callback();
        return;
    }

    // 本地环境，等待配置加载
    let attempts = 0;
    const maxAttempts = 50; // 最多等待5秒

    const checkInterval = setInterval(() => {
        attempts++;

        // 检查本地配置是否已加载
        if (window.supabaseConfig) {
            clearInterval(checkInterval);
            // 使用本地配置 - 现在可以安全地重新赋值，因为 supabaseConfig 是用 let 声明的
            supabaseConfig = window.supabaseConfig;
            console.log('使用本地配置:', supabaseConfig);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('本地配置加载超时，使用默认配置');
            callback();
        }
    }, 100);
}

// 页面加载时验证 Supabase 配置
window.addEventListener('load', () => {
    const loadingStatus = document.getElementById('loadingStatus');

    // 等待本地配置加载完成
    waitForLocalConfig(() => {
        // 生产环境下，如果window.supabaseConfig存在，优先使用它
        const isProduction = window.location.hostname.includes('github.io');
        if (isProduction && window.supabaseConfig) {
            console.log('生产环境下使用window.supabaseConfig');
            supabaseConfig = window.supabaseConfig;
        }
        try {
            // 检查 Supabase 配置是否有效
            const isValidConfig = isSupabaseConfigValid(supabaseConfig);

            console.log('Supabase 配置:', supabaseConfig);
            console.log('配置有效性:', isValidConfig);

            if (!isValidConfig) {
                console.warn('Supabase 配置无效或未配置，将使用模拟模式');
                loadingStatus.textContent = 'Supabase 未配置，使用模拟模式';
                loadingStatus.classList.add('error');

                // 模拟初始化
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                    showError('Supabase 未配置，认证功能将不可用');

                    // 禁用认证按钮并添加遮罩效果
                    disableAuthButtons();
                }, 2000);

                return;
            }

            // 尝试初始化 Supabase
            initSupabase().then(({ data, error }) => {
                if (error) {
                    throw error;
                }

                console.log('Supabase 连接验证成功');
                loadingStatus.textContent = '初始化成功，正在加载应用...';

                // 隐藏加载屏幕
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                }, 1000);

                // 初始化应用
                initApp();
            }).catch(error => {
                console.error('Supabase 初始化失败:', error);
                loadingStatus.textContent = 'Supabase 初始化失败';
                loadingStatus.classList.add('error');

                // 隐藏加载屏幕并显示错误
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                    showError('Supabase 初始化失败: ' + error.message);

                    // 禁用认证按钮并添加遮罩效果
                    disableAuthButtons();
                }, 2000);
            });
        } catch (error) {
            console.error('配置检查发生错误:', error);
            loadingStatus.textContent = '配置检查错误';
            loadingStatus.classList.add('error');

            // 隐藏加载屏幕并显示错误
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
                showError('配置检查错误: ' + error.message);

                // 禁用认证按钮并添加遮罩效果
                disableAuthButtons();
            }, 2000);
        }
    });
});

// 应用初始化函数
function initApp() {
    console.log('开始初始化应用...');
    // 在这里添加应用初始化逻辑
    // 例如：加载用户数据、初始化UI组件等
    console.log('应用初始化完成');
}

// 初始化 Supabase
function initSupabase() {
    console.log('开始初始化Supabase...');
    if (isSupabaseConfigValid(supabaseConfig)) {
        console.log('正在初始化 Supabase...');
        supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);
        isSupabaseReady = true;
        console.log('Supabase 初始化成功');

        // 验证 Supabase 连接 - 使用更简单的方法
        return supabase.auth.getSession();
    }
    return Promise.reject(new Error('Supabase配置无效'));
}

// 页面加载时验证 Supabase 配置
window.addEventListener('load', () => {
    const loadingStatus = document.getElementById('loadingStatus');

    // 等待本地配置加载完成
    waitForLocalConfig(() => {
        // 生产环境下，如果window.supabaseConfig存在，优先使用它
        const isProduction = !isLocalEnvironment();
        if (isProduction && window.supabaseConfig) {
            console.log('生产环境下使用window.supabaseConfig');
            supabaseConfig = window.supabaseConfig;
        }
        try {
            // 检查 Supabase 配置是否有效
            const isValidConfig = isSupabaseConfigValid(supabaseConfig);

            console.log('Supabase 配置:', supabaseConfig);
            console.log('配置有效性:', isValidConfig);

            if (!isValidConfig) {
                console.warn('Supabase 配置无效或未配置，将使用模拟模式');
                loadingStatus.textContent = 'Supabase 未配置，使用模拟模式';
                loadingStatus.classList.add('error');

                // 模拟初始化
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                    showError('Supabase 未配置，认证功能将不可用');

                    // 禁用认证按钮并添加遮罩效果
                    disableAuthButtons();
                }, 2000);

                return;
            }

            // 尝试初始化 Supabase
            initSupabase().then(({ data, error }) => {
                if (error) {
                    throw error;
                }

                console.log('Supabase 连接测试成功');

                // Supabase 连接成功
                loadingStatus.textContent = 'Supabase 连接成功！正在加载主站内容...';
                loadingStatus.style.color = 'var(--secondary-color)';

                // 延迟显示主站内容
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                    showSuccess('欢迎来到 OmvianHub！');

                    // 启用认证按钮
                    document.getElementById('loginBtn').disabled = false;
                    document.getElementById('registerBtn').disabled = false;

                    // 设置认证监听器
                    setupAuthListeners();

                    // 检查用户是否已登录
                    if (data.session) {
                        updateAuthUI(data.session.user);
                    }
                }, 1500);
            }).catch((error) => {
                // Supabase 连接失败
                console.error('Supabase 连接失败:', error);
                loadingStatus.textContent = 'Supabase 连接失败，部分功能不可用';
                loadingStatus.classList.add('error');

                // 仍然显示主站内容，但显示错误提示
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                    showError('Supabase 连接失败，认证功能暂时不可用');

                    // 禁用认证按钮并添加遮罩效果
                    disableAuthButtons();
                }, 2000);
            });
        } catch (error) {
            // Supabase 初始化失败
            console.error('Supabase 初始化失败:', error);
            loadingStatus.textContent = 'Supabase 初始化失败，部分功能不可用';
            loadingStatus.classList.add('error');

            // 仍然显示主站内容，但显示错误提示
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
                showError('Supabase 初始化失败，认证功能暂时不可用');

                // 禁用认证按钮并添加遮罩效果
                disableAuthButtons();
            }, 2000);
        }
    });
});

// 检查用户会话
async function checkUserSession() {
    if (!isSupabaseReady) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // 用户已登录
        updateAuthUI(session.user);
    }
}

// 设置认证相关监听器
function setupAuthListeners() {
    // 登录按钮点击事件
    document.getElementById('loginBtn').addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'block';
        // 清除之前的验证状态
        clearFormValidation('loginForm');
    });

    // 注册按钮点击事件 - 展开注册界面
    document.getElementById('registerBtn').addEventListener('click', () => {
        const overlay = document.getElementById('registerOverlay');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        // 清除之前的验证状态
        clearFormValidation('registerForm');
    });

    // 注册界面关闭按钮
    document.getElementById('registerCloseBtn').addEventListener('click', () => {
        const overlay = document.getElementById('registerOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // 恢复背景滚动
    });

    // 点击注册界面外部关闭
    document.getElementById('registerOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

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

    // 登录表单实时验证
    setupLoginFormValidation();

    // 注册表单实时验证
    setupRegisterFormValidation();

    // 登录表单提交
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 验证表单
        if (!validateLoginForm()) {
            return;
        }

        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 设置按钮加载状态
        ButtonManager.setButtonLoading('loginSubmitBtn', true);

        try {
            // 尝试登录
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // 登录成功
            console.log('登录成功:', data.user);
            showSuccess('登录成功！正在跳转...');

            // 更新UI显示用户已登录
            setTimeout(() => {
                updateAuthUI(data.user);
                document.getElementById('loginModal').style.display = 'none';
            }, 1500);

        } catch (error) {
            // 登录失败
            console.error('登录失败:', error);

            // 根据错误类型显示不同的错误信息
            let errorMessage = '登录失败: ';
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = '邮箱或密码错误，请检查后重试。';
                FormValidator.showFieldError('username', '邮箱或密码错误');
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = '邮箱尚未验证，请查收验证邮件。';
            } else {
                errorMessage = error.message || '未知错误，请稍后重试。';
            }

            showError(errorMessage);
        } finally {
            // 恢复按钮状态
            ButtonManager.setButtonLoading('loginSubmitBtn', false);
        }
    });

    // 注册表单提交
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 验证表单
        if (!validateRegisterForm()) {
            return;
        }

        const email = document.getElementById('regEmail').value;
        const nickname = document.getElementById('regNickname').value;
        const password = document.getElementById('regPassword').value;

        // 设置按钮加载状态
        ButtonManager.setButtonLoading('registerSubmitBtn', true);

        try {
            // 创建用户
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
            showSuccess('注册成功！验证邮件已发送到您的邮箱，请查收并验证邮箱。');

            // 关闭注册界面
            setTimeout(() => {
                document.getElementById('registerOverlay').classList.remove('active');
                document.body.style.overflow = '';
                // 清空表单
                document.getElementById('registerForm').reset();
                // 清除验证状态
                clearFormValidation('registerForm');
            }, 3000);

        } catch (error) {
            // 注册失败
            console.error('注册失败:', error);

            // 根据错误类型显示不同的错误信息
            let errorMessage = '注册失败: ';
            if (error.message.includes('already registered')) {
                errorMessage = '该邮箱已被注册，请使用其他邮箱或尝试登录。';
                FormValidator.showFieldError('regEmail', '该邮箱已被注册');
            } else {
                errorMessage = error.message || '未知错误，请稍后重试。';
            }

            showError(errorMessage);
        } finally {
            // 恢复按钮状态
            ButtonManager.setButtonLoading('registerSubmitBtn', false);
        }
    });

    // 更新认证UI
    function updateAuthUI(user) {
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
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                try {
                    await supabase.auth.signOut();
                    console.log('退出成功');
                    // 更新UI显示用户已退出
                    location.reload();
                } catch (error) {
                    console.error('退出失败:', error);
                }
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
}

// 禁用认证按钮并添加遮罩效果
function disableAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // 创建遮罩层
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

    // 确保按钮不被禁用
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.title = '';
    }

    if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.title = '';
    }
}

// 表单验证工具
const FormValidator = {
    // 验证邮箱格式
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // 验证密码强度
    getPasswordStrength: function(password) {
        let strength = 0;

        // 长度检查
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;

        // 复杂性检查
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        return strength;
    },

    // 验证昵称
    isValidNickname: function(nickname) {
        return nickname.length >= 2 && nickname.length <= 20;
    },

    // 显示字段错误
    showFieldError: function(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        field.classList.add('invalid');
        field.classList.remove('valid');

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },

    // 显示字段成功
    showFieldSuccess: function(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        field.classList.add('valid');
        field.classList.remove('invalid');

        if (errorElement) {
            errorElement.classList.remove('show');
        }
    },

    // 清除字段状态
    clearFieldStatus: function(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        field.classList.remove('valid', 'invalid');

        if (errorElement) {
            errorElement.classList.remove('show');
        }
    },

    // 更新密码强度指示器
    updatePasswordStrength: function(password, strengthBarId, strengthTextId) {
        const strengthBar = document.getElementById(strengthBarId);
        const strengthText = document.getElementById(strengthTextId);

        if (!strengthBar || !strengthText) return;

        const strength = this.getPasswordStrength(password);

        strengthBar.className = 'password-strength-bar';

        if (strength <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = '弱';
            strengthText.style.color = '#f44336';
        } else if (strength <= 4) {
            strengthBar.classList.add('medium');
            strengthText.textContent = '中等';
            strengthText.style.color = '#ff9800';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = '强';
            strengthText.style.color = '#4caf50';
        }
    }
};

// 按钮状态管理
const ButtonManager = {
    // 设置按钮加载状态
    setButtonLoading: function(buttonId, isLoading = true) {
        const button = document.getElementById(buttonId);
        const spinner = document.getElementById(buttonId.replace('Btn', 'Spinner'));
        const buttonText = document.getElementById(buttonId.replace('Btn', 'ButtonText'));

        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            if (spinner) spinner.style.display = 'inline-block';
            if (buttonText) buttonText.style.display = 'none';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            if (spinner) spinner.style.display = 'none';
            if (buttonText) buttonText.style.display = 'inline';
        }
    }
};

// 设置登录表单验证
function setupLoginFormValidation() {
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');

    // 邮箱验证
    usernameField.addEventListener('blur', function() {
        const email = this.value.trim();

        if (!email) {
            FormValidator.showFieldError('username', '请输入邮箱地址');
        } else if (!FormValidator.isValidEmail(email)) {
            FormValidator.showFieldError('username', '请输入有效的邮箱地址');
        } else {
            FormValidator.showFieldSuccess('username');
        }
    });

    // 密码验证
    passwordField.addEventListener('blur', function() {
        const password = this.value;

        if (!password) {
            FormValidator.showFieldError('password', '请输入密码');
        } else if (password.length < 6) {
            FormValidator.showFieldError('password', '密码长度至少为6位');
        } else {
            FormValidator.showFieldSuccess('password');
        }
    });

    // 输入时清除错误状态
    usernameField.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            FormValidator.clearFieldStatus('username');
        }
    });

    passwordField.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            FormValidator.clearFieldStatus('password');
        }
    });
}

// 设置注册表单验证
function setupRegisterFormValidation() {
    const emailField = document.getElementById('regEmail');
    const nicknameField = document.getElementById('regNickname');
    const passwordField = document.getElementById('regPassword');
    const confirmPasswordField = document.getElementById('regConfirmPassword');

    // 邮箱验证
    emailField.addEventListener('blur', function() {
        const email = this.value.trim();

        if (!email) {
            FormValidator.showFieldError('regEmail', '请输入邮箱地址');
        } else if (!FormValidator.isValidEmail(email)) {
            FormValidator.showFieldError('regEmail', '请输入有效的邮箱地址');
        } else {
            FormValidator.showFieldSuccess('regEmail');
        }
    });

    // 昵称验证
    nicknameField.addEventListener('blur', function() {
        const nickname = this.value.trim();

        if (!nickname) {
            FormValidator.showFieldError('regNickname', '请输入昵称');
        } else if (!FormValidator.isValidNickname(nickname)) {
            FormValidator.showFieldError('regNickname', '昵称长度应为2-20个字符');
        } else {
            FormValidator.showFieldSuccess('regNickname');
        }
    });

    // 密码验证
    passwordField.addEventListener('input', function() {
        const password = this.value;

        // 更新密码强度指示器
        FormValidator.updatePasswordStrength(password, 'passwordStrengthBar', 'passwordStrengthText');

        // 验证密码
        if (!password) {
            FormValidator.showFieldError('regPassword', '请输入密码');
        } else if (password.length < 6) {
            FormValidator.showFieldError('regPassword', '密码长度至少为6位');
        } else {
            FormValidator.showFieldSuccess('regPassword');
        }

        // 如果确认密码已填写，重新验证
        if (confirmPasswordField.value) {
            validateConfirmPassword();
        }
    });

    // 确认密码验证
    confirmPasswordField.addEventListener('input', validateConfirmPassword);

    function validateConfirmPassword() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (!confirmPassword) {
            FormValidator.showFieldError('regConfirmPassword', '请确认密码');
        } else if (password !== confirmPassword) {
            FormValidator.showFieldError('regConfirmPassword', '两次输入的密码不一致');
        } else {
            FormValidator.showFieldSuccess('regConfirmPassword');
        }
    }

    // 输入时清除错误状态
    emailField.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            FormValidator.clearFieldStatus('regEmail');
        }
    });

    nicknameField.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            FormValidator.clearFieldStatus('regNickname');
        }
    });
}

// 验证登录表单
function validateLoginForm() {
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    let isValid = true;

    if (!email) {
        FormValidator.showFieldError('username', '请输入邮箱地址');
        isValid = false;
    } else if (!FormValidator.isValidEmail(email)) {
        FormValidator.showFieldError('username', '请输入有效的邮箱地址');
        isValid = false;
    }

    if (!password) {
        FormValidator.showFieldError('password', '请输入密码');
        isValid = false;
    } else if (password.length < 6) {
        FormValidator.showFieldError('password', '密码长度至少为6位');
        isValid = false;
    }

    return isValid;
}

// 验证注册表单
function validateRegisterForm() {
    const email = document.getElementById('regEmail').value.trim();
    const nickname = document.getElementById('regNickname').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    let isValid = true;

    if (!email) {
        FormValidator.showFieldError('regEmail', '请输入邮箱地址');
        isValid = false;
    } else if (!FormValidator.isValidEmail(email)) {
        FormValidator.showFieldError('regEmail', '请输入有效的邮箱地址');
        isValid = false;
    }

    if (!nickname) {
        FormValidator.showFieldError('regNickname', '请输入昵称');
        isValid = false;
    } else if (!FormValidator.isValidNickname(nickname)) {
        FormValidator.showFieldError('regNickname', '昵称长度应为2-20个字符');
        isValid = false;
    }

    if (!password) {
        FormValidator.showFieldError('regPassword', '请输入密码');
        isValid = false;
    } else if (password.length < 6) {
        FormValidator.showFieldError('regPassword', '密码长度至少为6位');
        isValid = false;
    }

    if (!confirmPassword) {
        FormValidator.showFieldError('regConfirmPassword', '请确认密码');
        isValid = false;
    } else if (password !== confirmPassword) {
        FormValidator.showFieldError('regConfirmPassword', '两次输入的密码不一致');
        isValid = false;
    }

    return isValid;
}

// 清除表单验证状态
function clearFormValidation(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input');
    const errors = form.querySelectorAll('.form-error');

    inputs.forEach(input => {
        input.classList.remove('valid', 'invalid');
    });

    errors.forEach(error => {
        error.classList.remove('show');
    });
}

// 分类点击事件
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
            filterModules(categoryType);
        } else if (categoryType === 'all') {
            // 全部分类特殊处理 - 显示所有模块
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 显示所有模块
            filterModules('all');
        } else {
            // 其他分类保持原有行为 - 展开/折叠子菜单
            category.classList.toggle('expanded');
        }
    });
});

// 分类项点击事件
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有活动状态
        document.querySelectorAll('.category-item').forEach(i => {
            i.classList.remove('active');
        });
        // 添加当前活动状态
        item.classList.add('active');

        // 获取筛选类别
        const filter = item.getAttribute('data-filter');
        filterModules(filter);
    });
});

// 筛选模块卡片
function filterModules(filter) {
    const modules = document.querySelectorAll('.module-card');

    if (filter === 'all') {
        // 显示所有模块
        modules.forEach(module => {
            module.style.display = 'flex';
        });
    } else {
        // 检查是否为分类筛选
        const isCategory = ['movie', 'music', 'tech', 'life'].includes(filter);

        if (isCategory) {
            // 显示该分类下的所有模块
            modules.forEach(module => {
                if (module.getAttribute('data-category') === filter) {
                    module.style.display = 'flex';
                } else {
                    module.style.display = 'none';
                }
            });
        } else {
            // 显示特定模块
            modules.forEach(module => {
                if (module.getAttribute('data-module') === filter) {
                    module.style.display = 'flex';
                } else {
                    module.style.display = 'none';
                }
            });
        }
    }
}

// 模块卡片点击事件
document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', () => {
        const moduleTitle = card.querySelector('.module-title').textContent;
        const moduleCategory = card.getAttribute('data-category');
        const module = card.getAttribute('data-module');

        console.log('打开模块:', moduleTitle, '分类:', moduleCategory, '模块ID:', module);

        // 实际应用中，这里应该跳转到对应的子页面
        // 例如: window.location.href = `${moduleCategory}/${module}.html`;

        // 模拟跳转提示
        alert(`即将跳转到 ${moduleTitle} 模块`);
    });
});

// 移动端菜单切换
const menuToggle = document.createElement('button');
menuToggle.className = 'menu-toggle';
menuToggle.innerHTML = '<i class="material-icons">menu</i>';
document.querySelector('.logo').parentElement.insertBefore(menuToggle, document.querySelector('.logo').nextSibling);

menuToggle.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});
