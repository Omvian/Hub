// button-state-manager.js - 按钮状态管理工具类
// 功能: 按钮显示/隐藏、加载状态、禁用状态、呼吸灯效果、批量操作
// 原则: 只使用CSS类，不使用内联样式
// 全局: window.buttonStateManager

class ButtonStateManager {
    constructor() {
        this.buttonStates = new Map();
    }

    /**
     * 显示按钮
     * @param {string|HTMLElement} button - 按钮ID或元素
     */
    showButton(button) {
        const btn = this.getElement(button);
        if (btn) {
            btn.classList.remove('btn-hidden');
            btn.classList.add('btn-visible');
        }
    }

    /**
     * 隐藏按钮
     * @param {string|HTMLElement} button - 按钮ID或元素
     */
    hideButton(button) {
        const btn = this.getElement(button);
        if (btn) {
            btn.classList.remove('btn-visible');
            btn.classList.add('btn-hidden');
        }
    }

    /**
     * 设置按钮加载状态
     * @param {string|HTMLElement} button - 按钮ID或元素
     * @param {boolean} loading - 是否加载中
     */
    setLoading(button, loading = true) {
        const btn = this.getElement(button);
        if (!btn) return;

        if (loading) {
            btn.classList.add('btn-loading');
            btn.disabled = true;
            this.stopBreathing(btn);
        } else {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
            this.startBreathing(btn);
        }
    }

    /**
     * 设置按钮禁用状态
     * @param {string|HTMLElement} button - 按钮ID或元素
     * @param {boolean} disabled - 是否禁用
     */
    setDisabled(button, disabled = true) {
        const btn = this.getElement(button);
        if (!btn) return;

        if (disabled) {
            btn.classList.add('btn-disabled');
            btn.disabled = true;
            this.stopBreathing(btn);
        } else {
            btn.classList.remove('btn-disabled');
            btn.disabled = false;
            this.startBreathing(btn);
        }
    }

    /**
     * 启动呼吸灯效果
     * @param {HTMLElement} button - 按钮元素
     */
    startBreathing(button) {
        const btn = this.getElement(button);
        if (btn && btn.classList.contains('modal-btn')) {
            btn.classList.add('breathing');
        }
    }

    /**
     * 停止呼吸灯效果
     * @param {HTMLElement} button - 按钮元素
     */
    stopBreathing(button) {
        const btn = this.getElement(button);
        if (btn) {
            btn.classList.remove('breathing');
        }
    }

    /**
     * 重置按钮到初始状态
     * @param {string|HTMLElement} button - 按钮ID或元素
     */
    resetButton(button) {
        const btn = this.getElement(button);
        if (!btn) return;

        btn.classList.remove('btn-loading', 'btn-disabled', 'btn-hidden');
        btn.classList.add('btn-visible');
        btn.disabled = false;
        this.startBreathing(btn);
    }

    /**
     * 获取DOM元素
     * @param {string|HTMLElement} element - 元素ID或元素
     * @returns {HTMLElement|null}
     */
    getElement(element) {
        if (typeof element === 'string') {
            return document.getElementById(element);
        }
        return element instanceof HTMLElement ? element : null;
    }

    /**
     * 批量操作按钮
     * @param {Array} buttons - 按钮ID数组
     * @param {string} action - 操作类型
     * @param {*} value - 操作值
     */
    batchOperation(buttons, action, value) {
        buttons.forEach(buttonId => {
            switch (action) {
                case 'show':
                    this.showButton(buttonId);
                    break;
                case 'hide':
                    this.hideButton(buttonId);
                    break;
                case 'loading':
                    this.setLoading(buttonId, value);
                    break;
                case 'disabled':
                    this.setDisabled(buttonId, value);
                    break;
                case 'reset':
                    this.resetButton(buttonId);
                    break;
            }
        });
    }

    /**
     * 初始化弹窗按钮
     * @param {string} buttonId - 按钮ID
     */
    initModalButton(buttonId) {
        const btn = this.getElement(buttonId);
        if (!btn) return;

        // 添加必要的CSS类
        btn.classList.add('btn', 'btn-primary', 'modal-btn');
        
        // 初始状态：隐藏
        this.hideButton(btn);
        
        // 启动呼吸灯效果
        this.startBreathing(btn);
    }

    /**
     * 根据表单验证结果显示/隐藏按钮
     * @param {string} buttonId - 按钮ID
     * @param {boolean} isValid - 表单是否有效
     */
    toggleByValidation(buttonId, isValid) {
        if (isValid) {
            this.showButton(buttonId);
        } else {
            this.hideButton(buttonId);
        }
    }
}

// 创建全局实例
window.buttonStateManager = new ButtonStateManager();

// 页面加载完成后初始化所有弹窗按钮
document.addEventListener('DOMContentLoaded', () => {
    const modalButtons = ['loginSubmitBtn', 'registerSubmitBtn', 'emailVerificationCloseBtn'];
    modalButtons.forEach(buttonId => {
        window.buttonStateManager.initModalButton(buttonId);
    });
});