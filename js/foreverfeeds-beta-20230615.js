if (typeof Lately === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://gcore.jsdelivr.net/gh/Tokinx/Lately/lately.min.js';
    script.onload = () => {
        window.Lately && Lately.init({target: '.forever-updated'});
    };
    document.head.appendChild(script);
} else {
    window.Lately && Lately.init({target: '.forever-updated'});
}
document.addEventListener("DOMContentLoaded", () => {
    var foreverDom = document.querySelector('#foreverblog') || ''
    if (foreverDom) {
        ForeverFeeds();
    }

    function ForeverFeeds() {
        var fetchUrl = "https://www.foreverblog.cn/api/v1/blog/feeds?page=1";
        var localforeverData = JSON.parse(localStorage.getItem("foreverData")) || '';
        if (localforeverData) {
            loadforever(localforeverData)
            console.log("Myforevers 本地数据加载成功")
        }
        fetch(fetchUrl).then(res => res.json()).then(resdata => {
            var foreverData = resdata.data
            if (foreverData) {
                foreverDom.innerHTML = "";
                loadforever(foreverData)
                localStorage.setItem("foreverData", JSON.stringify(foreverData))
                console.log("Myforevers 热更新完成")
            } else {
                console.log("Myforevers API 数据未更新")
            }
        })
    }

    function loadforever(foreverData) {
        var foreverArticle = '';
        for (var i = 0; i < 20; i++) {
            var item = foreverData.data[i];
            foreverArticle += `
        <div class="forever-item">
          <img class="forever-avatar avatar" src="https://gravatar.loli.net/avatar/${item.email}" alt="${item.author}">
          <div class="forever-cont">
            <div class="forever-title"><a target="_blank" rel="noopener nofollow" href="${item.link}">${item.title}</a></div>
            <div class="forever-updated">${item.created_at}</div>
          </div>
        </div>
        `;
        }
        foreverDom.innerHTML = foreverArticle
        Lately.init({target: '.forever-updated'});
    }
})