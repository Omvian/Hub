// mbti-auth.js - MBTI测试认证系统模块
class MBTIAuth {
    constructor(data) {
        this.data = data;
        this.isLocalFile = window.location.protocol === 'file:';
        this.init();
    }

    init() {
        console.log('🔧 开始初始化MBTI页面认证系统');
        
        if (this.isLocalFile) {
            console.log('⚠️ 检测到本地文件环境，使用简化认证模式');
            this.initializeLocalAuthSystem();
        } else {
            this.initializeServerAuthSystem();
        }
    }

    // 初始化服务器认证系统
    initializeServerAuthSystem() {
        // 检查必要的全局对象是否存在
        if (typeof window.authManager === 'undefined') {
            console.error('❌ authManager 未找到');
            this.initializeLocalAuthSystem();
            return;
        }

        if (typeof window.configManager === 'undefined') {
            console.error('❌ configManager 未找到');
            this.initializeLocalAuthSystem();
            return;
        }

        // 等待配置管理器准备就绪
        this.waitForConfigManager();
    }

    // 等待配置管理器
    waitForConfigManager() {
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
                
                console.log('✅ MBTI页面认证系统初始化完成');
            } else if (configWaitCount >= maxConfigWait) {
                console.warn('⚠️ 配置管理器等待超时，切换到本地模式');
                this.initializeLocalAuthSystem();
            } else {
                console.log(`⏳ 等待配置管理器准备就绪... (${configWaitCount}/${maxConfigWait})`);
                setTimeout(waitForConfig, 100);
            }
        };

        waitForConfig();
    }

    // 初始化本地认证系统
    initializeLocalAuthSystem() {
        console.log('🏠 初始化本地文件认证系统');
        
        // 设置基本的模态框事件监听器
        this.setupLocalModalEvents();
        
        // 显示本地环境提示
        setTimeout(() => {
            this.showNotification('当前为本地文件模式，认证功能受限', 'warning');
        }, 2000);
        
        console.log('✅ 本地认证系统初始化完成');
    }

    // 设置本地模态框事件
    setupLocalModalEvents() {
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
        
        // 登录表单提交事件
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.showNotification('本地文件模式下无法进行真实登录，请部署到服务器环境', 'info');
                console.log('ℹ️ 本地模式登录尝试');
            });
        }
        
        // 注册表单提交事件
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.showNotification('本地文件模式下无法进行真实注册，请部署到服务器环境', 'info');
                console.log('ℹ️ 本地模式注册尝试');
            });
        }
        
        console.log('🎛️ 本地模态框事件监听器已设置');
    }

    // 显示通知
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // 简单的通知实现
            const notification = document.createElement('div');
            notification.className = `auth-notification ${type}`;
            notification.textContent = message;
            
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
                maxWidth: '300px'
            });
            
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6'
            };
            notification.style.background = colors[type] || colors.info;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    }
}

window.MBTIAuth = MBTIAuth;
