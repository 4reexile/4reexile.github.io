---
title: Java代理
author: Creexile
date: 2025-08-08
lastMod: 2025-08-08
summary: '没有中间商赚差价'
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java]
---

参考文章

1. [博客园-java动态代理实现与原理详细分析](https://www.cnblogs.com/gonjan-blog/p/6685611.html)

# 前置知识

代理很简单, 就是引入一个中间人; 这个中间人不仅用于传递信息, 还可以进行过滤/其他调用等操作

这就好比 我通过朋友向老师提交作业, 朋友可能会顺一瓶可乐回来, 或者和老师聊聊天, 说说我的好话和坏话

代理组成:

- Subject：抽象主题（接口）
- RealSubject：真实主题（实现类）
- Proxy：代理类（控制对真实主题的访问）

# 动态和静态代理

静态代理, 在编译时就已经将接口, 被代理类等确定下来; 在程序运行之前, 代理类的.class文件就已经生成

动态代理: 代理类在程序运行时创建的代理方式被成为动态代理; 动态代理的优势在于可以很方便的对代理类的函数进行统一的处理, 而不用修改每个代理类中的方法

核心类与接口

- `java.lang.reflect.Proxy`：动态代理的主类
- `java.lang.reflect.InvocationHandler`：调用处理器接口

## 例子

```java
// 1. 定义业务接口
interface Service {
    void execute();
}

// 2. 实现业务接口
class RealService implements Service {
    public void execute() {
        System.out.println("真实服务执行");
    }
}

// 3. 实现调用处理器
class ServiceHandler implements InvocationHandler {
    private Object target; // 被代理对象

    public ServiceHandler(Object target) {
        this.target = target;
    }

    public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable {

        System.out.println("前置处理");
        Object result = method.invoke(target, args); // 调用真实方法
        System.out.println("后置处理");
        return result;
    }
}

// 4. 创建动态代理
public class Main {
    public static void main(String[] args) {
        // 创建真实对象
        Service realService = new RealService();

        // 创建调用处理器
        InvocationHandler handler = new ServiceHandler(realService);

        // 创建代理对象
        Service proxy = (Service) Proxy.newProxyInstance(
            Service.class.getClassLoader(), // 类加载器
            new Class[]{Service.class},    // 代理接口数组
            handler                        // 调用处理器
        );

        // 通过代理调用方法
        proxy.execute();
    }
}
```

方法调用流程

![JavaReflection](https://raw.githubusercontent.com/4reexile/Misc_/b8f059c66471fd65717d8291a64ea969ace416af/images/md/JavaReflection.png)

## 代理类生成过程

- 根据接口信息生成代理类的字节码
- 使用类加载器加载生成的代理类
- 通过反射创建代理类实例

## 代理使用条件

- 目标包含invoke
- invoke方法中调用get
- readObject调用已有方法

# 重点

执行被代理对象的任何方法都会先触发代理类的invoke方法, 你从上面的方法调用流程可以很直观的看出来

嗯, 这里好像可以利用反序列化哦
