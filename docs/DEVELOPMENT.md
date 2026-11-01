# 开发与验证

[返回首页](../README.md) · [常见问题](FAQ.md)

## 运行

本项目主要源码直接位于 `dist/`，不是缺少 src 或 npm 构建脚本。克隆后通过 Python 3 的本地服务访问：

```powershell
py -m http.server 4173 --bind 127.0.0.1 -d dist
```

浏览器打开 `http://127.0.0.1:4173/`，按 Ctrl + C 停止服务。无 Python 时可尝试直接打开页面，但浏览器限制可能不同，不以 file:// 作为唯一验证方式。

## 模块

| 文件 | 职责 |
| --- | --- |
| `dist/index.html` / `styles.css` | 页面、设置和响应式布局 |
| `dist/app.js` | 训练流程、记录与界面组织 |
| `dist/chord-style-packs.js` | 流行、爵士、古典语汇包 |
| `dist/jazz.js` / `jazz-notation.js` | 传统爵士生成、配位和记谱 |
| `dist/melody.js` | 等时值音高听写模型 |
| `dist/review.js` | 答后复盘协作 |
| `dist/piano-sampler.js` | 钢琴采样加载与播放 |
| `tests/` | Node 内置逻辑测试 |

设计文档保留在本目录，根 AGENTS.md 规定修改相关交互或数据格式时同步更新设计和验收说明。

## 验证

```powershell
node --test tests/*.test.cjs
```

本次 Node `24.19.0` 下 29 项通过。逻辑测试不覆盖所有浏览器音频设备、真实试听、移动端布局或线上部署，本轮未重新操作训练页面。

修改页面或音频后，打开本地服务，分别验证出题、作答、谱面、正确/错误答案试听、进入下一题及记录保存。修改和声规则还应检查调性、题目长度、语汇包、干扰项及声部连接，不能只凭随机题目看起来合理。

## 数据与资源

记录在当前浏览器的 Local Storage，浏览器与源地址不同可能对应不同记录。换设备或清理前从历史页面导出 JSON，恢复后核对记录。采样与播放器按 `THIRD_PARTY_NOTICES.md` 及随目录许可管理，开发和安装过程不要提交个人导出档案。

## 发布

现有 `.github/workflows/deploy-pages.yml` 在 main 推送后运行逻辑测试，再发布 dist 到 Pages。文档更新也会触发现有流程；部署完成与浏览器实际使用是不同验证阶段。无需新增构建框架或在线音色服务。
