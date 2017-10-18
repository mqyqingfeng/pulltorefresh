# pulltorefresh

## 介绍

移动端下拉刷新库，原生 JavaScript 实现。

效果演示：

[https://mqyqingfeng.github.io/pulltorefresh/](https://mqyqingfeng.github.io/pulltorefresh/)

[https://mqyqingfeng.github.io/pulltorefresh/withScroll.html](https://mqyqingfeng.github.io/pulltorefresh/withScroll.html)

## 依赖

原生 JavaScript 实现，无依赖。

## 大小

压缩后 4KB，gzip 压缩后更小。

## 下载

```js
git clone git@github.com:mqyqingfeng/pulltorefresh.git
```

## 使用

```html
<script src="path/pulltorefresh.js"></script>
```

或者

```js
import PullToRefresh from 'path/pulltorefresh.js'
```

## 示例

```js
var pull = new PullToRefresh({
    target: 'body',
    onRefresh: function(){
        window.location.reload();
    }
})
```

## API

### 初始化

```js
var pulltorefresh = new PullToRefresh(options);
```

### options

**1.target**

传入要下拉加载的元素的 id，如果是 body 元素，可以直接传入 "body"。

```js
var pull = new PullToRefresh({
    target: 'body'
})
```

**2.threshold**

默认值为 `60`，表示当大于 60px 的时候才会触发 relase 事件。

**3.max**

默认值为 `80`，表示最大可以拉到 80px 的高度。

**4.reloadHeight**

默认值为 `50`，表示释放后，高度回到 50px。

**5.onRefresh**

当 relase 时要执行的函数。

**6.pullText**

默认值为 `下拉以刷新页面`，表示下拉时的文字提示。

**7.relaseText**

默认值为 `释放以刷新页面`，表示释放前的文字。

**8.refreshText**

默认值为 `刷新`，表示释放后的文字。

**9.pullIcon**

默认值为 `&#8675;`，表示下拉时的图标。

**10.refreshIcon**

默认值为 `&hellip;`，表示释放后的图标。
