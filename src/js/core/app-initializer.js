// app-initializer.js
// 应用初始化模块 - 负责页面加载时的初始化流程

class AppInitializer {
    constructor() {
        this.initializationSteps = [];
        this.isInitialized = false;
        this.loadingScreen = null;
        this.loadingStatus = null;
    }

    // 初始化应用
    init() {
        console.log('开始初始化应用...');
        
        // 获取加载界面元素
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingStatus = document.getElementById('loadingStatus');

        // 设置页面加载监听器
        this.setupPageLoadListener();
    }

    // 设置页面加载监听器
    setupPageLoadListener() {
        window.addEventListener('load', () => {
            this.startInitialization();
        });
    }

    // 开始初始化流程
    async startInitialization() {
        try {
            console.log('页面加载完成，开始初始化流程...');

            // 步骤1: 等待本地配置加载
            await this.waitForConfiguration();

            // 步骤2: 初始化Supabase
            await this.initializeSupabase();

            // 步骤3: 初始化各个管理器
            await this.initializeManagers();

            // 步骤4: 完成初始化
            await this.completeInitialization();

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }

    // 等待配置加载
    async waitForConfiguration() {
        return new Promise((resolve) => {
            this.updateLoadingStatus('正在加载配置...');
            
            window.configManager.waitForLocalConfig(() => {
                console.log('配置加载完成');
                resolve();
            });
        });
    }

    // 初始化Supabase
    async initializeSupabase() {
        this.updateLoadingStatus('正在连接 Supabase...');

        try {
            // 检查配置有效性
            const config = window.configManager.getConfig();
            const isValidConfig = window.configManager.isSupabaseConfigValid(config);

            if (!isValidConfig) {
                throw new Error('Supabase 配置无效或未配置');
            }

            // 初始化Supabase
            const sessionData = await window.configManager.initSupabase();
            
            console.log('Supabase 连接测试成功');
            this.updateLoadingStatus('Supabase 连接成功！正在加载主站内容...', 'success');

            // 启用认证按钮
            this.enableAuthButtons();

            // 如果有会话，更新认证UI
            if (sessionData && sessionData.data && sessionData.data.session) {
                window.authManager.updateAuthUI(sessionData.data.session.user);
            }

            return sessionData;

        } catch (error) {
            console.warn('Supabase 初始化失败:', error);
            
            if (error.message.includes('配置无效')) {
                this.updateLoadingStatus('Supabase 未配置，认证功能不可用', 'warning');
                // 使用通知管理器显示错误（如果可用）
                if (window.showError) {
                    window.showError('Supabase 未配置，认证功能将不可用', 3000);
                }
            } else {
                this.updateLoadingStatus('Supabase 连接失败，认证功能不可用', 'error');
                // 使用通知管理器显示错误（如果可用）
                if (window.showError) {
                    window.showError('Supabase 连接失败，认证功能暂时不可用', 3000);
                }
            }

            // 禁用认证按钮
            this.disableAuthButtons();
            
            // 不抛出错误，继续初始化其他功能
            return null;
        }
    }

    // 初始化各个管理器
    async initializeManagers() {
        this.updateLoadingStatus('正在初始化功能模块...');

        try {
            // 初始化认证管理器
            if (window.authManager) {
                window.authManager.init();
                console.log('认证管理器初始化完成');
            }

            // 初始化UI管理器
            if (window.uiManager) {
                window.uiManager.init();
                console.log('UI管理器初始化完成');
            }

            // 初始化表单验证器（已在创建时自动初始化）
            console.log('表单验证器初始化完成');

            // 初始化按钮管理器（已在创建时自动初始化）
            console.log('按钮管理器初始化完成');

            // 初始化通知管理器（已在创建时自动初始化）
            console.log('通知管理器初始化完成');

        } catch (error) {
            console.error('管理器初始化失败:', error);
            throw error;
        }
    }

    // 完成初始化
    async completeInitialization() {
        this.updateLoadingStatus('初始化完成，正在进入主站...', 'success');

        // 延迟显示主站内容
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showWelcomeMessage();
            this.isInitialized = true;
            
            console.log('应用初始化完成');
            
            // 触发初始化完成事件
            this.triggerInitializationComplete();
        }, 1500);
    }

    // 处理初始化错误
    handleInitializationError(error) {
        this.updateLoadingStatus('初始化失败，部分功能不可用', 'error');

        // 仍然显示主站内容，但显示错误提示
        setTimeout(() => {
            this.hideLoadingScreen();
            // 使用通知管理器显示错误（如果可用）
            if (window.showError) {
                window.showError('应用初始化失败，部分功能可能不可用', 3000);
            }
            
            // 禁用认证按钮
            this.disableAuthButtons();
        }, 2000);
    }

    // 更新加载状态
    updateLoadingStatus(message, type = 'info') {
        if (!this.loadingStatus) return;

        this.loadingStatus.textContent = message;
        
        // 清除之前的状态类
        this.loadingStatus.classList.remove('success', 'error', 'warning');
        
        // 添加新的状态类
        if (type !== 'info') {
            this.loadingStatus.classList.add(type);
        }

        console.log(`加载状态: ${message}`);
    }

    // 隐藏加载界面
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    // 显示欢迎消息
    showWelcomeMessage() {
        if (window.configManager.isReady()) {
            // 使用通知管理器显示成功消息（如果可用）
            if (window.showSuccess) {
                window.showSuccess('欢迎来到 OmvianHub！', 3000);
            }
        } else {
            // 使用通知管理器显示信息消息（如果可用）
            if (window.showInfo) {
                window.showInfo('欢迎来到 OmvianHub！部分功能可能受限。', 3000);
            }
        }
    }

    // 启用认证按钮
    enableAuthButtons() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        if (loginBtn) {
            loginBtn.disabled = false;
        }
        
        if (registerBtn) {
            registerBtn.disabled = false;
        }

        // 移除遮罩层
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // 禁用认证按钮
    disableAuthButtons() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        if (loginBtn) {
            loginBtn.disabled = true;
        }
        
        if (registerBtn) {
            registerBtn.disabled = true;
        }

        // 添加遮罩效果
        if (window.authManager) {
            window.authManager.disableAuthButtons();
        }
    }

    // 触发初始化完成事件
    triggerInitializationComplete() {
        const event = new CustomEvent('appInitialized', {
            detail: {
                timestamp: Date.now(),
                supabaseReady: window.configManager.isReady()
            }
        });

        window.dispatchEvent(event);
    }

    // 添加初始化步骤
    addInitializationStep(name, handler) {
        this.initializationSteps.push({
            name,
            handler,
            completed: false
        });
    }

    // 检查是否已初始化
    isAppInitialized() {
        return this.isInitialized;
    }

    // 等待初始化完成
    waitForInitialization() {
        return new Promise((resolve) => {
            if (this.isInitialized) {
                resolve();
                return;
            }

            const handler = () => {
                window.removeEventListener('appInitialized', handler);
                resolve();
            };

            window.addEventListener('appInitialized', handler);
        });
    }

    // 重新初始化应用
    async reinitialize() {
        console.log('重新初始化应用...');
        
        this.isInitialized = false;
        
        // 显示加载界面
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
        }

        // 重新开始初始化流程
        await this.startInitialization();
    }

    // 获取初始化状态
    getInitializationStatus() {
        return {
            isInitialized: this.isInitialized,
            supabaseReady: window.configManager ? window.configManager.isReady() : false,
            steps: this.initializationSteps.map(step => ({
                name: step.name,
                completed: step.completed
            }))
        };
    }
}

// 创建全局应用初始化器实例
window.appInitializer = new AppInitializer();

// 自动开始初始化
window.appInitializer.init();