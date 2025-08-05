// mbti-core.js - MBTI测试核心逻辑模块
class MBTICore {
    constructor(data) {
        this.data = data;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.testStartTime = null;
        this.testEndTime = null;
    }

    // 开始测试
    startTest() {
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.testStartTime = new Date();
    }

    // 记录答案
    recordAnswer(questionIndex, answerIndex) {
        this.answers[questionIndex] = answerIndex;
    }

    // 上一题
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    // 下一题
    nextQuestion() {
        if (this.currentQuestionIndex < this.data.questions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    // 计算测试结果
    calculateResult() {
        const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        
        // 统计各维度得分
        this.answers.forEach((answerIndex, questionIndex) => {
            const question = this.data.questions[questionIndex];
            const selectedOption = question.options[answerIndex];
            scores[selectedOption.type]++;
        });

        // 确定每个维度的倾向
        const type = 
            (scores.E > scores.I ? 'E' : 'I') +
            (scores.S > scores.N ? 'S' : 'N') +
            (scores.T > scores.F ? 'T' : 'F') +
            (scores.J > scores.P ? 'J' : 'P');

        // 计算测试时长
        const testDuration = this.testStartTime ? 
            Math.round((new Date() - this.testStartTime) / 1000 / 60) : 0;

        return {
            type: type,
            scores: scores,
            typeInfo: this.data.types[type],
            testDate: new Date().toISOString(),
            testDuration: testDuration,
            totalQuestions: this.data.questions.length
        };
    }

    // 获取当前问题
    getCurrentQuestion() {
        return this.data.questions[this.currentQuestionIndex];
    }

    // 获取测试进度
    getProgress() {
        return {
            current: this.currentQuestionIndex + 1,
            total: this.data.questions.length,
            percentage: Math.round(((this.currentQuestionIndex + 1) / this.data.questions.length) * 100)
        };
    }

    // 检查是否完成测试
    isTestComplete() {
        return this.currentQuestionIndex === this.data.questions.length - 1 && 
               this.answers[this.currentQuestionIndex] !== undefined;
    }
}

window.MBTICore = MBTICore;
