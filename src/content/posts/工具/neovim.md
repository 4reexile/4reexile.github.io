---
title: neovim
author: Creexile
date: 2024-11-13
lastMod: 2025-10-09
summary: ''
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: []
---

在windows装了个neovim, 快捷键和一些插件就放在这里了, 不提供安装方式和详细配置

# 原生的

## 查看插件和配置文件路径:

如果用的vimscript

```
:version
# 高版本换了
:verbose version
# 如果存在就使用 $VIM/sysinit.vim
# 找不到就 C:/Program Files(x86)/nvim/share/nvim
# $VIM可以在vim利用以下命令输出
:echo $VIM
```

如果用的Lua, 进入到nvim下输入下面的命令查询配置文件路径

```
:help init.lua
# Unix: ~/.config/nvim/init.vim	or lua
# Windows: ~/AppData/Local/nvim/init.vim or lua
```

## 自检查系统配置

一般用来看什么地方引起的报错

```
:checkhealth
```

## 可能需要的字体:

windows安装完字体在终端中右键设置, 修改默认值

如果想要nvim显示更多符号, 必须使用github项目[Nerd Fonts](https://github.com/ryanoasis/nerd-fonts)字体

我使用了[Hack Nerd Font](https://github.com/ryanoasis/nerd-fonts/blob/master/patched-fonts/Hack)和[JetBrainsMono Nerd Font](https://github.com/ryanoasis/nerd-fonts/blob/master/patched-fonts/JetBrainsMono)

## 设置的键位

自带的键位

```
Normal 模式下按下 i 进入 Insert 模式
Insert/Visual 模式下按下 Esc 进入 Normal 模式
Normal 模式下按下 v 进入 Visual 模式
Visual 模式下 y 复制，x 或者 c 剪贴，p 粘贴
Normal 模式下 u 撤销（相当于 ctrl z）
Normal 模式下输入 / 进入搜索模式，/hello+回车就是查找所有包含 hello 的字符串
Normal 模式下 Ctrl + F 翻页，0 到行首，$到行尾
Ctrl +/- 可以调整字体大小

home/0 行首
end 行尾
```

键位是可以更改的, 我更改的键位

```
查看警告/错误: 空格+e
取消高亮: 空格+nh
```

# 插件

> 如果不想从零开始, 不如直接用[lazyvim](https://github.com/zhangshengasdf/lazyvim)

按键可以自己配置

左右上下切换窗口(比如从文件树切换回编辑窗口)

```
Ctrl+h,j,k,l
```

快速多行注释和单行注释

```
gcc  单行
gc  多行
```

## nvim-tree 文件树

https://github.com/nvim-tree/nvim-tree.lua

像vscode那样的侧边栏位

```bash
# 打开文件树
space + t

# 展开文件路径
Tab

# 文件操作
a    # 新建文件
e    # 重命名
o    # 打开文件
```

## 自动补全

[腾讯云-从零开始配置vim(24)——自动补全](https://cloud.tencent.com/developer/article/2130578)

又叫作`hrsh7th/nvim-cmp`及其附属

```
tab 补全, 切换输入位置
shift+tab 返回上一个输入位置
空格+e 查看错误/警告信息
空格+q 查看所有错误/警告信息
[d 查看上一个错误
]d 查看下一个错误

gD 跳转到类型定义
gd 跳转到定义
K 显示悬停信息
空格+D 跳转到类型定义
空格+rn 重命名符号
gr 查看引用
```

## Mason 外部工具包管理器‌

```bash
# 呼出菜单
:Mason

# 搜索语言html
/html

# 安装
i
```

## bufferline 多标签

https://github.com/akinsho/bufferline.nvim

可以像浏览器一样切换标签

```bash
shift+h/l
```
