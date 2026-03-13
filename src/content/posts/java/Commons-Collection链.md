---
title: Commons-Collection链
author: Creexile
date: 2025-08-03
lastMod: 2026-02-27
summary: '啊哈哈哈,CC链来咯'
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java, 代码审计, 反序列化]
---

参考文章

1. [csdn-CC链总结](https://blog.csdn.net/qq_36869808/article/details/129539246)
2. [博客园-Java反序列化Commons-Collection篇01-CC1链](https://www.cnblogs.com/1vxyz/p/17284838.html)
3. [freebuf-Java安全 CC链1分析](https://www.freebuf.com/articles/web/390210.html)
4. [个人博客-Java Web学习](https://geekdaxue.co/read/maxsecurity@mbxigk/yztya9)
5. [先知-通俗易懂的Java Commons Collection 2分析](https://xz.aliyun.com/news/9835)
6. [博客园-1vxyz-随笔分类-Java安全](https://www.cnblogs.com/1vxyz/category/2260818.html)
7. [先知-CC链 1-7 分析](https://xz.aliyun.com/news/8908#toc-8)

# 介绍

Apache Commons Collections 是一个为 Java 提供扩展集合类的开源项目, 它提供了一系列有用的集合类和算法, 可以使编程变得更加简单, 快捷和高效

CC链（Commons Collections反序列化漏洞利用链）是Java安全领域中最具代表性的反序列化攻击技术之一, 其核心通过恶意构造的序列化对象触发Apache Commons Collections库中的反射机制, 最终实现任意代码执行

# 环境准备

**JDK版本：**
CC1、CC3、CC5、CC6、CC7 建议使用JDK 8u65或更低版本
JDK 8u71后修复了AnnotationInvocationHandler的触发逻辑

**Commons Collections版本：**
CC1-CC3、CC5-CC7 使用 3.2.1；CC2、CC4 使用 4.0
注意：3.2.2/4.1版本增加了安全限制，但若启用不安全序列化属性仍可能存在风险

**工具：**
推荐使用[ysoserial](https://github.com/frohoff/ysoserial)生成Payload进行测试

CC1可以看[freebuf-Java安全 CC链1分析](https://www.freebuf.com/articles/web/390210.html)的第一部分来配置IDEA和java 8u66(我用这个版本进行复现)

CC2可以看[先知社区-通俗易懂的Java Commons Collection 2分析](https://xz.aliyun.com/news/9835)配置IDEA环境

# 前置知识

你需要了解的java前置知识:

- [Java代理](/posts/java/java代理)
- [JavaWeb](/posts/java/javaweb)
- [Java反序列化](/posts/java/java反序列化)
- `Apache Commons Collections`库中的常用API(写在对应文章里面得了)
- 如果一个函数重写了`readObject`, 在反序列化时会自动调用该函数

可能函数也要了解一下, 主要是Transformer接口的实现类

- [Transformer接口的实现类](Transformer接口的实现类.md)

# CC链

流程图总览[CC利用链.excalidraw](CC利用链.excalidraw.md)

## CC1

条件: CC3.1-3.2.1, jdk 1.7(<=8u71)

cc1有两种链, 一种使用的动态代理(LazyMap), 一种直接创建(TransformedMap)

```txt
动态代理:
AnnotationInvocationHandler.readObject()
-> Proxy.invoke() //动态代理
-> LazyMap.get()
-> ChainedTransformer.transform()
-> Runtime.exec()

直接调用:
AnnotationInvocationHandler.readObject()
-> TransformedMap.decorate()
-> ChainedTransformer.transform()
-> Runtime.exec()
```

### TransformedMap

入口: `AnnotationInvocationHandler#readObject`
核心组件: `TransformedMap`

```txt
ObjectInputStream.readObject()
  AnnotationInvocationHandler.readObject()
    memberValues.entrySet().iterator().next().setValue()
      TransformedMap.checkSetValue()
        ChainedTransformer.transform()
          ConstantTransformer.transform() // 获取Runtime类
          InvokerTransformer.transform() // 反射获取getRuntime方法
          InvokerTransformer.transform() // 反射调用getRuntime方法
          InvokerTransformer.transform() // 反射调用exec方法执行命令
```

- [CC迭代调用链](CC迭代调用链.md)
- [CC1_TransformedMap调用链](CC1_TransformedMap调用链.md)
- [CC1_AnnotationInvocationHandler-readObject调用链](CC1_AnnotationInvocationHandler-readObject调用链.md)

### LazyMap

入口: `AnnotationInvocationHandler#readObject`
核心组件: `LazyMap`

```
ObjectInputStream.readObject()
  AnnotationInvocationHandler.readObject()
    memberValues.entrySet().iterator().next().getValue()
      Proxy.invoke() // 动态代理调用
        LazyMap.get()
          factory.transform() // ChainedTransformer.transform()
            迭代调用链
```

- [CC1_LazyMap调用链](CC1_LazyMap调用链.md)
- [CC1_AnnotationInvocationHandler动态代理调用链](CC1_AnnotationInvocationHandler动态代理调用链.md)

## CC2

条件: CC4.0, 通用(java1.7+)

```txt
PriorityQueue链:
PriorityQueue
-> TransformingComparator
-> InvokerTransformer
-> TemplatesImpl
```

### PriorityQueue

入口: `TransformingComparator#compare`
核心组件: `PriorityQueue`, `TemplatesImpl`
条件: jdk无限制, CommonsCollections4

```
ObjectInputStream.readObject()
  PriorityQueue.readObject()
    heapify()
      siftDown()
        siftDownUsingComparator()
          TransformingComparator.compare()
            InvokerTransformer.transform()
              TemplatesImpl.newTransformer()
                TemplatesImpl.getTransletInstance()
                  TransletClassLoader.defineClass() [加载恶意字节码]
                    恶意类的静态代码块/构造函数执行 [命令执行]
```

- [CC2_TemplatesImpl底层调用链](CC2_TemplatesImpl底层调用链.md)
- [CC2_TransformingComparator](CC2_TransformingComparator.md)
- [CC2_PriorityQueue](CC2_PriorityQueue.md)

## CC3

条件: CC3.1-3.2.1, jdk 1.7(<=8u71)

```txt
TrAXFilter链:
AnnotationInvocationHandler
-> LazyMap
-> InstantiateTransformer
-> TrAXFilter
-> TemplatesImpl
```

### TrAXFilter

入口: `AnnotationInvocationHandler#readObject`
核心组件: `TrAXFilter`, `TemplatesImpl`
条件: jdk1.7

```txt
ObjectInputStream.readObject()
  AnnotationInvocationHandler.readObject()
    memberValues.entrySet().iterator().next().getValue()
      Proxy.invoke() // 动态代理调用
        LazyMap.get()
          factory.transform() // ChainedTransformer.transform()
            ConstantTransformer.transform() // 获取TrAXFilter类
            InstantiateTransformer.transform()
              TrAXFilter构造函数()
                templates.newTransformer() // TemplatesImpl.newTransformer()
                  TemplatesImpl.getTransletInstance()
                    TransletClassLoader.defineClass() [加载恶意字节码]
                     恶意类的静态代码块/构造函数执行 [命令执行]
```

别看很长, 其实是拼接CC1的`lazyMap.get() -> InvokerTransformer.transform()`

- [CC3_TrAXFilter](CC3_TrAXFilter.md)

## CC4

条件: CC4.0, 通用(java1.7+)

```txt
HashedMap链:
HashedMap
-> TransformedMap
-> InvokerTransformer
-> TemplatesImpl
```

### HashedMap

### 组合利用

入口: `TransformingComparator#compare`
核心组件: `PriorityQueue`, `TrAXFilter`
条件: CommonsCollections4

```
ObjectInputStream.readObject()
  PriorityQueue.readObject()
    heapify()
      siftDown()
        siftDownUsingComparator()
          TransformingComparator.compare()
            ChainedTransformer.transform()
              ConstantTransformer.transform() // 获取TrAXFilter类
              InstantiateTransformer.transform()
                TrAXFilter构造函数()
                  templates.newTransformer() // TemplatesImpl.newTransformer()
                    TemplatesImpl.getTransletInstance()
                      TransletClassLoader.defineClass() // 加载恶意字节码
                       恶意类的静态代码块/构造函数执行 [命令执行]
```

结合CC2的`PriorityQueue`触发点和CC3的`TrAXFilter`利用方式

- [CC4](CC4.md)

## CC5

条件: CC3.1-3.2.1, java1.7(<=8u71)

```txt
BadAttributeValueExpException链:
BadAttributeValueExpException
-> TiedMapEntry
-> LazyMap
-> Runtime.exec
```

### TiedMap

入口: `BadAttributeValueExpException#readObject`
核心组件: `TiedMapEntry`, `LazyMap`
条件: 无任何要求，可以直接使用

```
ObjectInputStream.readObject()
  BadAttributeValueExpException.readObject()
    val.toString() [TiedMapEntry.toString()]
      TiedMapEntry.getValue()
        LazyMap.get()
          factory.transform() [ChainedTransformer.transform()]
            迭代调用链
```

- [CC5](CC5.md)

## CC6

条件: CC3/4, 无jdk限制

```txt
HashSet链
HashSet
-> TiedMapEntry
-> LazyMap
-> Runtime.exec
```

### HashSet

入口: `HashMap#hash -> TiedMapEntry#hashCode`
核心组件: `TiedMapEntry`, `HashMap`
条件: 无任何要求，可以直接使用

```
ObjectInputStream.readObject()
  HashSet.readObject()
    HashMap.put()
      HashMap.hash()
        TiedMapEntry.hashCode()
          TiedMapEntry.getValue()
            LazyMap.get()
              factory.transform() [ChainedTransformer.transform()]
                迭代调用链
```

- [CC6](CC6.md)

> 走urldns反序列化一套

## CC7

条件: CC3/4, jdk6-11

```txt
DefaultedMap链:

Hashtable链:

```

### Hashtable

入口: `Hashtable#reconstitutionPut`
核心组件: `Hashtable`

```
ObjectInputStream.readObject()
  Hashtable.readObject()
    Hashtable.reconstitutionPut()
      AbstractMap.equals()
        TiedMapEntry.equals()
          TiedMapEntry.getValue()
            LazyMap.get()
              factory.transform() [ChainedTransformer.transform()]
                迭代调用链
```

> 在CC6的基础上多走了一步 HashTable

- [CC7](CC7.md)

# 关键链解析

## CC3链-TrAXFilter与字节码加载

CC3链的核心目的是绕过一些安全规则对InvokerTransformer类的限制（例如黑名单)

它不再直接使用`InvokerTransformer`来调用方法，而是利用了`TrAXFilter`类; CC3链通过`InstantiateTransformer`来实例化`TrAXFilter`类，并传入恶意构造的`TemplatesImpl`对象，最终在实例化过程中触发`TemplatesImpl#newTransformer()`，加载并执行其中的恶意字节码; 这使得CC3链更侧重于类加载而非直接的命令执行

## CC6链-hashCode的利用

CC6链提供了一种非常通用的触发方式; 它通过`TiedMapEntry#hashCode()`方法触发`TiedMapEntry#getValue()`, 进而调用`LazyMap#get()`和后续的`Transformer`链

该链的触发点`HashMap#hash()`在反序列化读取数据时会被调用, 因此**不受JDK版本限制**, 适用性非常广泛

## CC4链-组合利用

CC4链可以看作是CC2和CC3思想的结合; 它像CC2一样使用`PriorityQueue`和`TransformingComparator`作为触发入口, 但像CC3一样使用`InstantiateTransformer`来实例化`TrAXFilter`并最终触发`TemplatesImpl`中的字节码, 从而避免使用可能被禁用的`InvokerTransformer`

# 绕过技术与历史修复

## JDK版本的绕过

JDK 8u71+ 修改了 `sun.reflect.annotation.AnnotationInvocationHandler` 类的 `readObject` 方法，使其不再直接操作我们精心构造的Map对象，导致直接依赖它的CC1链失效; 应对策略是寻找新的触发点, 如CC6利用`HashMap#hashCode()`, CC2/CC4利用`PriorityQueue#readObject()`中的比较器

## Commons Collections的修复

在3.2.2和4.1版本中, 官方试图修复漏洞;

例如，在3.2.2版本中，对`InvokerTransformer`、`InstantiateTransformer`等类的序列化支持增加了开关

这些开关默认情况下关闭，反序列化这些类会抛出`UnsupportedOperationException`异常; 若要启用，需设置系统属性`org.apache.commons.collections.enableUnsafeSerialization=true`

需要注意的是, 3.2.2版本的修复并不彻底, 因为它只是增加了一个默认关闭的开关, 如果应用程序在启动时启用了不安全的序列化属性, 仍然可能存在风险

# 其他

## Commons Collections3和4的区别

Commons Collections 3和4是Java编程语言中的开源类库，用于提供更多的集合数据结构和工具类。它们的主要区别如下：

架构：Commons Collections 4使用了新的架构，通过更好的设计和实现，提高了性能和可用性。

功能：Commons Collections 4新增了一些功能，例如BloomFilter，MultiValuedMap等。

兼容性：Commons Collections 4支持Java 8和以上版本，而Commons Collections 3只支持Java 7及以下版本。

依赖：Commons Collections 4移除了对其他类库的依赖，例如BeanUtils和ComparatorUtils，这使得它更加轻便和易用。

Commons Collections 4是一个更为现代化和高效的Java集合类库，更适合使用Java 8及以上版本。但如果你仍然需要在Java 7及以下版本中使用，那么Commons Collections 3是一个不错的选择。

## 利用链的演变与绕过

JDK版本适配问题
JDK 8u71+修复了AnnotationInvocationHandler的触发逻辑，导致CC1链失效。

替代方案：
CC3链：引入TemplatesImpl类，通过字节码加载执行命令。
CC6链：改用HashSet和HashMap的hashCode()触发点79。

Commons Collections的修复与绕过
官方修复（3.2.2+）：在InvokerTransformer中增加序列化开关，默认关闭反序列化功能58。
绕过手段：使用其他危险类（如InstantiateTransformer）构造新链，或依赖未修复的4.x版本组件
