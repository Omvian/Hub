// mbti-ui.js - MBTI测试UI交互模块
class MBTIUI {
    constructor(core, data) {
        this.core = core;
        this.data = data;
        this.audio = null; // 音乐播放器
        this.isMuted = false; // 静音状态
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        this.initializeScrollEffects();
        this.showLastResultHint(); // 新增：初始化时显示上次结果提示
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 开始测试按钮
        const startTestBtn = document.getElementById('startTestBtn');
        if (startTestBtn) {
            startTestBtn.addEventListener('click', () => this.startTest());
        }

        // 重新测试按钮
        const retakeTestBtn = document.getElementById('retakeTestBtn');
        if (retakeTestBtn) {
            retakeTestBtn.addEventListener('click', () => this.resetTest());
        }

        // 分享结果按钮
        const shareResultBtn = document.getElementById('shareResultBtn');
        if (shareResultBtn) {
            shareResultBtn.addEventListener('click', () => this.shareResult());
        }

        // 保存结果按钮
        const saveResultBtn = document.getElementById('saveResultBtn');
        if (saveResultBtn) {
            saveResultBtn.addEventListener('click', () => this.saveResult());
        }

        // 导航按钮
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevQuestion());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }
    }

    // 开始测试
    startTest() {
        console.log('🚀 开始MBTI测试');
        
        this.core.startTest();
        
        // 隐藏介绍页面，显示测试页面
        document.getElementById('testIntro').style.display = 'none';
        document.getElementById('testQuestions').style.display = 'block';
        document.getElementById('testProgress').style.display = 'flex';
        
        // 显示第一题
        this.showQuestion();
        
        // 播放音乐并显示控制按钮
        this.playMusic();
        this.showMusicControlBtn();
    }

    // 显示问题
    showQuestion() {
        const question = this.core.getCurrentQuestion();
        const progress = this.core.getProgress();
        const questionCard = document.getElementById('questionCard');
        
        // 添加淡出效果
        questionCard.classList.add('fade-out');
        
        setTimeout(() => {
            // 更新问题编号
            document.getElementById('questionNumber').textContent = 
                `${progress.current} / ${progress.total}`;
            document.getElementById('currentQuestion').textContent = progress.current;
            document.getElementById('totalQuestions').textContent = progress.total;
            
            // 更新进度条
            document.getElementById('progressFill').style.width = `${progress.percentage}%`;
            document.getElementById('progressPercentage').textContent = `${progress.percentage}%`;
            
            // 确定问题类型和图标
            const questionType = this.getQuestionType(question);
            const iconName = this.getQuestionIcon(question);
            
            // 更新问题类别和图标
            document.getElementById('questionCategory').textContent = questionType;
            document.getElementById('questionIcon').textContent = iconName;
            
            // 更新问题内容
            document.getElementById('questionText').textContent = question.text;
            
            // 创建选项
            this.createOptions(question);
            
            // 更新导航按钮状态
            this.updateNavigationButtons();
            
            // 添加淡入效果前先移除fade-out
            questionCard.classList.remove('fade-out');
            questionCard.classList.add('fade-in');
            
            setTimeout(() => {
                questionCard.classList.remove('fade-in');
            }, 500);
            
            // 平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }

    // 获取问题类型
    getQuestionType(question) {
        const type = question.options[0].type;
        const types = window.MBTI_DATA.ui.typeLabels;
        return types[type] || '';
    }

    // 获取问题图标
    getQuestionIcon(question) {
        const type = question.options[0].type;
        const icons = window.MBTI_DATA.ui.typeIcons;
        return icons[type] || 'psychology';
    }

    // 创建选项
    createOptions(question) {
        const optionsContainer = document.getElementById('questionOptions');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = option.text;
            optionBtn.dataset.type = option.type;
            optionBtn.dataset.index = index;
            
            // 如果已经有答案，显示选中状态
            if (this.core.answers[this.core.currentQuestionIndex] === index) {
                optionBtn.classList.add('selected');
            }
            
            optionBtn.addEventListener('click', () => {
                this.selectOption(optionBtn, index);
            });
            
            optionsContainer.appendChild(optionBtn);
        });
    }

    // 选择选项
    selectOption(button, optionIndex) {
        // 移除所有选中状态
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 添加选中状态
        button.classList.add('selected');
        
        // 记录答案
        this.core.recordAnswer(this.core.currentQuestionIndex, optionIndex);
        
        // 添加选择反馈动画
        this.addRippleEffect(button);
        
        // 自动进入下一题
        setTimeout(() => {
            if (this.core.currentQuestionIndex < this.core.data.questions.length - 1) {
                this.nextQuestion();
            } else {
                this.finishTest();
            }
        }, 800);
    }

    // 添加涟漪效果
    addRippleEffect(button) {
        const ripple = document.createElement('span');
        ripple.className = 'option-ripple';
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 700);
    }

    // 上一题
    prevQuestion() {
        if (this.core.prevQuestion()) {
            this.showQuestion();
        }
    }

    // 下一题
    nextQuestion() {
        if (this.core.nextQuestion()) {
            this.showQuestion();
        } else {
            this.finishTest();
        }
    }

    // 更新导航按钮状态
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progress = this.core.getProgress();
        
        // 上一题按钮
        if (progress.current === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            prevBtn.disabled = false;
        }
        
        // 下一题按钮
        const hasAnswer = this.core.answers[this.core.currentQuestionIndex] !== undefined;
        
        if (progress.current === progress.total) {
            // 最后一题
            nextBtn.style.display = hasAnswer ? 'flex' : 'none';
            nextBtn.disabled = !hasAnswer;
            nextBtn.innerHTML = '<i class="material-icons">check_circle</i>';
            nextBtn.classList.add('submit-btn');
        } else {
            // 非最后一题
            nextBtn.style.display = hasAnswer ? 'flex' : 'none';
            nextBtn.disabled = !hasAnswer;
            nextBtn.innerHTML = '<i class="material-icons">arrow_forward</i>';
            nextBtn.classList.remove('submit-btn');
        }
    }

    // 完成测试
    finishTest() {
        console.log('✅ 测试完成');
        // 立即保存最近一次结果到cookie
        if (window.cookieManager) {
            const result = this.core.calculateResult();
            window.cookieManager.setCookie(
                'mbti_last_result',
                JSON.stringify({
                    type: result.type,
                    date: new Date().toLocaleString('zh-CN'),
                    testDuration: result.testDuration || '',
                }),
                30,
                'functional'
            );
        }
        // 显示结果加载动画
        this.showResultLoading();
        // 延迟显示结果
        setTimeout(() => {
            const result = this.core.calculateResult();
            this.showResult(result);
            // 隐藏测试页面
            document.getElementById('testQuestions').style.display = 'none';
            document.getElementById('testProgress').style.display = 'none';
            // 显示结果页面
            document.getElementById('testResults').style.display = 'block';
            // 通知改为全局通知框
            window.showSuccess(window.MBTI_DATA.ui.notifications.testCompleted);
            // 平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
        if (this.audio) this.audio.pause();
    }

    // 显示结果加载动画
    showResultLoading() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'result-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="result-loading-content">
                <div class="result-loading-spinner">
                    <i class="material-icons rotating">psychology</i>
                </div>
                <h3>${window.MBTI_DATA.ui.labels.analyzing}</h3>
                <p>${window.MBTI_DATA.ui.labels.pleaseWait}</p>
            </div>
        `;
        
        document.body.appendChild(loadingOverlay);
        
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }, 1500);
    }

    // 显示结果
    showResult(result, isFromCookie = false) {
        const { type, scores, typeInfo, testDuration } = isFromCookie ? {
            ...result,
            scores: {},
            typeInfo: window.MBTI_DATA.types && window.MBTI_DATA.types[result.type] || { title: '', subtitle: '', description: '', characteristics: [] },
            testDuration: result.testDuration || ''
        } : result;
        
        // 显示基本信息
        document.getElementById('resultType').textContent = type;
        document.getElementById('resultTitle').textContent = typeInfo.title;
        document.getElementById('resultSubtitle').textContent = typeInfo.subtitle;
        
        // 显示描述
        const descriptionContainer = document.getElementById('resultDescription');
        descriptionContainer.innerHTML = `
            <h3>${window.MBTI_DATA.ui.labels.personalityDescription}</h3>
            <p>${typeInfo.description}</p>
            <div class="result-meta">
                <div class="result-meta-item">
                    <i class="material-icons">schedule</i>
                    <span>${window.MBTI_DATA.ui.labels.testDuration}: ${testDuration} ${window.MBTI_DATA.ui.labels.minutes}</span>
                </div>
                <div class="result-meta-item">
                    <i class="material-icons">today</i>
                    <span>${window.MBTI_DATA.ui.labels.testDate}: ${new Date().toLocaleDateString('zh-CN')}</span>
                </div>
            </div>
        `;
        
        // 显示维度分析
        this.showDimensionAnalysis(scores);
        
        // 显示特征分析
        this.showCharacteristics(typeInfo);
    }

    // 显示维度分析
    showDimensionAnalysis(scores) {
        const dimensionsContainer = document.getElementById('resultDimensions');
        dimensionsContainer.innerHTML = `<h3>${window.MBTI_DATA.ui.labels.dimensionAnalysis}</h3>`;
        
        const dimensionsGrid = document.createElement('div');
        dimensionsGrid.className = 'dimensions-grid';
        
        const dimensions = window.MBTI_DATA.ui.dimensions;
        
        dimensions.forEach(dim => {
            const eScore = scores[dim.e];
            const iScore = scores[dim.i];
            const total = eScore + iScore;
            const ePercentage = Math.round((eScore / total) * 100);
            const iPercentage = Math.round((iScore / total) * 100);
            const dominant = eScore > iScore ? dim.e : dim.i;
            const dominantLabel = eScore > iScore ? dim.eLabel : dim.iLabel;
            const dominantDesc = eScore > iScore ? dim.eDesc : dim.iDesc;
            const dominantPercentage = Math.max(ePercentage, iPercentage);
            
            const dimensionDiv = document.createElement('div');
            dimensionDiv.className = 'dimension-result';
            dimensionDiv.innerHTML = `
                <h4>${dim.name}</h4>
                <div class="dimension-value">${dominant}</div>
                <div class="dimension-label">${dominantLabel} (${dominantPercentage}%)</div>
                <div class="dimension-bar-container">
                    <div class="dimension-bar">
                        <div class="dimension-bar-fill" style="width: ${dominantPercentage}%"></div>
                    </div>
                </div>
                <div class="dimension-description">${dominantDesc}</div>
            `;
            dimensionsGrid.appendChild(dimensionDiv);
        });
        
        dimensionsContainer.appendChild(dimensionsGrid);
    }

    // 显示特征分析
    showCharacteristics(typeInfo) {
        const characteristicsContainer = document.getElementById('resultCharacteristics');
        characteristicsContainer.innerHTML = `
            <h3>${window.MBTI_DATA.ui.labels.mainCharacteristics}</h3>
            <div class="characteristics-grid">
                ${typeInfo.characteristics.map(char => `
                    <div class="characteristic-item">
                        <h4>${char.title}</h4>
                        <p>${char.desc}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 添加职业建议
        const careerSuggestions = this.getCareerSuggestions(typeInfo.title);
        if (careerSuggestions && careerSuggestions.length > 0) {
            const careerSection = document.createElement('div');
            careerSection.className = 'result-careers';
            careerSection.innerHTML = `
                <h3>${window.MBTI_DATA.ui.labels.suitableCareers}</h3>
                <div class="career-tags">
                    ${careerSuggestions.map(career => `
                        <div class="career-tag">${career}</div>
                    `).join('')}
                </div>
            `;
            characteristicsContainer.appendChild(careerSection);
        }
    }

    // 获取职业建议
    getCareerSuggestions(typeTitle) {
        const careerMap = {
            '建筑师': ['战略规划师', '系统分析师', '软件架构师', '投资银行家', '科学研究员', '企业顾问'],
            '逻辑学家': ['软件开发者', '数据科学家', '研究科学家', '系统设计师', '大学教授', '逻辑学家'],
            '指挥官': ['企业高管', '管理顾问', '律师', '项目经理', '政治家', '企业家'],
            '辩论家': ['企业家', '营销策略师', '发明家', '创意总监', '风险投资家', '商业顾问'],
            '提倡者': ['心理咨询师', '作家', '人力资源专家', '社会工作者', '教师', '艺术治疗师'],
            '调停者': ['作家', '心理咨询师', '社会工作者', '艺术家', '设计师', '教师'],
            '主人公': ['教育工作者', '人力资源经理', '公关专家', '销售经理', '市场营销总监', '职业顾问'],
            '竞选者': ['创意总监', '记者', '演员', '市场营销专家', '活动策划师', '人力资源专员'],
            '物流师': ['财务分析师', '会计师', '项目经理', '军事人员', '法官', '审计师'],
            '守护者': ['护士', '小学教师', '行政助理', '社会工作者', '客户服务代表', '办公室经理'],
            '总经理': ['销售经理', '项目经理', '军事或警察领导', '金融经理', '行政主管', '法官'],
            '执政官': ['护士', '教师', '销售代表', '公关专员', '人力资源专员', '社区服务经理'],
            '鉴赏家': ['工程师', '技术专家', '飞行员', '法医专家', '机械师', '软件开发者'],
            '探险家': ['艺术家', '设计师', '音乐家', '厨师', '兽医', '美容师'],
            '企业家': ['企业家', '销售代表', '市场营销专员', '运动员', '警察或消防员', '项目协调员'],
            '娱乐家': ['活动策划师', '销售代表', '旅游顾问', '演员', '教练', '儿童保育工作者']
        };
        
        return careerMap[typeTitle] || [];
    }

    // 重置测试
    resetTest() {
        console.log('🔄 重置测试');
        
        // 重置数据
        this.core.startTest();
        
        // 隐藏结果页面
        document.getElementById('testResults').style.display = 'none';
        
        // 显示介绍页面
        document.getElementById('testIntro').style.display = 'block';
        
        // 隐藏进度条
        document.getElementById('testProgress').style.display = 'none';
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.showLastResultHint();
        if (this.audio) this.audio.pause();
    }

    // 分享结果
    shareResult() {
        const resultType = document.getElementById('resultType').textContent;
        const resultTitle = document.getElementById('resultTitle').textContent;
        
        const shareText = `${window.MBTI_DATA.ui.labels.myMbtiType} ${resultType} - ${resultTitle}！${window.MBTI_DATA.ui.labels.testLink}`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'MBTI人格测试结果',
                text: shareText,
                url: shareUrl
            }).then(() => {
                this.showNotification(window.MBTI_DATA.ui.notifications.shareSuccess, 'success');
            }).catch(() => {
                this.copyToClipboard(`${shareText} ${shareUrl}`);
            });
        } else {
            this.copyToClipboard(`${shareText} ${shareUrl}`);
        }
    }

    // 保存结果
    saveResult() {
        const resultType = document.getElementById('resultType').textContent;
        const resultTitle = document.getElementById('resultTitle').textContent;
        const resultDescription = document.getElementById('resultDescription').textContent;
        
        const resultData = {
            type: resultType,
            title: resultTitle,
            description: resultDescription,
            testDate: new Date().toLocaleString('zh-CN'),
            url: window.location.href
        };
        
        // 创建下载内容
        const content = `
${window.MBTI_DATA.ui.labels.mbtiTestResult}
================

${window.MBTI_DATA.ui.labels.testType}: ${resultData.type}
${window.MBTI_DATA.ui.labels.personalityType}: ${resultData.title}
${window.MBTI_DATA.ui.labels.testTime}: ${resultData.testDate}

${resultData.description}

${window.MBTI_DATA.ui.labels.testLink}: ${resultData.url}
        `.trim();
        
        // 创建下载链接
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${window.MBTI_DATA.ui.labels.mbtiTestResult}_${resultData.type}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(window.MBTI_DATA.ui.notifications.resultSaved, 'success');
    }

    // 复制到剪贴板
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification(window.MBTI_DATA.ui.notifications.copySuccess, 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    // 备用复制方法
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification(window.MBTI_DATA.ui.notifications.copySuccess, 'success');
        } catch (err) {
            this.showNotification(window.MBTI_DATA.ui.notifications.copyFailed, 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `simple-notification ${type}`;
        notification.textContent = message;
        
        // 设置样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // 设置背景色
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.background = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 初始化键盘快捷键
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 在测试过程中的快捷键
            if (document.getElementById('testQuestions').style.display !== 'none') {
                // 数字键1-2选择选项
                if (e.key >= '1' && e.key <= '2') {
                    const optionIndex = parseInt(e.key) - 1;
                    const options = document.querySelectorAll('.option-btn');
                    if (options[optionIndex]) {
                        options[optionIndex].click();
                    }
                }
                
                // 左右箭头键导航
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevBtn = document.getElementById('prevBtn');
                    if (prevBtn && !prevBtn.disabled) {
                        prevBtn.click();
                    }
                }
                
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextBtn = document.getElementById('nextBtn');
                    if (nextBtn && !nextBtn.disabled) {
                        nextBtn.click();
                    }
                }
            }
            
            // ESC键返回介绍页面
            if (e.key === 'Escape') {
                if (document.getElementById('testQuestions').style.display !== 'none') {
                    if (confirm(window.MBTI_DATA.ui.labels.confirmExitTest)) {
                        this.resetTest();
                    }
                }
            }
        });
    }

    // 初始化滚动效果
    initializeScrollEffects() {
        let ticking = false;
        
        const updateScrollEffects = () => {
            const scrollY = window.scrollY;
            const header = document.querySelector('.subpage-header');
            
            if (scrollY > 50) {
                header.style.background = 'rgba(26, 26, 26, 0.98)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)';
                header.style.backdropFilter = 'blur(10px)';
            }
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        });
    }

    // 新增：显示上次测试结果提示
    showLastResultHint(retry = 0) {
        if (!window.cookieManager) return;
        const lastResultStr = window.cookieManager.getCookie('mbti_last_result');
        if (!lastResultStr) return;
        let lastResult;
        try {
            lastResult = JSON.parse(lastResultStr);
        } catch (e) {
            return;
        }
        const btn = document.getElementById('startTestBtn');
        if (!btn) {
            if (retry < 10) setTimeout(() => this.showLastResultHint(retry + 1), 100);
            return;
        }
        let hint = document.getElementById('lastResultHint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'lastResultHint';
            hint.className = 'lastResultHint';
            btn.parentNode.insertBefore(hint, btn.nextSibling);
        }
        hint.innerHTML = `
            <div class="result-info">上次测试结果：<span>${lastResult.type}</span>（${lastResult.date ? lastResult.date.split(' ')[0] : ''}）</div>
            <button id="viewLastResultBtn" class="view-result-btn">查看上次结果</button>
        `;
        document.getElementById('viewLastResultBtn').onclick = () => {
            this.showResult(lastResult, true);
            document.getElementById('testIntro').style.display = 'none';
            document.getElementById('testQuestions').style.display = 'none';
            document.getElementById('testProgress').style.display = 'none';
            document.getElementById('testResults').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    // 音乐播放
    playMusic() {
        if (!this.audio) {
            this.audio = document.createElement('audio');
            this.audio.src = 'assets/audio/space.mp3';
            this.audio.loop = true;
            this.audio.volume = 0.6;
            document.body.appendChild(this.audio);
        }
        this.audio.muted = this.isMuted;
        this.audio.play().catch(() => {});
    }
    // 显示音乐控制按钮
    showMusicControlBtn() {
        let btn = document.getElementById('musicControlBtn');
        const testQuestions = document.getElementById('testQuestions');
        if (!testQuestions) return;
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'musicControlBtn';
            btn.style.position = 'absolute';
            btn.style.top = '18px';
            btn.style.right = '18px';
            btn.style.zIndex = '10';
            btn.style.background = 'rgba(30,30,40,0.7)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '50%';
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.cursor = 'pointer';
            btn.innerHTML = '<i class="material-icons">' + (this.isMuted ? 'volume_off' : 'music_note') + '</i>';
            testQuestions.appendChild(btn);
        } else {
            btn.innerHTML = '<i class="material-icons">' + (this.isMuted ? 'volume_off' : 'music_note') + '</i>';
        }
        btn.onclick = () => {
            this.isMuted = !this.isMuted;
            if (this.audio) this.audio.muted = this.isMuted;
            btn.innerHTML = '<i class="material-icons">' + (this.isMuted ? 'volume_off' : 'music_note') + '</i>';
        };
    }
}

window.MBTIUI = MBTIUI;
