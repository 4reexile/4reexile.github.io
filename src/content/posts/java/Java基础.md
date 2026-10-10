---
title: Java基础
author: Creexile
date: 2025-08-18
lastMod: 2026-03-17
summary: ''
cover: ''
category: 'Java'
draft: false
comments: false
sticky: 0
tags: [Java基础, Java安全, Java, Spring]
---

Java平台共分为三个主要版本

- `Java SE`（`Java Platform, Standard Edition`，Java平台标准版）
- `Java EE`（`Java Platform Enterprise Edition`，Java平台企业版）
- `Java ME`（`Java Platform, Micro Edition`，Java平台微型版）

`Java SE`是JDK自带的标准API

代码我就不写了, 去看看视频之类的吧

# 软件项目管理工具

## Maven

Maven是基于项目对象模型(POM project object model)，可以通过一小段描述信息（配置）来管理项目的构建，报告和文档的软件项目管理工具

就是通过pom.xml文件的配置获取jar包

## pom.xml

XML格式显示所有依赖包的版本、名称、配置等信息

# 命名规则

## 基础规则

| 元素           | 规则                                       | 示例                                |
| -------------- | ------------------------------------------ | ----------------------------------- |
| 包名           | 全部小写，单词之间用点分隔，一般为域名倒序 | `com.example.myapp.dao`             |
| 类/接口名      | 帕斯卡命名 (每个单词首字母大写)            | `UserService`, `HttpClient`         |
| 方法名, 变量名 | 驼峰命名 (首字母小写，首字母大写)          | `getUserById` , `calculateTotal`    |
| 常量名         | 全部大写，单词间下划线分隔                 | `MAX_RETRY_COUNT` `DEFAULT_TIMEOUT` |

## 通用设计

- 工厂类：以 `Factory` 结尾
- 单例类：通常 `getInstance()` 作为获取实例的方法
- 构建器：内部Builder类，如`User.Builder`
- 监听器/回调：以`Listener`结尾, 或以 `Callback` 结尾
- 适配器：以`Adapter`结尾

## 分层架构

- Controller:`XxxController`,`XxxResource`
- Service:`XxxService`（接口）+`XxxServiceImpl`（实现）
- DAO/Repository:`XxxDao`,`XxxRepository`
- DTO:`XxxDto`,`XxxRequest`,`XxxResponse`

较老的项目中一般`I`开头的是接口类

## 布尔/数组

布尔一般是`is`前缀, 例如`isActive`

集合和数组一般是复数形式, 例如`List<User> users;`

## 方法命名

- 获取/查询: getXxx, findXxx, loadXxx
- 设置/修改: setXxx, saveXxx
- 判断/检查: isXxx
- 转换/构建: toXxx, of, builder
- 创建/销毁: createXxx, close, destroy

## 异常类

通常以 `Exception` 结尾

## 测试类

`Test` 结尾或开头

# Java类

可以通过JDK自带的`javap`命令反汇编class文件，用Linux自带的`hexdump`命令查看文件二进制内容

> JVM在执行之前会先解析class二进制内容，JVM执行的其实就是如上`javap`命令生成的字节码(`ByteCode`)

# 常见框架和组件

## Mybatis

MyBatis 是支持定制化SQL、存储过程以及高级映射的优秀的持久层框架

## SpringBoot

SpringBoot是一款基于JAVA的开源框架。目的是为了简化Spring应用搭建和开发流程

使用注解`@Controller`来加载控制器(自动导入所需要的包)
`@ResponseBody`声明响应部分
`@RequestMapping`声明"入参"，相当于访问路径

```java
package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HelloController {
    @ResponseBody
    @RequestMapping("/hello")
    public String sayHello(){
        return "Hello, world! ";
    }
}
```

## SpringBoot Actuator

Spring Boot Actuator就是一款可以帮助你监控系统数据的框架,其可以监控很多很多的系统数据,它有对应用系统的自省和监控的集成功能，可以查看应用配置的详细信息

## SpringSecurity

Spring 是一个非常流行和成功的java应用开发框架。 Spring Security 基于Spring 框架，提供了一套web应用安全性的完整解决方案

在用户认证方面，Spring Security 框架支持主流的认证方式，包括 HTTP 基本认证、HTTP 表单验证、HTTP 摘要认证、OpenID 和 LDAP 等

在用户授权方面，Spring Security 提供了基于角色的访问控制和访问控制列表（Access Control List，ACL），可以对应用中的领域对象进行细粒度的控制

## Druid

Druid是一个高效的数据查询系统，主要解决的是对于大量的基于时序的数据进行聚合查询。数据可以实时摄入，进入到Druid后立即可查，同时数据是几乎是不可变。通常是基于时序的事实事件，事实发生后进入Druid，外部系统就可以对该事实进行查询

参考书籍

- java从入门到精通||又叫做 java从入门到入土||

参考文章

1. [个人博客-java一把梭](https://geekdaxue.co/read/maxsecurity@mbxigk/yztya9)
2. [freebug-Java代码审计从零到一|基础篇](https://www.freebuf.com/articles/web/330861.html)
3. [博客园-maven(一) maven到底是个啥玩意~](https://www.cnblogs.com/whgk/p/7112560.html)
4. [csdn-druid简单教程](https://blog.csdn.net/yunnysunny/article/details/8657095)
5. [语雀-Bloyet](https://www.yuque.com/bloyet/)
