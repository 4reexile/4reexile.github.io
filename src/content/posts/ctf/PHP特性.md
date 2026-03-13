---
title: PHP特性
author: Creexile
date: 2024-11-02
lastMod: 2024-12-19
summary: ''
cover: ''
category: ''
draft: false
comments: false
sticky: 0
tags:
  - PHP
---

# 函数特性

`preg_match()`函数在传入数组会直接返回0

`inteval()`函数失败返回0, 空的array返回0, 非空的array返回1

通过`intval()`函数变为int类型

`intval($value, $base)`在官方文档中定义为: 如果base是0, 通过检测value的格式来决定使用的进制

`in_array()`函数有漏洞, 没有设置第三个参数时为弱类型比较, 就可以形成自动转换; 比如n=1.php自动转换为1

# 换行解析漏洞

[Apache HTTPD 换行解析漏洞(CVE-2017-15715)与拓展](https://blog.csdn.net/qq_46091464/article/details/108278486)

# 一些函数

`strpos()` - 函数查找字符串在另一字符串中第一次出现的位置。
`stripos()` - 查找字符串在另一字符串中第一次出现的位置, 不区分大小写
`strripos()` - 查找字符串在另一字符串中最后一次出现的位置, 不区分大小写
`strrpos()` - 查找字符串在另一字符串中最后一次出现的位置, 区分大小写

`call_user_func` 是 PHP 中的一个函数，它允许你调用一个回调函数，并且动态地将参数传递给该回调函数

# 规避正则

利用前面加空格或者+的方式规避第一个字符是0的问题;

下面这种也可以在数字前面增加+

```php
if(!preg_match('/[oc]:\d+:/i', $user)){}
```

# 伪协议拓展

`highlight_file()`也可以用伪协议

# 执行优先级

```php
 &&  ||  =   and   or
 // PHP中运算符优先级的排列, 从左往右，从高到低
```

比如下面这个内容, 看着很牛逼, 其实只判断了`is_numeric($v1)`, 此时v0就是1了

```php
$v0=is_numeric($v1) and is_numeric($v2) and is_numeric($v3);
```

# php反射

php反射 或者 相关函数(var_dump函数)

php反射这个工具允许你在运行时检查对象的属性和方法, 甚至可以调用它们; 反射 API 由一系列类组成, 这些类使得PHP代码能够获取关于类、接口、函数、方法和扩展的信息, 并在运行时动态调用它们

# 传参包含下划线

用`[`代替`_`, 自动解析会将`[`解析为`_`

> 有几个比赛都用了这个妙妙方法
