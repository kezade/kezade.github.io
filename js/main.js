// Lazyload Start
(function () {
    function logElementEvent(eventName, element) {
        console.log(Date.now(), eventName, element.getAttribute("data-src"));
    }

    var callback_enter = function (element) {
        logElementEvent("🔑 ENTERED", element);
    };
    var callback_exit = function (element) {
        logElementEvent("🚪 EXITED", element);
    };
    var callback_loading = function (element) {
        logElementEvent("⌚ LOADING", element);
    };
    var callback_loaded = function (element) {
        logElementEvent("👍 LOADED", element);
    };
    var callback_error = function (element) {
        logElementEvent("💀 ERROR", element);
        element.src = "/assets/img/error.png";
    };
    var callback_finish = function () {
        logElementEvent("✔️ FINISHED", document.documentElement);
    };
    var callback_cancel = function (element) {
        logElementEvent("🔥 CANCEL", element);
    };

    var ll = new LazyLoad({
        class_applied: "lz-applied",
        class_loading: "lz-loading",
        class_loaded: "lz-loaded",
        class_error: "lz-error",
        class_entered: "lz-entered",
        class_exited: "lz-exited",
        // Assign the callbacks defined above
        callback_enter: callback_enter,
        callback_exit: callback_exit,
        callback_cancel: callback_cancel,
        callback_loading: callback_loading,
        callback_loaded: callback_loaded,
        callback_error: callback_error,
        callback_finish: callback_finish
    });
})();
// Lazyload End

// 解析 TAG 标签，添加样式
const TAG_REG = /#([^\s#]+?)\s/g;
// 解析 BiliBili
const BILIBILI_REG = /<a\shref="https:\/\/www\.bilibili\.com\/video\/((av[\d]{1,10})|(BV([\w]{10})))\/?">.*<\/a>/g;
// 解析网易云音乐
const NETEASE_MUSIC_REG = /<a\shref="https:\/\/music\.163\.com\/.*id=([0-9]+)".*?>.*<\/a>/g;
// 解析 QQ 音乐
const QQMUSIC_REG = /<a\shref="https\:\/\/y\.qq\.com\/.*(\/[0-9a-zA-Z]+)(\.html)?".*?>.*?<\/a>/g;
// 解析腾讯视频
const QQVIDEO_REG = /<a\shref="https:\/\/v\.qq\.com\/.*\/([a-z|A-Z|0-9]+)\.html".*?>.*<\/a>/g;
// 解析 Spotify
const SPOTIFY_REG = /<a\shref="https:\/\/open\.spotify\.com\/(track|album)\/([\s\S]+)".*?>.*<\/a>/g;
// 解析优酷视频
const YOUKU_REG = /<a\shref="https:\/\/v\.youku\.com\/.*\/id_([a-z|A-Z|0-9|==]+)\.html".*?>.*<\/a>/g;
//解析 Youtube
const YOUTUBE_REG = /<a\shref="https:\/\/www\.youtube\.com\/watch\?v\=([a-z|A-Z|0-9]{11})\".*?>.*<\/a>/g;
//去除markdown图片
const MARKDOWN_PICS = /\!\[.*?\]\(.*?\)/g;
//去除```...```整个包裹内容
const ANTI_REFS = /```([\W\w]+)```/g;
//去除<pre>
const HTML_PRE=/\<pre\>[\W\w]+\<\/pre\>/g;
//内置图片，被markedjs解析的，干掉
const MARKED_JS_PICS=/\<div class\=\"waterfall\" id\=\"encrypt\-blog\"\>.*\<\/div\>/g;

var limit = memos.limit
var memoUrl = memos.host + memos.path + "?creatorId=" + memos.creatorId + "&rowStatus=NORMAL"
var page = 1,
    offset = 0,
    nextLength = 0,
    nextDom = '';
var tag = '';
var btnRemove = 0
var memoDom = document.querySelector(memos.domId);
var load = '<button class="load-btn button-load">努力加载中……</button>'
if (memoDom) {
    memoDom.insertAdjacentHTML('afterend', load);
    getFirstList() // 首次加载数据
    // 添加 button 事件监听器
    btnRemove = 0;
    var btn = document.querySelector("button.button-load");
    btn.addEventListener("click", function () {
        btn.textContent = '努力加载中……';
        updateHTMl(nextDom)
        if (nextLength < limit) { // 返回数据条数小于限制条数，隐藏
            document.querySelector("button.button-load").remove()
            btnRemove = 1
            return
        }
        getNextList()
    });
}

function getFirstList() {
    var memoUrl_first = memoUrl + "&limit=" + limit;
    fetch(memoUrl_first).then(res => res.json()).then(resdata => {
        updateTwikoo(resdata)
        var nowLength = resdata.length
        if (nowLength < limit) { // 返回数据条数小于 limit 则直接移除“加载更多”按钮，中断预加载
            document.querySelector("button.button-load").remove()
            btnRemove = 1
            return
        }
        page++
        offset = limit * (page - 1)
        getNextList()
    });
}

// 预加载下一页数据
function getNextList() {
    if (tag) {
        var memoUrl_next = memoUrl + "&limit=" + limit + "&offset=" + offset + "&tag=" + tag;
    } else {
        var memoUrl_next = memoUrl + "&limit=" + limit + "&offset=" + offset;
    }
    fetch(memoUrl_next).then(res => res.json()).then(resdata => {
        nextDom = resdata
        nextLength = nextDom.length
        page++
        offset = limit * (page - 1)
        if (nextLength < 1) { // 返回数据条数为 0 ，隐藏
            document.querySelector("button.button-load").remove()
            btnRemove = 1
            return
        }
    })
}

// 标签选择
document.addEventListener('click', function (event) {
    var target = event.target;
    if (target && target.tagName.toLowerCase() === 'a' && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
        event.preventDefault();
        tag = target.getAttribute('href').substring(1).trim(); // 获取标签名
        if (btnRemove) {	// 如果 botton 被 remove
            btnRemove = 0;
            memoDom.insertAdjacentHTML('afterend', load);
            // 添加 button 事件监听器
            var btn = document.querySelector("button.button-load");
            btn.addEventListener("click", function () {
                btn.textContent = '努力加载中……';
                updateHTMl(nextDom)
                if (nextLength < limit) { // 返回数据条数小于限制条数，隐藏
                    document.querySelector("button.button-load").remove()
                    btnRemove = 1
                    return
                }
                getNextList()
            });

        }
        getTagFirstList();
        var filterElem = document.getElementById('tag-filter');
        filterElem.style.display = 'block';	// 显示过滤器
        var tags = document.getElementById('tags');
        var tagresult = `Filter: <span class='tag-span'><a rel='noopener noreferrer' href=''>#${tag}</a></span>`
        tags.innerHTML = tagresult;
        scrollTo(0, 0);	// 回到顶部
    }

    //关闭哔哔页面所有的按钮集合窗口
    var yourClassElements = document.getElementsByClassName('btnsContainer');
    var targetClassElements = document.getElementsByClassName('more-action-btns-wrapper');
    var clickedInsideYourClass = false;
    for (var i = 0; i < yourClassElements.length; i++) {
        if (target === yourClassElements[i] || yourClassElements[i].contains(target)) {
            clickedInsideYourClass = true;
            break;
        }
    }

    if (!clickedInsideYourClass) {
        for (var i = 0; i < targetClassElements.length; i++) {
            if (!targetClassElements[i].classList.contains('d-none')) {
                targetClassElements[i].classList.add('d-none');
            }
        }
    }
});

function getTagFirstList() {
    page = 1;
    offset = 0;
    nextLength = 0;
    nextDom = '';
    memoDom.innerHTML = "";
    var memoUrl_tag = memoUrl + "&limit=" + limit + "&tag=" + tag;
    fetch(memoUrl_tag).then(res => res.json()).then(resdata => {
        updateTwikoo(resdata);
        var nowLength = resdata.length
        if (nowLength < limit) { // 返回数据条数小于 limit 则直接移除“加载更多”按钮，中断预加载
            document.querySelector("button.button-load").remove()
            btnRemove = 1
            return
        }
        page++
        offset = limit * (page - 1)
        getNextList()
    });
}

// 标签选择 end

function updateTwikoo(data) {
    var twiID = data.map((item) => memos.host + "m/" + item.id);
    twikoo.getCommentsCount({
        envId: envId, // 环境 ID
        urls: twiID,
        includeReply: true // 评论数是否包括回复，默认：false
    }).then(function (res) {
        updateCount(res)
    }).catch(function (err) {
        console.error(err);
    });

    function updateCount(res) {
        var twiCount = res.map((item) => {
            return Object.assign({},{'count':item.count})
        });
        var bbTwikoo = data.map((item,index) => {
            return {...item, ...twiCount[index]};
        });
        updateHTMl(bbTwikoo)
    }
}

// 插入 html
function updateHTMl(data, type) {
    var memoResult = "", resultAll = "";

    // Marked Options
    marked.setOptions({
        breaks: true,
        smartypants: true,
        langPrefix: 'language-',
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, {language}).value;
        },
    });

    // Memos Content
    var isGallery=false;
    for (var i = 0; i < data.length; i++) {
        var memoContREG = data[i].content
            .replace(TAG_REG, "<span class='tag-span'><a rel='noopener noreferrer' href='#$1'>#$1</a></span>")

        if (memoContREG.indexOf('#相册') > 0) {
            isGallery = true;
        }
        // For CJK language users
        // 用 PanguJS 自动处理中英文混合排版
        // 在 index.html 引入 JS：<script type="text/javascript" src="assets/js/pangu.min.js?v=4.0.7"></script>
        // 把下面的 memoContREG = marked.parse(memoContREG) 改为：memoContREG = marked.parse(pangu.spacing(memoContREG))
        //如果用这个的话，会把【#说说】这种tag修改为【# 说说】，对于memos通过tag去过滤查询会有影响。
        // 若仍然想使用pangu，可在136行末尾，加上【.trim()】，去除前后空格可解决。
        memoContREG = marked.parse(pangu.spacing(memoContREG))
            .replace(BILIBILI_REG, "<div class='video-wrapper'><iframe src='//player.bilibili.com/player.html?bvid=$1&as_wide=1&high_quality=1&danmaku=0' scrolling='no' border='0' frameborder='no' framespacing='0' allowfullscreen='true' style='position:absolute;height:100%;width:100%;'></iframe></div>")
            .replace(YOUTUBE_REG, "<div class='video-wrapper'><iframe src='https://www.youtube.com/embed/$1' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen title='YouTube Video'></iframe></div>")
            .replace(NETEASE_MUSIC_REG, "<meting-js auto='https://music.163.com/#/song?id=$1'></meting-js>")
            .replace(QQMUSIC_REG, "<meting-js auto='https://y.qq.com/n/yqq/song$1.html'></meting-js>")
            .replace(QQVIDEO_REG, "<div class='video-wrapper'><iframe src='//v.qq.com/iframe/player.html?vid=$1' allowFullScreen='true' frameborder='no'></iframe></div>")
            .replace(SPOTIFY_REG, "<div class='spotify-wrapper'><iframe style='border-radius:12px' src='https://open.spotify.com/embed/$1/$2?utm_source=generator&theme=0' width='100%' frameBorder='0' allowfullscreen='' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy'></iframe></div>")
            .replace(YOUKU_REG, "<div class='video-wrapper'><iframe src='https://player.youku.com/embed/$1' frameborder=0 'allowfullscreen'></iframe></div>")
            .replace(YOUTUBE_REG, "<div class='video-wrapper'><iframe src='https://www.youtube.com/embed/$1' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen title='YouTube Video'></iframe></div>")

        memoContREG += leonus.procBiBi(memos.host, data[i], 'resimg', envId);
        //去除md图片、反引用内容
        if (isGallery) {
            memoContREG = memoContREG.replace(MARKDOWN_PICS, '').replace(ANTI_REFS, '').replace(HTML_PRE, '');
            isGallery = false;
        }
        //删除markedjs解析的memos内置图片
        memoContREG = memoContREG.replace(MARKED_JS_PICS, '');
        //置顶
        var pinnedFlag = data[i].pinned;
        let pinnedHtml = '';
        if (pinnedFlag){
            pinnedHtml += `<div title="置顶"><svg class="memos__verify" width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-a744ea7b4e0022c)"><path d="M10.6963 17.5042C13.3347 14.8657 16.4701 14.9387 19.8781 16.8076L32.62 9.74509L31.8989 4.78683L43.2126 16.1005L38.2656 15.3907L31.1918 28.1214C32.9752 31.7589 33.1337 34.6647 30.4953 37.3032C30.4953 37.3032 26.235 33.0429 22.7171 29.525L6.44305 41.5564L18.4382 25.2461C14.9202 21.7281 10.6963 17.5042 10.6963 17.5042Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/></g><defs><clipPath id="icon-a744ea7b4e0022c"><rect width="48" height="48" fill="#333"/></clipPath></defs></svg></div>`;
        }
        //按钮集合
        let btnsContainerDiv = procBtns(memos.host, data[i].id, pinnedFlag);

        //拼接完整，成为一个memos
        memoResult += '<li class="timeline"><div class="memos__content"><div class="memos__text"><div class="memos__userinfo"><div>' + memos.name + '</div><div class="memos__svg"><div title="认证账号"><svg viewBox="0 0 24 24" class="memos__verify"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path></g></svg></div>' +pinnedHtml + '</div><div class="memos__id">@' + memos.username + '</div>' + btnsContainerDiv + '</div><p>' + memoContREG + '</p></div><div class="memos__meta"><small class="memos__date">' + moment(data[i].createdTs * 1000).twitter() + ' • 来自「<a href="' + memos.host + 'm/' + data[i].id + '" target="_blank">鑫鑫心情</a>」</small></div></div></li>'
    }
    var memoBefore = '<ul id="memosList">'
    var memoAfter = '</ul>'
    resultAll = memoBefore + memoResult + memoAfter
    //type=true,放在最前面；否则，默认放在最后。
    if(type){
        //放在已有的ul的子元素第一位
        document.querySelector('#memosList').insertAdjacentHTML('afterbegin', memoResult);
    } else {
        memoDom.insertAdjacentHTML('beforeend', resultAll);
    }
    //解析豆瓣电影和豆瓣阅读
    // leonus.fetchNeoDB()
    if (document.querySelector('button.button-load')) {
        document.querySelector('button.button-load').textContent = '加载更多';
    }
}

// Memos End

//处理按钮集合
function procBtns(memosUrl, memosId, pinnedFlag) {
    let btnSet = leonus.getBtnSet(memosUrl, memosId, pinnedFlag);
    if (!btnSet) {
        return '';
    }
    return `
        <div class="btnsContainer">
            <span class="more-action-btn" onclick="showBtns('btns_${memosId}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-img"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></span>
        </div>
        <div class="more-action-btns-wrapper d-none" id="btns_${memosId}">
            <div class="more-action-btns-container min-w-[6em]">${btnSet}</div>
       </div>`;
}

function showBtns(btnId) {
    //将其他打开的按钮列表都关掉
    $('.more-action-btns-wrapper:not(.d-none):not(#'+btnId+')').addClass('d-none');
    $('#' + btnId).toggleClass('d-none');
}

// 解析豆瓣 Start
// 文章内显示豆瓣条目 https://immmmm.com/post-show-douban-item/
// 解析豆瓣必须要API，请找朋友要权限，或自己按 https://github.com/eallion/douban-api-rs 这个架设 API，非常简单，资源消耗很少
// 已内置样式，修改 API 即可使用
function fetchDB() {
    var dbAPI = "https://douban-api.edui.fun/";  // 修改为自己的 API
    var dbA = document.querySelectorAll(".timeline a[href*='douban.com/subject/']:not([rel='noreferrer'])") || '';
    if (dbA) {
        for (var i = 0; i < dbA.length; i++) {
            _this = dbA[i]
            var dbHref = _this.href
            var db_reg = /^https\:\/\/(movie|book)\.douban\.com\/subject\/([0-9]+)\/?/;
            var db_type = dbHref.replace(db_reg, "$1");
            var db_id = dbHref.replace(db_reg, "$2").toString();
            if (db_type === 'movie') {
                var this_item = 'movie' + db_id;
                var url = dbAPI + "movies/" + db_id;
                if (localStorage.getItem(this_item) == null || localStorage.getItem(this_item) === 'undefined') {
                    fetch(url).then(res => res.json()).then(data => {
                        let fetch_item = 'movies' + data.sid;
                        let fetch_href = "https://movie.douban.com/subject/" + data.sid + "/"
                        localStorage.setItem(fetch_item, JSON.stringify(data));
                        movieShow(fetch_href, fetch_item)
                    });
                } else {
                    movieShow(dbHref, this_item)
                }
            } else if (db_type === 'book') {
                var this_item = 'book' + db_id;
                var url = dbAPI + "v2/book/id/" + db_id;
                if (localStorage.getItem(this_item) == null || localStorage.getItem(this_item) === 'undefined') {
                    fetch(url).then(res => res.json()).then(data => {
                        let fetch_item = 'book' + data.id;
                        let fetch_href = "https://book.douban.com/subject/" + data.id + "/"
                        localStorage.setItem(fetch_item, JSON.stringify(data));
                        bookShow(fetch_href, fetch_item)
                    });
                } else {
                    bookShow(dbHref, this_item)
                }
            }
        }// for end
    }
}

function movieShow(fetch_href, fetch_item) {
    var storage = localStorage.getItem(fetch_item);
    var data = JSON.parse(storage);
    var db_star = Math.ceil(data.rating);
    var db_html = "<div class='post-preview'><div class='post-preview--meta'><div class='post-preview--middle'><h4 class='post-preview--title'><a target='_blank' rel='noreferrer' href='" + fetch_href + "'>《" + data.name + "》</a></h4><div class='rating'><div class='rating-star allstar" + db_star + "'></div><div class='rating-average'>" + data.rating + "</div></div><time class='post-preview--date'>导演：" + data.director + " / 类型：" + data.genre + " / " + data.year + "</time><section class='post-preview--excerpt'>" + data.intro.replace(/\s*/g, "") + "</section></div></div><img referrer-policy='no-referrer' loading='lazy' class='post-preview--image' src=" + data.img + "></div>"
    var db_div = document.createElement("div");
    var qs_href = ".timeline a[href='" + fetch_href + "']"
    var qs_dom = document.querySelector(qs_href)
    qs_dom.parentNode.replaceChild(db_div, qs_dom);
    db_div.innerHTML = db_html
}

function bookShow(fetch_href, fetch_item) {
    var storage = localStorage.getItem(fetch_item);
    var data = JSON.parse(storage);
    var db_star = Math.ceil(data.rating.average);
    var db_html = "<div class='post-preview'><div class='post-preview--meta'><div class='post-preview--middle'><h4 class='post-preview--title'><a target='_blank' rel='noreferrer' href='" + fetch_href + "'>《" + data.title + "》</a></h4><div class='rating'><div class='rating-star allstar" + db_star + "'></div><div class='rating-average'>" + data.rating.average + "</div></div><time class='post-preview--date'>作者：" + data.author + " </time><section class='post-preview--excerpt'>" + data.summary.replace(/\s*/g, "") + "</section></div></div><img referrer-policy='no-referrer' loading='lazy' class='post-preview--image' src=" + data.images.medium + "></div>"
    var db_div = document.createElement("div");
    var qs_href = ".timeline a[href='" + fetch_href + "']"
    var qs_dom = document.querySelector(qs_href)
    qs_dom.parentNode.replaceChild(db_div, qs_dom);
    db_div.innerHTML = db_html
}

// 解析豆瓣 End

// Images lightbox
window.ViewImage && ViewImage.init('.container img');

// Memos Total Start
// Get Memos total count
function getTotal() {
    var totalUrl = memos.host + memos.path + "/stats?creatorId=" + memos.creatorId
    fetch(totalUrl).then(res => res.json()).then(resdata => {
        if (resdata) {
            var allnums = resdata.length
            var memosCount = document.getElementById('total');
            memosCount.innerHTML = allnums;
        }
    }).catch(err => {
        // Do something for an error here
    });
};
window.onload = getTotal();
// Memos Total End

// Toggle Darkmode
const localTheme = window.localStorage && window.localStorage.getItem("theme");
const themeToggle = document.querySelector(".theme-toggle");
const postToggle = document.querySelector("#toggleButton");

if (localTheme) {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(localTheme);
}

themeToggle.addEventListener("click", () => {
    const themeUndefined = !new RegExp("(dark|light)-theme").test(document.body.className);
    const isOSDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (themeUndefined) {
        if (isOSDark) {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.add("dark-theme");
        }
    } else {
        document.body.classList.toggle("light-theme");
        document.body.classList.toggle("dark-theme");
    }

    window.localStorage &&
    window.localStorage.setItem(
        "theme",
        document.body.classList.contains("dark-theme") ? "dark-theme" : "light-theme",
    );
});
postToggle.addEventListener('click',()=>{
    $("#memoPage").toggleClass("d-none");
    let isHide=true;
    if($("#memoPage").hasClass("d-none")){
        isHide = true;
    } else {
        isHide = false;
    }
    localStorage.setItem("memos-editor-display", isHide);
});
// Darkmode End
