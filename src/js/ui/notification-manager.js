// notification-manager.js - 全局通知系统管理器
// 功能: 右下角通知框、复制功能、自动消失、类型区分(成功/错误/警告/信息)
// 全局: window.showSuccess, window.showError, window.showInfo, window.showWarning
// 特性: 最多同时显示3个，支持复制到剪贴板
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 3;
        this.init();
    }

    // 初始化通知容器
    init() {
        // 检查是否已存在容器
        if (document.querySelector('.notification-container')) {
            this.container = document.querySelector('.notification-container');
            return;
        }

        // 确保 DOM 已准备好
        const initContainer = () => {
            if (!document.body) {
                // 如果 body 还没准备好，等待一下
                setTimeout(initContainer, 10);
                return;
            }

            // 创建通知容器
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        };

        initContainer();
    }

    // 显示通知
    show(message, type = 'info', duration = 5000) {
        // 确保容器已初始化
        if (!this.container) {
            this.init();
            
            // 如果容器仍然不存在，使用延迟重试
            if (!this.container) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const notification = this.show(message, type, duration);
                        resolve(notification);
                    }, 100);
                });
            }
        }
        
        // 创建通知元素
        const notification = this.createNotification(message, type);

        // 添加到容器
        this.container.appendChild(notification);

        // 添加到通知列表
        this.notifications.push({
            element: notification,
            timer: null
        });

        // 检查是否超过最大通知数量
        this.checkNotificationCount();

        // 设置自动移除定时器
        const timer = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // 保存定时器引用
        const notificationObj = this.notifications.find(n => n.element === notification);
        if (notificationObj) {
            notificationObj.timer = timer;
        }

        return notification;
    }

    // 创建通知元素
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification-box ${type}`;

        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.innerHTML = message;

        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'notification-copy';
        copyButton.innerHTML = '<i class="material-icons">content_copy</i>';
        copyButton.title = '复制到剪贴板';
        copyButton.addEventListener('click', (event) => {
            this.copyToClipboard(message, event);
        });

        // 组装通知
        notification.appendChild(content);
        notification.appendChild(copyButton);

        return notification;
    }

    // 显示固定位置的复制提示（支持成功和失败状态）
    showCopyToastFixed(type = 'success', message = '已复制到剪贴板') {
        // 移除已存在的复制提示
        const existingToast = document.querySelector('.copy-toast-fixed');
        if (existingToast) {
            existingToast.remove();
        }

        // 根据类型设置不同的配置
        const config = {
            success: {
                icon: '✓',
                iconBg: '#4caf50',
                textColor: '#2e7d32',
                borderColor: 'rgba(76, 175, 80, 0.2)'
            },
            error: {
                icon: '✕',
                iconBg: '#f44336',
                textColor: '#c62828',
                borderColor: 'rgba(244, 67, 54, 0.2)'
            }
        };

        const currentConfig = config[type] || config.success;

        // 创建复制提示容器
        const toastContainer = document.createElement('div');
        toastContainer.className = 'copy-toast-fixed';

        // 创建图标
        const icon = document.createElement('div');
        icon.className = 'copy-toast-icon';
        icon.innerHTML = currentConfig.icon;

        // 创建文字
        const text = document.createElement('div');
        text.className = 'copy-toast-text';
        text.textContent = message;

        // 组装元素
        toastContainer.appendChild(icon);
        toastContainer.appendChild(text);

        // 设置容器样式
        Object.assign(toastContainer.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-100px)', // 初始位置在屏幕上方
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            padding: '12px 20px',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${currentConfig.borderColor}`,
            zIndex: '10001',
            opacity: '0',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
            backdropFilter: 'blur(12px)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            minWidth: '180px',
            justifyContent: 'center'
        });

        // 设置图标样式
        Object.assign(icon.style, {
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: currentConfig.iconBg,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            flexShrink: '0'
        });

        // 设置文字样式
        Object.assign(text.style, {
            color: currentConfig.textColor,
            fontWeight: '500'
        });

        document.body.appendChild(toastContainer);

        // 显示动画 - 从上方滑入
        setTimeout(() => {
            toastContainer.style.opacity = '1';
            toastContainer.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // 自动移除函数
        const removeToast = () => {
            if (toastContainer.parentNode) {
                toastContainer.style.opacity = '0';
                toastContainer.style.transform = 'translateX(-50%) translateY(-50px)';
                setTimeout(() => {
                    if (toastContainer.parentNode) {
                        toastContainer.parentNode.removeChild(toastContainer);
                    }
                }, 400);
            }
        };

        // 2.5秒后自动移除（失败提示稍长一些）
        const duration = type === 'error' ? 2500 : 2000;
        setTimeout(removeToast, duration);

        // 返回移除函数，以便外部可以提前移除
        return removeToast;
    }

    // 复制到剪贴板
    async copyToClipboard(text, event) {
        try {
            // 提取纯文本内容并简化
            const cleanText = this.extractCleanText(text);
            await navigator.clipboard.writeText(cleanText);
            
            // 显示固定位置的复制成功提示
            this.showCopyToastFixed('success', '已复制到剪贴板');
            
            // 立即移除当前通知
            const notification = event.target.closest('.notification-box');
            if (notification) {
                this.removeNotification(notification);
            }
            
        } catch (err) {
            window.logger?.error('复制失败:', err);
            
            // 显示固定位置的复制失败提示
            this.showCopyToastFixed('error', '复制失败，请手动复制');
            
            // 也移除当前通知
            const notification = event.target.closest('.notification-box');
            if (notification) {
                this.removeNotification(notification);
            }
        }
    }

    // 提取并清理文本内容
    extractCleanText(htmlText) {
        // 创建临时DOM元素来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        
        // 获取纯文本内容
        let cleanText = tempDiv.textContent || tempDiv.innerText || '';
        
        // 针对错误消息进行特殊处理
        if (cleanText.includes('[错误101]') || cleanText.includes('[错误102]')) {
            // 提取错误代码和主要信息
            const errorCodeMatch = cleanText.match(/\[错误\d+\]/);
            const errorCode = errorCodeMatch ? errorCodeMatch[0] : '';
            
            // 简化消息内容
            let mainMessage = '';
            if (cleanText.includes('无法打开登录窗口')) {
                mainMessage = '账号系统异常，无法打开登录窗口。';
            } else if (cleanText.includes('无法打开注册窗口')) {
                mainMessage = '账号系统异常，无法打开注册窗口。';
            } else {
                // 提取主要错误信息（去掉"如刷新后依然有问题，请联系我们"等冗余信息）
                mainMessage = cleanText.replace(/[。，]如刷新后依然有问题.*$/, '。');
                mainMessage = mainMessage.replace(errorCode, '').trim();
            }
            
            // 组合简化后的文本
            cleanText = errorCode + mainMessage;
        }
        
        return cleanText.trim();
    }

    // 移除通知
    removeNotification(notification) {
        // 添加移除动画类
        notification.classList.add('removing');

        // 从通知列表中移除
        const index = this.notifications.findIndex(n => n.element === notification);
        if (index !== -1) {
            // 清除定时器
            if (this.notifications[index].timer) {
                clearTimeout(this.notifications[index].timer);
            }

            // 从列表中移除
            this.notifications.splice(index, 1);
        }

        // 动画结束后移除DOM元素
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // 检查通知数量，移除多余的通知
    checkNotificationCount() {
        while (this.notifications.length > this.maxNotifications) {
            const oldestNotification = this.notifications[0];
            this.removeNotification(oldestNotification.element);
        }
    }

    // 显示成功通知
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    // 显示错误通知
    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    // 显示信息通知
    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    // 显示警告通知
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
}

// 创建全局通知管理器实例
const notificationManager = new NotificationManager();

// 暴露到全局变量
window.notificationManager = notificationManager;

// 提供全局访问函数
window.showNotification = function(message, type = 'info', duration = 5000) {
    return notificationManager.show(message, type, duration);
};

window.showSuccess = function(message, duration = 5000) {
    return notificationManager.success(message, duration);
};

window.showError = function(message, duration = 5000) {
    return notificationManager.error(message, duration);
};

window.showInfo = function(message, duration = 5000) {
    return notificationManager.info(message, duration);
};

window.showWarning = function(message, duration = 5000) {
    return notificationManager.warning(message, duration);
};
