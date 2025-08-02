# 🌟 OmvianHub - 多功能主站

> 一个现代化的多功能主站，集成影视、音乐、科技、生活等多个领域的内容管理系统。

## 📁 项目结构

```
OmvianHub/
├── src/                          # 源代码目录
│   ├── js/                       # JavaScript模块
│   │   ├── core/                 # 核心模块
│   │   │   ├── config-manager.js # 配置管理
│   │   │   └── app-initializer.js # 应用初始化
│   │   ├── auth/                 # 认证模块
│   │   │   ├── auth-manager.js   # 认证管理
│   │   │   └── form-validator.js # 表单验证
│   │   ├── ui/                   # UI模块
│   │   │   ├── ui-manager.js     # UI交互管理
│   │   │   ├── button-manager.js # 按钮状态管理
│   │   │   └── notification-manager.js # 通知管理
│   │   └── utils/                # 工具模块
│   │       ├── constants.js      # 常量定义
│   │       └── helpers.js        # 辅助函数
│   └── css/                      # 样式文件
│       └── main.css              # 主样式文件
├── index.html                    # 主页面
├── script.js                     # 主脚本（向后兼容）
├── .gitignore                   # Git忽略文件
└── README.md                    # 项目说明
```
## 版本信息

📝 [查看更新日志](./CHANGELOG.md)

> 💡 想了解项目的最新变化和功能更新？点击上方链接查看详细的版本更新记录！

## 访问

[在线访问](https://github.com/Omvian/Hub)


## 🔧 技术架构

### 模块化设计
- **核心模块**: 配置管理、应用初始化
- **认证模块**: 用户认证、表单验证  
- **UI模块**: 界面交互、按钮管理、通知系统
- **工具模块**: 常量定义、辅助函数


### 脚本加载顺序
1. Supabase SDK
2. 本地配置文件
3. 工具模块 (constants, helpers)
4. 核心模块 (config-manager, app-initializer)
5. UI模块 (button-manager, notification-manager, ui-manager)
6. 认证模块 (form-validator, auth-manager)
7. 主脚本 (script.js)

## 📊 部署信息

- **平台**: GitHub Pages
- **域名**: 自定义域名或 username.github.io
- **HTTPS**: 自动启用
- **CDN**: GitHub全球CDN加速