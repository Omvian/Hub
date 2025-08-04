// script.js
// 主脚本文件 - 向后兼容和调试工具

// 等待所有模块加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('OmvianHub 主脚本已加载');
    
    // 检查必要的模块是否已加载
    const requiredModules = [
        'window.APP_CONSTANTS',
        'window.helpers',
        'window.configManager',
        'window.buttonManager',
        'window.notificationManager',
        'window.uiManager',
        'window.formValidator',
        'window.authManager',
        'window.appInitializer'
    ];
    
    const missingModules = requiredModules.filter(module => {
        const parts = module.split('.');
        let obj = window;
        for (const part of parts.slice(1)) {
            if (!obj[part]) return true;
            obj = obj[part];
        }
        return false;
    });
    
    if (missingModules.length > 0) {
        console.warn('以下模块未正确加载:', missingModules);
    } else {
        console.log('所有必要模块已成功加载');
    }
});

// 向后兼容的全局函数
window.showNotification = function(message, type = 'info', duration = 5000) {
    if (window.notificationManager) {
        return window.notificationManager.show(message, type, duration);
    } else {
        console.warn('通知管理器未加载，使用fallback方式显示通知:', message);
        alert(message);
    }
};

window.showSuccess = function(message, duration = 5000) {
    return window.showNotification(message, 'success', duration);
};

window.showError = function(message, duration = 5000) {
    return window.showNotification(message, 'error', duration);
};

window.showInfo = function(message, duration = 5000) {
    return window.showNotification(message, 'info', duration);
};

window.showWarning = function(message, duration = 5000) {
    return window.showNotification(message, 'warning', duration);
};

// 开发者调试工具
window.getModuleInfo = function() {
    const modules = {
        constants: !!window.APP_CONSTANTS,
        helpers: !!window.helpers,
        configManager: !!window.configManager,
        buttonManager: !!window.buttonManager,
        notificationManager: !!window.notificationManager,
        uiManager: !!window.uiManager,
        formValidator: !!window.formValidator,
        authManager: !!window.authManager,
        appInitializer: !!window.appInitializer
    };
    
    console.table(modules);
    return modules;
};

window.debugModules = function() {
    console.group('模块调试信息');
    
    if (window.configManager) {
        console.log('配置管理器状态:', {
            isLocal: window.configManager.isLocal,
            supabaseConfigured: !!window.supabase
        });
    }
    
    if (window.authManager) {
        console.log('认证管理器状态:', {
            isLoggedIn: window.authManager.isLoggedIn,
            currentUser: window.authManager.currentUser
        });
    }
    
    if (window.notificationManager) {
        console.log('通知管理器状态:', {
            activeNotifications: window.notificationManager.notifications.length,
            maxNotifications: window.notificationManager.maxNotifications
        });
    }
    
    console.groupEnd();
};

window.checkModuleHealth = function() {
    const health = {
        overall: 'healthy',
        issues: []
    };
    
    // 检查关键模块
    if (!window.configManager) {
        health.issues.push('配置管理器未加载');
        health.overall = 'critical';
    }
    
    if (!window.notificationManager) {
        health.issues.push('通知管理器未加载');
        health.overall = health.overall === 'critical' ? 'critical' : 'warning';
    }
    
    if (!window.authManager) {
        health.issues.push('认证管理器未加载');
        health.overall = health.overall === 'critical' ? 'critical' : 'warning';
    }
    
    // 检查Supabase连接
    if (!window.supabase) {
        health.issues.push('Supabase未初始化 - 认证功能不可用');
        health.overall = health.overall === 'critical' ? 'critical' : 'warning';
    }
    
    console.log('模块健康检查结果:', health);
    return health;
};

window.getPerformanceMetrics = function() {
    if (window.helpers && window.helpers.performance) {
        return window.helpers.performance.getMetrics();
    } else {
        console.warn('性能监控工具未加载');
        return null;
    }
};

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // 如果通知管理器可用，显示用户友好的错误信息
    if (window.notificationManager && event.error) {
        const userMessage = '网站功能异常，这是程序错误，请刷新页面重试或联系技术支持';
        window.notificationManager.show(userMessage, 'error', 5000);
    }
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
    
    if (window.notificationManager) {
        const userMessage = '操作失败，请稍后重试';
        window.notificationManager.show(userMessage, 'error', 3000);
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('页面重新获得焦点');
        // 可以在这里添加重新连接或刷新数据的逻辑
    } else {
        console.log('页面失去焦点');
        // 可以在这里添加暂停某些操作的逻辑
    }
});

console.log('OmvianHub 主脚本初始化完成');