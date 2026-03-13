---
title: CobaltStrike
author: Creexile
date: 2025-04-15 20:06:57
lastMod: 2025-04-15
summary: '大型多人在线竞技平台'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: [渗透]
---

# Cobalt Strike介绍

Cobalt Strike（简称为CS）是一款团队作战渗透测试神器，是一种可以用来进行横向移动、数据窃取、鱼叉式钓鱼的后渗透工具，分为客户端和服务端，一个客户端可 以连接多个服务端，一个服务端也可以对应多个客户端连接。

我们更喜欢称之为大型多人在线竞技平台 CS

# 安装和使用

## 安装

安装JDK

```bash
apt search java | grep jdk
# 反正推荐11, 不行换一个
apt install openjdk-11-jdk
```

环境变量配置

```
Java_Home => C:\Program files\jdk1.8.0_216
CLASSPATH => .;JAVA_HOME%\lib;%JAVA_HOME\lib\tools.jar
PATH => %JAVA_HOME%\bin;%JAVA_HOME\jre\bin
```

## 使用

```bash
# 记得用管理员权限
unzip coablt_strike_4.5.zip
cd coablt_strike_4.5
chmod 777 *		// 给予权限
# 启动时设置ip和密码
./teamserver 192.168.204.132 123456
```

客户端需要输入ip和密码

```bash
./cobaltstrike
```

Alias：别名，用户名@服务端IP地址
Host :服务端IP地址，可为域名
Port：服务端口号，默认50050，可进行修改
User：用户名，可随意填写，只要不冲突即可
Password: 登录密码，启动服务端时设置的密码

虽然很多功能右键都可以执行,我还是要写一下常用的

```bash
hashdump		# 凭证抓取
shell ipconfig		# 加上shell执行系统命令
shell systeminfo /all
net view		# 探测ip
help
sleep 本地测试建议1
shell+命令
net user    # 用户
desktop    # 桌面监控
getuid    # 用户权限
```

# 监听器

# Beacon

## 内网

### SMB Beacon

内网中上线不出网的机器一般使用的是`SMB Beacon`, SMB Beacon 是 CS 中专门用于内网横向移动和命令控制的类型。

它的工作原理是利用 命名管道（Named Pipe），通过 SMB 协议 与目标机器上的 Beacon 进行通信

首先需要一台已经通过常规方法上线的机器(如HTTP/S Beacon), 被称为中继机器; 随后通过psexec, psexec_psh或wmi模块, 通过 **派生(Spawn)** 的方式将SMB Beacon部署到不出网的目标机器上

### HTTP/S Beacon with Domain Fronting

域前置(Domain Fronting), 这个严格来说不算是Beacon类型, 但是它是一种非常有效的技术, 主要用于帮助HTTP/S Beacon伪装流量, 从而绕过网络限制

工作原理：

域前置利用了内容分发网络 CDN 的特性。CDN 允许一个请求的 主机头（Host Header） 和实际连接的 IP 地址不一致

工作流程：

正常流量：攻击者在 CS 中将 Beacon 的 C2 地址设置为 CDN 的域名（如 cdn.microsoft.com），而实际上 Beacon 会向 CDN 的 IP 地址发送请求

CDN 代理：当 CDN 收到请求后，它会根据 HTTP 请求中的 Host 字段，将请求转发到攻击者在 CDN 上配置的真实 C2 服务器

绕过限制：对于不出网的机器，如果它的网络策略允许访问 CDN 节点的 IP，那么它就可以成功将流量发送出去，因为在它的网络视角中，它只是在访问一个合法的 CDN 资源，而不会被认为是恶意流量
