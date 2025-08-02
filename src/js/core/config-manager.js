// src/js/core/config-manager.js
// 配置管理模块 - 负责Supabase配置的管理和验证

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
        console.log('检查Supabase配置有效性...');
        console.log('配置详情:', {
            url: config.url,
            keyLength: config.key ? config.key.length : 0,
            keyType: config.key.startsWith('sb_publishable_') ? '可发布密钥' : '其他类型'
        });

        // 检查基本格式
        if (!config.url || !config.key) {
            console.warn('配置缺少必要字段');
            return false;
        }

        // 检查URL格式
        if (!config.url.startsWith('https://') || !config.url.includes('.supabase.co')) {
            console.warn('Supabase URL格式无效');
            return false;
        }

        // 检查密钥格式（可发布密钥应该以sb_publishable_开头）
        if (!config.key.startsWith('sb_publishable_')) {
            console.warn('密钥格式无效，应使用可发布密钥');
            return false;
        }

        console.log('Supabase配置有效');
        return true;
    }

    // 初始化 Supabase
    async initSupabase() {
        console.log('开始初始化Supabase...');
        
        try {
            if (this.isSupabaseConfigValid(this.supabaseConfig)) {
                console.log('正在创建Supabase客户端...');
                
                // 检查Supabase SDK是否正确加载
                if (!window.supabase || !window.supabase.createClient) {
                    throw new Error('Supabase SDK 未正确加载');
                }
                
                // 创建Supabase客户端
                this.supabase = window.supabase.createClient(
                    this.supabaseConfig.url, 
                    this.supabaseConfig.key
                );
                console.log('Supabase 客户端创建成功');
                
                // 验证连接
                const sessionResult = await this.supabase.auth.getSession();
                if (sessionResult.error) {
                    console.warn('Supabase连接验证警告:', sessionResult.error.message);
                } else {
                    console.log('Supabase连接验证成功');
                }
                
                this.isSupabaseReady = true;
                console.log('Supabase初始化成功');
                return sessionResult; // 返回完整的session结果
                
            } else {
                const errorMsg = 'Supabase配置无效';
                console.error(errorMsg);
                
                // 使用通知管理器显示错误
                if (window.showError) {
                    window.showError('Supabase 配置无效，认证功能将不可用', 3000);
                }
                return { data: null, error: new Error(errorMsg) };
            }
        } catch (error) {
            console.error('Supabase初始化失败:', error);
            
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