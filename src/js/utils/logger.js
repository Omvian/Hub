// logger.js - 日志管理工具类
// 功能: 控制台日志输出、环境检测、日志级别控制、生产环境保护
// 全局: window.logger

class Logger {
    constructor() {
        // 检测是否为本地开发环境
        this.isDevelopment = this.detectDevelopmentEnvironment();
        
        // 日志级别配置
        this.levels = {
            ERROR: 0,   // 错误 - 生产环境也显示
            WARN: 1,    // 警告 - 生产环境也显示
            INFO: 2,    // 信息 - 仅开发环境
            DEBUG: 3    // 调试 - 仅开发环境
        };
        
        // 当前日志级别 - 生产环境只显示错误
        this.currentLevel = this.isDevelopment ? this.levels.DEBUG : this.levels.ERROR;
        
        // 初始化提示 - 仅开发环境
        if (this.isDevelopment) {
            console.log('🔧 开发模式：日志输出已启用');
        }
    }
    
    /**
     * 检测是否为开发环境
     */
    detectDevelopmentEnvironment() {
        // 检测本地开发环境的多种方式
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           hostname.includes('local');
        
        const isFileProtocol = window.location.protocol === 'file:';
        const hasDevParams = window.location.search.includes('debug=true');
        
        // 生产环境强制检查：如果是正式域名，强制为生产环境
        const isProductionDomain = hostname && 
                                  !isLocalhost && 
                                  !isFileProtocol && 
                                  !hasDevParams &&
                                  (hostname.includes('.com') || 
                                   hostname.includes('.cn') || 
                                   hostname.includes('.org') ||
                                   hostname.includes('.net'));
        
        // 如果是生产域名，强制返回false（生产环境）
        if (isProductionDomain) {
            return false;
        }
        
        return isLocalhost || isFileProtocol || hasDevParams;
    }
    
    /**
     * 错误日志 - 生产环境也会显示
     */
    error(message, ...args) {
        if (this.currentLevel >= this.levels.ERROR) {
            console.error(`❌ ${message}`, ...args);
        }
    }
    
    /**
     * 警告日志 - 仅开发环境显示
     */
    warn(message, ...args) {
        if (this.currentLevel >= this.levels.WARN) {
            console.warn(`⚠️ ${message}`, ...args);
        }
    }
    
    /**
     * 信息日志 - 仅开发环境显示
     */
    info(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`ℹ️ ${message}`, ...args);
        }
    }
    
    /**
     * 调试日志 - 仅开发环境显示
     */
    debug(message, ...args) {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.log(`🔍 ${message}`, ...args);
        }
    }
    
    /**
     * 成功日志 - 仅开发环境显示
     */
    success(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`✅ ${message}`, ...args);
        }
    }
    
    /**
     * 系统启动日志 - 仅开发环境显示
     */
    system(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`🚀 ${message}`, ...args);
        }
    }
    
    /**
     * 性能日志 - 仅开发环境显示
     */
    performance(label, startTime) {
        if (this.currentLevel >= this.levels.DEBUG) {
            const duration = Date.now() - startTime;
            console.log(`⏱️ ${label}: ${duration}ms`);
        }
    }
    
    /**
     * 用户操作日志 - 仅开发环境显示
     */
    user(action, details) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`👤 用户操作: ${action}`, details || '');
        }
    }
    
    /**
     * Cookie相关日志 - 仅开发环境显示
     */
    cookie(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`🍪 ${message}`, ...args);
        }
    }
    
    /**
     * 移动端适配日志 - 仅开发环境显示
     */
    mobile(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`📱 ${message}`, ...args);
        }
    }
    
    /**
     * 认证相关日志 - 仅开发环境显示
     */
    auth(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`🔐 ${message}`, ...args);
        }
    }
    
    /**
     * 网络请求日志 - 仅开发环境显示
     */
    network(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`🌐 ${message}`, ...args);
        }
    }
    
    /**
     * 分组日志开始 - 仅开发环境显示
     */
    group(title) {
        if (this.currentLevel >= this.levels.INFO) {
            console.group(`📂 ${title}`);
        }
    }
    
    /**
     * 分组日志结束 - 仅开发环境显示
     */
    groupEnd() {
        if (this.currentLevel >= this.levels.INFO) {
            console.groupEnd();
        }
    }
    
    /**
     * 表格日志 - 仅开发环境显示
     */
    table(data, columns) {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.table(data, columns);
        }
    }
    
    /**
     * 获取当前环境信息 - 仅开发环境显示
     */
    getEnvironmentInfo() {
        if (this.currentLevel >= this.levels.DEBUG) {
            return {
                isDevelopment: this.isDevelopment,
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                currentLevel: this.currentLevel,
                logsEnabled: this.currentLevel >= this.levels.INFO
            };
        }
        return null;
    }
}

// 创建全局日志实例
window.logger = new Logger();

// 在开发环境下提供环境信息
if (window.logger.isDevelopment) {
    window.logger.debug('日志管理器初始化完成', window.logger.getEnvironmentInfo());
}

// 导出日志实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}