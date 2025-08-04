// config-manager.js - Supabase配置管理核心模块
// 依赖: constants.js, notification-manager.js, Supabase SDK
// 功能: Supabase配置管理、客户端初始化、连接验证、状态检查
// 全局: window.configManager

class ConfigManager {
    constructor() {
        // Supabase配置 - 使用可发布密钥，可以安全地暴露在客户端代码中
        this.supabaseConfig = {
            url: 'https://nqfxyrmhjmxjhcizwlwu.supabase.co',
            key: 'sb_publishable_XRfyh45O5KCz2hRhMEYeog_uzd3Syvd'
        };
        this.isSupabaseReady = false;
        this.supabase = null;
    }

    // 检查 Supabase 配置是否有效
    isSupabaseConfigValid(config) {
        if (window.logger?.isDevelopment) {
            window.logger.debug('检查Supabase配置有效性');
        }

        // 检查基本格式
        if (!config.url || !config.key) {
            window.logger?.warn('Supabase配置缺少必要字段');
            return false;
        }

        // 检查URL格式
        if (!config.url.startsWith('https://') || !config.url.includes('.supabase.co')) {
            window.logger?.warn('Supabase URL格式无效');
            return false;
        }

        // 检查密钥格式（可发布密钥应该以sb_publishable_开头）
        if (!config.key.startsWith('sb_publishable_')) {
            window.logger?.warn('密钥格式无效，应使用可发布密钥');
            return false;
        }

        if (window.logger?.isDevelopment) {
            window.logger.debug('Supabase配置验证通过');
        }
        return true;
    }

    // 初始化 Supabase
    async initSupabase() {
        if (window.logger?.isDevelopment) {
            window.logger.info('开始初始化Supabase');
        }
        
        try {
            if (this.isSupabaseConfigValid(this.supabaseConfig)) {
                // 检查Supabase SDK是否正确加载
                if (!window.supabase || !window.supabase.createClient) {
                    throw new Error('Supabase SDK 未正确加载');
                }
                
                // 创建Supabase客户端
                this.supabase = window.supabase.createClient(
                    this.supabaseConfig.url, 
                    this.supabaseConfig.key
                );
                
                // 验证连接
                const sessionResult = await this.supabase.auth.getSession();
                if (sessionResult.error) {
                    window.logger?.warn('Supabase连接验证警告:', sessionResult.error.message);
                } else {
                    if (window.logger?.isDevelopment) {
                        window.logger.info('Supabase连接验证成功');
                    }
                }
                
                this.isSupabaseReady = true;
                if (window.logger?.isDevelopment) {
                    window.logger.info('Supabase初始化完成');
                }
                return sessionResult; // 返回完整的session结果
                
            } else {
                const errorMsg = 'Supabase配置无效';
                window.logger?.error(errorMsg);
                
                // 使用通知管理器显示错误
                if (window.showError) {
                    window.showError('Supabase 配置无效，认证功能将不可用', 3000);
                }
                return { data: null, error: new Error(errorMsg) };
            }
        } catch (error) {
            window.logger?.error('Supabase初始化失败:', error);
            
            // 使用通知管理器显示错误
            if (window.showError) {
                window.showError('Supabase 连接失败，认证功能暂时不可用', 3000);
            }
            return { data: null, error: error };
        }
    }

    // 获取Supabase实例
    getSupabase() {
        return this.supabase;
    }

    // 检查Supabase是否就绪
    isReady() {
        return this.isSupabaseReady;
    }

    // 获取配置信息
    getConfig() {
        return this.supabaseConfig;
    }

    // 显示配置状态
    getStatus() {
        return {
            environment: 'production', // 现在统一使用生产配置
            supabaseReady: this.isSupabaseReady,
            configValid: this.isSupabaseConfigValid(this.supabaseConfig),
            hasSupabaseInstance: !!this.supabase,
            keyType: 'publishable' // 使用可发布密钥
        };
    }
}

// 创建全局配置管理器实例
window.configManager = new ConfigManager();

// 自动初始化配置管理器
document.addEventListener('DOMContentLoaded', async () => {
    if (window.logger?.isDevelopment) {
        window.logger.info('开始自动初始化配置管理器');
    }
    
    try {
        await window.configManager.initSupabase();
        if (window.logger?.isDevelopment) {
            window.logger.info('配置管理器自动初始化完成');
        }
    } catch (error) {
        window.logger?.error('配置管理器自动初始化失败:', error);
    }
});

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即初始化
    setTimeout(async () => {
        if (window.logger?.isDevelopment) {
            window.logger.info('DOM已就绪，立即初始化配置管理器');
        }
        
        try {
            await window.configManager.initSupabase();
            if (window.logger?.isDevelopment) {
                window.logger.info('配置管理器立即初始化完成');
            }
        } catch (error) {
            window.logger?.error('配置管理器立即初始化失败:', error);
        }
    }, 100);
}
