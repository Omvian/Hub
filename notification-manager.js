// notification-manager.js
// 通知管理器
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

        // 创建通知容器
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    // 显示通知
    show(message, type = 'info', duration = 5000) {
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
        content.textContent = message;

        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'notification-copy';
        copyButton.innerHTML = '<i class="material-icons">content_copy</i>';
        copyButton.title = '复制到剪贴板';
        copyButton.addEventListener('click', () => {
            this.copyToClipboard(message);
        });

        // 组装通知
        notification.appendChild(content);
        notification.appendChild(copyButton);

        // 自动调整高度以适应内容
        this.adjustNotificationHeight(notification);

        return notification;
    }

    // 调整通知高度以适应内容
    adjustNotificationHeight(notification) {
        const content = notification.querySelector('.notification-content');
        const minHeight = 150;
        const padding = 32; // 上下各16px
        const contentHeight = content.scrollHeight;

        if (contentHeight + padding > minHeight) {
            notification.style.minHeight = `${contentHeight + padding}px`;
        } else {
            notification.style.minHeight = `${minHeight}px`;
        }
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.show('已复制到剪贴板', 'success', 2000);
        } catch (err) {
            console.error('复制失败:', err);
            this.show('复制失败，请手动复制', 'error', 2000);
        }
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
