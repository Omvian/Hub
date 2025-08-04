// form-validator.js - 表单验证工具模块
// 功能: 登录/注册表单验证、密码强度检测、UI状态管理
// 全局: window.formValidator

class FormValidator {
    constructor() {
        this.init();
    }

    // 初始化表单验证
    init() {
        this.setupLoginFormValidation();
        this.setupRegisterFormValidation();
        this.setupPasswordToggle();
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 验证密码强度
    getPasswordStrength(password) {
        let strength = 0;

        // 长度检查
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;

        // 复杂性检查
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        return strength;
    }

    // 验证昵称
    isValidNickname(nickname) {
        return nickname.length >= 2 && nickname.length <= 20;
    }

    // 显示字段错误
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        if (field) {
            field.classList.add('invalid');
            field.classList.remove('valid');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // 显示字段成功
    showFieldSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        if (field) {
            field.classList.add('valid');
            field.classList.remove('invalid');
        }

        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // 清除字段状态
    clearFieldStatus(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        if (field) {
            field.classList.remove('valid', 'invalid');
        }

        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // 更新密码强度指示器
    updatePasswordStrength(password, strengthBarId, strengthTextId) {
        const strengthBar = document.getElementById(strengthBarId);
        const strengthText = document.getElementById(strengthTextId);

        if (!strengthBar || !strengthText) return;

        const strength = this.getPasswordStrength(password);

        strengthBar.className = 'password-strength-bar';

        if (strength <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = '弱';
            strengthText.style.color = '#f44336';
        } else if (strength <= 4) {
            strengthBar.classList.add('medium');
            strengthText.textContent = '中等';
            strengthText.style.color = '#ff9800';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = '强';
            strengthText.style.color = '#4caf50';
        }
    }

    // 设置登录表单验证
    setupLoginFormValidation() {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');

        if (!usernameField || !passwordField) return;

        // 邮箱验证
        usernameField.addEventListener('blur', () => {
            const email = usernameField.value.trim();

            if (!email) {
                this.showFieldError('username', '请输入邮箱地址');
            } else if (!this.isValidEmail(email)) {
                this.showFieldError('username', '请输入有效的邮箱地址');
            } else {
                this.showFieldSuccess('username');
            }
        });

        // 密码验证
        passwordField.addEventListener('blur', () => {
            const password = passwordField.value;

            if (!password) {
                this.showFieldError('password', '请输入密码');
            } else if (password.length < 6) {
                this.showFieldError('password', '密码长度至少为6位');
            } else {
                this.showFieldSuccess('password');
            }
        });

        // 输入时清除错误状态
        usernameField.addEventListener('input', () => {
            if (usernameField.classList.contains('invalid')) {
                this.clearFieldStatus('username');
            }
        });

        passwordField.addEventListener('input', () => {
            if (passwordField.classList.contains('invalid')) {
                this.clearFieldStatus('password');
            }
        });
    }

    // 设置注册表单验证
    setupRegisterFormValidation() {
        const emailField = document.getElementById('regEmail');
        const nicknameField = document.getElementById('regNickname');
        const passwordField = document.getElementById('regPassword');
        const confirmPasswordField = document.getElementById('regConfirmPassword');

        if (!emailField || !nicknameField || !passwordField || !confirmPasswordField) return;

        // 设置清空按钮功能
        this.setupClearButtons();

        // 邮箱验证
        emailField.addEventListener('blur', () => {
            this.validateRegisterEmail();
            this.updateRegisterFormState();
        });

        emailField.addEventListener('input', () => {
            if (emailField.classList.contains('invalid')) {
                this.clearFieldStatus('regEmail');
            }
            this.toggleClearButton('regEmail');
            this.updateRegisterFormState();
        });

        // 昵称验证
        nicknameField.addEventListener('blur', () => {
            this.validateRegisterNickname();
            this.updateRegisterFormState();
        });

        nicknameField.addEventListener('input', () => {
            if (nicknameField.classList.contains('invalid')) {
                this.clearFieldStatus('regNickname');
            }
            this.toggleClearButton('regNickname');
            this.updateRegisterFormState();
        });

        // 密码验证
        passwordField.addEventListener('input', () => {
            this.validateRegisterPassword();
            this.updateConfirmPasswordVisibility();
            // 如果确认密码已填写，重新验证
            if (confirmPasswordField.value) {
                this.validateConfirmPassword();
            }
            this.updateRegisterFormState();
        });

        // 确认密码验证
        confirmPasswordField.addEventListener('input', () => {
            this.validateConfirmPassword();
            this.updateRegisterFormState();
        });
    }

    // 设置清空按钮功能
    setupClearButtons() {
        const clearButtons = document.querySelectorAll('.clear-input-btn');
        
        clearButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('data-target');
                const input = document.getElementById(targetId);
                
                if (input) {
                    input.value = '';
                    input.focus();
                    button.style.display = 'none';
                    
                    // 清除验证状态
                    this.clearFieldStatus(targetId);
                    this.updateRegisterFormState();
                }
            });
        });
    }

    // 切换清空按钮显示
    toggleClearButton(inputId) {
        const input = document.getElementById(inputId);
        const clearBtn = document.querySelector(`[data-target="${inputId}"]`);
        
        if (input && clearBtn) {
            if (input.value.trim()) {
                clearBtn.style.display = 'flex';
            } else {
                clearBtn.style.display = 'none';
            }
        }
    }

    // 更新确认密码框显示
    updateConfirmPasswordVisibility() {
        const passwordField = document.getElementById('regPassword');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        
        if (!passwordField || !confirmPasswordGroup) return;
        
        const password = passwordField.value;
        const isPasswordValid = password && password.length >= 6 && password.length <= 20;
        
        if (isPasswordValid) {
            confirmPasswordGroup.style.display = 'block';
            // 添加渐入动画
            setTimeout(() => {
                confirmPasswordGroup.style.opacity = '1';
                confirmPasswordGroup.style.transform = 'translateY(0)';
            }, 50);
        } else {
            confirmPasswordGroup.style.display = 'none';
            // 清空确认密码
            const confirmPasswordField = document.getElementById('regConfirmPassword');
            if (confirmPasswordField) {
                confirmPasswordField.value = '';
                this.clearFieldStatus('regConfirmPassword');
            }
        }
    }

    // 更新注册表单状态（包括按钮显示）
    updateRegisterFormState() {
        this.updateRegisterButtonVisibility();
        this.updateRegisterButtonState();
    }

    // 更新注册按钮显示
    updateRegisterButtonVisibility() {
        const email = document.getElementById('regEmail').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // 检查所有字段是否有效
        const isEmailValid = email && this.isValidEmail(email);
        const isNicknameValid = nickname && this.isValidNickname(nickname);
        const isPasswordValid = password && password.length >= 6 && password.length <= 20;
        const isConfirmPasswordValid = confirmPassword && password === confirmPassword;

        const allValid = isEmailValid && isNicknameValid && isPasswordValid && isConfirmPasswordValid;

        // 使用新的按钮状态管理器
        if (window.buttonStateManager) {
            window.buttonStateManager.toggleByValidation('registerSubmitBtn', allValid);
        }
    }

    // 验证注册邮箱
    validateRegisterEmail() {
        const email = document.getElementById('regEmail').value.trim();
        
        if (!email) {
            this.showFieldError('regEmail', '请输入邮箱地址');
            return false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('regEmail', '请输入有效的邮箱地址');
            return false;
        } else {
            this.showFieldSuccess('regEmail');
            return true;
        }
    }

    // 验证注册昵称
    validateRegisterNickname() {
        const nickname = document.getElementById('regNickname').value.trim();
        
        if (!nickname) {
            this.showFieldError('regNickname', '请输入昵称');
            return false;
        } else if (!this.isValidNickname(nickname)) {
            this.showFieldError('regNickname', '昵称长度应为2-20个字符');
            return false;
        } else {
            this.showFieldSuccess('regNickname');
            return true;
        }
    }

    // 验证注册密码
    validateRegisterPassword() {
        const passwordField = document.getElementById('regPassword');
        const password = passwordField.value;
        
        // 更新密码强度指示器
        this.updatePasswordStrength(password, 'passwordStrengthBar', 'passwordStrengthText');

        // 清除之前的错误状态
        this.clearFieldError('regPassword');

        if (!password) {
            passwordField.classList.remove('valid', 'invalid');
            return false;
        } else if (password.length < 6) {
            passwordField.classList.remove('valid');
            passwordField.classList.add('invalid');
            this.showFieldError('regPassword', '密码长度至少为6位');
            return false;
        } else if (password.length > 20) {
            passwordField.classList.remove('valid');
            passwordField.classList.add('invalid');
            this.showFieldError('regPassword', '密码长度不能超过20位');
            return false;
        } else {
            // 密码长度符合要求就显示成功
            passwordField.classList.remove('invalid');
            passwordField.classList.add('valid');
            return true;
        }
    }

    // 更新注册按钮状态
    updateRegisterButtonState() {
        const submitBtn = document.getElementById('registerSubmitBtn');
        if (!submitBtn) return;

        const email = document.getElementById('regEmail').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // 检查所有字段是否有效
        const isEmailValid = email && this.isValidEmail(email);
        const isNicknameValid = nickname && this.isValidNickname(nickname);
        const isPasswordValid = password && password.length >= 6 && password.length <= 20;
        const isConfirmPasswordValid = confirmPassword && password === confirmPassword;

        const allValid = isEmailValid && isNicknameValid && isPasswordValid && isConfirmPasswordValid;

        if (allValid) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('disabled');
            submitBtn.classList.add('enabled');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.add('disabled');
            submitBtn.classList.remove('enabled');
        }
    }

    // 验证确认密码
    validateConfirmPassword() {
        const passwordField = document.getElementById('regPassword');
        const confirmPasswordField = document.getElementById('regConfirmPassword');

        if (!passwordField || !confirmPasswordField) return false;

        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        // 清除之前的错误状态
        this.clearFieldError('regConfirmPassword');

        // 如果确认密码为空，不显示错误（等用户输入）
        if (!confirmPassword) {
            confirmPasswordField.classList.remove('valid', 'invalid');
            return false;
        } 
        
        // 只有当确认密码有内容时才进行比较
        if (password === confirmPassword) {
            confirmPasswordField.classList.remove('invalid');
            confirmPasswordField.classList.add('valid');
            return true;
        } else {
            confirmPasswordField.classList.remove('valid');
            confirmPasswordField.classList.add('invalid');
            this.showFieldError('regConfirmPassword', '两次输入的密码不一致');
            return false;
        }
    }

    // 清除字段错误
    clearFieldError(fieldId) {
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // 初始化注册按钮状态
    initRegisterButtonState() {
        const submitBtn = document.getElementById('registerSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('disabled');
            submitBtn.classList.remove('enabled');
        }
    }

    // 验证登录表单
    validateLoginForm() {
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        let isValid = true;

        if (!email) {
            this.showFieldError('username', '请输入邮箱地址');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('username', '请输入有效的邮箱地址');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('password', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('password', '密码长度至少为6位');
            isValid = false;
        }

        return isValid;
    }

    // 验证注册表单
    validateRegisterForm() {
        const email = document.getElementById('regEmail').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        let isValid = true;

        if (!email) {
            this.showFieldError('regEmail', '请输入邮箱地址');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('regEmail', '请输入有效的邮箱地址');
            isValid = false;
        }

        if (!nickname) {
            this.showFieldError('regNickname', '请输入昵称');
            isValid = false;
        } else if (!this.isValidNickname(nickname)) {
            this.showFieldError('regNickname', '昵称长度应为2-20个字符');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('regPassword', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('regPassword', '密码长度至少为6位');
            isValid = false;
        }

        if (!confirmPassword) {
            this.showFieldError('regConfirmPassword', '请确认密码');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showFieldError('regConfirmPassword', '两次输入的密码不一致');
            isValid = false;
        }

        return isValid;
    }

    // 清除表单验证状态
    clearFormValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const inputs = form.querySelectorAll('input');
        const errors = form.querySelectorAll('.form-error');

        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
        });

        errors.forEach(error => {
            error.classList.remove('show');
        });
    }

    // 设置密码显示/隐藏功能 - 按住显示，松开隐藏
    setupPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = button.querySelector('i');
            
            if (!passwordInput || !icon) return;
            
            // 鼠标按下时显示密码
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                passwordInput.type = 'text';
                icon.textContent = 'visibility_off';
                button.classList.add('active');
            });
            
            // 鼠标松开时隐藏密码
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                passwordInput.type = 'password';
                icon.textContent = 'visibility';
                button.classList.remove('active');
            });
            
            // 鼠标离开按钮时也隐藏密码
            button.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                passwordInput.type = 'password';
                icon.textContent = 'visibility';
                button.classList.remove('active');
            });
            
            // 防止按钮获得焦点
            button.addEventListener('focus', (e) => {
                e.preventDefault();
                button.blur();
            });
        });
    }

    // 检查邮箱是否可注册（简化版本，不进行实际注册尝试）
    async checkEmailAvailability(email) {
        // 简单的邮箱格式验证
        if (!this.isValidEmail(email)) {
            return { available: false, error: '邮箱格式不正确' };
        }
        
        // 直接返回可用，让 Supabase 在实际注册时处理重复邮箱的情况
        return { available: true };
    }
}

// 创建全局表单验证器实例
window.formValidator = new FormValidator();
