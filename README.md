# 艾尔登法环·褪色者探索罗盘 (Elden Compass)

<p align="center">
  <img src="app.ico" alt="Elden Compass Logo" width="80" height="80">
</p>

<p align="center">
  <strong>专为 PC 端《艾尔登法环》打造的沉浸式游戏内置顶悬浮攻略 & 全收集防断罗盘</strong>
</p>

<p align="center">
  <a href="https://github.com/kengkong0/elden-compass/releases/latest"><img src="https://img.shields.io/github/v/release/kengkong0/elden-compass?color=d4af37&label=%E6%9C%80%E6%96%B0%E7%89%88%E6%9C%AC" alt="Release"></a>
  <a href="#"><img src="https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-Windows%2010%2F11-blue?logo=windows" alt="Platform"></a>
  <a href="#"><img src="https://img.shields.io/badge/%E8%BF%90%E8%A1%8C%E6%96%B9%E5%BC%8F-%E5%8D%95%E6%96%87%E4%BB%B6%E5%85%8D%E5%AE%89%E8%A3%85-green" alt="Standalone"></a>
  <a href="#"><img src="https://img.shields.io/badge/Python-3.10%2B-brightgreen?logo=python" alt="Python"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/%E5%BC%80%E6%BA%90%E8%AE%B8%E5%8F%AF-MIT-yellow" alt="License"></a>
</p>

---

## 📖 痛点与初衷

在交界地探索时，你是否也经常遇到这些困扰？
* **频频切屏**：每走两步就得 `Alt + Tab` 切到网页看攻略，游戏节奏全被打乱，稍不留神甚至直接猝死在 Boss 刀下；
* **低头看手机**：一手拿手柄一手刷手机，屏幕小、图片看不清、手忙脚乱；
* **关键支线断档**：烧树或打了特定 Boss 后才发现，菈妮、菲雅或米莉森的精彩支线早已永久关闭，只能遗憾等二周目；
* **跑图遗漏核心质变道具**：通关了圣杯瓶还没强化满，护符皮袋漏拿导致少带一个护符，严重降低游戏体验。

**「法环探索罗盘」** 是一款基于 Windows 原生分层置顶悬浮技术的游戏辅助罗盘，无需双显示器，在游戏画面上以轻量优雅的黑金悬浮窗随开随用，助你丝滑畅游交界地！

---

## ✨ 核心特性

### 🎮 游戏内沉浸式置顶悬浮
* **暗金律法美学**：采用契合游戏基调的黑金 UI 设计，无系统边框，视野宽敞纯粹。
* **GPU 硬件级平滑透明度**：支持 20% ~ 100% 动态半透明调节，看攻略时兼顾游戏内角色与周边敌情。
* **鼠标穿透模式 (Click-Through)**：一键开启穿透，罗盘可见但鼠标点击直接穿透作用于游戏视角和战斗操作，激战中彻底防误触。

### ⚡ 全局热键随心掌控（无需切出游戏）
无论当前焦点在游戏内还是其他窗口，随时通过系统级热键瞬发响应：

| 热键快捷键 | 功能说明 | 适用场景 |
| :--- | :--- | :--- |
| **`Alt + M`** 或 **`F8`** | **一键显示 / 隐藏罗盘** | 进入 Boss 房一键清屏隐匿，打完一键呼出查路线 |
| **`Alt + Q`** | **切换鼠标穿透模式** | 开启后点击直接操作游戏，解除后恢复点击罗盘 |
| **`Alt + ←`** | **切换至上一节攻略** | 游戏激战或跑图中快速回顾上一步点位 |
| **`Alt + →`** | **切换至下一节攻略** | 到达当前节点后瞬发加载下一站攻略 |

### 📜 199 篇全探索指引 & 高清灯箱
* **游民星空全流程档案深度清洗**：内置 199 章节完整全流程地毯式路线，剔除广告与冗余标签，正文宽屏舒适。
* **重点道具胶囊速览**：每章自动提取核心道具（黄金种子、圣杯露滴、关键护符、武器、骨灰）并置顶展示，重点一目了然。
* **无损大图灯箱预览**：攻略中的路线截图点击即可全屏放大查看，路线与隐藏洞窟细节分毫毕现。
* **智能后台预加载**：当前阅读第 $N$ 节时，后台静默拉取相邻章节，翻页 **0 毫秒秒开**。
* **抽屉式秒级检索**：输入区域名、地名、或直接输入 `p21`、`21`，毫秒级筛选定位目标章节。

### 🍷 全收集进度看板 (Checklist)
* 🍷 **圣杯露滴**：全 12 处教堂位点清单与地图方位，拿满强化圣杯瓶恢复量；
* 🌰 **黄金种子**：40+ 关键黄金树幼苗位点打勾追踪，轻松升满 14 瓶上限；
* 🎒 **护符皮袋**：3 处扩容节点明确指引，早早拉满 4 槽强力护符；
* 🔮 **记忆石**：全法师塔解谜与点位汇总，扩充法术装备格；
* 💾 **本地持久化**：打勾状态自动实时保存，换章节或重启罗盘进度绝不丢失。

### 👑 不可逆核心支线防断追踪器
涵盖最容易因主线推过头而断掉的四大重要剧情支线：
* 🌕 **魔女菈妮支线**（暗月大剑、群星结局）
* 🪦 **死眠菲雅支线**（死王子结局、死龙弗尔桑克斯）
* 🏺 **战士壶亚历山大支线**（全游戏最强战技增伤护符「亚历山大的碎片」）
* 🪡 **米莉森支线**（纯净金针、腐败翼剑徽章/米莉森的义手）

每个任务节点附带防断警告与前置触发条件，保姆级提示何时该停下主线推进支线。

### 📊 开荒避坑指南 & 互动地图
* **区域推荐等级 & 武器强化对照表**：新手明确知道各区域怪物的适正等级，防止误入高危区域受挫；
* **逃课神器速拿指引**：猎犬长牙、陨石杖+岩石球、名刀月隐等神器前期无痛速拿路线；
* **一键集成互动地图**：内置全功能交界地互动大地图，查点位更直观。

---

## 🚀 快速上手

### 方式 1：下载独立版（推荐，小白首选）
无需安装任何 Python 运行环境或第三方依赖，开箱即用：
1. 前往 👉 [**Releases 发布页面**](https://github.com/kengkong0/elden-compass/releases/latest)；
2. 下载 **`法环探索罗盘.exe`**；
3. 双击即可秒开运行！

### 方式 2：Python 源码运行（适合开发者二次定制）
如果你熟悉 Python，可以直接从源码启动：

```bash
# 1. 克隆代码仓库
git clone https://github.com/kengkong0/elden-compass.git
cd elden-compass

# 2. 安装必要依赖
pip install -r requirements.txt

# 3. 运行方式（二选一）：
# 选项 A：使用 pythonw 无黑框静默启动（推荐）
pythonw main.py

# 选项 B：普通调试启动（带控制台日志）
python main.py
```

### 🛠️ 自行打包 EXE
```bash
# 执行根目录下的打包脚本即可生成单文件 EXE
build_exe.bat
```

---

## 🏗️ 技术架构

* **UI 宿主引擎**：[Pywebview](https://pywebview.flowrl.com/) + Microsoft Edge WebView2（轻量低内存占用，GPU 硬件加速渲染）
* **后端本地微服务**：Waitress WSGI 高并发多线程服务器 + Bottle 极简路由引擎
* **数据清洗引擎**：BeautifulSoup4 DOM 解析清洗 + Regex 安全属性过滤
* **系统原生集成**：
  * Win32 API 原生消息拦截（`WS_EX_LAYERED`、`WS_EX_TRANSPARENT`、`WM_NCLBUTTONDOWN` 原生平滑拖拽与穿透）
  * `pystray` Windows 系统托盘守护
  * `keyboard` 全局低级键盘钩子

---

## ⚠️ 免责声明与致谢

1. 本软件为开源交流作品，仅通过公开 HTTP 接口读取攻略图文内容，所载图文攻略著作权归原作者及 [游民星空 (Gamersky)](https://www.gamersky.com/) 所有。
2. 《艾尔登法环》（ELDEN RING™）是 FromSoftware Inc. 及 Bandai Namco Entertainment Inc. 的注册商标，本项目与上述公司无任何官方关联。
3. 本罗盘仅为纯外部桌面悬浮工具，**绝对不读写游戏内存、不注入游戏进程**，完全遵守相关反作弊协议，安全无封号风险。

---

## 📄 开源许可证

本项目基于 [MIT 许可证](LICENSE) 开源发布。
欢迎提交 Issue 和 Pull Request，共同完善褪色者的交界地罗盘！
