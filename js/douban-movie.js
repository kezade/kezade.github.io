document.addEventListener("DOMContentLoaded", () => {
    //memos module
    const doubanMovieDom = document.querySelector('#douban-movie') || '';
    let domain = '';
    if (doubanMovieDom) {
        memosDouban(5);
    }

    //load Memos豆瓣
    function memosDouban(count) {
        let movieUrl = '';
        if (typeof (myMovies) !== "undefined") {
            movieUrl = myMovies.url;
            domain = myMovies.domain;
        }
        let limit = count || 8;

        var localDoubanMovieUpdated = JSON.parse(localStorage.getItem("movieLastUpdatedTime")) || '';
        var localDoubanMovieData = JSON.parse(localStorage.getItem("movieDatas")) || '';
        if (localDoubanMovieData) {
            loadDoubanMovies(localDoubanMovieData, limit)
            console.log("memosDoubanMovie 本地数据加载成功")
        } else {
            localStorage.setItem("movieLastUpdatedTime", "")
        }
        fetch(movieUrl).then(res => res.json()).then(resdata => {
            var doubanMovieUpdated = leonus.formatTimestamp(Date.parse(resdata.data[0].created_time) / 1000);
            if (doubanMovieUpdated && localDoubanMovieUpdated != doubanMovieUpdated) {
                var doubanMovieData = resdata.data
                doubanMovieDom.innerHTML = "";
                //开始布局
                loadDoubanMovies(doubanMovieData, limit)
                localStorage.setItem("movieLastUpdatedTime", JSON.stringify(doubanMovieUpdated))
                localStorage.setItem("movieDatas", JSON.stringify(doubanMovieData))
                console.log("memosDoubanMovie 热更新完成")
            } else {
                console.log("memosDoubanMovie API 数据未更新")
            }
        });
    }

    //loading
    function loadDoubanMovies(doubanMovieData, limit) {
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
                    movieShow(url, this_item, doubanMovieDom)
                } else {
                    movieShow(url, this_item, doubanMovieDom)
                }
            }
        });//end of  for
        window.Lately && Lately.init({target: '.photo-time'});
    }

});

function movieShow(fetch_href, fetch_item, doubanMovieDom) {
    var storage = localStorage.getItem(fetch_item);
    var data = JSON.parse(storage);
    var db_star = data.rating || 8;
    var allstarPercent = toPercent(db_star / 10);
    var img = data.cover_image_url;
    var title = data.title;
    var html = '';

    html += `<div class="dfdORB"><div class="sc-hKFxyN HPRth"><div class="lazyload-wrapper"><img class="avatar" src="${img}" referrer-policy="no-referrer" loading="lazy" title="${title}" width="150" height="220" /></div></div><div class="sc-fujyAs eysHZq"><div class="rating"><span class="allstardark"><span class="allstarlight" style="width:${allstarPercent}"></span></span><span class="rating_nums">${db_star}</span></div></div><div class="sc-iCoGMd kMthTr"><a rel="noreferrer" href="${fetch_href}" target="_blank">${title}</a></div></div>`;
    if (doubanMovieDom) {
        doubanMovieDom.insertAdjacentHTML('beforeend', html);
    }
}

//小数-百分数
function toPercent(point) {
    var str = Number(point * 100).toFixed(1);
    str += "%";
    return str;
}