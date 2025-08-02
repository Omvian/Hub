// button-manager.js
// 按钮状态管理模块 - 负责按钮加载状态、禁用状态等管理

class ButtonManager {
    constructor() {
        this.buttonStates = new Map();
    }

    // 设置按钮加载状态
    setButtonLoading(buttonId, isLoading = true) {
        const button = document.getElementById(buttonId);
        const spinner = document.getElementById(buttonId.replace('Btn', 'Spinner'));
        const buttonText = document.getElementById(buttonId.replace('Btn', 'ButtonText'));

        if (!button) {
            console.warn(`按钮 ${buttonId} 不存在`);
            return;
        }

        // 保存按钮状态
        this.buttonStates.set(buttonId, {
            isLoading,
            originalDisabled: button.disabled,
            originalText: buttonText ? buttonText.textContent : button.textContent
        });

        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            
            if (spinner) {
                spinner.style.display = 'inline-block';
            }
            
            if (buttonText) {
                buttonText.style.display = 'none';
            } else {
                // 如果没有单独的文字元素，创建一个加载指示器
                if (!button.querySelector('.loading-indicator')) {
                    const loadingIndicator = document.createElement('span');
                    loadingIndicator.className = 'loading-indicator';
                    loadingIndicator.innerHTML = '<span class="spinner"></span>';
                    button.appendChild(loadingIndicator);
                }
            }
        } else {
            const state = this.buttonStates.get(buttonId);
            
            button.disabled = state ? state.originalDisabled : false;
            button.classList.remove('loading');
            
            if (spinner) {
                spinner.style.display = 'none';
            }
            
            if (buttonText) {
                buttonText.style.display = 'inline';
            } else {
                // 移除加载指示器
                const loadingIndicator = button.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        }
    }

    // 设置按钮禁用状态
    setButtonDisabled(buttonId, isDisabled = true) {
        const button = document.getElementById(buttonId);
        
        if (!button) {
            console.warn(`按钮 ${buttonId} 不存在`);
            return;
        }

        button.disabled = isDisabled;
        
        if (isDisabled) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    }

    // 设置按钮文本
    setButtonText(buttonId, text) {
        const button = document.getElementById(buttonId);
        const buttonText = document.getElementById(buttonId.replace('Btn', 'ButtonText'));

        if (!button) {
            console.warn(`按钮 ${buttonId} 不存在`);
            return;
        }

        if (buttonText) {
            buttonText.textContent = text;
        } else {
            button.textContent = text;
        }
    }

    // 重置按钮状态
    resetButton(buttonId) {
        const state = this.buttonStates.get(buttonId);
        
        if (state) {
            this.setButtonLoading(buttonId, false);
            this.setButtonText(buttonId, state.originalText);
            this.buttonStates.delete(buttonId);
        }
    }

    // 获取按钮状态
    getButtonState(buttonId) {
        return this.buttonStates.get(buttonId) || null;
    }

    // 批量设置按钮状态
    setBatchButtonsLoading(buttonIds, isLoading = true) {
        buttonIds.forEach(buttonId => {
            this.setButtonLoading(buttonId, isLoading);
        });
    }

    // 批量禁用按钮
    setBatchButtonsDisabled(buttonIds, isDisabled = true) {
        buttonIds.forEach(buttonId => {
            this.setButtonDisabled(buttonId, isDisabled);
        });
    }

    // 创建动态按钮
    createButton(config) {
        const {
            id,
            text,
            className = 'btn',
            onClick,
            parent,
            disabled = false
        } = config;

        const button = document.createElement('button');
        button.id = id;
        button.className = className;
        button.textContent = text;
        button.disabled = disabled;

        if (onClick && typeof onClick === 'function') {
            button.addEventListener('click', onClick);
        }

        if (parent) {
            const parentElement = typeof parent === 'string' 
                ? document.getElementById(parent) 
                : parent;
            
            if (parentElement) {
                parentElement.appendChild(button);
            }
        }

        return button;
    }

    // 移除按钮
    removeButton(buttonId) {
        const button = document.getElementById(buttonId);
        
        if (button) {
            button.remove();
            this.buttonStates.delete(buttonId);
        }
    }

    // 添加按钮点击防抖
    addClickDebounce(buttonId, delay = 300) {
        const button = document.getElementById(buttonId);
        
        if (!button) {
            console.warn(`按钮 ${buttonId} 不存在`);
            return;
        }

        let debounceTimer;
        const originalClick = button.onclick;

        button.onclick = (event) => {
            clearTimeout(debounceTimer);
            
            debounceTimer = setTimeout(() => {
                if (originalClick) {
                    originalClick.call(button, event);
                }
            }, delay);
        };
    }

    // 添加按钮点击节流
    addClickThrottle(buttonId, delay = 1000) {
        const button = document.getElementById(buttonId);
        
        if (!button) {
            console.warn(`按钮 ${buttonId} 不存在`);
            return;
        }

        let lastClickTime = 0;
        const originalClick = button.onclick;

        button.onclick = (event) => {
            const now = Date.now();
            
            if (now - lastClickTime >= delay) {
                lastClickTime = now;
                
                if (originalClick) {
                    originalClick.call(button, event);
                }
            }
        };
    }

    // 清理所有按钮状态
    clearAllStates() {
        this.buttonStates.clear();
    }
}

// 创建全局按钮管理器实例
window.buttonManager = new ButtonManager();