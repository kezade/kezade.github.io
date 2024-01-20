document.addEventListener("DOMContentLoaded", () => {
    //bibi module
    var quanquanDom = document.querySelector('#quanquan') || '';
    if (quanquanDom) {
        quanquan();
    }

    //开始加载json
    function quanquan() {
        var url = null;
        var fetchNum = 20;
        if (typeof (myFriendCircles) !== "undefined") {
            url = myFriendCircles.api;
        }
        //cache
        var localCirclesUpdated = localStorage.getItem("friendCircleUpdated") || '';
        var localCirclesData = JSON.parse(localStorage.getItem("friendCircleData")) || '';
        if (localCirclesData) {
            loadFriendsCircles(localCirclesData, fetchNum)
            console.log("myQuanquan 本地数据加载成功")
        } else {
            localStorage.setItem("friendCircleUpdated", "")
        }
        //开始加载远端json，可以通过statistical_data.last_updated_time判断是否更新了，若更新了就加载远端，否则，不调用远端接口
        if (url === null || '' === url) {
            console.warn("friends-circle url is null or blank.")
            return;
        }
        fetch(url).then(res => res.json()).then(resdata => {
            var friendCircleUpdated = resdata.statistical_data.last_updated_time
            if (friendCircleUpdated && localCirclesUpdated != friendCircleUpdated) {
                var friendCircleData = resdata.article_data;
                //开始布局
                loadFriendsCircles(friendCircleData, fetchNum)
                localStorage.setItem("friendCircleUpdated", friendCircleUpdated)
                localStorage.setItem("friendCircleData", JSON.stringify(friendCircleData))
                console.log("myQuanquan 热更新完成")
            } else {
                console.log("myQuanquan API 数据未更新")
            }
        });//end of fetch
    }

    //loading
    function loadFriendsCircles(friendCircleData, fetchNum) {
        let cnt = friendCircleData.length;
        var html = '';
        var error_img = "https://gravatar.loli.net/avatar/57d8260dfb55501c37dde588e7c3852c";
        for (var i = 0; i < fetchNum && i < cnt; i++) {
            var item = friendCircleData[i];
            html += `
                <div class="forever-item">
                  <img class="forever-avatar avatar" src="${item.avatar}" alt="${item.author}" onerror="this.src='${error_img}';this.onerror = null;">
                  <div class="forever-cont">
                    <div class="forever-title"><a target="_blank" rel="noopener nofollow" href="${item.link}">${item.title}</a></div>
                    <div class="forever-updated">${item.updated}</div>
                  </div>
                </div>
            `;
        }
        quanquanDom.insertAdjacentHTML('beforeend', html);
        window.Lately && Lately.init({target: '.forever-updated'});
    }
})