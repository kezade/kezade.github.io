document.addEventListener("DOMContentLoaded", () => {
    //memos module
    const doubanBookDom = document.querySelector('#douban-book') || '';
    let domain = '';
    if (doubanBookDom) {
        memosDouban(5);
    }

    //load Memos豆瓣
    function memosDouban(count) {
        var movieUrl = '';
        if (typeof (myBooks) !== "undefined") {
            movieUrl = myBooks.url;
            domain = myBooks.domain;
        }
        let limit = count || 8;

        var localDoubanBookUpdated = JSON.parse(localStorage.getItem("doubanBookUpdated")) || '';
        var localDoubanBookData = JSON.parse(localStorage.getItem("doubanBookData")) || '';
        if (localDoubanBookData) {
            loadDoubanBooks(localDoubanBookData, limit)
            console.log("memosDoubanBook 本地数据加载成功")
        } else {
            localStorage.setItem("doubanBookUpdated", "")
        }
        fetch(movieUrl).then(res => res.json()).then(resdata => {
            var doubanBookUpdated = leonus.formatTimestamp(Date.parse(resdata.data[0].created_time) / 1000);
            if (doubanBookUpdated && localDoubanBookUpdated != doubanBookUpdated) {
                var doubanBookData = resdata.data
                //开始布局
                loadDoubanBooks(doubanBookData, limit)
                localStorage.setItem("doubanBookUpdated", JSON.stringify(doubanBookUpdated))
                localStorage.setItem("doubanBookData", JSON.stringify(doubanBookData))
                console.log("memosDoubanBook 热更新完成")
            } else {
                console.log("memosDoubanBook API 数据未更新")
            }
        });
    }

    //loading
    function loadDoubanBooks(doubanMovieData, limit) {
        let nowNum = 0;
        doubanMovieData.forEach(ddd => {
            if (ddd && nowNum < limit) {
                var item = ddd.item;
                var db_type = item.category;
                var db_id = item.uuid;
                nowNum++;
                var this_item = db_type + '-' + db_id;
                var url = domain + item.url;
                if (localStorage.getItem(this_item) == null || localStorage.getItem(this_item) === 'undefined') {
                    localStorage.setItem(this_item, JSON.stringify(item));
                    bookShow(url, this_item, doubanBookDom)
                } else {
                    bookShow(url, this_item, doubanBookDom)
                }
            }
        });//end of  for
        window.Lately && Lately.init({target: '.photo-time'});
    }

});

function bookShow(fetch_href, fetch_item, doubanBookDom) {
    var storage = localStorage.getItem(fetch_item);
    var data = JSON.parse(storage);
    var db_star = data.rating || 8;
    var allstarPercent = toPercent(db_star / 10);
    var img = data.cover_image_url;
    var title = data.title;
    var html = '';

    html += `<div class="dfdORB"><div class="sc-hKFxyN HPRth"><div class="lazyload-wrapper"><img class="avatar" src="${img}" referrer-policy="no-referrer" loading="lazy" alt="${title}" title="${title}" width="150" height="220" /></div></div><div class="sc-fujyAs eysHZq"><div class="rating"><span class="allstardark"><span class="allstarlight" style="width:${allstarPercent}"></span></span><span class="rating_nums">${db_star}</span></div></div><div class="sc-iCoGMd kMthTr"><a rel="noreferrer" href="${fetch_href}" target="_blank">${title}</a></div></div>`;
    if (doubanBookDom) {
        doubanBookDom.insertAdjacentHTML('beforeend', html);
    }
}

//小数-百分数
function toPercent(point) {
    var str = Number(point * 100).toFixed(1);
    str += "%";
    return str;
}