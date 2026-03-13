---
title: JavaWeb
author: Creexile
date: 2025-12-18
lastMod: 2025-12-18
summary: ''
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java]
---

# 基础三大件

你也有三大件, 分别是服务器Servlet, 过滤器Filter, 监听器Listener

写代码的时候确实难受, 因为写代码还有后面DAO和model呢

## Servlet

Servlet 是运行在 Web 服务器或应用服务器上的程序，它作为来自客户端的请求和服务器上的数据库或应用程序之间的中间层, 负责处理用户的请求, 并根据请求生成相应的返回信息提供给用户

web.xml中是这样的

```xml
<servlet>
    <servlet-name>MonthlyReportServlet</servlet-name>
    <servlet-class>com.eazydeals.servlets.MonthlyReportServlet</servlet-class>
    <!-- <load-on-startup>1</load-on-startup> 还能设置启动顺序 -->
</servlet>
<servlet-mapping>
    <servlet-name>MonthlyReportServlet</servlet-name>
    <url-pattern>/MonthlyReportServlet</url-pattern>
</servlet-mapping>
```

源码中是这样的

```java
public class AdminServlet extends HttpServlet {
    public void init() {
        System.out.println("servlet init");
    }
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    }

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
	}
}
```

## Filter

filter也称之为过滤器，其主要功能是在 HttpServletRequest 到达 Servlet 之前进行拦截，根据需要检查HttpServletRequest，也可以修改HttpServletRequest 头和数据

Filter的定义位于web.xml中, 形如:

```xml
<filter>
    <filter-name>testfilter</filter-name>
    <filter-class>com.example.testfilter.testfilter</filter-class>
</filter>

<filter-mapping>
    <filter-name>testfilter</filter-name>
        <url-pattern>/test</url-pattern>
</filter-mapping>
```

在代码中是这样的

```java
public class testfilter implements Filter{

    @Override
    public void init(FilterConfig filterConfig) throw ServletException{
        // 服务器启动的时候触发
        System.out.println("初始化");
    }
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throw IOException, ServletException{
        // 访问url时触发
        System.out.println("处理请求");
    }
    @Override
    public void destroy() {}
        // 销毁时触发
        System.out.println("资源被释放");
    }
}

```

## Listener

监听器（Listener）就是Application、Session和Request三大对象创建、销毁或者往其中添加、修改、删除属性时自动执行代码的功能组件

web.xml如下, 不需要定义访问路由, 部署完成后会自动触发

```xml
<listener>
  <listener-class>com.example.MyServletContextListener</listener-class>
</listener>
```

源代码如下

```java
public class MyRequestListener implements ServletRequestListener {
    @Override
    public void requestDestroyed(ServletRequestEvent servletRequestEvent) {
        System.out.println("请求销毁了...");
    }

    @Override
    public void requestInitialized(ServletRequestEvent servletRequestEvent) {
        System.out.println("创建请求...");
    }
}

```

# Tomcat

Tomcat需要处理网络的连接与 Servlet 的管理, 因此，Tomcat 设计了两个核心组件来实现这两个功能，分别是连接器和容器，连接器用来处理外部网络连接，容器用来处理内部 Servlet

一个 Tomcat 代表一个 Server 服务器，一个 Server 服务器可以包含多个 Service 服务

一个engine可以对一个多个host，也就是虚拟主机，一个host可以对应多个context，也就是web应用，一个context对应多个wrapper，也就是servlet

Tomcat 使用 组件容器模型, 所有可管理的对象（Servlet、Filter 等）都必须注册到相应的容器中。`StandardContext` 实现了 `Container` 接口，其 `children` 属性维护着所有已注册的子容器

正常的处理流程:

1. HTTP请求到达
2. Mapper组件解析
3. 查询Wrapper映射, 返回Wrapper名称
4. 在children中查找
5. 找到了就获取Servlet实例并调用, 没找到就返回404

Tomcat 维护两个核心数据结构

```java
public class StandardContext extends ContainerBase {
    // 子容器注册表 - 必须在此注册才有效
    private HashMap<String, Container> children = new HashMap<>();

    // URL到Wrapper名称的映射表
    private HashMap<String, String> servletMappings = new HashMap<>();

    // 关键方法：添加映射但不注册容器是无效的
    public void addServletMapping(String pattern, String name) {
        servletMappings.put(pattern, name);
        // 但实际使用时还需要在children中能找到该name
    }

    public Container findChild(String name) {
        return children.get(name);  // 仅从children查找
    }
}
```
