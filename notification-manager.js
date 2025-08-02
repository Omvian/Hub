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
        copyButton.addEventListener('click', (event) => {
            this.copyToClipboard(message, event, notification);
        });

        // 组装通知
        notification.appendChild(content);
        notification.appendChild(copyButton);

        return notification;
    }

    // 在鼠标位置显示气泡复制成功提示
    showCopyToastFollowMouse(event) {
        // 移除已存在的复制提示
        const existingToast = document.querySelector('.copy-toast-bubble');
        if (existingToast) {
            existingToast.remove();
        }

        // 获取初始鼠标位置
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // 创建气泡提示
        const toast = document.createElement('div');
        toast.className = 'copy-toast-bubble';
        toast.textContent = '已复制到剪贴板';

        // 设置气泡样式
        Object.assign(toast.style, {
            position: 'fixed',
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px', // 更圆润的气泡效果
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(76, 175, 80, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            zIndex: '10001',
            opacity: '0',
            transform: 'scale(0.8)',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // 弹性动画
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)', // 毛玻璃效果
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' // 渐变背景
        });

        document.body.appendChild(toast);

        // 计算最佳位置的函数
        const calculatePosition = (x, y) => {
            const rect = toast.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let finalX = x + 15; // 默认在鼠标右侧
            let finalY = y - rect.height / 2; // 垂直居中对齐鼠标

            // 检查右边界
            if (finalX + rect.width > viewportWidth - 10) {
                finalX = x - rect.width - 15; // 切换到左侧
            }

            // 检查下边界
            if (finalY + rect.height > viewportHeight - 10) {
                finalY = viewportHeight - rect.height - 10;
            }

            // 检查上边界
            if (finalY < 10) {
                finalY = 10;
            }

            // 检查左边界
            if (finalX < 10) {
                finalX = 10;
            }

            return { x: finalX, y: finalY };
        };

        // 初始位置设置
        const initialPos = calculatePosition(mouseX, mouseY);
        toast.style.left = initialPos.x + 'px';
        toast.style.top = initialPos.y + 'px';

        // 显示动画 - 弹性出现
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'scale(1)';
        }, 10);

        // 鼠标移动跟随函数
        const followMouse = (e) => {
            if (toast.parentNode) {
                const newPos = calculatePosition(e.clientX, e.clientY);
                toast.style.left = newPos.x + 'px';
                toast.style.top = newPos.y + 'px';
            }
        };

        // 添加鼠标移动监听器
        document.addEventListener('mousemove', followMouse);

        // 自动移除函数
        const removeToast = () => {
            document.removeEventListener('mousemove', followMouse);
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 200);
            }
        };

        // 1.5秒后自动移除
        setTimeout(removeToast, 1500);

        // 返回移除函数，以便外部可以提前移除
        return removeToast;
    }

    // 复制到剪贴板
    async copyToClipboard(text, event, notification) {
        try {
            await navigator.clipboard.writeText(text);
            
            // 显示跟随鼠标的复制提示
            this.showCopyToastFollowMouse(event);
            
            // 立即移除当前通知
            this.removeNotification(notification);
            
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
