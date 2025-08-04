// cookie-manager.js - Cookie管理工具类
// 功能: Cookie设置/获取/删除、隐私同意管理、分类权限控制、安全清理
// 全局: window.cookieManager

class CookieManager {
    constructor() {
        this.consentKey = 'omvian_privacy_consent';
        this.consentSettings = this.getConsentSettings();
        
        // Cookie分类定义
        this.categories = {
            necessary: 'necessary',      // 必要功能
            functional: 'functional',    // 功能性增强
            analytics: 'analytics',      // 使用分析
            personalization: 'personalization' // 个性化设置
        };
        
        // Cookie配置
        this.cookieConfig = {
            // 必要功能Cookie - 无法禁用
            'omvian_privacy_consent': { category: 'necessary', days: 365 },
            'omvian_auth_token': { category: 'necessary', days: 30 },
            'omvian_session_id': { category: 'necessary', days: 0 }, // 会话Cookie
            'omvian_auth_state': { category: 'necessary', days: 30 },
            'user_data': { category: 'necessary', days: 30 },
            
            // 功能性增强Cookie
            'omvian_theme_preference': { category: 'functional', days: 365 },
            'omvian_language': { category: 'functional', days: 365 },
            'omvian_layout_mode': { category: 'functional', days: 365 },
            'omvian_returning_from_subpage': { category: 'functional', days: 0 },
            'omvian_return_time': { category: 'functional', days: 0 },
            'omvian_from_main_page': { category: 'functional', days: 0 },
            'omvian_main_page_time': { category: 'functional', days: 0 },
            
            // 使用分析Cookie
            'omvian_analytics_id': { category: 'analytics', days: 730 },
            'omvian_page_views': { category: 'analytics', days: 730 },
            'omvian_behavior_data': { category: 'analytics', days: 365 },
            'omvian_performance_metrics': { category: 'analytics', days: 90 },
            
            // 个性化设置Cookie
            'omvian_interests': { category: 'personalization', days: 365 },
            'omvian_recommendations': { category: 'personalization', days: 365 },
            'omvian_content_prefs': { category: 'personalization', days: 365 }
        };
    }

    /**
     * 获取当前的隐私同意设置
     */
    getConsentSettings() {
        try {
            const consent = localStorage.getItem(this.consentKey);
            if (consent) {
                const consentData = JSON.parse(consent);
                return consentData.settings || {
                    necessary: true,
                    functional: false,
                    analytics: false,
                    personalization: false
                };
            }
        } catch (error) {
            window.logger?.warn('获取隐私同意设置失败:', error);
        }
        
        // 默认只允许必要Cookie
        return {
            necessary: true,
            functional: false,
            analytics: false,
            personalization: false
        };
    }

    /**
     * 更新隐私同意设置
     */
    updateConsentSettings(settings) {
        this.consentSettings = settings;
        
        // 根据新设置清理不被允许的Cookie
        this.cleanupCookiesByConsent(settings);
    }

    /**
     * 检查Cookie类别是否被允许
     */
    isCategoryAllowed(category) {
        return this.consentSettings[category] === true;
    }

    /**
     * 设置Cookie
     */
    setCookie(name, value, days = null, category = null) {
        // 获取Cookie配置
        const config = this.cookieConfig[name];
        if (config) {
            category = config.category;
            days = days !== null ? days : config.days;
        }
        
        // 检查是否允许设置此类别的Cookie
        if (category && !this.isCategoryAllowed(category)) {
            if (window.logger?.isDevelopment) {
                window.logger.cookie(`Cookie ${name} 被隐私设置阻止 (类别: ${category})`);
            }
            return false;
        }
        
        try {
            let expires = '';
            if (days && days > 0) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }
            
            // 安全设置
            const secure = location.protocol === 'https:' ? '; Secure' : '';
            const sameSite = '; SameSite=Lax';
            
            document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/${secure}${sameSite}`;
            
            if (window.logger?.isDevelopment) {
                window.logger.debug(`Cookie已设置: ${name} (类别: ${category || 'unknown'})`);
            }
            return true;
        } catch (error) {
            window.logger?.error(`设置Cookie失败: ${name}`, error);
            return false;
        }
    }

    /**
     * 获取Cookie值
     */
    getCookie(name) {
        try {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                }
            }
        } catch (error) {
            window.logger?.error(`获取Cookie失败: ${name}`, error);
        }
        return null;
    }

    /**
     * 删除Cookie
     */
    deleteCookie(name) {
        try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            if (window.logger?.isDevelopment) {
                window.logger.debug(`Cookie已删除: ${name}`);
            }
            return true;
        } catch (error) {
            window.logger?.error(`删除Cookie失败: ${name}`, error);
            return false;
        }
    }

    /**
     * 根据隐私同意设置清理Cookie
     */
    cleanupCookiesByConsent(consentSettings) {
        if (window.logger?.isDevelopment) {
            window.logger.cookie('根据隐私设置清理Cookie', consentSettings);
        }
        
        // 获取所有现有Cookie
        const cookies = document.cookie.split(';');
        let cleanedCount = 0;
        
        cookies.forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            const config = this.cookieConfig[name];
            
            if (config && config.category !== 'necessary') {
                // 检查此类别是否被允许
                if (!consentSettings[config.category]) {
                    this.deleteCookie(name);
                    cleanedCount++;
                }
            }
        });
        
        if (cleanedCount > 0 && window.logger?.isDevelopment) {
            window.logger.cookie(`已清理 ${cleanedCount} 个Cookie`);
        }
    }

    /**
     * 清除所有非必要Cookie
     */
    clearAllNonEssentialCookies() {
        if (window.logger?.isDevelopment) {
            window.logger.cookie('清除所有非必要Cookie');
        }
        
        const cookies = document.cookie.split(';');
        let cleanedCount = 0;
        
        cookies.forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            const config = this.cookieConfig[name];
            
            // 只保留必要Cookie
            if (!config || config.category !== 'necessary') {
                this.deleteCookie(name);
                cleanedCount++;
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.cookie(`已清除 ${cleanedCount} 个非必要Cookie`);
        }
    }

    /**
     * 获取所有Cookie的状态信息
     */
    getCookieStatus() {
        const status = {
            necessary: [],
            functional: [],
            analytics: [],
            personalization: [],
            unknown: []
        };
        
        const cookies = document.cookie.split(';');
        
        cookies.forEach(cookie => {
            if (cookie.trim()) {
                const name = cookie.split('=')[0].trim();
                const config = this.cookieConfig[name];
                const category = config ? config.category : 'unknown';
                
                status[category].push({
                    name: name,
                    value: this.getCookie(name),
                    allowed: this.isCategoryAllowed(category)
                });
            }
        });
        
        return status;
    }

    /**
     * 启用分析Cookie
     */
    enableAnalyticsCookies() {
        if (this.isCategoryAllowed('analytics')) {
            // 设置分析相关Cookie
            this.setCookie('omvian_analytics_id', this.generateAnalyticsId(), null, 'analytics');
            this.setCookie('omvian_page_views', '1', null, 'analytics');
            
            if (window.logger?.isDevelopment) {
                window.logger.cookie('分析Cookie已启用');
            }
        }
    }

    /**
     * 禁用分析Cookie
     */
    disableAnalyticsCookies() {
        let disabledCount = 0;
        // 删除所有分析Cookie
        Object.keys(this.cookieConfig).forEach(name => {
            if (this.cookieConfig[name].category === 'analytics') {
                this.deleteCookie(name);
                disabledCount++;
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.cookie(`分析Cookie已禁用 (${disabledCount}个)`);
        }
    }

    /**
     * 启用个性化Cookie
     */
    enablePersonalizationCookies() {
        if (this.isCategoryAllowed('personalization')) {
            // 设置个性化相关Cookie
            this.setCookie('omvian_interests', JSON.stringify([]), null, 'personalization');
            this.setCookie('omvian_content_prefs', JSON.stringify({}), null, 'personalization');
            
            if (window.logger?.isDevelopment) {
                window.logger.cookie('个性化Cookie已启用');
            }
        }
    }

    /**
     * 禁用个性化Cookie
     */
    disablePersonalizationCookies() {
        let disabledCount = 0;
        // 删除所有个性化Cookie
        Object.keys(this.cookieConfig).forEach(name => {
            if (this.cookieConfig[name].category === 'personalization') {
                this.deleteCookie(name);
                disabledCount++;
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.cookie(`个性化Cookie已禁用 (${disabledCount}个)`);
        }
    }

    /**
     * 启用功能性Cookie
     */
    enableFunctionalCookies() {
        if (this.isCategoryAllowed('functional')) {
            // 设置功能性相关Cookie
            this.setCookie('omvian_theme_preference', 'dark', null, 'functional');
            this.setCookie('omvian_language', 'zh-CN', null, 'functional');
            
            if (window.logger?.isDevelopment) {
                window.logger.cookie('功能性Cookie已启用');
            }
        }
    }

    /**
     * 禁用功能性Cookie
     */
    disableFunctionalCookies() {
        let disabledCount = 0;
        // 删除所有功能性Cookie（除了页面跳转相关的会话Cookie）
        Object.keys(this.cookieConfig).forEach(name => {
            if (this.cookieConfig[name].category === 'functional' && 
                this.cookieConfig[name].days > 0) { // 只删除持久Cookie
                this.deleteCookie(name);
                disabledCount++;
            }
        });
        
        if (window.logger?.isDevelopment) {
            window.logger.cookie(`功能性Cookie已禁用 (${disabledCount}个)`);
        }
    }

    /**
     * 生成匿名分析ID
     */
    generateAnalyticsId() {
        return 'analytics_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * 记录页面访问（如果允许分析）
     */
    trackPageView(pageName) {
        if (this.isCategoryAllowed('analytics')) {
            const currentViews = parseInt(this.getCookie('omvian_page_views') || '0');
            this.setCookie('omvian_page_views', (currentViews + 1).toString(), null, 'analytics');
            
            if (window.logger?.isDevelopment) {
                window.logger.debug(`页面访问已记录: ${pageName}`);
            }
        }
    }

    /**
     * 保存用户偏好（如果允许功能性Cookie）
     */
    saveUserPreference(key, value) {
        if (this.isCategoryAllowed('functional')) {
            this.setCookie(`omvian_${key}`, value, null, 'functional');
            if (window.logger?.isDevelopment) {
                window.logger.debug(`用户偏好已保存: ${key} = ${value}`);
            }
            return true;
        }
        return false;
    }

    /**
     * 获取用户偏好
     */
    getUserPreference(key) {
        return this.getCookie(`omvian_${key}`);
    }
}

// 创建全局Cookie管理器实例
window.cookieManager = new CookieManager();

// 只在开发环境输出系统日志
if (window.logger?.isDevelopment) {
    window.logger.system('Cookie管理器已初始化');
}