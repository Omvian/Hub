// src/js/core/config-manager.js
// 配置管理模块 - 负责Supabase配置的管理和验证

class ConfigManager {
    constructor() {
        // 使用 let 而不是 const，以便在本地环境中重新赋值
        this.supabaseConfig = {
            url: "%%SUPABASE_URL%%",
            key: "%%SUPABASE_KEY%%"
        };
        this.isSupabaseReady = false;
        this.supabase = null;
        this.isLocal = this.isLocalEnvironment();
    }

    // 统一环境检测函数
    isLocalEnvironment() {
        // 检测常见本地环境标识
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isFileProtocol = window.location.protocol === 'file:';
        const isPrivateIP = window.location.hostname.includes('192.168.') || 
                            window.location.hostname.includes('10.') || 
                            window.location.hostname.includes('172.');
        const isMobileLocal = window.innerWidth < 768 && (isLocalhost || isPrivateIP);
        
        console.log('环境检测结果:', {
            localhost: isLocalhost,
            fileProtocol: isFileProtocol,
            privateIP: isPrivateIP,
            mobileLocal: isMobileLocal,
            hostname: window.location.hostname,
            protocol: window.location.protocol
        });
        
        return isLocalhost || isFileProtocol || isPrivateIP || isMobileLocal;
    }

    // 检查 Supabase 配置是否有效
    isSupabaseConfigValid(config) {
        console.log('检查Supabase配置有效性...');
        console.log('配置详情:', {
            url: config.url,
            keyLength: config.key ? config.key.length : 0,
            environment: this.isLocal ? '本地' : '生产'
        });

        // 检查基本格式
        if (!config.url || !config.key) {
            console.warn('配置缺少必要字段');
            return false;
        }

        // 检查是否是占位符
        if (config.url.includes('%%') || config.key.includes('%%')) {
            console.warn('配置包含占位符，Supabase未正确配置');
            return false;
        }

        if (!config.url.startsWith('https://') || config.key.length < 20) {
            console.warn('配置格式无效');
            return false;
        }

        console.log('Supabase配置有效');
        return true;
    }

    // 等待本地配置加载完成
    waitForLocalConfig(callback) {
        console.log('环境检查:', this.isLocal ? '本地环境' : '生产环境');

        if (!this.isLocal) {
            // 非本地环境，直接执行回调
            console.log('生产环境，使用部署时替换的配置');
            callback();
            return;
        }

        // 本地环境，等待local_test.js配置加载
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒

        const checkInterval = setInterval(() => {
            attempts++;

            // 检查本地配置是否已加载
            if (window.supabaseConfig) {
                clearInterval(checkInterval);
                // 使用本地配置
                this.supabaseConfig = window.supabaseConfig;
                console.log('成功加载本地配置文件 (local_test.js)');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('本地配置文件 (local_test.js) 加载超时或不存在');
                console.warn('请确保已创建 local_test.js 文件并配置了正确的Supabase信息');
                callback();
            }
        }, 100);
    }

    // 初始化 Supabase
    async initSupabase() {
        console.log('开始初始化Supabase...');
        
        try {
            if (this.isSupabaseConfigValid(this.supabaseConfig)) {
                console.log('正在创建Supabase客户端...');
                // 检查Supabase是否正确加载
                if (!window.supabase || !window.supabase.createClient) {
                    throw new Error('Supabase SDK 未正确加载');
                }
                this.supabase = window.supabase.createClient(this.supabaseConfig.url, this.supabaseConfig.key);
                
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
                console.warn('Supabase配置无效，认证功能将不可用');
                // 使用通知管理器显示错误
                if (window.showError) {
                    window.showError('Supabase 未配置，认证功能将不可用', 3000);
                }
                return { data: null, error: new Error('Supabase配置无效') };
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
            environment: this.isLocal ? 'local' : 'production',
            supabaseReady: this.isSupabaseReady,
            configValid: this.isSupabaseConfigValid(this.supabaseConfig),
            hasSupabaseInstance: !!this.supabase
        };
    }
}

// 创建全局配置管理器实例
window.configManager = new ConfigManager();