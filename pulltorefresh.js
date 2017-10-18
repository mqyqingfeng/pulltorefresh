(function() {
    var root = (typeof self == 'object' && self.self == self && self) ||
        (typeof global == 'object' && global.global == global && global) ||
        this || {};

    var util = {
        extend: function(target) {
            for (var i = 1, len = arguments.length; i < len; i++) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop]
                    }
                }
            }

            return target
        }
    };

    function PullToRefresh(options) {

        this.options = util.extend({}, this.constructor.defaultOptions, options);

        this.init();
    }

    PullToRefresh.VERSION = '1.0.0';

    PullToRefresh.defaultOptions = {
        // 下拉时的文字
        pullText: "下拉以刷新页面",
        // 下拉时的图标
        pullIcon: "&#8675;",
        // 释放前的文字
        relaseText: "释放以刷新页面",
        // 释放后的文字
        refreshText: "刷新",
        // 释放后的图标
        refreshIcon: "&hellip;",
        // 当大于 60px 的时候才会触发 relase 事件
        threshold: 60,
        // 最大可以拉到 80px 的高度
        max: 80,
        // 释放后，高度回到 50px
        reloadHeight: 50
    }

    // 记录当前状态 pending/pulling/releasing/refreshing
    var _state = 'pending';
    // touchstart 时的 Y 轴的位置
    var pullStartY = null;
    // touchmove 时的 Y 轴的位置
    var pullMoveY = null;
    // 手指移动的距离
    var dist = 0;
    // refresh-element 要移动的距离，跟手指距离的值不同，因为要有阻尼效果
    var distResisted = 0;
    // 检测是否支持 passive 事件，我们可以传递 passive 为 true 来明确告诉浏览器，事件处理程序不会调用 preventDefault 来阻止默认滑动行为。
    var supportsPassive = false;

    var proto = PullToRefresh.prototype;

    proto.constructor = PullToRefresh;

    proto.init = function() {
        // 创建下拉元素和添加样式
        this.createRefreshElement();
        this.setRefreshStyle();

        // 获取该下拉元素
        this.getElement();

        // 判断是否支持 passive
        this.supportsPassive();
        // 绑定事件
        this.bindEvent();
    };

    proto.createRefreshElement = function() {
        var elem = document.createElement('div');
        if (this.options.target !== 'body') {
            var target = document.getElementById(this.options.target);
            target.parentNode.insertBefore(elem, target);
        } else {
            document.body.insertBefore(elem, document.body.firstChild);
        }

        elem.className = "refresh-element";
        elem.id = "refresh-element";

        elem.innerHTML = '<div class="refresh-box"><div class="refresh-content"><div class="refresh-icon"></div><div class="refresh-text"></div></div></div>';

    };

    proto.setRefreshStyle = function () {
        var styleElem = document.createElement('style');
        styleElem.setAttribute('id', 'refresh-element-style');
        document.head.appendChild(styleElem);
        styleElem.textContent = '.refresh-element {pointer-events: none; font-size: 0.85em; top: 0; height: 0; transition: height 0.3s, min-height 0.3s; text-align: center; width: 100%; overflow: hidden; color: #fff; } .refresh-box {padding: 10px; } .pull {transition: none; } .refresh-text {margin-top: .33em; } .refresh-icon {transition: transform .3s; } .release .refresh-icon {transform: rotate(180deg); }';

    };

    proto.getElement = function() {
        this.refreshElem = document.getElementById("refresh-element");
    };

    // 判断是否支持 passive
    proto.supportsPassive = function() {
        try {
            var opts = Object.defineProperty({}, 'passive', {
                get: function() {
                    supportsPassive = true;
                }
            });
            window.addEventListener("test", null, opts);
        } catch (e) {}
    };

    proto.bindEvent = function() {
        window.addEventListener('touchstart', this);
        window.addEventListener('touchmove', this, supportsPassive ? { passive: false } :
            false
        );
        window.addEventListener('touchend', this);
    };

    proto.handleEvent = function(event) {
        var method = 'on' + event.type;
        if (this[method]) {
            this[method](event);
        }
    };

    proto.shouldPullToRefresh = function() {
        return !window.scrollY;
    };

    // 根据状态更新文字
    proto.update = function() {

        var iconEl = this.refreshElem.querySelector(".refresh-icon");
        var textEl = this.refreshElem.querySelector(".refresh-text");

        if (_state === 'refreshing') {
            iconEl.innerHTML = this.options.refreshIcon;
        } else {
            iconEl.innerHTML = this.options.pullIcon;
        }

        if (_state === 'releasing') {
            textEl.innerHTML = this.options.relaseText;
        }

        if (_state === 'pulling' || _state === 'pending') {
            textEl.innerHTML = this.options.pullText;
        }

        if (_state === 'refreshing') {
            textEl.innerHTML = this.options.refreshText;
        }
    };

    proto.ontouchstart = function(e) {
        if (this.shouldPullToRefresh()) {
            pullStartY = e.touches[0].screenY;
        }

        if (_state !== 'pending') {
            return;
        }

        _state = 'pending';

        this.update();
    };

    proto.resistanceFunction = function(t) {
        return Math.min(1, t / 2.5);
    };

    proto.ontouchmove = function(e) {

        pullMoveY = e.touches[0].screenY;

        if (_state === 'refreshing') {

            // 在 second.html 中，如果使用下面的代码，就无法向上滑动
            // if (this.shouldPullToRefresh() && pullStartY < pullMoveY) {
            //     e.preventDefault();
            // }

            return;
        }

        if (_state === 'pending') {
            this.refreshElem.classList.add(("pull"));
            _state = 'pulling';
            this.update();
        }

        // 计算手指移动距离
        if (pullStartY && pullMoveY) {
            dist = pullMoveY - pullStartY;
        }

        if (dist > 0) {
            // 阻止默认的滚动事件，如果不阻止，既会触发下拉刷新又会滚动页面
            e.preventDefault();

            this.refreshElem.style.minHeight = distResisted + "px";

            distResisted = this.resistanceFunction(dist / this.options.threshold) *
                Math.min(this.options.max, dist);

            if (_state === 'pulling' && distResisted > this.options.threshold) {
                this.refreshElem.classList.add("release");
                _state = 'releasing';
                this.update();
            }

            if (_state === 'releasing' && distResisted < this.options.threshold) {
                this.refreshElem.classList.remove("release");
                _state = 'pulling';
                this.update();
            }
        }
    };

    proto.ontouchend = function() {

        if (_state === 'releasing' && distResisted > this.options.threshold) {
            _state = 'refreshing';

            this.refreshElem.style["minHeight"] = this.options.reloadHeight + "px";
            this.refreshElem.classList.add("refresh");

            if (typeof this.options.onRefresh === 'function') {
                this.options.onRefresh(this.onReset.bind(this));
            }

        } else {
            if (_state === 'refreshing') {
                return;
            }

            this.refreshElem.style["minHeight"] = '0px';

            _state = 'pending';
        }

        this.update();

        this.refreshElem.classList.remove("release");
        this.refreshElem.classList.remove("pull");

        pullStartY = pullMoveY = null;
        dist = distResisted = 0;
    };

    proto.onReset = function() {
        this.refreshElem.classList.remove("refresh");
        this.refreshElem.style["min-height"] = '0px';

        _state = 'pending';
    };

    if (typeof exports != 'undefined' && !exports.nodeType) {
        if (typeof module != 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = PullToRefresh;
        }
        exports.PullToRefresh = PullToRefresh;
    } else {
        root.PullToRefresh = PullToRefresh;
    }

}());