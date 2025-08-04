// app-initializer.js - 应用初始化核心模块
// 依赖: config-manager.js, notification-manager.js, auth-manager.js
// 功能: 应用启动流程、加载状态管理、Supabase初始化、管理器协调
// 全局: window.appInitializer

class AppInitializer {
    constructor() {
        this.initializationSteps = [];
        this.isInitialized = false;
        this.loadingScreen = null;
        this.loadingStatus = null;
        
        // 添加全局初始化状态缓存
        this.globalInitState = this.getGlobalInitState();
    }
    
    // 获取全局初始化状态
    getGlobalInitState() {
        if (!window.omvianGlobalState) {
            window.omvianGlobalState = {
                isInitialized: false,
                supabaseReady: false,
                managersReady: false,
                lastInitTime: 0
            };
        }
        return window.omvianGlobalState;
    }

    // 初始化应用
    init() {
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

    // 开始初始化流程 - 优化版本，支持快速重入
    async startInitialization() {
        try {
            // 检查是否需要完整初始化
            const needsFullInit = this.needsFullInitialization();
            
            if (!needsFullInit) {
                // 快速初始化：只更新UI状态
                this.updateLoadingStatus('正在恢复状态...');
                await this.quickInitialization();
                return;
            }

            // 完整初始化流程
            this.updateLoadingStatus('正在加载配置...');

            // 步骤1: 初始化Supabase
            await this.initializeSupabase();

            // 步骤2: 初始化各个管理器
            await this.initializeManagers();

            // 步骤3: 完成初始化
            await this.completeInitialization();

        } catch (error) {
            window.logger?.error('应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }
    
    // 检查是否需要完整初始化
    needsFullInitialization() {
        const now = Date.now();
        const timeSinceLastInit = now - this.globalInitState.lastInitTime;
        
        // 如果距离上次初始化不到30秒，且状态正常，则不需要完整初始化
        if (timeSinceLastInit < 30000 && 
            this.globalInitState.isInitialized && 
            window.configManager && 
            window.authManager) {
            return false;
        }
        
        return true;
    }
    
    // 快速初始化 - 用于页面间快速切换
    async quickInitialization() {
        this.updateLoadingStatus('正在恢复状态...');
        
        // 检查认证状态
        if (window.authManager) {
            await window.authManager.checkUserSession();
        }
        
        // 快速完成
        setTimeout(() => {
            this.hideLoadingScreen();
            this.isInitialized = true;
            this.triggerInitializationComplete();
        }, 200); // 极快的加载时间
    }

    // 初始化Supabase - 优化版本
    async initializeSupabase() {
        this.updateLoadingStatus('正在连接服务...');

        try {
            // 检查配置有效性
            const config = window.configManager.getConfig();
            const isValidConfig = window.configManager.isSupabaseConfigValid(config);

            if (!isValidConfig) {
                throw new Error('Supabase 配置无效或未配置');
            }

            // 初始化Supabase
            const sessionData = await window.configManager.initSupabase();
            
            this.updateLoadingStatus('正在加载主站内容...', 'success');

            // 启用认证按钮
            this.enableAuthButtons();

            // 如果有会话，更新认证UI
            if (sessionData && sessionData.data && sessionData.data.session) {
                window.authManager.updateAuthUI(sessionData.data.session.user);
            }

            return sessionData;

        } catch (error) {
            if (error.message.includes('配置无效')) {
                this.updateLoadingStatus('认证功能不可用', 'warning');
            } else {
                this.updateLoadingStatus('连接失败，认证功能不可用', 'error');
            }

            // 禁用认证按钮
            this.disableAuthButtons();
            
            // 不抛出错误，继续初始化其他功能
            return null;
        }
    }

    // 初始化各个管理器 - 优化版本
    async initializeManagers() {
        this.updateLoadingStatus('正在初始化功能模块...');

        try {
            // 初始化认证管理器
            if (window.authManager) {
                window.authManager.init();
            }

            // 初始化UI管理器
            if (window.uiManager) {
                window.uiManager.init();
            }

        } catch (error) {
            window.logger?.error('管理器初始化失败:', error);
            throw error;
        }
    }

    // 完成初始化 - 优化版本，减少延迟
    async completeInitialization() {
        this.updateLoadingStatus('正在进入主站...', 'success');

        // 更新全局状态
        this.globalInitState.isInitialized = true;
        this.globalInitState.supabaseReady = window.configManager ? window.configManager.isReady() : false;
        this.globalInitState.managersReady = true;
        this.globalInitState.lastInitTime = Date.now();

        // 减少延迟时间，加快进入速度
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showWelcomeMessage();
            this.isInitialized = true;
            
            // 触发初始化完成事件
            this.triggerInitializationComplete();
        }, 800);
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
        }, 1000); // 减少延迟
    }

    // 更新加载状态 - 优化版本，减少日志输出
    updateLoadingStatus(message, type = 'info') {
        if (!this.loadingStatus) return;

        this.loadingStatus.textContent = message;
        
        // 清除之前的状态类
        this.loadingStatus.classList.remove('success', 'error', 'warning');
        
        // 添加新的状态类
        if (type !== 'info') {
            this.loadingStatus.classList.add(type);
        }

        // 只在错误时输出日志
        if (type === 'error') {
            window.logger?.error(`加载状态: ${message}`);
        }
    }

    // 隐藏加载界面
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    // 显示欢迎消息 - 优化版本
    showWelcomeMessage() {
        if (window.configManager.isReady()) {
            // 使用通知管理器显示成功消息（如果可用）
            if (window.showSuccess) {
                window.showSuccess('欢迎来到 OmvianHub！', 2000); // 减少显示时间
            }
        } else {
            // 使用通知管理器显示信息消息（如果可用）
            if (window.showInfo) {
                window.showInfo('欢迎来到 OmvianHub！', 2000);
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