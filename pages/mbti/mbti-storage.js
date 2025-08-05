// mbti-storage.js - MBTI测试数据存储和分享模块
class MBTIStorage {
    constructor(data) {
        this.data = data;
        this.storageKey = 'mbtiTestResults';
        this.maxResults = 5;
    }

    // 保存结果到本地存储
    saveResultToStorage(result) {
        try {
            const savedResults = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            savedResults.push(result);
            
            // 只保留最近的结果
            if (savedResults.length > this.maxResults) {
                savedResults.splice(0, savedResults.length - this.maxResults);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(savedResults));
            console.log('✅ 结果已保存到本地存储');
            return true;
        } catch (error) {
            console.error('❌ 保存结果失败:', error);
            return false;
        }
    }

    // 获取保存的结果
    getSavedResults() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('❌ 读取保存结果失败:', error);
            return [];
        }
    }

    // 检查是否有最近的结果
    checkRecentResult() {
        const savedResults = this.getSavedResults();
        if (savedResults.length > 0) {
            const latestResult = savedResults[savedResults.length - 1];
            const testDate = new Date(latestResult.testDate);
            const daysSinceTest = Math.floor((new Date() - testDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceTest < 30) {
                console.log(`📊 发现 ${daysSinceTest} 天前的测试结果: ${latestResult.type}`);
                return latestResult;
            }
        }
        return null;
    }

    // 清除所有保存的结果
    clearSavedResults() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('✅ 已清除所有保存的测试结果');
            return true;
        } catch (error) {
            console.error('❌ 清除保存结果失败:', error);
            return false;
        }
    }

    // 导出结果为JSON文件
    exportResults() {
        const savedResults = this.getSavedResults();
        if (savedResults.length === 0) {
            console.log('📊 没有可导出的测试结果');
            return false;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalResults: savedResults.length,
            results: savedResults
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MBTI测试结果_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ 测试结果已导出');
        return true;
    }

    // 导入结果从JSON文件
    importResults(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.results || !Array.isArray(importData.results)) {
                        throw new Error('无效的导入文件格式');
                    }

                    const savedResults = this.getSavedResults();
                    const newResults = [...savedResults, ...importData.results];
                    
                    // 去重并限制数量
                    const uniqueResults = this.deduplicateResults(newResults);
                    const finalResults = uniqueResults.slice(-this.maxResults);
                    
                    localStorage.setItem(this.storageKey, JSON.stringify(finalResults));
                    
                    console.log(`✅ 成功导入 ${importData.results.length} 个测试结果`);
                    resolve(finalResults);
                } catch (error) {
                    console.error('❌ 导入测试结果失败:', error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    // 去重结果
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = `${result.type}_${result.testDate}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 获取结果统计
    getResultStats() {
        const savedResults = this.getSavedResults();
        const stats = {
            totalTests: savedResults.length,
            typeDistribution: {},
            averageDuration: 0,
            oldestTest: null,
            newestTest: null
        };

        if (savedResults.length === 0) {
            return stats;
        }

        // 计算类型分布
        savedResults.forEach(result => {
            stats.typeDistribution[result.type] = (stats.typeDistribution[result.type] || 0) + 1;
        });

        // 计算平均时长
        const totalDuration = savedResults.reduce((sum, result) => sum + (result.testDuration || 0), 0);
        stats.averageDuration = Math.round(totalDuration / savedResults.length);

        // 找到最早和最新的测试
        const dates = savedResults.map(r => new Date(r.testDate));
        stats.oldestTest = new Date(Math.min(...dates));
        stats.newestTest = new Date(Math.max(...dates));

        return stats;
    }
}

window.MBTIStorage = MBTIStorage;
