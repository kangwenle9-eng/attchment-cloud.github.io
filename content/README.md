# Codex 与 Agent 30 天学习实验室

这是当前目录的学习入口。课程面向编程基础较少的学习者，以 Codex 桌面版为主、PowerShell 与 Codex CLI 为辅，每天约 45-60 分钟。

## 从这里开始

1. 打开 [30 天课程](30-day-course.md)，从第 1 天开始。
2. 复制当天的“开课提示词”发给 Codex。
3. 先自己完成练习，再让 Codex 按验收标准评分。
4. 把当天记录复制到 `records/day-XX.md`，模板见 [每日记录](templates/daily-record.md)。
5. 通过后再勾选 [学习进度](progress.md)。

建议第一句话：

```text
开始 Codex 实验室第 1 天。先检查 AGENTS.md 和 codex-lab/30-day-course.md 中第 1 天的要求。按“概念、示范、练习、验收”带我学习；在我提交练习前不要直接给出完整答案。
```

## 目录说明

- `30-day-course.md`：30 天逐日课程、提示词和验收标准。
- `progress.md`：课程进度与周复盘；只记录真实完成情况。
- `templates/`：任务书、每日记录、证据台账、错误日志和评分表。
- `reference/`：现有 PDF 内容地图、Codex/Agent 能力地图和源文件清单。
- `reference/bilibili-learning-guide.md`：按课程天数整理的 B 站 UP 主与视频导航。
- `examples/`：不会自动生效的配置、Hook、自动化、子智能体和 worktree 示例。
- `capstone/`：第 28-30 天综合项目说明。
- `scripts/`：实验室完整性检查脚本。
- `.agents/skills/learning-material-analyzer/`：项目级“学习资料分析”Skill。

## 每日固定节奏

- 10 分钟：概念。要求用生活类比、一个正例和一个反例解释。
- 10 分钟：示范。观察 Codex 如何先检查、再计划、再验证。
- 25-30 分钟：亲手实践。学习者负责作出关键判断。
- 5-10 分钟：验收复盘。评分、订正并记录下一次改进。

## 通过规则

- 每日总分 70 分及以上才算通过。
- “安全与权限”出现严重错误时，即使总分超过 70 也要订正。
- 没有可复查证据的“已完成”不计为完成。
- 不理解时允许请求一级提示、二级提示；三级提示会展示完整步骤，应在记录中注明。

## 快速检查

在 PowerShell 中进入本目录后运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\codex-lab\scripts\Test-Lab.ps1
```

该命令只检查课程结构、Skill 入口和 8 份原始 PDF 是否保持基线，不会修改资料。

## 视频辅助学习

如果更习惯先看视频，请打开 [B 站学习导航](reference/bilibili-learning-guide.md)。视频用于建立直觉，涉及 Codex 当前设置、权限和功能时仍以 OpenAI 官方文档及当前应用实际界面为准。
