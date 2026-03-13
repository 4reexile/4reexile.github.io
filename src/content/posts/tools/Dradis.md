---
title: Dradis
author: Creexile
date: 2024-09-20
lastMod: 2024-11-24
summary: '协作报告生成'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: []
---

# Dradis

> 记得注意Dradis需要的ruby版本和Bundler版本, 别装错了又重装, 笔者安装时间为2024/9/20
>
> 你可以先git下来, 然后装好ruby后尝试安装, 它会告诉你缺了什么; [官方教程](https://dradis.com/ce/documentation/install_git.html)

## 安装环境

```bash
sudo apt-get install libpq-dev libsqlite3-dev
```

## 下载源文件

```bash
git clone https://github.com/dradis/dradis-ce.git
cd dradis-ce/
```

## 安装 rvm

```bash
curl -L https://get.rvm.io | bash -s stable
# 检查 rvm -v
```

基本都会出错, 复制那个`gpg --keyserver`开头的执行一遍, 再执行一边就行了(其实就是导入公钥)

> To start using RVM you need to run `source /home/ghost/.rvm/scripts/rvm`
>
> 看到这一行了? 每次想要运行rvm就要用这个命令, 不认运行不了rvm -v

## 安装 ruby

```bash
rvm install 3.1.2
#或者	rvm install "ruby-3.1.2"
rvm 3.1.2 --default
# 默认使用这个版本
# 检查 ruby -v
# gem -v
```

## 安装, 配置Bundler

如果你此时运行过, 他至少会出现以下报错(如果没有就下一步)

```
Install missing gems with `bundle install`
Bundler 2.3.7 is running, but your lockfile was generated with 2.3.16. Installing Bundler 2.3.16 and restarting using that version.
```

安装对应版本

```bash
gem install bundler -v 2.3.16
bundle install --verbose
# 安装软件所需所有依赖
```

用`bundle install --verbose`查看哪里有问题, `bundle install`不输出东西我不爽

如果一直卡在HTTP, 就是要换源了, 换源后重新执行即可

```bash
gem sources -l
# 查看源和验证源
gem sources --add https://mirrors.tuna.tsinghua.edu.cn/rubygems/
# 添加源
bundle config mirror.https://rubygems.org https://mirrors.tuna.tsinghua.edu.cn/rubygems
# 为 Bundler 设置镜像源
```

## 安装Dradis

```bash
cd dradis-ce/
# 反正在那个文件夹就行
./bin/setup
```

然后访问http://127.0.0.1:8080进行配置

剩下的官方教程解决
