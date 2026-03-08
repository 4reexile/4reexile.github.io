---
title: Java反射
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

先讲一下Java类动态加载方式

# Java类动态加载方式

Java类加载方式分为显式和隐式

- 显式即我们通常使用Java反射或者`ClassLoader`来动态加载一个类对象
- 隐式指的是`类名.方法名()`或`new`类实例

## 显式加载

`Class.forName()`方式

```java
// 默认初始化类
Class<?> clazz = Class.forName("com.example.MyClass");

// 控制初始化的重载方法
Class<?> clazz = Class.forName(
    "com.example.MyClass",
    false, // 是否初始化
    Thread.currentThread().getContextClassLoader()
);
```

`ClassLoader.loadClass()`方式

```java
// 使用系统类加载器
Class<?> clazz = ClassLoader.getSystemClassLoader()
    .loadClass("com.example.MyClass");

// 使用当前类加载器
Class<?> clazz = getClass().getClassLoader()
    .loadClass("com.example.MyClass");
```

`Class.forName("类名")`默认会初始化被加载类的静态属性和方法，如果不希望初始化类可以使用`Class.forName("类名", 是否初始化类, 类加载器)`

若用`ClassLoader.loadClass`, 该方式默认不会初始化类方法

## 隐式加载

```java
ClassName.staticMethod()
new ClassName()
```

`Class.forName("类名")`默认会初始化被加载类的静态属性和方法，如果不希望初始化类可以使用`Class.forName("类名", 是否初始化类, 类加载器)`，而`ClassLoader.loadClass`默认不会初始化类方法。

# 反射是什么

**反射**: Java在运行时动态获取类信息、操作类属性和方法的能力

# 如何获取一个对象

1. 获取类的 Class 对象实例

```java
Class clz = Class.forName("com.zhenai.api.Apple");
```

2. 根据 CLass 对象实例获取 Constructor 对象

```java
Constructor appleConstructor = clz.getConstructor();
```

3. 使用 Constructor 对象的 newInstance 方法获取反射类对象

```java
Object appleObj = appleConstructor.newInstance();
```

# 如何调用某一个方法

1. 获取方法的 Method 对象

```java
Method setPriceMethod = clz.getMethod("setPrice", int.class);
```

2. 利用 invoke 方法调用方法

```java
setPriceMethod.invoke(appleObj, 14);
```

特点:

- 突破封装性：可访问私有成员（需setAccessible(true)）
- 动态性：运行时才确定操作对象（如`Class.forName("java.lang.Runtime"`方法)）
- 自省能力：可获取类结构（方法、字段、注解等）

> 反射使攻击者能绕过Java的访问控制，操作`Runtime`等敏感类。

| 术语         | 作用               | 漏洞利用中的角色                |
| ------------ | ------------------ | ------------------------------- |
| 反射         | 运行时动态操作类   | 突破Java安全机制的基础能力      |
| 反射获取方法 | 提取类中的特定方法 | 获取敏感方法（如 `getRuntime`） |
| 反射调用     | 动态执行方法       | 触发命令执行（如 `exec()`)      |
