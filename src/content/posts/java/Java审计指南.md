---
title: Java审计指南
author: Creexile
date: 2025-08-20
lastMod: 2025-08-20
summary: 'cup是杯子,cdown是倒过来的杯子'
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java, 代码审计]
---

参考文章:

1. [springmvc Controller接收前端参数的几种方式总结](https://www.cnblogs.com/mjs154/p/11667796.html)

# 审计

## 准备工作

在审计之前，按照如下步骤，了解框架、技术架构和业务逻辑

1. 了解应用系统主要业务逻辑，
2. 了解项目的结构和项目当中的类依赖。
3. 根据业务模块去读对应的代码，从功能去关联业务代码往往比逮着段代码就看效率高很多。

## 全文通读

初步分析其系统存在的安全控制措施，如框架安全机制、安全组件、过滤器、拦截器等

从系统的入口开始审计，梳理清楚数据流及控制流走向，列出分析表

## 敏感函数

通过搜索敏感函数关键字，分析其是否存在安全缺陷，逆向追踪参数的传递过程，分析参数是否用户可控

# 全文审计

函数集文件：通常文件名中包含function或者common等关键词，这些文件里面是一些公共函数，提供给其他文件统一调用，想要寻找这些文件可以在index.php或者一些功能性文件，一般都能找到。

配置文件：通常命名中包含config关键词，配置文件中可以了解CMS使用时必要的功能性配置选项以及数据库等配置信息，另外在观看配置文件时可以注意观察配置文件中参数值是否采用双引号，如果采用双引号，可能会存在代码执行漏洞。

安全过滤文件：安全过滤文件对于做审计非常重要，关系到我们挖掘到漏洞点的利用，通常文件名中包含filter、safe、check等关键词，这类文件主要是对参数进行过滤，如 sql、xss、rce等。

# 根据功能点定向审计

文件上传: 对文件类型没有做严格过滤,或对文件名没有进行过滤造成sql注入

文件管理系统: 文件名或文件路径直接在参数中传递, 可能导致任意文件操作

登录认证功能: 未加盐/算法可逆,可能导致知道用户部分信息就可以登入他人账户

找回密码: 找回管理员密码

验证码爆破

# 通用漏洞审计

| 漏洞名称                 | 关键词                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 密码硬编码、密码明文存储 | `password`、`pass`、`jdbc`                                                                                                                                                   |
| XSS                      | `getParamter`、`<%= =%>`、`param`                                                                                                                                            |
| SQL 注入                 | `Select`、`Dao`、`from`、`delete`、`update`、`insert`                                                                                                                        |
| 任意文件下载             | `download` 、`fileName` 、`filePath`、`write`、`getFile`、`getWriter`                                                                                                        |
| 任意文件删除             | `Delete`、`deleteFile`、`fileName` 、`filePath`                                                                                                                              |
| 文件上传                 | `Upload`、`write`、`fileName` 、`filePath`                                                                                                                                   |
| 命令注入                 | `getRuntime`、`exec`、`cmd`、`shell`                                                                                                                                         |
| 缓冲区溢出               | `strcpy`,`strcat`,`scanf`,`memcpy`,`memmove`,`memeccpy` `Get()`,`fgetc()`,`getchar`;`read`,`printf`                                                                          |
| XML注入                  | `DocumentBuilder`、`XMLStreamReader`、`SAXBuilder`、`SAXParser` `SAXReader` 、`XMLReader` `SAXSource` 、`TransformerFactory` 、`SAXTransformerFactory` `SchemaFactory`       |
| 反序列化漏洞             | `ObjectlnputStream.readObject` 、`ObjectlnputStream.readUnshared`、`XMLDecoder.readObject` `Yaml.load` 、 `XStream.fromXML` 、`ObjectMapper.readValue` 、 `JSON.parseObject` |
| url跳转                  | `sendRedirect`、`setHeader`、`forward`                                                                                                                                       |
| 不安全组件暴露           | `activity`、`Broadcast Receiver`、`Content Provider`、`Service`、 `inter-filter`                                                                                             |
| 日志记录敏感信息         | `log` `log.info` `logger.info`                                                                                                                                               |
| 代码执行                 | `eval`、`system`、`exec`                                                                                                                                                     |

# 基于关键词审计的漏洞

## 密码硬编码

直接搜就完了

## XSS

### 反射型XSS

反射型 XSS 一般 fortify 一般都能扫描出来
如果是手工找，可全局搜索以下关键词

```
getParamter
<%= 或 =%>
param
${
```

Servlet:
request.getParameter("name")

Struts2:
通过Action类绑定参数或model自动获取前端的参数
通过action属性接收参数

SpringMVC:
对象方式(类似Struts2)
自定义参数名
使用requestbody绑定注解获取参数
request获取参数值

特点:
前端->后端无过滤
后端->前端无过滤

### 存储型XSS

两种方式:

第一种:
关键词: `insert`,`save`,`update`
然后找到该插入语句所属的方法名如(`insertUser()`)，然后全局搜索该方法在哪里被调用，一层层的跟踪。直到`getParamter()`方法获取请求参数的地方停止

第二种:
从`getParamter`关键词开始 ，跟踪请求参数，直到插入数据库的语句，如果中间没有过 滤参数，则存在存储型 XSS

## SQL注入

fortify 一般都能扫描出来

### 特征

原生jdbc
使用statement对象进行数据库操作，未使用prepareStatement预编译

Mybatis：
使用`${}`拼接用户输入

SQL注入常见关键字：
`Statement`、`createStatement`、`executeQuery`、`executeUpdate`、`execute`、`prepareStatement`、`${`
`select`,`update`,`$(`,`#`,`+append`等等
还有什么 `+table`,`+id+`等等,那些自己整吧

当找到某个变量关键词有 SQL 注入漏洞时，还可以直接全局搜索那个关键词找出类似漏洞 的文件
要查找那个页面调用到含有漏洞的代码，就要跟踪方法的调用栈

### 步骤

原生jdbc：1. 搜索`Statement`、`createStatement`、`executeQuery`、`executeUpdate`、`execute`等关键字，确定使用Statement对象执行SQL语句的代码。2. 检查`executeQuery`、`executeUpdate`、`execute`函数的参数是否经过充分过滤，是否对危险字符进行转译。3. 若使用了`Statement`对象执行SQL语句，且`executeQuery`、`executeUpdate`、`execute`函数过滤不严格，则存在SQL注入4. 搜索关键字`prepareStatement`、`executeQuery`、`executeUpdate`、`execute`确定使用预编译对象`prepareStatement`执行SQL语句的代码。5. 检查在构造SQL语句时，拼接用户输入的位置是否使用“?”占位。

Mybatis：1. 在mapper文件中搜索 `${` ，检查是否使用 `${}` 拼接用户输入 2. 对于无法使用`#{}` 拼接用户输入的位置，寻找调用该SQL语句前是否对`${}`内的参数进行过滤或转译。3. 若全部使用`#{}`拼接用户输入，则不存在生SQL注入；若使用`${}`的位置进行严格过滤或转译，则不存在SQL注入。

SQL注入高发位置：
由于SQL语句中部分位置不支持预编译，或使用预编译时将改变SQL原有语法，这些位置将成为SQL注入高发点，如order by 、like 等位置后的参数，应着重进行审计

## 任意文件下载

### 特征

审计方法：全局搜索以下关键词
`fileName`
`filePath`
`getFile`
`getWriter`

## 任意文件删除

### 特征

`delete`, `deleteFile`,`fileName` ,`filePath`

## XPath注入

### 特征

Xpath注入关键字：
`DocumentBuilder`、`XPathFactory`、`XPath`、`XPathExpression`、`evaluate`等

### 审计

1. 搜索`DocumentBuilder`、`XPathFactory`、`XPath`、`XPathExpression`等关键字，定位使用Xpath相关代码位置；
2. 检查使用`XPath.compile()`函数生成`XPathExpression`时，`compile`函数的参数是否对用户输入进行拼接；
3. 若`XPath.compile()`函数的参数直接拼接用户输入，或者对用户输入过滤不严格，则存在XPath注入

## XML注入

### 特征

Java可用的xml解析器很多，比如`XMLReaderFactory`、`XMLReader`、`DocumentBuilderFactory`、`SAXReader`、`SAXParserFactory`等等

XML实体注入关键字：
`XMLReaderFactory`、`XMLReader`、`DocumentBuilder`、`SAXBuilder`、`SAXParserFactory`、`parse`、`setFeature`,`XMLStreamReader`,`SAXParser`,`SAXSource`.`TransformerFactory`.`SAXTransformerFactory`, `SchemaFactory`
`validate`

### 审计

1. 搜索XML实体注入关键字（如XMLReader、SAXReader），定位解析xml的代码块；
2. 检查是否正确设置解析器特性；
3. 若xml解析器没有正确设置解析特性，则存在XML实体注入；

补充：推荐特性设置：

```java
xmlReader.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);    // 禁用DTD
xmlReader.setFeature("http://xml.org/sax/features/external-general-entities", false); // 防止外部普通实体
xmlReader.setFeature("http://xml.org/sax/features/external-parameter-entities", false); // 防止外部参数实体
```

## 命令注入

### 特征

`Runtime.exec()`函数或`processBuilder`在构造系统命令时拼接用户输入。
命令注入关键字：
`Runtime`、`exec`、`processBuilder`,`cmd`,`shell`

### 审计

1. 搜索关键字`Runtime.getRuntime()`，`processBuilder`等关键字定位执行系统命令的代码块；
2. 检查`exec()`函数的参数是否拼接了用户输入，或在整个数据流中是否对用户输入进行过滤或转译；
3. 检查`proceesBuilder.command()`函数的参数是否拼接了用户输入，或在整个数据流中是否对用户输入进行过滤或转译；
4. 若`exec()`函数或`command()`函数拼接用户参数且过滤不充分，则存在命令注入

定位危险入口点，识别所有可能执行系统命令的代码位置

`Runtime.getRuntime().exec()`
`ProcessBuilder.start()`
反射调用`ProcessImpl`、`UNIXProcess`等底层类的方法

审计技巧：
使用IDE全局搜索关键词：`exec(`、`ProcessBuilder`、`start(`、`getRuntime()`。
检查反射调用：搜索`Class.forName()`、`Method.invoke()`等代码块，确认是否操作危险类（如`ProcessImpl`）。

## 日志记录敏感信息

### 特征

通过搜索关键词 `log.info` `logger.info` 来进行定位

## CRLF注入

### 描述

CRLF是“回车+换行”（\r\n）的简称。

在HTTP协议中，HTTPHeader与HTTPBody是用两个CRLF分隔的，浏览器就是根据这两个CRLF来取出HTTP内容并显示出来。所以，一旦我们能够控制HTTP消息头中的字符，注入一些恶意的换行，这样我们就能注入一些会话Cookie或者HTML代码

所以CRLFInjection又叫HTTPResponseSplitting，简称HRS。

### 特征

CRLF漏洞本身没有特殊的关键字，CRLF注入大量出现在重定向功能中，也可以通过搜索`Redirect`、`setHeader`、`addCookie`关键字来定位部分CRLF漏洞

CRLF特殊字符：
`\r` 、`\n`、`%0a`、`%0d`

### 审计

1. 搜索关键字`Redirect`、`setHeader`，定位操作http头部的代码, 关注`HttpServletResponse`对象
2. 检查`sendRedirect`函数、`setHeader`函数的参数中是否拼接了用户输入，或是否对用户输入的回车换行符进行转译过滤；
3. 若上述函数拼接用户输入，且过滤不充分，则存在CRLF注入漏洞

## 不安全的重定向和任意页面跳转

开放重定向漏洞的本质是未对即将跳转的URL进行合法性校验，Javaweb中通常使用sendRedirect函数来进行重定向

### 特征

`sendRedirect`、`redirect`、`setHeader`, `forward`

需注意有没有配置 url 跳转白名单

### 审计

1. 搜索`sendRedirect`、`redirect`、`setHeader`等关键字，定位实现重定向功能的代码块
2. 检查代码中是否对即将跳转的URL地址合法性进行限制；
3. 检查URL合法性校验中，是否使用`startsWith`、`indexOf`等部分匹配校验；
4. 检查URL合法性校验中，是否过滤了JavaScript伪协议；
5. 若代码没有对URL合法性进行校验，则存在开放重定向漏洞，若URL合法性校验时使用部分匹配，则校验容易绕过，若没有过滤JavaScript伪协议，则存在XSS漏洞；

## 敏感信息泄露

### 特征

查看配置文件是否配置统一错误页面，如果有则不存在此漏洞

`Getmessage`、`exception`

## 路径穿越

### 特征

`File`、`getPath`、`getAbsolutePath`、`getCanonicalPath`、`entry.getName`、`multipartFile.getOriginalFilename`

路径穿越特殊符号：

`~`、`.`、`..`、`/`

### 审计

1. 搜索`File`、`getPath`、`getAbsolutePath`、`entry.getName`、`multipartFile.getOriginalFilename`等关键字，定位操作文件的代码块；
2. 检查实例化File时，Path参数是否拼接用户输入，或者用户输入是否对特殊字符进行过滤或转译；
3. 检查在进行路径校验时，是否使用`getAbsolutePath`并结合`indexOf`、`startsWith`等部分匹配函数进行路径校验；
4. 对于压缩解压操作，检查是否直接使用`entry.getName`拼接保存路径
5. 若实例化File的参数用户可控，且调用栈中没有进行过滤或转义，则存在路径穿越漏洞；
6. 若使用`getAbsolutePath`并结合`indexOf`、`startsWith`等部分匹配函数进行路径校验，将导致校验函数被绕过，存在路径穿越漏洞（应使用`getCanonicalPath`函数）
7. 若解压文件时直接使用`entry.getName`拼接保存路径，且后续不再校验路径，则存在路径穿越漏洞。

## 任意文件上传

任意文件覆盖似乎也是这个

### 特征

需注意有没有配置文件上传白名单

`MultipartFile`、`FileItem`、`upload`、`transferTo`，`write`,`fileName` ,`filePath`

### 审计

1. 搜索`MultipartFile`、`FileItem`、`upload`、`transferTo`等关键字，定位实现文件上传的代码块；
2. 检查代码中是否对文件保存路径进行限制（参考路径穿越章节）；
3. 检查代码中是否对文件类型进行校验；
4. 检查文件类型校验是否可绕过，内容包括但不限于以下几个小类：
   使用黑名单还是白名单校验，黑名单是否完备；
   使用文件后缀还是MIME获取文件类型；
   使用后缀名校验文件类型时，是否正确取后缀；是否对大小写进行统一后再校验
5. 若文件类型没有校验，则存在任意文件上传漏洞；
6. 文件类型黑名单，或大小写未统一，存在遗漏，则存在漏洞；

## SSRF

### 特征

`URLConnection`、`HTTPConnection`

### 审计

1. 搜索`URLConnection`、`HTTPConnection`等关键字，定位发起服务端请求的代码块；
2. 检查目标地址URL是否用户可控，是否对目标地址合法性进行检查；
3. 检查目标地址合法性时，是否使用`startsWith`、`indexOf`等部分匹配
4. 若`HTTPConnection`、`URLConnection`的目标地址用户可控，且校验函数可绕过，则存在SSRF漏洞。

## 序列化漏洞

### 特征

反序列化操作一般在导入模版文件、网络通信、数据传输、日志格式化存储、对象数据落磁 盘或 DB 存储等业务场景,在代码审计时可重点关注一些反序列化操作函数并判断输入是否可控

反序列化漏洞关键字：
`ObjectInputStream`、`ObjectOutputStream`、`serializable`、`readOject`、`readExternal`

`ObjectInputStream.readObject`
`ObjectInputStream.readUnshared`
`XMLDecoder.readObject`
`Yaml.load`
`XStream.fromXML`
`ObjectMapper.readValue`
`JSON.parseObject`

### 审计

1. 搜索实现`serializable`或`external`的接口，检查`readOject`、`readExternal`等函数中是否进行了危险操作（如删除文件，调用系统命令等）
2. 搜索关键字`ObjectInputStream.readObject`，检查对数据进行反序列化时，是否对数据进行安全校验（如是否重写了`resolveClass`并自定义白名单、使用IO流过滤器）
3. 如果程序读取输入流并将其反序列化为对象, 此时可查看项目工程中是否引入可利 用的 commons-collections 3.1、commons-fileupload 1.3.1 等第三方库

## 文件包含

### 特征

`include()`，`require()`和`include_once()`，`require_once()`等

### 审计

1. 在jsp、jspx中搜索关键字include；
2. 被包含的文件是否用户可控，是否限定在特定的目录下；
3. 若包含的文件用户完全可控，没有路径限制，则存在任意文件包含漏洞；

## 缓冲区溢出

主要通过搜索关键词定位，再分析上下文
可搜索以下关键字：
`strcpy`,`strcat`,`scanf`,`memcpy`,`memmove`,`memeccpy Getc()`,`fgetc()`,`getchar`;`read`,`printf`

## 不安全的第三方组件

### 审计

1. 获取项目的依赖文件（如pom.xml、lib文件夹）
2. 检查项目依赖的第三方组件是否为存在漏洞的版本
3. 由于第三方组件漏洞在持续更新，建议对第三方组件漏洞进行持续跟踪

安卓:
通过查看配置文件`AndroidManifest.xml`,查看`<inter-filter>`属性有没有配置 `false`, 如没有配置, 默认组件可被导出

`ObjectInputStream.readObject`
`ObjectInputStream.readUnshared`
`XMLDecoder.readObject`
`Yaml.load`
`XStream.fromXML`
`ObjectMapper.readValue`
`JSON.parseObject`
`Serializable`

`commons-io 2.4`
`commons-collections 3.1`
`commons-logging 1.2`
`commons-beanutils 1.9.2`
`org.slf4j:slf4j-api 1.7.21`
`com.mchange:mchange-commons-java 0.2.11`
`org.apache.commons:commons-collections 4.0`
`com.mchange:c3p0 0.9.5.2`
`org.beanshell:bsh 2.0b5`
`org.codehaus.groovy:groovy 2.3.9`
`org.springframework:spring-aop4.1.4.RELEASE`

# 逻辑漏洞

## 水平越权

水平越权本身没有特定的关键字，应在审计过程中关注系统业务逻辑

重点关注用户操作请求时查看是否有对当前登陆用户权限做校验从而确定是否存在漏洞，有些厂商会使用一些主流的权限框架，例如 `shiro` ,`spring security` 等框架，那么需要重点关注框架的配置文件以及实现方法

### 审计

1. 对业务功能的逻辑处理流程进行梳理，分析流程中是否判断了请求与请求发起者之间的绑定关系。
2. 找到一个功能点，检查请求参数中是否包含了可以验证用户身份的信息，如短信验证码。然后，分析该功能的处理逻辑中是否对用户标识（userID等）进行了判断，检查该用户标识是否用户可控。
3. 当该功能未判断请求与请求发起者之间的绑定关系，或用于判断绑定关系的各参数用户可控（cookie中的未加密内容，Http请求头中的内容，Http正文中的内容一般都认为是用户可控内容），则该功能存在水平越权漏洞。

## 垂直越权

同上

搜索关键字`getRequestURI`，发现该`/add/user`接口通过`getRequestURI`方法获取当前URL，若`getRequestURI`返回值以admin开头。则要求session中admin取值为admin，才能访问URL。但是`getRequestURI`和`startsWith`联合使用时，可以通过`/aaa/bbb/../../admin/add/user`，来调用`/admin/add/user`接口

# 其他漏洞审计方法

## csrf

### 特征

通过查看配置文件有没有配置 csrf 全局过滤器，如果没有则重点看每个操作前有
没有添加 token 的防护机制

## 会话超时设置

Javaweb 应用会话超时设置一般有俩种方法：

一是在配置文件 `web.xml` 设置

```xml
<session-config>
<session-timeout>15</session-timeout>
</session-config>
```

二是通过 java 代码设置

```java
HttpSession session = request.getSession();
session.setMaxInactiveInterval(60); // 单位: 秒
```

## 敏感数据弱加密

> 不需要写入报告中

看看数据传输中的加密方法, 不能仅用base64, 可以用换表base64嘛

## session

成功登陆之后是否会更新SessionID
session是否有超时注销功能

## cookie

是否设置了Cookie的httponly属性
是否在cookie中设置明文的用户名或用户编号，且服务端根据该信息来鉴权。

## 密码管理

密码是否以不可逆的哈希形态存储
是否使用不带salt的哈希算法来加密密码
加密哈希算法中的salt是否硬编码在代码中

检查密码修改功能请求中是否有用户名或用户编号，且服务端以该参数来选择需要修改密码的用户，如有则存在越权

# 高危组件漏洞

## shiro

## Weblogic

## Fastjson

`parse` 和 `parseObject`

## Struts2
