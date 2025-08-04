// helpers.js - 通用辅助函数工具模块
// 功能: 防抖节流、深拷贝、日期格式化、本地存储、URL操作、DOM操作、验证器、性能监控
// 全局: window.helpers (包含所有工具函数)
// 特性: 纯函数集合，无外部依赖，被所有模块引用

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 生成随机ID
 * @param {number} length - ID长度
 * @returns {string} 随机ID
 */
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 检查是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 检查是否为触摸设备
 * @returns {boolean} 是否为触摸设备
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 获取浏览器信息
 * @returns {Object} 浏览器信息对象
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    const browsers = {
        chrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
        firefox: /Firefox/i.test(ua),
        safari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
        edge: /Edge/i.test(ua),
        ie: /MSIE|Trident/i.test(ua)
    };

    const browserName = Object.keys(browsers).find(key => browsers[key]) || 'unknown';
    
    return {
        name: browserName,
        userAgent: ua,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
    };
}

/**
 * 本地存储工具
 */
const storageUtils = {
    /**
     * 设置本地存储
     * @param {string} key - 键名
     * @param {any} value - 值
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            window.logger?.error('本地存储设置失败:', error);
        }
    },

    /**
     * 获取本地存储
     * @param {string} key - 键名
     * @param {any} defaultValue - 默认值
     * @returns {any} 存储的值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            window.logger?.error('本地存储获取失败:', error);
            return defaultValue;
        }
    },

    /**
     * 删除本地存储
     * @param {string} key - 键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            window.logger?.error('本地存储删除失败:', error);
        }
    },

    /**
     * 清空本地存储
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            window.logger?.error('本地存储清空失败:', error);
        }
    }
};

/**
 * URL工具
 */
const urlUtils = {
    /**
     * 获取URL参数
     * @param {string} name - 参数名
     * @param {string} url - URL字符串
     * @returns {string|null} 参数值
     */
    getParam(name, url = window.location.href) {
        const urlObj = new URL(url);
        return urlObj.searchParams.get(name);
    },

    /**
     * 设置URL参数
     * @param {string} name - 参数名
     * @param {string} value - 参数值
     * @param {string} url - URL字符串
     * @returns {string} 新的URL字符串
     */
    setParam(name, value, url = window.location.href) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(name, value);
        return urlObj.toString();
    },

    /**
     * 删除URL参数
     * @param {string} name - 参数名
     * @param {string} url - URL字符串
     * @returns {string} 新的URL字符串
     */
    removeParam(name, url = window.location.href) {
        const urlObj = new URL(url);
        urlObj.searchParams.delete(name);
        return urlObj.toString();
    }
};

/**
 * DOM工具
 */
const domUtils = {
    /**
     * 等待DOM元素出现
     * @param {string} selector - CSS选择器
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<Element>} DOM元素
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`元素 ${selector} 在 ${timeout}ms 内未找到`));
            }, timeout);
        });
    },

    /**
     * 添加CSS类
     * @param {Element|string} element - DOM元素或选择器
     * @param {string} className - 类名
     */
    addClass(element, className) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.classList.add(className);
    },

    /**
     * 移除CSS类
     * @param {Element|string} element - DOM元素或选择器
     * @param {string} className - 类名
     */
    removeClass(element, className) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.classList.remove(className);
    },

    /**
     * 切换CSS类
     * @param {Element|string} element - DOM元素或选择器
     * @param {string} className - 类名
     */
    toggleClass(element, className) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.classList.toggle(className);
    }
};

/**
 * 验证工具
 */
const validators = {
    /**
     * 验证邮箱
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * 验证手机号
     * @param {string} phone - 手机号
     * @returns {boolean} 是否有效
     */
    isPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    },

    /**
     * 验证URL
     * @param {string} url - URL地址
     * @returns {boolean} 是否有效
     */
    isUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 验证密码强度
     * @param {string} password - 密码
     * @returns {Object} 强度信息
     */
    getPasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password)
        };

        Object.values(checks).forEach(check => {
            if (check) score++;
        });

        let level = 'weak';
        if (score >= 4) level = 'strong';
        else if (score >= 3) level = 'medium';

        return { score, level, checks };
    }
};

/**
 * 性能监控工具
 */
const performanceUtils = {
    /**
     * 测量函数执行时间
     * @param {Function} func - 要测量的函数
     * @param {string} label - 标签
     * @returns {any} 函数返回值
     */
    measure(func, label = 'function') {
        const start = Date.now();
        const result = func();
        const end = Date.now();
        if (window.logger?.isDevelopment) {
            window.logger.debug(`${label} 执行时间: ${end - start}ms`);
        }
        return result;
    },

    /**
     * 获取页面性能指标
     * @returns {Object} 性能指标
     */
    getMetrics() {
        if (!window.performance) return null;

        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
            // 页面加载时间
            loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
            // DOM内容加载时间
            domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : 0,
            // 首次绘制时间
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            // 首次内容绘制时间
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
    }
};

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.helpers = {
        debounce,
        throttle,
        deepClone,
        formatDate,
        generateId,
        isMobileDevice,
        isTouchDevice,
        getBrowserInfo,
        storage: storageUtils,
        urlUtils,
        domUtils,
        validators,
        performance: performanceUtils
    };
}