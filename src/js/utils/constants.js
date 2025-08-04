// constants.js - 项目常量定义
// 功能: 全局常量配置、错误消息、成功消息、UI配置、验证规则、存储键名
// 全局: window.APP_CONSTANTS (包含所有常量)
// 重要: MODULE_CATEGORIES修改需同步更新HTML和CSS

// 应用配置常量
const APP_CONFIG = {
    NAME: 'OmvianHub',
    VERSION: '2.0.0',
    DESCRIPTION: '多功能主站',
    AUTHOR: 'OmvianHub Team'
};

// API配置常量
const API_CONFIG = {
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

// UI配置常量
const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 5000,
    LOADING_DELAY: 1500,
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    DESKTOP_BREAKPOINT: 1200
};

// 表单验证常量
const VALIDATION_CONFIG = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MIN_NICKNAME_LENGTH: 2,
    MAX_NICKNAME_LENGTH: 20,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_STRENGTH_LEVELS: {
        WEAK: 2,
        MEDIUM: 4,
        STRONG: 6
    }
};

// 通知类型常量
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// 认证状态常量
const AUTH_STATES = {
    LOGGED_IN: 'logged_in',
    LOGGED_OUT: 'logged_out',
    LOADING: 'loading',
    ERROR: 'error'
};

// ===== 模块类别常量 =====
// 重要: 此常量定义了主页面的分类系统
// 当前使用的分类: 'all', 'review', 'psychology'
// 已废弃的分类: 'movie', 'music', 'tech', 'life'
// 修改时需要同时更新:
// 1. index.html 中的分类点击逻辑
// 2. ui-manager.js 中的 filterTitles 对象
// 3. CSS 中的相关样式
const MODULE_CATEGORIES = {
    ALL: 'all',           // 全部模块 - 当前使用
    REVIEW: 'review',     // 测评中心 - 当前使用 (原movie分类)
    PSYCHOLOGY: 'psychology', // 心理测试 - 当前使用
    // 以下分类已废弃，保留用于兼容性
    MOVIE: 'movie',       // 已废弃 - 改为 REVIEW
    MUSIC: 'music',       // 已废弃 - 已移除
    TECH: 'tech',         // 已废弃 - 已移除
    LIFE: 'life'          // 已废弃 - 已移除
};

// 错误消息常量
const ERROR_MESSAGES = {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    SUPABASE_CONFIG_INVALID: 'Supabase配置无效或未配置',
    SUPABASE_CONNECTION_FAILED: 'Supabase连接失败',
    LOGIN_FAILED: '登录失败，请检查邮箱和密码',
    REGISTER_FAILED: '注册失败，请稍后重试',
    EMAIL_INVALID: '请输入有效的邮箱地址',
    PASSWORD_TOO_SHORT: '密码长度至少为6位',
    PASSWORDS_NOT_MATCH: '两次输入的密码不一致',
    NICKNAME_INVALID: '昵称长度应为2-20个字符',
    COPY_FAILED: '复制失败，请手动复制',
    UNKNOWN_ERROR: '发生未知错误，请稍后重试'
};

// 成功消息常量
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: '登录成功！正在跳转...',
    REGISTER_SUCCESS: '注册成功！验证邮件已发送到您的邮箱',
    LOGOUT_SUCCESS: '退出成功',
    COPY_SUCCESS: '已复制到剪贴板',
    WELCOME: '欢迎来到 OmvianHub！'
};

// 加载状态消息常量
const LOADING_MESSAGES = {
    INITIALIZING: '正在加载 OmvianHub...',
    VERIFYING_CONNECTION: '验证连接中...',
    LOADING_CONFIG: '正在加载配置...',
    CONNECTING_SUPABASE: '正在连接 Supabase...',
    SUPABASE_SUCCESS: 'Supabase 连接成功！正在加载主站内容...',
    LOADING_MODULES: '正在初始化功能模块...',
    INITIALIZATION_COMPLETE: '初始化完成，正在进入主站...'
};

// 本地存储键名常量
const STORAGE_KEYS = {
    USER_PREFERENCES: 'omvianhub_user_preferences',
    THEME_SETTING: 'omvianhub_theme',
    LANGUAGE_SETTING: 'omvianhub_language',
    LAST_VISITED_MODULE: 'omvianhub_last_module'
};

// 事件名称常量
const EVENT_NAMES = {
    APP_INITIALIZED: 'appInitialized',
    AUTH_STATE_CHANGED: 'authStateChanged',
    MODULE_LOADED: 'moduleLoaded',
    THEME_CHANGED: 'themeChanged',
    NOTIFICATION_SHOWN: 'notificationShown'
};

// CSS类名常量
const CSS_CLASSES = {
    LOADING: 'loading',
    HIDDEN: 'hidden',
    ACTIVE: 'active',
    DISABLED: 'disabled',
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
    FADE_IN: 'fade-in',
    FADE_OUT: 'fade-out',
    SLIDE_IN: 'slide-in',
    SLIDE_OUT: 'slide-out'
};

// 模块路径常量
const MODULE_PATHS = {
    CORE: 'src/js/core/',
    AUTH: 'src/js/auth/',
    UI: 'src/js/ui/',
    UTILS: 'src/js/utils/'
};

// 开发环境常量
const DEV_CONFIG = {
    DEBUG_MODE: true,
    VERBOSE_LOGGING: true,
    PERFORMANCE_MONITORING: true,
    ERROR_REPORTING: true
};

// 生产环境常量
const PROD_CONFIG = {
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    PERFORMANCE_MONITORING: false,
    ERROR_REPORTING: true
};

// 导出所有常量到全局作用域
if (typeof window !== 'undefined') {
    window.APP_CONSTANTS = {
        APP_CONFIG,
        API_CONFIG,
        UI_CONFIG,
        VALIDATION_CONFIG,
        NOTIFICATION_TYPES,
        AUTH_STATES,
        MODULE_CATEGORIES,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        LOADING_MESSAGES,
        STORAGE_KEYS,
        EVENT_NAMES,
        CSS_CLASSES,
        MODULE_PATHS,
        DEV_CONFIG,
        PROD_CONFIG
    };
}
