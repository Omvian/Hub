// MBTI测试 子页面脚本
// 依赖关系: 无外部依赖，独立运行
// 功能: MBTI人格测试逻辑、问题展示、结果分析
// 关联文件: mbti.html (页面结构), mbti.css (样式)
/* 
 * ⚠️  修改此文件前必须阅读以下文档：
 * - .docs/js-architecture.md - JavaScript架构指南
 * 
 * 🎯 此文件职责：
 * - MBTI人格测试的完整逻辑实现
 * - 问题展示、答案收集、结果计算和展示
 * - 测试进度管理和导航控制
 * - 结果保存、分享和本地存储功能
 * 
 * 🔗 依赖关系：
 * - 无外部JS依赖，独立运行
 * - 依赖pages/mbti/mbti.html的DOM结构
 * - 依赖pages/mbti/mbti.css的样式定义
 * 
 * ⚠️ 重要提醒：
 * - 包含完整的MBTI测试题目和类型描述数据
 * - 支持键盘快捷键和页面刷新保护
 * - 结果自动保存到localStorage
 */

// 全局变量
let currentQuestionIndex = 0;
let answers = [];
let questions = [];
let testStartTime = null;

// MBTI测试题目数据 - 权威版本（48题，每个维度12题）
const mbtiQuestions = [
    // E/I 维度题目 (12题)
    {
        text: "在社交场合中，你通常会：",
        options: [
            { text: "认识很多人并与大家交谈", type: "E" },
            { text: "与少数几个你认识的人交谈", type: "I" }
        ]
    },
    {
        text: "你更喜欢：",
        options: [
            { text: "参加聚会和社交活动", type: "E" },
            { text: "独自或与一两个亲密朋友在一起的时光", type: "I" }
        ]
    },
    {
        text: "当你需要在一个重要问题上做决定时，你倾向于：",
        options: [
            { text: "与他人讨论以理清思路", type: "E" },
            { text: "独自思考后再与他人分享结论", type: "I" }
        ]
    },
    {
        text: "在工作或学习环境中，你更喜欢：",
        options: [
            { text: "开放的协作空间，可以随时与他人交流", type: "E" },
            { text: "安静的私人空间，可以专注思考", type: "I" }
        ]
    },
    {
        text: "当你遇到问题时，你通常会：",
        options: [
            { text: "立即寻求他人的建议和帮助", type: "E" },
            { text: "先尝试自己解决，必要时才寻求帮助", type: "I" }
        ]
    },
    {
        text: "你更容易：",
        options: [
            { text: "在与人交流中获得能量和灵感", type: "E" },
            { text: "在独处时获得能量和灵感", type: "I" }
        ]
    },
    {
        text: "在会议或课堂上，你更可能：",
        options: [
            { text: "主动发言，分享想法", type: "E" },
            { text: "倾听他人，仅在必要时发言", type: "I" }
        ]
    },
    {
        text: "你更喜欢的工作方式是：",
        options: [
            { text: "团队合作，可以与他人交流想法", type: "E" },
            { text: "独立工作，可以专注于自己的任务", type: "I" }
        ]
    },
    {
        text: "当你有空闲时间时，你更倾向于：",
        options: [
            { text: "外出与朋友相聚", type: "E" },
            { text: "在家放松或进行个人爱好", type: "I" }
        ]
    },
    {
        text: "你认为自己是：",
        options: [
            { text: "容易接近且健谈的人", type: "E" },
            { text: "安静且有所保留的人", type: "I" }
        ]
    },
    {
        text: "在新环境中，你通常会：",
        options: [
            { text: "迅速融入并结交新朋友", type: "E" },
            { text: "慢慢观察并逐渐适应", type: "I" }
        ]
    },
    {
        text: "长时间的社交活动后，你通常感到：",
        options: [
            { text: "精力充沛，想继续社交", type: "E" },
            { text: "需要独处时间来恢复精力", type: "I" }
        ]
    },
    
    // S/N 维度题目 (12题)
    {
        text: "你更关注：",
        options: [
            { text: "具体的事实和细节", type: "S" },
            { text: "概念和可能性", type: "N" }
        ]
    },
    {
        text: "你更相信：",
        options: [
            { text: "直接经验和观察", type: "S" },
            { text: "理论和想象", type: "N" }
        ]
    },
    {
        text: "你更喜欢处理：",
        options: [
            { text: "已知的和实际的问题", type: "S" },
            { text: "新颖的和抽象的问题", type: "N" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "关注现实和当下", type: "S" },
            { text: "思考未来和可能性", type: "N" }
        ]
    },
    {
        text: "你更喜欢的工作是：",
        options: [
            { text: "有明确步骤和具体结果的工作", type: "S" },
            { text: "允许创新和探索新方法的工作", type: "N" }
        ]
    },
    {
        text: "你更喜欢的书籍或电影是：",
        options: [
            { text: "基于现实或历史事件的作品", type: "S" },
            { text: "科幻、奇幻或充满想象力的作品", type: "N" }
        ]
    },
    {
        text: "在学习新事物时，你更喜欢：",
        options: [
            { text: "循序渐进，掌握每个具体步骤", type: "S" },
            { text: "先了解整体概念，再填补细节", type: "N" }
        ]
    },
    {
        text: "你更相信：",
        options: [
            { text: "实践经验和已证实的方法", type: "S" },
            { text: "直觉和创新方法", type: "N" }
        ]
    },
    {
        text: "你更喜欢的老师是：",
        options: [
            { text: "清晰讲解具体知识点的老师", type: "S" },
            { text: "激发思考和探索新想法的老师", type: "N" }
        ]
    },
    {
        text: "在解决问题时，你更倾向于：",
        options: [
            { text: "使用已证实有效的方法", type: "S" },
            { text: "尝试新颖的解决方案", type: "N" }
        ]
    },
    {
        text: "你更喜欢的工作指导是：",
        options: [
            { text: "具体明确的指示", type: "S" },
            { text: "概括性的方向，留有创新空间", type: "N" }
        ]
    },
    {
        text: "你更关注：",
        options: [
            { text: "实际应用和实用性", type: "S" },
            { text: "创新和理论可能性", type: "N" }
        ]
    },
    
    // T/F 维度题目 (12题)
    {
        text: "做决定时，你更看重：",
        options: [
            { text: "逻辑和客观分析", type: "T" },
            { text: "个人价值观和对他人的影响", type: "F" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "公正客观地分析情况", type: "T" },
            { text: "考虑决定对人的影响", type: "F" }
        ]
    },
    {
        text: "你认为更重要的是：",
        options: [
            { text: "真实，即使可能伤害他人感受", type: "T" },
            { text: "善良，避免不必要的伤害", type: "F" }
        ]
    },
    {
        text: "在冲突中，你更关注：",
        options: [
            { text: "找出问题的逻辑解决方案", type: "T" },
            { text: "维护关系和每个人的感受", type: "F" }
        ]
    },
    {
        text: "你更欣赏他人的：",
        options: [
            { text: "清晰的思维和合理的论点", type: "T" },
            { text: "强烈的同理心和情感理解", type: "F" }
        ]
    },
    {
        text: "你更喜欢的领导风格是：",
        options: [
            { text: "基于逻辑和公平的领导", type: "T" },
            { text: "关注团队和谐与个人需求的领导", type: "F" }
        ]
    },
    {
        text: "在评估情况时，你更倾向于：",
        options: [
            { text: "客观分析利弊", type: "T" },
            { text: "考虑对人的影响和价值观", type: "F" }
        ]
    },
    {
        text: "你更容易被他人形容为：",
        options: [
            { text: "理性和逻辑性强的人", type: "T" },
            { text: "富有同情心和理解力的人", type: "F" }
        ]
    },
    {
        text: "在给予反馈时，你更倾向于：",
        options: [
            { text: "直接指出问题和解决方案", type: "T" },
            { text: "先肯定优点，再委婉提出改进建议", type: "F" }
        ]
    },
    {
        text: "你更看重：",
        options: [
            { text: "公正和一致性", type: "T" },
            { text: "和谐与同理心", type: "F" }
        ]
    },
    {
        text: "在工作中，你更关注：",
        options: [
            { text: "任务完成和效率", type: "T" },
            { text: "团队合作和人际关系", type: "F" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "基于原则和规则做决定", type: "T" },
            { text: "考虑特殊情况和个人需求", type: "F" }
        ]
    },
    
    // J/P 维度题目 (12题)
    {
        text: "你更喜欢：",
        options: [
            { text: "有计划和结构的生活", type: "J" },
            { text: "灵活和自发的生活", type: "P" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "提前计划和安排", type: "J" },
            { text: "随机应变，保持选择的开放性", type: "P" }
        ]
    },
    {
        text: "你更喜欢：",
        options: [
            { text: "有明确截止日期的项目", type: "J" },
            { text: "灵活时间安排的项目", type: "P" }
        ]
    },
    {
        text: "你的工作区域通常是：",
        options: [
            { text: "整洁有序，物品归位", type: "J" },
            { text: "创意性混乱，随手可及", type: "P" }
        ]
    },
    {
        text: "你更喜欢：",
        options: [
            { text: "按计划完成任务", type: "J" },
            { text: "根据灵感和兴趣行动", type: "P" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "做决定并完成事情", type: "J" },
            { text: "保持选择的开放性，收集更多信息", type: "P" }
        ]
    },
    {
        text: "你更喜欢的工作方式是：",
        options: [
            { text: "有明确的目标和截止日期", type: "J" },
            { text: "灵活调整，根据情况变化", type: "P" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "按部就班，一步一步完成任务", type: "J" },
            { text: "多任务处理，根据兴趣切换", type: "P" }
        ]
    },
    {
        text: "你更喜欢：",
        options: [
            { text: "提前计划假期的每一天", type: "J" },
            { text: "即兴决定，根据当时情况安排", type: "P" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "按时完成任务，避免最后冲刺", type: "J" },
            { text: "在截止日期前突击完成", type: "P" }
        ]
    },
    {
        text: "你更喜欢的环境是：",
        options: [
            { text: "有序、可预测的环境", type: "J" },
            { text: "灵活、可变化的环境", type: "P" }
        ]
    },
    {
        text: "你更倾向于：",
        options: [
            { text: "制定计划并坚持执行", type: "J" },
            { text: "根据情况随时调整计划", type: "P" }
        ]
    }
];

// MBTI类型描述
const mbtiTypes = {
    "INTJ": {
        title: "建筑师",
        subtitle: "富有想象力和战略性的思想家，一切皆在计划之中",
        description: "INTJ型人格被称为'建筑师'，他们具有独特的能力将创意和决心结合起来。他们不会满足于仅仅做白日梦，而是会采取具体的步骤来实现目标，产生持久而积极的影响。",
        characteristics: [
            { title: "理性思维", desc: "善于分析复杂问题，制定长远战略" },
            { title: "独立自主", desc: "喜欢独立工作，不依赖他人认可" },
            { title: "追求完美", desc: "对自己和他人都有很高的标准" },
            { title: "创新能力", desc: "能够看到别人看不到的可能性" }
        ]
    },
    "INTP": {
        title: "逻辑学家",
        subtitle: "具有创新精神的发明家，对知识有着不可抑制的渴望",
        description: "INTP型人格被称为'逻辑学家'，他们以其独特的观点和旺盛的智力而自豪。他们无法忍受无聊的环境，虽然他们只占人口的3%，但他们在历史上许多科学发现中都留下了不可磨灭的印记。",
        characteristics: [
            { title: "理论思维", desc: "热爱抽象概念和理论探索" },
            { title: "逻辑分析", desc: "善于发现模式和逻辑关系" },
            { title: "求知欲强", desc: "对新知识有强烈的渴望" },
            { title: "独立思考", desc: "不轻易接受权威观点" }
        ]
    },
    "ENTJ": {
        title: "指挥官",
        subtitle: "大胆、富有想象力、意志强烈的领导者，总能找到或创造解决方法",
        description: "ENTJ型人格被称为'指挥官'，他们是天生的领导者。具有这种人格类型的人体现了领导力的天赋，以魅力和自信来团结众人为共同目标而努力。",
        characteristics: [
            { title: "天生领导", desc: "具有强烈的领导欲望和能力" },
            { title: "战略思维", desc: "善于制定长期计划和策略" },
            { title: "决断力强", desc: "能够快速做出重要决定" },
            { title: "目标导向", desc: "专注于实现既定目标" }
        ]
    },
    "ENTP": {
        title: "辩论家",
        subtitle: "聪明好奇的思想家，无法抗拒智力上的挑战",
        description: "ENTP型人格被称为'辩论家'，他们是终极的魔鬼代言人，在思辨和信念的交锋中茁壮成长。这并不是说他们是恶意的，而是说他们有一种独特的习惯，即为了辩论而辩论。",
        characteristics: [
            { title: "创新思维", desc: "充满创意，善于提出新想法" },
            { title: "辩论能力", desc: "享受智力辩论和思想交锋" },
            { title: "适应性强", desc: "能够快速适应新环境" },
            { title: "好奇心强", desc: "对各种可能性充满兴趣" }
        ]
    },
    "INFJ": {
        title: "提倡者",
        subtitle: "安静而神秘，同时鼓舞人心且不知疲倦的理想主义者",
        description: "INFJ型人格被称为'提倡者'，他们具有内在的理想主义和道德感，但真正令他们与众不同的是，他们不是空想家，而是能够采取具体步骤来实现目标，产生积极而持久影响的人。",
        characteristics: [
            { title: "理想主义", desc: "追求有意义的人生目标" },
            { title: "洞察力强", desc: "能够理解他人的动机和感受" },
            { title: "创造性", desc: "具有丰富的想象力和创造力" },
            { title: "坚持原则", desc: "坚守个人价值观和信念" }
        ]
    },
    "INFP": {
        title: "调停者",
        subtitle: "诗意、善良、利他主义，总是热切地寻求帮助好的事业",
        description: "INFP型人格被称为'调停者'，他们是真正的理想主义者，总是从最坏的人和事中寻找一丝善意，并努力让事情变得更好。虽然他们可能被认为是冷静、矜持甚至害羞的，但他们内心燃烧着激情的火焰。",
        characteristics: [
            { title: "价值驱动", desc: "行为受个人价值观强烈驱动" },
            { title: "同理心强", desc: "能够深刻理解他人感受" },
            { title: "创造天赋", desc: "在艺术和创意领域表现出色" },
            { title: "追求和谐", desc: "努力维护人际关系和谐" }
        ]
    },
    "ENFJ": {
        title: "主人公",
        subtitle: "富有魅力、鼓舞人心的领导者，有能力让听众着迷",
        description: "ENFJ型人格被称为'主人公'，他们是天生的领导者，充满激情和魅力，能够鼓舞听众为共同的利益而努力。他们往往会被政治和公共服务所吸引。",
        characteristics: [
            { title: "鼓舞他人", desc: "能够激励和影响他人" },
            { title: "人际敏感", desc: "对他人需求高度敏感" },
            { title: "组织能力", desc: "善于组织和协调团队" },
            { title: "利他主义", desc: "关心他人福祉和社会进步" }
        ]
    },
    "ENFP": {
        title: "竞选者",
        subtitle: "热情、有创造力、社交能力强，总能找到微笑的理由",
        description: "ENFP型人格被称为'竞选者'，他们是真正自由的精神。他们通常是聚会的焦点，但与探聚光灯的类型不同，他们享受与他人的社交和情感联系。",
        characteristics: [
            { title: "热情洋溢", desc: "对生活充满热情和活力" },
            { title: "社交能力", desc: "善于建立人际关系" },
            { title: "创意丰富", desc: "充满创新想法和可能性" },
            { title: "鼓励他人", desc: "能够看到他人的潜力" }
        ]
    },
    "ISTJ": {
        title: "物流师",
        subtitle: "实用主义、注重事实的可靠性，可以信赖他们完成任务",
        description: "ISTJ型人格被称为'物流师'，他们以其可靠性而闻名。他们言出必行，当他们承诺做某事时，他们会坚持到底。这种人格类型构成了许多家庭以及我们珍视的组织的核心。",
        characteristics: [
            { title: "责任感强", desc: "对承诺和义务非常认真" },
            { title: "注重细节", desc: "关注具体事实和细节" },
            { title: "组织有序", desc: "喜欢有序和结构化的环境" },
            { title: "传统价值", desc: "尊重传统和既定程序" }
        ]
    },
    "ISFJ": {
        title: "守护者",
        subtitle: "非常专注、温暖的守护者，时刻准备保护爱的人",
        description: "ISFJ型人格被称为'守护者'，他们以其温暖的心和乐于助人的天性而闻名。他们慷慨大方，往往把他人的需要放在自己的需要之前，很少要求认可或感谢。",
        characteristics: [
            { title: "关怀他人", desc: "天生具有照顾他人的倾向" },
            { title: "忠诚可靠", desc: "对朋友和家人极其忠诚" },
            { title: "实用主义", desc: "注重实际和可行的解决方案" },
            { title: "谦逊低调", desc: "不喜欢成为关注焦点" }
        ]
    },
    "ESTJ": {
        title: "总经理",
        subtitle: "出色的管理者，在管理事物或人员方面无与伦比",
        description: "ESTJ型人格被称为'总经理'，他们是优秀的组织者，善于管理事物和人员。他们生活在一个事实和具体现实的世界里，是天生的领导者。",
        characteristics: [
            { title: "管理能力", desc: "天生的组织者和管理者" },
            { title: "务实高效", desc: "注重效率和实际结果" },
            { title: "决断力强", desc: "能够快速做出决定" },
            { title: "责任心强", desc: "对工作和义务高度负责" }
        ]
    },
    "ESFJ": {
        title: "执政官",
        subtitle: "极有同情心、受欢迎、总是热心帮助他人",
        description: "ESFJ型人格被称为'执政官'，他们是受欢迎且慷慨的人，他们努力维护和谐的环境。他们渴望归属感和被接受，这种需求往往使他们成为受欢迎的委员会成员。",
        characteristics: [
            { title: "社交能力", desc: "善于建立和维护人际关系" },
            { title: "服务精神", desc: "乐于帮助和服务他人" },
            { title: "和谐导向", desc: "努力维护群体和谐" },
            { title: "传统价值", desc: "重视传统和社会规范" }
        ]
    },
    "ISTP": {
        title: "鉴赏家",
        subtitle: "大胆而实际的实验家，擅长使用各种工具",
        description: "ISTP型人格被称为'鉴赏家'，他们天生好奇，喜欢用双手探索周围的世界。他们是天生的创造者，在各种项目中从一个想法转向另一个想法。",
        characteristics: [
            { title: "实践能力", desc: "善于动手解决实际问题" },
            { title: "适应性强", desc: "能够灵活应对变化" },
            { title: "独立自主", desc: "喜欢独立工作和思考" },
            { title: "冷静理性", desc: "在压力下保持冷静" }
        ]
    },
    "ISFP": {
        title: "探险家",
        subtitle: "灵活、迷人的艺术家，时刻准备探索新的可能性",
        description: "ISFP型人格被称为'探险家'，他们是真正的艺术家，但不一定是典型意义上的艺术家。对他们来说，生活就是一块画布，他们用同情心、善良和美感来表达自己。",
        characteristics: [
            { title: "艺术天赋", desc: "具有强烈的美感和创造力" },
            { title: "价值驱动", desc: "行为受个人价值观指导" },
            { title: "灵活适应", desc: "能够适应不同环境" },
            { title: "关怀他人", desc: "对他人需求敏感" }
        ]
    },
    "ESTP": {
        title: "企业家",
        subtitle: "聪明、精力充沛、善于感知的人，真正享受生活在边缘",
        description: "ESTP型人格被称为'企业家'，他们总是对周围环境产生影响。在聚会中你可以通过他们的笑声找到他们，他们放松和幽默的谈话吸引着每个人。",
        characteristics: [
            { title: "行动导向", desc: "喜欢立即行动而非长期规划" },
            { title: "社交活跃", desc: "在社交场合中表现活跃" },
            { title: "实用主义", desc: "关注当下的实际需求" },
            { title: "冒险精神", desc: "愿意承担风险和挑战" }
        ]
    },
    "ESFP": {
        title: "娱乐家",
        subtitle: "自发的、精力充沛、热情的人，生活对他们来说从不无聊",
        description: "ESFP型人格被称为'娱乐家'，他们是自发的、精力充沛和热情的人。没有其他人格类型比他们花更多时间与朋友出去玩，他们从与他人的社交和情感联系中获得能量。",
        characteristics: [
            { title: "热情开朗", desc: "天生乐观，感染他人" },
            { title: "社交天赋", desc: "善于与各种人建立联系" },
            { title: "灵活自发", desc: "喜欢自发的活动和体验" },
            { title: "实用导向", desc: "关注当下的具体需求" }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 MBTI测试页面加载完成');
    
    // 延迟初始化，确保所有脚本都已加载
    setTimeout(() => {
        // 初始化认证系统
        initializeAuthSystem();
        
        // 初始化页面功能
        initializeTest();
    }, 500);
});

// 初始化认证系统
function initializeAuthSystem() {
    try {
        console.log('🔧 开始初始化MBTI页面认证系统');
        
        // 检查是否为本地文件环境
        const isLocalFile = window.location.protocol === 'file:';
        if (isLocalFile) {
            console.log('⚠️ 检测到本地文件环境，使用简化认证模式');
            initializeLocalAuthSystem();
            return;
        }
        
        // 检查必要的全局对象是否存在
        if (typeof window.authManager === 'undefined') {
            console.error('❌ authManager 未找到');
            return;
        }
        
        if (typeof window.configManager === 'undefined') {
            console.error('❌ configManager 未找到');
            return;
        }
        
        // 等待配置管理器准备就绪（添加超时机制）
        let configWaitCount = 0;
        const maxConfigWait = 100; // 最多等待10秒
        
        const waitForConfig = () => {
            configWaitCount++;
            
            if (window.configManager && window.configManager.isReady()) {
                console.log('✅ 配置管理器已就绪，初始化认证系统');
                
                // 初始化认证管理器
                window.authManager.init();
                
                // 初始化其他管理器
                if (window.uiManager) {
                    window.uiManager.init();
                }
                
                if (window.formValidator) {
                    window.formValidator.init();
                }
                
                console.log('✅ MBTI页面认证系统初始化完成');
            } else if (configWaitCount >= maxConfigWait) {
                console.warn('⚠️ 配置管理器等待超时，切换到本地模式');
                initializeLocalAuthSystem();
            } else {
                console.log(`⏳ 等待配置管理器准备就绪... (${configWaitCount}/${maxConfigWait})`);
                setTimeout(waitForConfig, 100);
            }
        };
        
        waitForConfig();
        
    } catch (error) {
        console.error('❌ 认证系统初始化失败:', error);
        // 如果初始化失败，尝试本地模式
        initializeLocalAuthSystem();
    }
}

// 本地文件环境的简化认证系统
function initializeLocalAuthSystem() {
    console.log('🏠 初始化本地文件认证系统');
    
    // 设置基本的模态框事件监听器
    setupLocalModalEvents();
    
    // 显示本地环境提示
    setTimeout(() => {
        if (window.showWarning) {
            window.showWarning('当前为本地文件模式，认证功能受限');
        } else {
            showNotification('当前为本地文件模式，认证功能受限', 'warning');
        }
    }, 2000);
    
    console.log('✅ 本地认证系统初始化完成');
}

// 设置本地模态框事件
function setupLocalModalEvents() {
    // 登录模态框关闭事件
    const loginModal = document.getElementById('loginModal');
    const loginCloseBtn = loginModal?.querySelector('.close');
    
    if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            console.log('🔒 登录模态框已关闭');
        });
    }
    
    // 点击模态框外部关闭
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
                console.log('🔒 登录模态框已关闭（点击外部）');
            }
        });
    }
    
    // 注册模态框关闭事件
    const registerOverlay = document.getElementById('registerOverlay');
    const registerCloseBtn = document.getElementById('registerCloseBtn');
    
    if (registerCloseBtn) {
        registerCloseBtn.addEventListener('click', () => {
            registerOverlay.style.display = 'none';
            console.log('📝 注册模态框已关闭');
        });
    }
    
    // 登录表单提交事件（本地模式下显示提示）
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 使用全局通知系统
            if (window.showInfo) {
                window.showInfo('本地文件模式下无法进行真实登录，请部署到服务器环境');
            } else {
                showNotification('本地文件模式下无法进行真实登录，请部署到服务器环境', 'info');
            }
            console.log('ℹ️ 本地模式登录尝试');
        });
    }
    
    // 注册表单提交事件（本地模式下显示提示）
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // 使用全局通知系统
            if (window.showInfo) {
                window.showInfo('本地文件模式下无法进行真实注册，请部署到服务器环境');
            } else {
                showNotification('本地文件模式下无法进行真实注册，请部署到服务器环境', 'info');
            }
            console.log('ℹ️ 本地模式注册尝试');
        });
    }
    
    console.log('🎛️ 本地模态框事件监听器已设置');
}

// 初始化测试
function initializeTest() {
    const startTestBtn = document.getElementById('startTestBtn');
    const retakeTestBtn = document.getElementById('retakeTestBtn');
    const shareResultBtn = document.getElementById('shareResultBtn');
    const saveResultBtn = document.getElementById('saveResultBtn');
    
    // 开始测试按钮
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startTest);
    }
    
    // 重新测试按钮
    if (retakeTestBtn) {
        retakeTestBtn.addEventListener('click', resetTest);
    }
    
    // 分享结果按钮
    if (shareResultBtn) {
        shareResultBtn.addEventListener('click', shareResult);
    }
    
    // 保存结果按钮
    if (saveResultBtn) {
        saveResultBtn.addEventListener('click', saveResult);
    }
    
    // 初始化问题数据
    questions = [...mbtiQuestions];
    
    // 检查是否有保存的测试结果
    checkSavedResult();
}

// 开始测试
function startTest() {
    console.log('🚀 开始MBTI测试');
    
    // 重置测试数据
    currentQuestionIndex = 0;
    answers = [];
    testStartTime = new Date();
    
    // 隐藏介绍页面，显示测试页面
    document.getElementById('testIntro').style.display = 'none';
    document.getElementById('testQuestions').style.display = 'block';
    document.getElementById('testProgress').style.display = 'flex';
    
    // 显示第一题
    showQuestion();
    
    // 初始化导航按钮
    initializeNavigation();
    
    // 显示开始测试的通知
    if (window.showInfo) {
        window.showInfo('测试已开始，请根据您的真实想法作答');
    } else {
        showNotification('测试已开始，请根据您的真实想法作答', 'info');
    }
}

// 显示问题 - 现代化设计
function showQuestion() {
    const question = questions[currentQuestionIndex];
    const questionCard = document.getElementById('questionCard');
    
    // 添加淡出效果
    questionCard.classList.add('fade-out');
    
    setTimeout(() => {
        // 更新问题编号 - 使用更清晰的对比色
        document.getElementById('questionNumber').textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
        document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = questions.length;
        
        // 更新进度条和百分比
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressPercentage').textContent = `${Math.round(progress)}%`;
        
        // 确定问题类型和对应图标
        let questionType = "";
        let iconName = "psychology";
        
        if (question.options[0].type === "E" || question.options[0].type === "I") {
            questionType = "外向/内向";
            iconName = "groups";
        } else if (question.options[0].type === "S" || question.options[0].type === "N") {
            questionType = "感觉/直觉";
            iconName = "lightbulb";
        } else if (question.options[0].type === "T" || question.options[0].type === "F") {
            questionType = "思考/情感";
            iconName = "balance";
        } else if (question.options[0].type === "J" || question.options[0].type === "P") {
            questionType = "判断/感知";
            iconName = "calendar_today";
        }
        
        // 更新问题类别和图标
        document.getElementById('questionCategory').textContent = questionType;
        document.getElementById('questionIcon').textContent = iconName;
        
        // 更新问题内容
        document.getElementById('questionText').textContent = question.text;
        
        // 创建选项
        const optionsContainer = document.getElementById('questionOptions');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = option.text;
            optionBtn.dataset.type = option.type;
            optionBtn.dataset.index = index;
            
            // 如果已经有答案，显示选中状态
            if (answers[currentQuestionIndex] === index) {
                optionBtn.classList.add('selected');
            }
            
            optionBtn.addEventListener('click', function() {
                selectOption(this, index);
            });
            
            optionsContainer.appendChild(optionBtn);
        });
        
        // 更新导航按钮状态
        updateNavigationButtons();
        
        // 添加淡入效果
        questionCard.classList.remove('fade-out');
        questionCard.classList.add('fade-in');
        
        // 移除淡入类，以便下次使用
        setTimeout(() => {
            questionCard.classList.remove('fade-in');
        }, 500);
        
        // 平滑滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 300); // 短暂延迟以确保淡出效果可见
}

// 导航指示器功能已移除

// 选择选项 - 现代化交互与平滑过渡
function selectOption(button, optionIndex) {
    // 移除所有选中状态
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 添加选中状态和动画效果
    button.classList.add('selected');
    
    // 保存答案
    answers[currentQuestionIndex] = optionIndex;
    
    // 添加选择反馈动画
    const ripple = document.createElement('span');
    ripple.className = 'option-ripple';
    button.appendChild(ripple);
    
    // 找出已回答的最大题目索引
    let maxAnsweredIndex = -1;
    for (let i = 0; i < answers.length; i++) {
        if (answers[i] !== undefined) {
            maxAnsweredIndex = i;
        }
    }
    
    // 如果当前题目索引小于已回答的最大题目索引，则处于回退状态
    const isBacktracking = currentQuestionIndex < maxAnsweredIndex;
    
    // 标记是否将自动进入下一题
    const willAutoAdvance = currentQuestionIndex < questions.length - 1 && !isBacktracking && !window.justClickedPrev;
    
    // 如果不会自动进入下一题，才更新导航按钮状态
    if (!willAutoAdvance) {
        updateNavigationButtons();
    } else {
        // 如果会自动进入下一题，确保下一题按钮不显示
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.style.display = 'none';
    }
    
    // 动画结束后移除
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 700);
    
    // 只有在非回退状态下才自动进入下一题
    if (willAutoAdvance) {
        // 非回退状态，自动进入下一题
        setTimeout(() => {
            // 在开始切换动画时就更新当前题目索引
            currentQuestionIndex++;
            
            // 添加淡出效果
            const questionCard = document.getElementById('questionCard');
            questionCard.classList.add('fade-out');
            
            // 等待淡出效果完成后显示下一题
            setTimeout(() => {
                showQuestion();
            }, 300);
        }, 800); // 延迟800毫秒后开始淡出动画
    }
    // 如果是回退状态，不自动进入下一题，让用户手动点击下一题按钮
}

// 初始化导航
function initializeNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // 初始状态下隐藏所有导航按钮
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    
    // 初始化全局标记
    window.justClickedPrev = false;
    
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextQuestion);
}

// 上一题
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        
        // 添加一个全局标记，表示用户刚刚点击了上一题按钮
        window.justClickedPrev = true;
        
        showQuestion();
    }
}

// 下一题
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        // 清除回退状态标记
        window.justClickedPrev = false;
        showQuestion();
    } else {
        finishTest();
    }
}

// 更新导航按钮状态 - 使用圆形图标按钮
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // 找出已回答的最大题目索引
    let maxAnsweredIndex = -1;
    for (let i = 0; i < answers.length; i++) {
        if (answers[i] !== undefined) {
            maxAnsweredIndex = i;
        }
    }
    
    // 第一题时隐藏上一题按钮，第二题开始显示
    if (currentQuestionIndex === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        prevBtn.disabled = false; // 确保上一题按钮可用
    }
    
    // 下一题按钮
    const hasAnswer = answers[currentQuestionIndex] !== undefined;
    
    // 最后一题时显示提交结果按钮
    if (currentQuestionIndex === questions.length - 1) {
        // 最后一题只有在选择了答案后才显示提交按钮
        nextBtn.style.display = hasAnswer ? 'flex' : 'none';
        nextBtn.disabled = !hasAnswer;
        nextBtn.innerHTML = '<i class="material-icons">check_circle</i>';
        nextBtn.classList.toggle('submit-btn', true); // 添加提交按钮样式
        
        // 如果已选择答案，添加脉冲动画
        if (hasAnswer) {
            nextBtn.classList.add('pulse-animation');
        } else {
            nextBtn.classList.remove('pulse-animation');
        }
    } else {
        // 非最后一题，只要当前题目已选择答案就显示下一题按钮
        if (hasAnswer) {
            nextBtn.style.display = 'flex';
            nextBtn.disabled = false;
            nextBtn.innerHTML = '<i class="material-icons">arrow_forward</i>';
            nextBtn.classList.toggle('submit-btn', false); // 移除提交按钮样式
            nextBtn.classList.remove('pulse-animation');
        } else {
            nextBtn.style.display = 'none';
        }
    }
}

// 完成测试 - 现代化结果展示
function finishTest() {
    console.log('✅ 测试完成');
    
    // 计算结果
    const result = calculateResult();
    
    // 显示结果加载动画
    showResultLoading();
    
    // 延迟显示结果，增强用户体验
    setTimeout(() => {
        // 显示结果
        showResult(result);
        
        // 隐藏测试页面和进度条
        document.getElementById('testQuestions').style.display = 'none';
        document.getElementById('testProgress').style.display = 'none';
        
        // 显示结果页面
        document.getElementById('testResults').style.display = 'block';
        
        // 保存结果到本地存储
        saveResultToStorage(result);
        
        // 显示完成通知
        if (window.showSuccess) {
            window.showSuccess('测试完成！您的MBTI类型已分析出来');
        } else {
            showNotification('测试完成！您的MBTI类型已分析出来', 'success');
        }
        
        // 平滑滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 1500);
}

// 显示结果加载动画
function showResultLoading() {
    // 创建加载动画元素
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'result-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="result-loading-content">
            <div class="result-loading-spinner">
                <i class="material-icons rotating">psychology</i>
            </div>
            <h3>正在分析您的答案...</h3>
            <p>请稍候，我们正在计算您的MBTI人格类型</p>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(loadingOverlay);
    
    // 设置超时移除
    setTimeout(() => {
        if (loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
    }, 1500);
}

// 计算MBTI结果
function calculateResult() {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    
    // 统计各维度得分
    answers.forEach((answerIndex, questionIndex) => {
        const question = questions[questionIndex];
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
    const testDuration = testStartTime ? Math.round((new Date() - testStartTime) / 1000 / 60) : 0;
    
    return {
        type: type,
        scores: scores,
        typeInfo: mbtiTypes[type],
        testDate: new Date().toISOString(),
        testDuration: testDuration,
        totalQuestions: questions.length
    };
}

// 显示结果 - 现代化详细展示
function showResult(result) {
    const { type, scores, typeInfo, testDuration } = result;
    
    // 显示类型
    document.getElementById('resultType').textContent = type;
    document.getElementById('resultTitle').textContent = typeInfo.title;
    document.getElementById('resultSubtitle').textContent = typeInfo.subtitle;
    
    // 显示描述
    const descriptionContainer = document.getElementById('resultDescription');
    descriptionContainer.innerHTML = `
        <h3>性格描述</h3>
        <p>${typeInfo.description}</p>
        <div class="result-meta">
            <div class="result-meta-item">
                <i class="material-icons">schedule</i>
                <span>测试用时: ${testDuration} 分钟</span>
            </div>
            <div class="result-meta-item">
                <i class="material-icons">today</i>
                <span>测试日期: ${new Date().toLocaleDateString('zh-CN')}</span>
            </div>
        </div>
    `;
    
    // 显示维度分析
    const dimensionsContainer = document.getElementById('resultDimensions');
    dimensionsContainer.innerHTML = '<h3>维度分析</h3>';
    
    const dimensionsGrid = document.createElement('div');
    dimensionsGrid.className = 'dimensions-grid';
    
    const dimensions = [
        { name: '外向 vs 内向', e: 'E', i: 'I', eLabel: '外向', iLabel: '内向', eDesc: '从外部世界获取能量', iDesc: '从内心世界获取能量' },
        { name: '感觉 vs 直觉', e: 'S', i: 'N', eLabel: '感觉', iLabel: '直觉', eDesc: '关注具体事实和细节', iDesc: '关注概念和可能性' },
        { name: '思考 vs 情感', e: 'T', i: 'F', eLabel: '思考', iLabel: '情感', eDesc: '基于逻辑做决定', iDesc: '基于价值观和感受做决定' },
        { name: '判断 vs 知觉', e: 'J', i: 'P', eLabel: '判断', iLabel: '知觉', eDesc: '喜欢计划和确定性', iDesc: '喜欢灵活和自发性' }
    ];
    
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
    
    // 显示特征分析
    const characteristicsContainer = document.getElementById('resultCharacteristics');
    characteristicsContainer.innerHTML = `
        <h3>主要特征</h3>
        <div class="characteristics-grid">
            ${typeInfo.characteristics.map(char => `
                <div class="characteristic-item">
                    <h4>${char.title}</h4>
                    <p>${char.desc}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    // 添加职业建议部分
    const careerSuggestions = getCareerSuggestions(type);
    if (careerSuggestions && careerSuggestions.length > 0) {
        const careerSection = document.createElement('div');
        careerSection.className = 'result-careers';
        careerSection.innerHTML = `
            <h3>适合的职业方向</h3>
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
function getCareerSuggestions(type) {
    const careerMap = {
        'INTJ': ['战略规划师', '系统分析师', '软件架构师', '投资银行家', '科学研究员', '企业顾问'],
        'INTP': ['软件开发者', '数据科学家', '研究科学家', '系统设计师', '大学教授', '逻辑学家'],
        'ENTJ': ['企业高管', '管理顾问', '律师', '项目经理', '政治家', '企业家'],
        'ENTP': ['企业家', '营销策略师', '发明家', '创意总监', '风险投资家', '商业顾问'],
        'INFJ': ['心理咨询师', '作家', '人力资源专家', '社会工作者', '教师', '艺术治疗师'],
        'INFP': ['作家', '心理咨询师', '社会工作者', '艺术家', '设计师', '教师'],
        'ENFJ': ['教育工作者', '人力资源经理', '公关专家', '销售经理', '市场营销总监', '职业顾问'],
        'ENFP': ['创意总监', '记者', '演员', '市场营销专家', '活动策划师', '人力资源专员'],
        'ISTJ': ['财务分析师', '会计师', '项目经理', '军事人员', '法官', '审计师'],
        'ISFJ': ['护士', '小学教师', '行政助理', '社会工作者', '客户服务代表', '办公室经理'],
        'ESTJ': ['销售经理', '项目经理', '军事或警察领导', '金融经理', '行政主管', '法官'],
        'ESFJ': ['护士', '教师', '销售代表', '公关专员', '人力资源专员', '社区服务经理'],
        'ISTP': ['工程师', '技术专家', '飞行员', '法医专家', '机械师', '软件开发者'],
        'ISFP': ['艺术家', '设计师', '音乐家', '厨师', '兽医', '美容师'],
        'ESTP': ['企业家', '销售代表', '市场营销专员', '运动员', '警察或消防员', '项目协调员'],
        'ESFP': ['活动策划师', '销售代表', '旅游顾问', '演员', '教练', '儿童保育工作者']
    };
    
    return careerMap[type] || [];
}

// 重置测试
function resetTest() {
    console.log('🔄 重置测试');
    
    // 重置数据
    currentQuestionIndex = 0;
    answers = [];
    testStartTime = null;
    
    // 隐藏结果页面
    document.getElementById('testResults').style.display = 'none';
    
    // 显示介绍页面
    document.getElementById('testIntro').style.display = 'block';
    
    // 隐藏进度条
    document.getElementById('testProgress').style.display = 'none';
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 分享结果
function shareResult() {
    const resultType = document.getElementById('resultType').textContent;
    const resultTitle = document.getElementById('resultTitle').textContent;
    
    const shareText = `我的MBTI人格类型是 ${resultType} - ${resultTitle}！快来测试你的人格类型吧！`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'MBTI人格测试结果',
            text: shareText,
            url: shareUrl
        }).then(() => {
            showNotification('分享成功！', 'success');
        }).catch((error) => {
            console.log('分享失败:', error);
            copyToClipboard(`${shareText} ${shareUrl}`);
        });
    } else {
        copyToClipboard(`${shareText} ${shareUrl}`);
    }
}

// 保存结果
function saveResult() {
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
MBTI人格测试结果
================

测试类型: ${resultData.type}
人格类型: ${resultData.title}
测试时间: ${resultData.testDate}

${resultData.description}

测试链接: ${resultData.url}
    `.trim();
    
    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MBTI测试结果_${resultData.type}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('结果已保存到本地文件！', 'success');
}

// 保存结果到本地存储
function saveResultToStorage(result) {
    try {
        const savedResults = JSON.parse(localStorage.getItem('mbtiTestResults') || '[]');
        savedResults.push(result);
        
        // 只保留最近5次结果
        if (savedResults.length > 5) {
            savedResults.splice(0, savedResults.length - 5);
        }
        
        localStorage.setItem('mbtiTestResults', JSON.stringify(savedResults));
        console.log('✅ 结果已保存到本地存储');
    } catch (error) {
        console.error('❌ 保存结果失败:', error);
    }
}

// 检查保存的结果
function checkSavedResult() {
    try {
        const savedResults = JSON.parse(localStorage.getItem('mbtiTestResults') || '[]');
        if (savedResults.length > 0) {
            const latestResult = savedResults[savedResults.length - 1];
            const testDate = new Date(latestResult.testDate);
            const daysSinceTest = Math.floor((new Date() - testDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceTest < 30) {
                console.log(`📊 发现 ${daysSinceTest} 天前的测试结果: ${latestResult.type}`);
            }
        }
    } catch (error) {
        console.error('❌ 读取保存结果失败:', error);
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('已复制到剪贴板！', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// 备用复制方法
function fallbackCopyToClipboard(text) {
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
        showNotification('已复制到剪贴板！', 'success');
    } catch (err) {
        showNotification('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 显示通知（简化版，不依赖主站的通知系统）
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `simple-notification ${type}`;
    notification.textContent = message;
    
    // 添加样式
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
    
    // 根据类型设置背景色
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

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
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
            if (!prevBtn.disabled) {
                prevBtn.click();
            }
        }
        
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextBtn = document.getElementById('nextBtn');
            if (!nextBtn.disabled) {
                nextBtn.click();
            }
        }
    }
    
    // ESC键返回介绍页面
    if (e.key === 'Escape') {
        if (document.getElementById('testQuestions').style.display !== 'none') {
            if (confirm('确定要退出测试吗？当前进度将会丢失。')) {
                resetTest();
            }
        }
    }
});

// 页面滚动优化
let ticking = false;

function updateScrollEffects() {
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
}

window.addEventListener('scroll', function() {
    if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
    }
});

// 防止页面刷新时丢失测试进度
window.addEventListener('beforeunload', function(e) {
    if (document.getElementById('testQuestions').style.display !== 'none' && answers.length > 0) {
        e.preventDefault();
        e.returnValue = '测试进行中，确定要离开吗？当前进度将会丢失。';
        return e.returnValue;
    }
});

console.log('🧠 MBTI测试脚本初始化完成');
