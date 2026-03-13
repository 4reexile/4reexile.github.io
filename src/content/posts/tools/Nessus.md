---
title: Nessus
author: Creexile
date: 2025-09-23
lastMod: 2025-09-23
summary: '一款漏扫工具'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: [渗透]
---

参考文章

1. [知乎-漏扫神器：Nessus 安装、使用及插件升级（附破解步骤）](https://zhuanlan.zhihu.com/p/708965325)
2. [csdn-手把手教学Windows系统安装破解Nessus版](https://blog.csdn.net/edsion4/article/details/138632194)
3. [博客园-Windows下安装Nessus 10.8.3安装破解教程](https://www.cnblogs.com/CVE-2003/p/18442392)
4. [知乎-Nessus漏洞扫描使用教程](https://zhuanlan.zhihu.com/p/625304158)

我翻了好多发现安装最后卡住/无法使用的情况, 然后发现没法用其实是因为要等加载, 没绷住

# 使用

## 启动

启动/关闭服务

```bash
net start "Tenable Nessus"
net stop "Tenable Nessus"
```

访问 https://localhost:8834 https://127.0.0.1:8834/

账密: Admin/Admin123

## 扫描

测试连通性, 直接ping即可

如果我们扫描的是对象是一个主机部署的系统，主要是Windows、linux等通用操作系统，这样的目标就选主机扫描，可以选择中间的高级扫描模式

如果扫描的对象是web服务，比如云服务这种，就选择web应用扫描，  
如果是移动应用那么就选择移动应用扫描

## 报告

扫描的右上角点击report即可导出扫描的报告

[报告处理工具-Nessus_modify](https://github.com/chuxuan909/Nessus_Modify)

# 安装

[Nessus下载地址](https://www.tenable.com/downloads/nessus?loginAttempted=true), 下载后安装

安装完成后访问 https://localhost:8834

- 勾选`Register Offline`后点击`Continue`
- 选择`Managed Scanner`后点击`Continue`
- 选择`Tenable Security Center`后点击`Continue`

然后就是注册, 设置用户名和密码, 点击Submit

[Nessus注册链接](https://www.tenablecloud.cn/products/nessus/nessus-essentials), 除了邮箱随便填, 收到邮件后拿到注册码?

```
VCZX-XXXX-XXXX-XXXX-XXXX
```

在Nessus安装目录下以管理员身份运行cmd, 输入命令停止服务

```bash
net stop "Tenable Nessus"

# Tenable Nessus 服务正在停止..
# Tenable Nessus 服务已成功停止。
```

运行以下代码, 着重注意`Challenge code`

```bash
.\nessuscli.exe fetch --challenge

# Challenge code: 3eea9ec5b2898b748d996cfa444921774c0ee62d
#
# Activation Code at:
# https://plugins.nessus.org/v2/offline.php
```

访问刚才执行命令出现的链接: https://plugins.nessus.org/v2/offline.php

两个框框, 上面填写cmd中的, 下面填写邮箱中收到的

然后会显示俩链接, 文章只下了一个, 我下俩; 还有网页最底部的`Download nessus.license`

首先将下载的`all-2.0.tar.gz`和`nessus.license`放进Nessus目录下

解除绑定

```bash
attrib -s -r -h "D:\Nessus\Nessus\nessus\plugins\*.*"
attrib -s -r -h "D:\Nessus\Nessus\nessus\plugin_feed_info.inc"
```

注册nessus.license

```bash
.\nessuscli.exe fetch --register-offline nessus.license

# Warning! Performing this action will delete plugins. Do you want to # continue? (y/n) [n]: y
# Your Activation Code has been registered properly - thank you.
# Nessus is offline and cannot do software updates via the feed.
```

安装all插件, 注意version后的数字, 此为插件版本号

```bash
.\nessuscli.exe update all-2.0.tar.gz

# [info] Copying templates version 202509221308 to D:\...\nessus\templates\tmp
# [info] Finished copying templates.
# [info] Moved new templates with version 202509091540 from plugins dir.
# [info] Moved new pendo client with version 2.169.1
# from plugins dir.
# * Update successful.  The changes will be automatically processed by Nessus.
```

更新插件, 这个需要在线环境, 不更新也行

```bash
.\nessuscli.exe update --plugins-only
```

查看在nessus\plugins目录的`plugin_feed_info.inc`文件, 第一行替换为刚才update出现的插件版本号, 第二行和第三行需要替换

```inc
PLUGIN_SET = "202509221308"; PLUGIN_FEED = "ProfessionalFeed (Direct)"; PLUGIN_FEED_TRANSPORT =
"Tenable Network Security Lightning";
```

复制并替换`plugin_feed_info.inc`到nessus\目录下, 并将 `.plugin_feed_info.inc`文件内容也替换为`plugin_feed_info.inc`文件中内容

执行命令, 注意路径

```bash
attrib +s +r +h "D:\Nessus\Nessus\nessus\plugins\*.*"
attrib -s -r -h "D:\Nessus\Nessus\nessus\plugins\plugin_feed_info.inc"
attrib +s +r +h "D:\Nessus\Nessus\nessus\plugin_feed_info.inc"
```

最后启动服务

```bash
net start "Tenable Nessus"
```

现在进去, 右上角会一直转圈圈,等待

# 排错

没有插件的情况下首先停止Nessus服务,再解锁Nessus下文件

```bash
net stop "Tenable Nessus"
attrib -s -r -h "D:\tool\web\Nessus\Nessus\nessus\plugins\*.*"
attrib -s -r -h "D:\tool\web\Nessus\Nessus\nessus\plugins\plugin_feed_info.inc"
attrib -s -r -h "D:\tool\web\Nessus\Nessus\nessus\plugin_feed_info.inc"
```

再查看`E:\Nessus\nessus\plugins\plugin_feed_info.inc `和 `E:\Nessus\nessus\plugin_feed_info.inc` 文件内容是否变化了
