document.addEventListener("DOMContentLoaded", () => {
// 获取neodb-movie元素
    const neodbMovieDom = document.getElementById('neodb-movie');
    const lastUpdatedDom = document.querySelector('#lastUpdated') || '';
    if (neodbMovieDom) {
        load(30);
    }

    // 准备movies数据
    function load(count) {
        let limit = count || 30;
        //cache
        var localCirclesUpdated = JSON.parse(localStorage.getItem("localMovieCount")) || '';
        var localUpdatedTime = JSON.parse(localStorage.getItem("movieLastUpdatedTime")) || '';
        var localCirclesData = JSON.parse(localStorage.getItem("movieDatas")) || '';
        lastUpdatedDom.innerText = "最后更新：" + localUpdatedTime;
        if (localCirclesData) {
            loadNeoMovies(localCirclesData, limit)
            console.log("neoMovie 本地数据加载成功")
        } else {
            localStorage.setItem("localMovieCount", "")
        }
        let url = null;
        if (typeof (myMovies) !== "undefined") {
            url = myMovies.url;
        }
        //开始加载远端json，可以通过json列表中第一条的创建时间created_time判断是否更新了，若更新了就加载远端，否则，不调用远端接口
        if (url === null || '' === url) {
            console.warn("NeoDB Movie url is null or blank.")
            return;
        }
        //start to fetch
        fetch(url).then(res => res.json()).then(resdata => {
            var remoteMovieCount = resdata.count;
            if (remoteMovieCount && localCirclesUpdated !== remoteMovieCount) {
                var movieDatas = resdata.data;
                var lastUpdatedTime = leonus.formatTimestamp(Date.parse(movieDatas[0].created_time) / 1000);
                lastUpdatedDom.innerText = "最后更新：" + lastUpdatedTime
                //开始布局
                loadNeoMovies(movieDatas, limit)
                localStorage.setItem("movieLastUpdatedTime", JSON.stringify(lastUpdatedTime))
                localStorage.setItem("localMovieCount", JSON.stringify(remoteMovieCount))
                localStorage.setItem("movieDatas", JSON.stringify(movieDatas))
                console.log("neoMovie 热更新完成")
            } else {
                console.log("neoMovie API 数据未更新")
            }
        });//end of fetch
    }

    //开始拼装
    function loadNeoMovies(movies, limit) {
        // 构建HTML字符串
        var html = '';
        for (var i = 0, len = movies.length; i < len && i < limit; i++) {
            var m = movies[i];
            var item = m.item;
            var $title = item.display_title;
            var $rating = item.rating || 8;
            var $movie_url = item.url;
            var $cover = item.cover_image_url;
            var $hasDouban = false;
            var title_html = '';
            var rating_html = '';
            var referrer_html = '';
            var cover_container_html_children = '';

            //rating
            for (var $star = 0; $star <= 8; $star += 2) {
                if ($rating > $star) {
                    rating_html += `
                         <span>
                            <svg viewBox="0 0 24 24" width="24" height="24" class="stars">
                                <path fill="none" d="M0 0h24v24H0z"></path>
                                <path fill="currentColor"
                                      d="M12 18.26l-7.053 3.948 1.575-7.928L.587 8.792l8.027-.952L12 .5l3.386 7.34 8.027.952-5.935 5.488 1.575 7.928z">
                                </path>
                            </svg>
                         </span>`;
                } else {
                    rating_html += ` <span>
                    <svg viewBox="0 0 24 24" width="24" height="24" class="stars white">
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path fill="currentcolor"
                          d="M12 18.26l-7.053 3.948 1.575-7.928L.587 8.792l8.027-.952L12 .5l3.386 7.34 8.027.952-5.935 5.488 1.575 7.928z">
                    </path>
                    </svg>
                    </span>`;
                }
            }

            //external resources
            for (var j = 0, len2 = item.external_resources.length; j < len2; j++) {
                let url = item.external_resources[j].url;
                if (url && url.includes('douban')) {
                    $hasDouban = true;
                    cover_container_html_children += `
                     <a href="${url}" target="_blank" rel="noreferrer noopener nofollow">
                         <img class="cover_image_url" src="${$cover}" loading="lazy" alt="${$title}">
                     </a>`;
                    title_html += `<a href="${url}" target="_blank" rel="noreferrer noopener nofollow">${$title}</a>`;
                }
                if (!$hasDouban) {
                    title_html += `<a href="https://neodb.social${$movie_url}" target="_blank" rel="noreferrer noopener nofollow">${$title}</a>`;
                }

                //referer
                var $parsedURL = new URL(url)
                var $host = $parsedURL.hostname
                var $title2 = item.title
                referrer_html += `
                    <span class="external-resource">
                        <a href="${url}" target="_blank" rel="noreferrer noopener nofollow">
                            <img src="/assets/${$host}.png" loading="lazy" alt="${$title2}">
                        </a>
                 </span>`;
            }

            html += `<div class="movies sorting" data-marked="${m.created_time}" data-year='{{  dateFormat "2006-01-02 15:04:05" m.created_time }}' data-star="${m.rating_grade}" data-rating="${item.rating}" data-count="${item.rating_count}">
                <div class="cover">
                    <div class="cover__container">                    
                        ${cover_container_html_children}
                    </div>
                </div>
                <div class="title">
                    ${title_html}
                </div>
                <div class="rating">
                    ${rating_html}
                     ${$rating}
                    <!-- ( 共 {{ item.rating_count }} 人评分) -->
                </div>
                <div class="referrer">
                    <span class="neodb">
                        <a href="https://neodb.social${$movie_url}" target="_blank" rel="noreferrer noopener nofollow">
                            <img src="/assets/neodbsocial.jpg" loading="lazy" alt="NeoDB">
                        </a>
                    </span>
                     ${referrer_html}
                </div>
            </div>`
        }
        // 将HTML字符串放置在neodb-movie元素中
        neodbMovieDom.innerHTML = html;
    }

});