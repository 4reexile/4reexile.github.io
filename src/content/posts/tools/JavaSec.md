---
title: JavaSec
author: Creexile
date: 2025-08-29
lastMod: 2025-08-29
summary: '玩Java代码审计的'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: [代码审计, Java]
---

参考文章

1. [先知社区-Java-Sec代码审计漏洞篇(一)](https://xz.aliyun.com/news/15669)
2. [先知社区-Java-Sec代码审计漏洞篇(二)](https://xz.aliyun.com/news/15721)

# 环境配置

## 下载

[github-下载地址](https://github.com/bewhale/JavaSec)
记得下载zip和releases中的jar包共两个文件

## 配置

> 这里是原有的部署方法, 本人在不属实发现该方法不生效, 但还是写一下

更改application.yml文件的数据库账号信息, 改成你的数据库
`JavaSec-master\src\main\resources\application.yml`

```yml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/javasec?serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: your_passwd
    driver-class-name: com.mysql.cj.jdbc.Driver
  thymeleaf:
    cache: false
```

新建javasec数据库(Navicat工具管理的mysql), 然后导入目录下的javasec.sql即可, 这样就算配置完了

到下载的jar包目录下, 用命令行运行

```powershell
java -jar javasec-0.0.1-SNAPSHOT.jar
```

在浏览器中打开`127.0.0.1:8000`即可进入登录界面, "Java漏洞靶场", 默认账户`admin / admin`

## 问题

README中没写, 网上文章推荐docker, 我就不

### 描述

在配置完后访问`127.0.0.1:8000`, 你会发现有登录界面但是没法登录, 报错提示为数据库连接错误

经过尝试后发现是配置文件没有被加载, 用的是jar包内的配置文件; 验证方法也很简单, 修改`JavaSec-master\src\main\resources\application.yml`中的端口, 如8005:

```yml
server:
  port: 8005
  servlet:
    session:
      timeout: 6h
    encoding:
      charset: utf-8
      force: true
      enabled: true
  error:
    #    include-exception: true
    include-stacktrace: always
```

再次运行jar包, 当看到端口仍为8000就知道就是该问题

### 解决方式

很简单, 把配置文件拿出来让它加载即可, 我的文件路径如下

```
JavaSec-app\
├── javasec-0.0.1-SNAPSHOT.jar
└── config\
    └── application.yml
```

此时运行jar, 发现端口变为8005, 且能正常登录
