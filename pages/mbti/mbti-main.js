// mbti-main.js - MBTI测试主入口脚本
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 MBTI测试页面加载完成');
    
    // 延迟初始化，确保所有脚本都已加载
    setTimeout(() => {
        initializeMBTIApp();
    }, 500);
});

// 初始化MBTI应用
function initializeMBTIApp() {
    try {
        // 检查数据是否已加载
        if (!window.MBTI_DATA) {
            console.error('❌ MBTI数据未加载');
            return;
        }
        
        console.log('📚 开始加载MBTI测试数据和文案');
        
        // 初始化各个模块
        const core = new window.MBTICore(window.MBTI_DATA);
        const ui = new window.MBTIUI(core, window.MBTI_DATA);
        const auth = new window.MBTIAuth(window.MBTI_DATA);
        const storage = new window.MBTIStorage(window.MBTI_DATA);
        const utils = new window.MBTIUtils();
        
        // 检查是否有保存的结果
        const recentResult = storage.checkRecentResult();
        if (recentResult) {
            console.log(`📊 发现 ${recentResult.type} 的最近测试结果`);
        }
        
        // 全局暴露，方便调试
        window.MBTI = {
            core,
            ui,
            auth,
            storage,
            utils,
            data: window.MBTI_DATA
        };
        
        console.log('✅ MBTI测试脚本初始化完成');
        
        // 初始化完成后的回调
        if (typeof window.onMBTIReady === 'function') {
            window.onMBTIReady(window.MBTI);
        }
        
    } catch (error) {
        console.error('❌ MBTI应用初始化失败:', error);
        
        // 显示错误提示
        const errorMessage = document.createElement('div');
        errorMessage.className = 'mbti-error-message';
        errorMessage.textContent = 'MBTI测试初始化失败，请刷新页面重试';
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
        `;
        document.body.appendChild(errorMessage);
    }
}

// 提供全局初始化完成的回调函数
window.onMBTIReady = function(mbti) {
    console.log('🎉 MBTI应用已准备就绪', mbti);
};
