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

    // 在鼠标位置显示带连接线的复制成功提示
    showCopyToastFollowMouse(event) {
        // 移除已存在的复制提示
        const existingToast = document.querySelector('.copy-toast-container');
        if (existingToast) {
            existingToast.remove();
        }

        // 获取初始鼠标位置
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // 创建容器
        const container = document.createElement('div');
        container.className = 'copy-toast-container';
        
        // 创建连接线
        const connector = document.createElement('div');
        connector.className = 'copy-toast-connector';
        
        // 创建气泡提示
        const toast = document.createElement('div');
        toast.className = 'copy-toast-bubble';
        toast.textContent = '已复制到剪贴板';

        // 组装元素
        container.appendChild(connector);
        container.appendChild(toast);

        // 设置容器样式
        Object.assign(container.style, {
            position: 'fixed',
            left: mouseX + 'px',
            top: mouseY + 'px',
            zIndex: '10001',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none'
        });

        // 设置连接线样式
        Object.assign(connector.style, {
            position: 'absolute',
            width: '2px',
            height: '20px',
            backgroundColor: '#4caf50',
            left: '0px',
            top: '0px',
            borderRadius: '1px',
            boxShadow: '0 0 4px rgba(76, 175, 80, 0.5)'
        });

        // 设置气泡样式
        Object.assign(toast.style, {
            position: 'absolute',
            left: '8px', // 连接线右侧8px
            top: '5px',  // 稍微向上偏移
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            boxShadow: '0 3px 12px rgba(76, 175, 80, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            // 添加小三角形指向鼠标
            '&::before': 'content: ""; position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 6px solid #4caf50;'
        });

        // 手动添加三角形伪元素
        const triangle = document.createElement('div');
        Object.assign(triangle.style, {
            position: 'absolute',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '6px solid #4caf50'
        });
        toast.appendChild(triangle);

        document.body.appendChild(container);

        // 检查边界并调整位置
        const adjustPosition = (x, y) => {
            const rect = toast.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let adjustedX = x;
            let adjustedY = y;
            let position = 'right'; // 默认在右侧

            // 检查右边界 - 如果超出，切换到左侧
            if (x + 8 + rect.width > viewportWidth) {
                position = 'left';
                toast.style.left = '-' + (rect.width + 8) + 'px';
                triangle.style.left = 'auto';
                triangle.style.right = '-6px';
                triangle.style.borderRight = 'none';
                triangle.style.borderLeft = '6px solid #4caf50';
            }

            // 检查下边界
            if (y + rect.height > viewportHeight) {
                adjustedY = y - rect.height - 10;
                toast.style.top = '-' + (rect.height + 5) + 'px';
                connector.style.height = '15px';
                connector.style.top = '-15px';
            }

            // 检查上边界
            if (adjustedY < 0) {
                adjustedY = y + 20;
                toast.style.top = '25px';
                connector.style.height = '20px';
                connector.style.top = '0px';
            }

            container.style.left = adjustedX + 'px';
            container.style.top = adjustedY + 'px';
        };

        // 初始位置调整
        setTimeout(() => {
            adjustPosition(mouseX, mouseY);
            container.style.opacity = '1';
        }, 10);

        // 鼠标移动跟随函数
        const followMouse = (e) => {
            if (container.parentNode) {
                adjustPosition(e.clientX, e.clientY);
            }
        };

        // 添加鼠标移动监听器
        document.addEventListener('mousemove', followMouse);

        // 自动移除
        const removeToast = () => {
            document.removeEventListener('mousemove', followMouse);
            if (container.parentNode) {
                container.style.opacity = '0';
                setTimeout(() => {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
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
