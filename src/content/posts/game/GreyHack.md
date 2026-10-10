---
title: GreyHack
auther: Creexile
date: 2024-12-20
lastMod: 2025-08-08
summary: '玩啊为什么不玩'
cover: ''
category: ''
draft: false
comments: false
sticky: 0
tags: []
---

# 新手期

## 连接WIFI

没有给出账号密码, 而是通过手册给出了四个工具用于破解WIFI密码, 工具在Kali有对应的工具

`airmon`可以用来开启网卡的监听模式, 这是获取wifi密码的第一步

> airmon -> airmon-ng

```bash
airmon
# wlan0      WWI109   False
airmon start wlan0
# wlan0      WWI109   True

```

`iwlist`查看附近的wifi列表, iwlist wlan0即可查看wlan0能连接到的网络

> iwlist -> iwlist

```bash
iwlist wlan0
# 选个好的
# 52:01:C6:3A:76:25  68%  Laska_NIGP
```

`aireplay`获取指定wifi的ACK包, 会在当前目录生成file.cap

```bash
# aireplay -b bssid -e essid
aireplay -b 52:01:C6:3A:76:25 -e Laska_NIGP
```

`aircrack`, 结合ack命令破解ack包

> aircrack -> aircrack-ng

```bash
aircrack file.cap
# Ittend
```

成功连接WIFI: `Laska_NIGP / Ittend`

> `iwconfig`指令连接wifi: `iwconfig wlan0 52:01:C6:3A:76:25 Laska_NIGP Ittend`

## 注册邮箱

用浏览器搜索mail以注册邮箱(注意避开搜索引擎的第一项)

输入账号密码即可

## 注册银行账号

输入bank, 随便注册一个

## 要点

用户空间下, config文件夹包含了邮箱和银行信息, 破解密码后可以给自己转账

# Day1

## 信息收集

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250113170916.png)

让你获取指定邮箱的密码

给出了受害者的IP地址, 利用`whois`来查询IP地址的相关信息

```bash
Creeper@Creeper:~$ whois 75.213.207.73
Domain name: compuwa.org
Administrative contact: Mabel Ersonebaumugg
Email address: Ersonebaumugg@compuwa.org
Phone: 544438967
```

> 我在想, 这不是受害者的IP么, whois查到的不应该是受害者的信息么? 还是说给的就是对应右键管理员的IP地址, 算了等会再说

利用社工模板向这位管理员发送社工邮件; 我如果用全名, 他就会说这个用户不存在, 看来只需要给出邮箱名字就行了

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250113173138.png)

他会给我们回信, 回信内容为账号密码, 我们利用这个内容登录远程服务器, 此时会有教程跳出来, 教你隐藏踪迹

## 工具部署

将附件下载到`/bin`文件夹就可以直接利用命令行调用工具了

## 远程登录

> ssh和现实有些不同, 但是毕竟是游戏

```bash
ssh Dairfa@isongo 98.4.81.231
```

可以通过`FileExplorer.exe`启动远程的文件管理器(显示在本地)

## 获取敏感信息

Config目录下有`Mail.txt`文件, 里面是用户的邮箱账号和密码哈希值

`Config/Bank.txt`是银行账号和密码哈希

```bash
# 下载
scp -d /home/Dairfa/Config/Bank.txt
scp -d /home/Dairfa/Config/Mail.txt
scp -d /etc/passwd
# 哈希爆破
decipher Mail.txt
decipher Bank.txt
decipher passwd
```

利用给的工具爆破哈希值即可, 甚至多行还能选择爆破哪一行

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250113181036.png)

## 提权

查看`/etc/passwd`, 发现不止一个用户, 提权到root试试

利用给的工具爆破哈希值, 然后切换用户; 目的其实是拿到另一个用户的所有敏感信息, 不搞也行

```
sudo -s
```

## 结尾

将Dairfa用户的密码作为回信发给他, 就可以获得一个IP, 可以进行访问(是一个小商店)

## 其他

上传ScanLan以更好地扫描网络配置

入侵完成后记得删除`/var/system.log`中操作的条目
