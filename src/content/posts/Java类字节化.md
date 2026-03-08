---
title: Java类字节化
author: Creexile
date: 2025-08-10
lastMod: 2025-08-10
summary: ''
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java]
---

参考文章

1. [51CTO-maven导入javassist](https://blog.51cto.com/u_16213311/13172392)

# 什么是Java类字节化？

Java 类字节化是指将 Java 类编译成 JVM 可执行的字节码格式（`.class` 文件）的过程。这种字节码是平台无关的中间表示，可以被 JVM 解释执行或即时编译（JIT）为机器码。

## 为什么需要动态生成字节码？

在某些高级场景中，我们需要在运行时动态生成类：

- 框架开发：如 Spring AOP、Hibernate 代理等
- 热部署/热修复：运行时修改类行为
- 性能优化：生成高度优化的代码路径
- DSL 实现：动态创建领域特定语言的实现类

下面介绍Javassist工具

# Javassist简介

Javassist（Java Programming Assistant）是一个开源的Java字节码操作库, 它提供了两个层次的 API, 允许开发者在**运行时动态修改类结构**, 无需了解底层 JVM 指令

1. **源码级 API**：允许直接使用 Java 语法操作字节码
2. **字节码级 API**：直接操作字节码指令

## 环境准备

```xml
<dependency>
    <groupId>org.javassist</groupId>
    <artifactId>javassist</artifactId>
    <version>3.29.2-GA</version> <!-- 检查最新版本 -->
</dependency>
```

## 示例

创建一个动态类

```java
import javassist.*;

public class JavassistDemo {
    public static void main(String[] args) {
        ClassPool pool = ClassPool.getDefault();
        CtClass cc = pool.makeClass("com.example.DynamicClass");

        // 添加字段
        CtField field = CtField.make("private int id;", cc);
        cc.addField(field);

        // 添加方法
        CtMethod method = CtMethod.make(
          "public void hello() { System.out.println(\"Created by Javassist!\"); }",
          cc
        );
        cc.addMethod(method);

        // 生成类并实例化
        Class<?> clazz = cc.toClass();
        Object obj = clazz.newInstance();
        clazz.getMethod("hello").invoke(obj); // 输出：Created by Javassist!
    }
}
```

# TemplatesImpl与字节码加载

在 Java 安全研究中，`com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl` 是一个重要的类，它可以将字节码直接加载到JVM中, 常用于动态加载和执行字节码

## 关键字段

| 字段名       | 类型                     | 作用                        |
| ------------ | ------------------------ | --------------------------- |
| `_bytecodes` | `byte[][]`               | 存储类字节码的二维数组      |
| `_name`      | `String`                 | 主类名 (可为null)           |
| `_class`     | `Class[]`                | 存储已加载的类              |
| `_tfactory`  | `TransformerFactoryImpl` | 转换器工厂实例 (不能为null) |

## 触发执行的入口方法

```java
// 触发类加载和实例化
public synchronized Transformer newTransformer() {
    // ...
    translet = getTransletInstance();
    // ...
}

// 实际加载和实例化类的方法
private Translet getTransletInstance() {
    // ...
    if (_class == null) defineTransletClasses();
    // ...
    AbstractTranslet translet = (AbstractTranslet) _class[_transletIndex].newInstance();
    // ...
}
```

## 加载要求

1. 类必须是 `com.sun.org.apache.xalan.internal.xsltc.runtime.AbstractTranslet` 的子类, 即必须要继承`AbstractTranslet`
2. 类必须有无参构造函数

# 使用Javassist生成TemplatesImpl所需的字节码

生成的类必须要满足要求

```java
// Javassist 创建类时的关键设置
cc.setSuperclass(pool.get(
    "com.sun.org.apache.xalan.internal.xsltc.runtime.AbstractTranslet"
));

// 必须包含的空方法（否则会报错）
CtMethod emptyMethod = CtMethod.make(
    "public void transform(com.sun.org.apache.xalan.internal.xsltc.DOM document, " +
    "com.sun.org.apache.xml.internal.serializer.SerializationHandler[] handlers) {}",
    cc
);
```

下面是一个例子, 利用Javassist生成字节码后放进TemplatesImpl执行

## 完整代码

我知道会报错但是能成功执行, 我不知道怎么解决

```java
package org.example;

import com.sun.org.apache.xalan.internal.xsltc.runtime.AbstractTranslet;
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;
import javassist.ClassPool;
import javassist.CtClass;
import javassist.CtConstructor;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Field;

public class Main {
    public static void main(String[] args) throws Exception {
        // 生成包含简单命令执行的字节码
        byte[] bytecode = generateSimpleClass();

        // 创建并初始化TemplatesImpl对象
        TemplatesImpl templates = new TemplatesImpl();
        setField(templates, "_bytecodes", new byte[][]{bytecode});
        setField(templates, "_name", "SimpleClass");
        setField(templates, "_tfactory", new TransformerFactoryImpl());

        // 触发执行
        System.out.println("触发命令执行...");
        templates.newTransformer();
    }

    private static byte[] generateSimpleClass() throws Exception {
        ClassPool pool = ClassPool.getDefault();
        CtClass clazz = pool.makeClass("SimpleClass");
        clazz.setSuperclass(pool.get(AbstractTranslet.class.getName()));

        // 简化的命令执行 - 直接输出结果到控制台
        clazz.makeClassInitializer().insertAfter(
                "try {" +
                        "   java.lang.Process process = Runtime.getRuntime().exec(\"whoami\");" +
                        "   java.io.InputStream input = process.getInputStream();" +
                        "   int c;" +
                        "   System.out.println(\"=== 命令输出开始 ===\");" +
                        "   while ((c = input.read()) != -1) {" +
                        "       System.out.write(c);" +
                        "   }" +
                        "   System.out.println(\"\\n=== 命令输出结束 ===\");" +
                        "   input.close();" +
                        "   process.waitFor();" +
                        "} catch (Exception e) {" +
                        "   e.printStackTrace();" +
                        "}"
        );

        // 必需的无参构造函数
        CtConstructor cons = new CtConstructor(new CtClass[0], clazz);
        cons.setBody("{}");
        clazz.addConstructor(cons);

        return clazz.toBytecode();
    }

    private static void setField(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }
}
```
