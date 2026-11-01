# 声阶 · Ear Training

一个完全在浏览器本地运行、可深度配置的练耳训练应用。音程辨认、和弦进行与旋律听写使用各自的配置和出题模型。

## 快速开始

推荐通过本地 HTTP 服务运行。在仓库根目录执行：

```powershell
py -m http.server 4173 --bind 127.0.0.1 -d dist
```

访问 `http://127.0.0.1:4173/`，也可运行 `start.bat`。Windows 未安装 Python 时，该启动脚本会回退到直接打开 `dist/index.html`；浏览器可能限制本地文件的音频或存储功能，因此 `file://` 不作为唯一验证方式。

首次播放需点击页面中的训练或试听按钮，允许浏览器启动音频。项目无需 npm 安装或构建即可使用。

## 在线访问与发布

项目通过 GitHub Pages 发布 `dist/`，访问地址：

https://nonoking123456.github.io/shengjie-ear-training/

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会先运行测试，再自动发布网站。首次发布需在仓库的 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**。

## 当前功能

- 音程辨认：固定或随机起始音，可选上行、下行或随机交替；依次或同时发声，并提供五度内、八度内与双八度快捷范围
- 音程答题后在同一音频 Panel 查看真实五线谱；答错时上下对照正确答案与所选音程，支持单音、整组、原题及 AB 试听，手动进入下一题
- 和弦进行：每轮选择大调或小调及调性中心，由系统逐个和弦生成完整题目
- 常见进行热身：直接轮换高频大调/小调进行，不混入随机和声

- 传统爵士：独立选择大调/小调、基础/进阶/高级语汇包、调性中心与 Shell/训练型/Rootless 配位；基于功能连接生成 3–4 和弦题目和相近选项

- 爵士进行按整段优化声部连接，答后在同一 Panel 比较正确与所选进行的实际五线谱配位，支持单个和弦、整段与 AB 试听；学习档案分别统计大调、小调、语汇包和常见混淆
- 可手动加入三级属、重属、降二级属、那不勒斯六和弦、德国增六和弦等调外和声
- 三档难度与 10/15/20 题配置；难度会调整音程预设与答案干扰项数量
- 钢琴采用 Salamander Grand Piano 的 Yamaha C5 实录采样；吉他、萨克斯和小提琴使用 FluidR3 采样
- Web Audio 精确调度本地采样，不依赖网络或外部音频服务
- 每轮实时记录准确率、连续答对、用时与反应速度
- 合并式学习档案：历史记录、筛选、趋势图、综合评分与训练建议
- 能力报告打印或保存为 PDF
- 响应式界面与数字键、空格键快捷操作

## 旋律与和声训练补充

- 旋律听写：选择调性环境、长度和音域，首音已给出，按等时值四分音符输入音高；不将它描述为任意节奏听写。
- 和弦进行还包含流行、爵士、古典风格语汇包；与独立的传统爵士入口和旧版综合记录区分。
- 训练逻辑分别位于 `melody.js`、`chord-style-packs.js` 和 `jazz.js`，答后复盘在 `review.js` 等模块协作完成。

## 数据说明

训练历史保存在当前浏览器的本地存储中，不会上传到服务器。换电脑或清除浏览器数据前，可在“历史”页面导出 JSON 备份。

## 项目结构

```text
dist/
  index.html   页面结构
  styles.css  视觉样式与响应式布局
  app.js      训练逻辑、音频、记录与报告
  jazz.js     传统爵士和声语法、题目与配位生成
  jazz-notation.js  爵士配位五线谱渲染
  piano-sampler.js  钢琴采样按需解码与播放
  assets/soundfonts/  Salamander 钢琴与三种 FluidR3 乐器采样
  vendor/webaudiofont/  SoundFont 浏览器播放器
```

第三方播放器与采样许可见 `THIRD_PARTY_NOTICES.md`。


## 开发验证

安装 Node.js 后，在仓库根目录运行，无需第三方测试框架：

```powershell
node --test tests/*.test.cjs
```

本次运行 29 项通过；页面、音频设备、移动端及线上部署不由逻辑测试结果代替。开发约定与更多步骤见 [开发文档](docs/DEVELOPMENT.md)。


## 项目维护与支持

[开发与验证](docs/DEVELOPMENT.md) · [常见问题](docs/FAQ.md) · [贡献说明](CONTRIBUTING.md) · [安全报告](SECURITY.md)

问题和功能建议请使用 [Issues](https://github.com/NonoKing123456/shengjie-ear-training/issues) 中的模板，注明版本、系统和复现步骤。不要用本机个人数据作为公开复现附件。

项目源码目前未单独声明开源许可证；已有第三方资源继续按其各自许可使用。
