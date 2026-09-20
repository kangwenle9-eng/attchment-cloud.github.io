# Git 与 Worktree 隔离练习

当前项目根目录不是 Git 仓库。第 19 天只在 `tmp/worktree-lab` 下创建一次性练习仓库，避免影响 8 份 PDF。

## 建议步骤

每条命令执行前，让 Codex 解释结果。以下命令在项目根目录的 PowerShell 中运行：

```powershell
$labRoot = (Resolve-Path '.\tmp').Path + '\worktree-lab'
New-Item -ItemType Directory -Force -Path $labRoot | Out-Null
Set-Location -LiteralPath $labRoot
git init
```

随后使用编辑工具创建一个 `README.md`，再执行：

```powershell
git add README.md
git commit -m "chore: initialize worktree lab"
git branch lesson-a
git worktree add ..\worktree-lab-a lesson-a
git worktree list
```

在主目录和 `worktree-lab-a` 中分别创建不同文件，比较 `git status`，观察两个工作目录如何共享仓库但拥有不同分支状态。

## 清理规则

不要复制粘贴未经检查的递归删除命令。先运行：

```powershell
Resolve-Path -LiteralPath '.\tmp\worktree-lab'
Resolve-Path -LiteralPath '.\tmp\worktree-lab-a'
```

只有两个绝对路径都明确位于当前项目的 `tmp` 目录内时，才让 Codex 提出精确清理步骤，并在执行前再次确认。

