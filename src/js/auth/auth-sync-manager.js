// auth-sync-manager.js - 现代化认证状态同步管理器
// 功能: BroadcastChannel跨页面实时同步、localStorage备用机制、状态回调管理
// 技术: BroadcastChannel API + localStorage + visibilitychange事件
// 全局: window.authSyncManager

/**
 * 现代化认证状态同步管理器
 * 使用BroadcastChannel API实现跨页面实时同步，localStorage作为备用机制
 */
class AuthSyncManager {
    constructor() {
        this.channel = null;
        this.storageKey = 'omvian_auth_state';
        this.callbacks = [];
        this.currentUser = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // 1. 使用BroadcastChannel实现实时跨页面通信
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('omvian_auth');
            this.channel.addEventListener('message', (event) => {
                this.handleAuthMessage(event.data);
            });
            console.log('✅ BroadcastChannel认证同步已启用');
        } else {
            console.warn('⚠️ BroadcastChannel不支持，使用localStorage同步');
        }
        
        // 2. localStorage作为备用同步机制
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.handleStorageChange(e);
            }
        });
        
        // 3. 页面可见性变化时检查状态
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncFromStorage();
            }
        });
        
        // 4. 初始化时从存储中恢复状态
        this.syncFromStorage();
        
        this.isInitialized = true;
    }

    // 处理BroadcastChannel消息
    handleAuthMessage(data) {
        if (data.type === 'AUTH_STATE_CHANGE') {
            this.currentUser = data.user;
            this.notifyCallbacks(data.user);
            console.log('📡 收到认证状态广播:', data.user ? '已登录' : '已登出');
        }
    }

    // 处理localStorage变化
    handleStorageChange(event) {
        const newValue = event.newValue;
        const user = newValue ? JSON.parse(newValue).user : null;
        
        if (JSON.stringify(this.currentUser) !== JSON.stringify(user)) {
            this.currentUser = user;
            this.notifyCallbacks(user);
            console.log('💾 localStorage认证状态变化:', user ? '已登录' : '已登出');
        }
    }

    // 从存储中同步状态
    syncFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                if (data.user && JSON.stringify(this.currentUser) !== JSON.stringify(data.user)) {
                    this.currentUser = data.user;
                    this.notifyCallbacks(data.user);
                }
            } else if (this.currentUser) {
                this.currentUser = null;
                this.notifyCallbacks(null);
            }
        } catch (error) {
            console.error('❌ 同步认证状态失败:', error);
        }
    }

    // 广播认证状态变化
    broadcastAuthChange(user) {
        // 1. 更新本地状态
        this.currentUser = user;
        
        // 2. 保存到localStorage
        if (user) {
            const authState = {
                user: user,
                timestamp: Date.now(),
                lastActive: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(authState));
        } else {
            localStorage.removeItem(this.storageKey);
        }
        
        // 3. 通过BroadcastChannel广播
        if (this.channel) {
            this.channel.postMessage({
                type: 'AUTH_STATE_CHANGE',
                user: user,
                timestamp: Date.now()
            });
        }
        
        // 4. 通知本页面的回调
        this.notifyCallbacks(user);
        
        console.log('📢 广播认证状态变化:', user ? '已登录' : '已登出');
    }

    // 注册状态变化回调
    onAuthChange(callback) {
        this.callbacks.push(callback);
        
        // 立即调用一次，传递当前状态
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    // 通知所有回调
    notifyCallbacks(user) {
        this.callbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('❌ 认证状态回调执行失败:', error);
            }
        });
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }

    // 清理资源
    destroy() {
        if (this.channel) {
            this.channel.close();
        }
        this.callbacks = [];
        this.isInitialized = false;
    }
}

// 创建全局实例
window.authSyncManager = new AuthSyncManager();