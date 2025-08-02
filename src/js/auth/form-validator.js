// form-validator.js
// 表单验证工具模块 - 负责所有表单验证相关功能

class FormValidator {
    constructor() {
        this.init();
    }

    // 初始化表单验证
    init() {
        this.setupLoginFormValidation();
        this.setupRegisterFormValidation();
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

        // 邮箱验证
        emailField.addEventListener('blur', () => {
            const email = emailField.value.trim();

            if (!email) {
                this.showFieldError('regEmail', '请输入邮箱地址');
            } else if (!this.isValidEmail(email)) {
                this.showFieldError('regEmail', '请输入有效的邮箱地址');
            } else {
                this.showFieldSuccess('regEmail');
            }
        });

        // 昵称验证
        nicknameField.addEventListener('blur', () => {
            const nickname = nicknameField.value.trim();

            if (!nickname) {
                this.showFieldError('regNickname', '请输入昵称');
            } else if (!this.isValidNickname(nickname)) {
                this.showFieldError('regNickname', '昵称长度应为2-20个字符');
            } else {
                this.showFieldSuccess('regNickname');
            }
        });

        // 密码验证
        passwordField.addEventListener('input', () => {
            const password = passwordField.value;

            // 更新密码强度指示器
            this.updatePasswordStrength(password, 'passwordStrengthBar', 'passwordStrengthText');

            // 验证密码
            if (!password) {
                this.showFieldError('regPassword', '请输入密码');
            } else if (password.length < 6) {
                this.showFieldError('regPassword', '密码长度至少为6位');
            } else {
                this.showFieldSuccess('regPassword');
            }

            // 如果确认密码已填写，重新验证
            if (confirmPasswordField.value) {
                this.validateConfirmPassword();
            }
        });

        // 确认密码验证
        confirmPasswordField.addEventListener('input', () => {
            this.validateConfirmPassword();
        });

        // 输入时清除错误状态
        emailField.addEventListener('input', () => {
            if (emailField.classList.contains('invalid')) {
                this.clearFieldStatus('regEmail');
            }
        });

        nicknameField.addEventListener('input', () => {
            if (nicknameField.classList.contains('invalid')) {
                this.clearFieldStatus('regNickname');
            }
        });
    }

    // 验证确认密码
    validateConfirmPassword() {
        const passwordField = document.getElementById('regPassword');
        const confirmPasswordField = document.getElementById('regConfirmPassword');

        if (!passwordField || !confirmPasswordField) return;

        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (!confirmPassword) {
            this.showFieldError('regConfirmPassword', '请确认密码');
        } else if (password !== confirmPassword) {
            this.showFieldError('regConfirmPassword', '两次输入的密码不一致');
        } else {
            this.showFieldSuccess('regConfirmPassword');
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
}

// 创建全局表单验证器实例
window.formValidator = new FormValidator();