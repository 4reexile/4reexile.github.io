---
title: Yazi
author: Creexile
date: 2025-01-26
lastMod: 2025-01-26
summary: '一个命令行文件管理器'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: []
---

# Yazi

- [Yazi - Blazing Fast Terminal File Manager](https://github.com/sxyazi/yazi)
- [配置文档](https://yazi-rs.github.io/docs/quick-start/)

一个命令行文件管理器, 利用rust编写; 不是很想用nvim的那个tree了, 找个新的玩玩

> 作者在windows部署, linux的有视频做讲解, 我就不管了

# git和yazi安装

首先结合配置文档安装git for windows, 找到git中的file.exe( 文档中有详细描述 ), 记录地址`C:\Program Files\Git\usr\bin\file.exe`

> 不知道可以执行`git --exec-path`

下载yazi下来后解压即可, 然后配置环境变量, 修改Path:

```powershell
# Git一般自己安装就会配置好, 不用管
C:\Program Files\Git
# 然后是yazi放在哪里也加进去
D:\tool\yazi
```

然后根据文档新增系统变量:

```
变量名:
YAZI_FILE_ONE
变量值:
C:\Program Files\Git\usr\bin\file.exe
```

# 退出时更改当前工作目录

文档中的`Quick Start`部分有点过于省略了

我是`powershell 7.x`版本, 如果你发现后面的步骤不可行, 请你自己升级powershell版本: [Installing PowerShell on Windows](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.5)

先执行一下下面的指令, 如果输出不同, 你再新建文件

```powershell
$PROFILE
# 看看输出有没有Microsoft.PowerShell_profile.ps1这个文件就行
```

我没有覆盖之前的版本, 但是大差不差; 如果没有这个文件, 直接在powershell那个可执行的文件目录下塞进去一个`Microsoft.PowerShell_profile.ps1`, 然后把下面这个直接写进去, 保存并退出即可

```powershell
function y {
    $tmp = [System.IO.Path]::GetTempFileName()
    yazi $args --cwd-file="$tmp"
    $cwd = Get-Content -Path $tmp -Encoding UTF8
    if (-not [String]::IsNullOrEmpty($cwd) -and $cwd -ne $PWD.Path) {
        Set-Location -LiteralPath ([System.IO.Path]::GetFullPath($cwd))
    }
    Remove-Item -Path $tmp
}
```

现在你可以用y来启动yazi且会自动切换为退出的目录; 你也可以自己修改那个函数名, 我修改为yz

按`q`退出的时候, 你会看到路径发生了变化; 当不想更改路径的时候, 按`shift+q`退出

# keymap

这个实在是有点多了, 参阅[默认的keymap.toml文件](https://github.com/sxyazi/yazi/blob/shipped/yazi-config/preset/keymap-default.toml), 或者还是看文档吧

# theme

选择你的主题[Flavors](https://github.com/yazi-rs/flavors), 以[Ayu Dark](https://github.com/kmlupreti/ayu-dark.yazi)为例

你先别急, 先来新建一些文件, 没有就新建:

路径: `C:\Users\USERNAME\AppData\Roaming\yazi\config\`

- [`yazi.toml`](https://yazi-rs.github.io/docs/configuration/yazi) - General configuration.
- [`keymap.toml`](https://yazi-rs.github.io/docs/configuration/keymap) - Keybindings configuration.
- [`theme.toml`](https://yazi-rs.github.io/docs/configuration/theme) - Color scheme configuration.

安装主题

```powershell
ya pack -a kmlupreti/ayu-dark
```

配置刚才新建的`theme.toml`

```toml
[flavor]
dark = "ayu-dark"
```

> 官方给的用不了, 怪了

# 插件

由于之前配置过neovim, 我肯定是有nerd-fonts字体的, 如果你的主题发现有一些地方和效果图不一样, 大概率是因为你没有nerd-fonts字体; [nerd-fonts字体下载](https://www.nerdfonts.com/)
