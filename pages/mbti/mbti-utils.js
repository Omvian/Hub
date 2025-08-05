// mbti-utils.js - MBTI测试工具函数模块
class MBTIUtils {
    constructor() {
        this.init();
    }

    init() {
        this.setupBeforeUnloadHandler();
    }

    // 设置页面卸载前的处理
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', (e) => {
            const testQuestions = document.getElementById('testQuestions');
            if (testQuestions && testQuestions.style.display !== 'none') {
                // 检查是否有答案
                const answers = window.MBTI?.core?.answers || [];
                if (answers.length > 0) {
                    e.preventDefault();
                    e.returnValue = '测试进行中，确定要离开吗？当前进度将会丢失。';
                    return e.returnValue;
                }
            }
        });
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 格式化时间
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 生成随机ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // 深拷贝对象
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    // 检查设备类型
    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
            return 'tablet';
        }
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // 检查浏览器支持
    checkBrowserSupport() {
        const support = {
            localStorage: false,
            sessionStorage: false,
            clipboard: false,
            share: false,
            fileApi: false
        };

        // 检查本地存储
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            support.localStorage = true;
        } catch (e) {}

        // 检查会话存储
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            support.sessionStorage = true;
        } catch (e) {}

        // 检查剪贴板API
        support.clipboard = !!navigator.clipboard;

        // 检查Web Share API
        support.share = !!navigator.share;

        // 检查File API
        support.fileApi = window.File && window.FileReader && window.FileList && window.Blob;

        return support;
    }

    // 显示加载指示器
    showLoading(message = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'mbti-loading';
        loading.innerHTML = `
            <div class="mbti-loading-spinner">
                <i class="material-icons rotating">refresh</i>
            </div>
            <div class="mbti-loading-text">${message}</div>
        `;
        
        Object.assign(loading.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9999'
        });
        
        document.body.appendChild(loading);
        return loading;
    }

    // 隐藏加载指示器
    hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }

    // 显示确认对话框
    showConfirm(message, onConfirm, onCancel) {
        const confirm = document.createElement('div');
        confirm.className = 'mbti-confirm';
        confirm.innerHTML = `
            <div class="mbti-confirm-content">
                <div class="mbti-confirm-message">${message}</div>
                <div class="mbti-confirm-buttons">
                    <button class="mbti-confirm-btn mbti-confirm-cancel">取消</button>
                    <button class="mbti-confirm-btn mbti-confirm-ok">确定</button>
                </div>
            </div>
        `;
        
        Object.assign(confirm.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9999'
        });
        
        document.body.appendChild(confirm);
        
        // 绑定事件
        const okBtn = confirm.querySelector('.mbti-confirm-ok');
        const cancelBtn = confirm.querySelector('.mbti-confirm-cancel');
        
        okBtn.addEventListener('click', () => {
            document.body.removeChild(confirm);
            if (onConfirm) onConfirm();
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(confirm);
            if (onCancel) onCancel();
        });
        
        return confirm;
    }
}

window.MBTIUtils = MBTIUtils;
