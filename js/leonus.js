function whenDOMReady() {
    "/message/" == location.pathname && document.body.clientWidth > 768 && leonus.addScript("gsap", "/js/easy-Danmaku.js", leonus.danmu);
    leonus.musicBtn();
    leonus.indexTalk();
    setTimeout(leonus.topCategoriesBarScroll, 50);
    (document.documentElement.scrollTop || window.pageYOffset) && document.getElementById("page-header").classList.add("nav-fixed", "nav-visible")

    if ("/"===location.pathname){
        leonus.addMusic();
    }
}

whenDOMReady();
document.addEventListener("pjax:complete", whenDOMReady);
leonus.cp();
leonus.addMusic();
leonus.musicBtn();
window.onscroll = leonus.percent, window.onresize = () => {
    "/photos/" == location.pathname && waterfall(".gallery-photos");
    "/zone/" == location.pathname && (waterfall("#talk"), setTimeout((() => {
        waterfall("#talk")
    }), 300))
}, window.onkeydown = e => {
    123 === e.keyCode && btf.snackbarShow("开发者模式已打开，请遵循GPL协议")
};