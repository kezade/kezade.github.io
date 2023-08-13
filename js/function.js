"use strict";
var leonus = {
    //解析所有memos内的图片，包括md格式的，内置资源的（上传至memos服务器的图片）
    procMemosGalleries: (memosUrl, memosData, limit, className) => {
        if (!(memosData && memosData.length > 0)) {
            return '';
        }
        let html = '', imgs = [];
        let nowNum = 0;
        memosData.forEach(item => {
            imgs = imgs.concat(item.content.match(/\!\[.*?\]\(.*?\)/g)).concat(leonus.procMemosResources(memosUrl, item));
        });
        imgs.forEach(item => {
            if (item && nowNum < limit) {
                nowNum++
                let img = item.replace(/!\[.*?\]\((.*?)\)/g, '$1'), time, title,
                    tat = item.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
                if (tat.indexOf(' ') !== -1) {
                    time = tat.split(' ')[0];
                    title = tat.split(' ')[1];
                } else title = tat

                html += `<div class="${className}"><a href="${img}" data-fancybox="gallery" class="fancybox" data-thumb="${img}"><img alt="${tat}" class="photo-img" loading='lazy' decoding="async" src="${img}"></a>`;
                title ? html += `<span class="photo-title">${title}</span>` : '';
                time ? html += `<span class="photo-time">${time}</span>` : '';
                html += `</div>`;
            }
        });
        return html;
    },
    //最终需要酱紫：![xxx](url)
    procMemosResources: (memosUrl, item) => {
        if (!(item && item.resourceList && 0 < item.resourceList.length) || !memosUrl) {
            return '';
        }
        let content = item.content;
        //取最后一个空格后的值为标题
        let titleConts = content.replace("\n", '').split(' ');
        let title = titleConts[titleConts.length - 1];
        let resourceList = item.resourceList;
        let picsUrlLikeMd = '';
        for (var j = 0; j < resourceList.length; j++) {
            var restype = resourceList[j].type.slice(0, 5);
            var resexlink = resourceList[j].externalLink
            var resLink = '', fileId = '';
            var createdDate = new Date(resourceList[j].createdTs * 1000);
            var dt = [createdDate.getFullYear(), createdDate.getMonth() + 1, createdDate.getDate()].join('-');
            if (resexlink) {
                resLink = resexlink
            } else {
                fileId = resourceList[j].publicId || resourceList[j].filename
                resLink = memosUrl + 'o/r/' + resourceList[j].id + '/' + fileId
            }
            if (restype === 'image') {
                if (!title) {
                    picsUrlLikeMd += `![${dt}](${resLink})`;
                } else {
                    picsUrlLikeMd += `![${dt} ${title}](${resLink})`;
                }
            }
        }
        return picsUrlLikeMd.match(/\!\[.*?\]\(.*?\)/g);
    },
    /**
     * 处理哔哔页面memos
     * @param memosUrl memos domain
     * @param singleData single memos data
     * @param className dom
     * @param envId twikoo envId
     * @returns {string}
     */
    procBiBi: (memosUrl, singleData, className, envId) => {
        var memoContREG = '';
        //解析md图片
        let imgMds = [];
        imgMds = imgMds.concat(singleData.content.match(/\!\[.*?\]\(.*?\)/g));
        if (imgMds && imgMds.length > 0) {
            let imgUrl = '';
            imgMds.forEach(item => {
                if (item) {
                    let imgSrc = item.replace(/!\[.*?\]\((.*?)\)/g, '$1');
                    let tat = item.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
                    imgUrl += `<div class="${className}"><a href="${imgSrc}" data-fancybox="gallery" class="fancybox" data-thumb="${imgSrc}"><img alt="${tat}" loading="lazy" src="${imgSrc}"/></a></div>`;
                }
            });
            if (imgUrl) {
                memoContREG += `<div class="resource-wrapper "><div class="images-wrapper">${imgUrl}</div></div>`;
            }
        }
        // 解析内置资源文件
        if (singleData && singleData.resourceList && singleData.resourceList.length > 0) {
            var resourceList = singleData.resourceList;
            var imgUrl = '', resUrl = '', resImgLength = 0;
            for (var j = 0; j < resourceList.length; j++) {
                var resType = resourceList[j].type.slice(0, 5);
                var resexlink = resourceList[j].externalLink;
                var resLink = '', fileId;
                if (resexlink) {
                    resLink = resexlink
                } else {
                    fileId = resourceList[j].publicId || resourceList[j].filename
                    resLink = memosUrl + 'o/r/' + resourceList[j].id + '/' + fileId
                }
                if (resType === 'image') {
                    imgUrl += `<div class="resimg"><a href="${resLink}" data-fancybox="gallery" class="fancybox" data-thumb="${resLink}"><img loading="lazy" src="${resLink}"/></a></div>`;
                    resImgLength = resImgLength + 1
                }
                if (resType !== 'image') {
                    resUrl += '<a target="_blank" rel="noreferrer" href="' + resLink + '">' + resourceList[j].filename + '</a>'
                }
            } //end of for
            if (imgUrl) {
                memoContREG += `<div class="resource-wrapper "><div class="images-wrapper">${imgUrl}</div></div>`;
            }
            if (resUrl) {
                memoContREG += `<div class="resource-wrapper "><p class="datasource">${resUrl}</p></div>`;
            }
        }

        //twikoo + forward + edit
        let memosId = singleData.id;
        let memosForm = leonus.getMemosForm(memosUrl, singleData);
        memoContREG += `<div class="memos__comments"><a class="artalk-div"onclick="leonus.loadTwikoo('${memosUrl}', ${memosId}, '${envId}')" rel="noopener noreferrer" title="评论"><i class="fas fa-comment-dots fa-fw"></i></a><a onclick="leonus.transPond(${memosForm})" rel="noopener noreferrer" title="转发"><i class="fa-solid fa-share-from-square"></i></a></div><div id="memos_${memosId}"class='twikoo-body item-content d-none'></div>`;
        return memoContREG;
    },
    //twikoo
    loadTwikoo: (memosUrl, memosId, envId) => {
        var twikooDom = document.querySelector('#memos_' + memosId);
        var twikooCon = "<div id='twikoo'></div>"
        if (twikooDom.classList.contains('d-none')) {
            document.querySelectorAll('.twikoo-body').forEach((item) => {
                item.classList.add('d-none');
            })
            if (document.getElementById("twikoo")) {
                document.getElementById("twikoo").remove() //如果页面中已经有其他Twikoo初始化，则移除。
            }
            twikooDom.insertAdjacentHTML('beforeend', twikooCon);
            twikooDom.classList.remove('d-none');
            twikoo.init({
                envId: envId, el: '#twikoo', path: memosUrl + "/m/" + memosId
            });
        } else {
            twikooDom.classList.add('d-none');
            document.getElementById("twikoo").remove()
        }
    },
    //time formation
    formatTimestamp: (value) => {
        if (value) {
            let date = new Date(value * 1000);    // 时间戳为秒：10位数
            //let date = new Date(value); // 时间戳为毫秒：13位数
            let year = date.getFullYear();
            let month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
            let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
            let hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
            let minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
            let second = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
            if (new Date().getFullYear() === year) {
                return `${month}-${day} ${hour}:${minute}:${second}`;
            } else {
                return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            }
        } else {
            return ''
        }
    },
    //好物
    memoGoods: (numb, goodsDom) => {
        let limit = numb || 30;
        // Memos Start
        var memo = {
            host: 'https://demo.usememos.com/',
            limit: '10',
            creatorId: '101',
            domId: '#memos',
            username: 'Admin',
            name: 'Administrator',
            path: ''
        }
        if (typeof (memos) !== "undefined") {
            for (var key in memos) {
                if (memos[key]) {
                    memo[key] = memos[key];
                }
            }
        }
        var goodsUrl = memo.host + memo.path + "?creatorId=" + memo.creatorId + "&tag=好物";
        var localalbumUpdated = JSON.parse(localStorage.getItem("goodsUpdated")) || '';
        var localalbumData = JSON.parse(localStorage.getItem("goodsData")) || '';
        if (localalbumData) {
            leonus.loadGoods(localalbumData, limit, memo.host, goodsDom)
            console.log("memosGoods 本地数据加载成功")
        } else {
            localStorage.setItem("goodsUpdated", "")
        }
        fetch(goodsUrl).then(res => res.json()).then(resdata => {
            var goodsUpdated = resdata[0].updatedTs
            if (goodsUpdated && localalbumUpdated !== goodsUpdated) {
                var goodsData = resdata
                //开始布局
                leonus.loadGoods(goodsData, limit, memo.host, goodsDom)
                localStorage.setItem("goodsUpdated", JSON.stringify(goodsUpdated))
                localStorage.setItem("goodsData", JSON.stringify(goodsData))
                console.log("memosGoods 热更新完成")
            } else {
                console.log("memosGoods API 数据未更新")
            }
        });
    },
    //渲染好物
    loadGoods: (data, limit, memosUrl, goodsDom) => {
        let nowNum = 1;
        const regex = /\n/;
        // 格式：#好物 \n价格\n标题（可链接）\n描述
        var result = '', resultAll = "";
        for (var i = 0; i < data.length && i < limit; i++) {
            if (nowNum <= limit) {
                var goodsCont = data[i].content.replace("#好物 \n", '')
                var goodsConts = goodsCont.split(regex)
                //解析memos内置资源文件(我一般不用memos上传图片，节省空间，用CDN或外链接)
                if (data[i].resourceList && data[i].resourceList.length > 0) {
                    var resourceList = data[i].resourceList;
                    for (var j = 0; j < resourceList.length; j++) {
                        var restype = resourceList[j].type.slice(0, 5);
                        var resexlink = resourceList[j].externalLink
                        var resLink = '', fileId = ''
                        if (resexlink) {
                            resLink = resexlink
                        } else {
                            fileId = resourceList[j].publicId || resourceList[j].filename
                            resLink = memosUrl + 'o/r/' + resourceList[j].id + '/' + fileId
                        }
                        if (restype === 'image' && nowNum <= limit) {
                            result += '<div class="goods-bankuai img-hide"><div class="goods-duiqi memos-photo"><a href="${resLink}" data-fancybox="gallery" class="fancybox" data-thumb="${resLink}" rel="noreferrer noopener nofollow"><img loading="lazy" decoding="async" src="' + resLink + '"/></a></div><div class="goods-jiage">' + goodsConts[0] + '</div><div class="goods-title">' + goodsConts[1].replace(/\[(.*?)\]\((.*?)\)/g, ' <a href="$2" target="_blank">$1</a> ') + '</div><div class="goods-note">' + goodsConts[2] + '</div></div>'
                            nowNum++;
                        }
                    }
                }
                //解析markdown格式图片
                var product = goodsConts[1].replace(/\[(.*?)\]\((.*?)\)/g, '$1')
                var img = goodsConts[1].replace(/\[(.*?)\]\((.*?)\)/g, '$2');
                var price = goodsConts[0];
                var note = goodsConts[2];
                result += `<div class="goods-bankuai img-hide"><div class="goods-duiqi  memos-photo"><a href="${img}" data-fancybox="gallery" class="fancybox" data-thumb="${img}"><img class="photo-img" loading="lazy" decoding="async" src="${img}" /></a></div><div class="goods-jiage">${price}</div><div class="goods-title"><a href="${img}" target="_blank">${product}</a></div><div class="goods-note">${note}</div></div>`;
                nowNum++;
            }
        }
        var goodsBefore = ``
        var goodsAfter = ``
        resultAll = result
        goodsDom.innerHTML = resultAll

    },
    /**
     * 获取转发内容
     * @param memosUrl memos 域名
     * @param data 转发的元数据
     * @returns {string}
     */
    getMemosForm: (memosUrl, data) => {
        let transData = data.content.replace(/#([^\s#]+?)\s/g, "")//tag
            .replace(/\!\[(.*?)\]\((.*?)\)/g, "")//image
            .replace(/\[(.*?)\]\((.*?)\)/g, "$1")//link
            .replace(/\n/g, " ")//line
            .replace(/\>.*$/g, "")//block quote
            .replace(/\```.*$/g, "");//code
        if (transData.length > 140) {
            transData = transData.substring(0, 140) + '...'
        }
        //转发内容实体
        let memosForm = {
            id: data.id,
            creatorName: data.creatorName,
            content: transData,
            url: memosUrl + 'm/' + data.id
        };
        return JSON.stringify(memosForm).replace(/"/g, '&quot;');
    },
    //转发
    transPond: (a) => {
        if (!leonus.openMemosEditForm(true)) {
            return;
        }
        //引用内容关联
        localStorage.setItem('relationList', JSON.stringify([{"relatedMemoId": a.id, "type": "REFERENCE"}]));
        const memosTextarea = document.querySelector(".common-editor-inputer");
        memosTextarea.value = '[@' + a.creatorName + '](' + a.url + ') \n\n> ' + a.creatorName + ': ' + a.content;
        memosTextarea.style.height = memosTextarea.scrollHeight + 'px';
        document.body.scrollIntoView({behavior: 'smooth'});
    },
    //按钮集合
    getBtnSet: (memosUrl, memosId, pinnedFlag) => {
        let editBtn = '';
        let memosDomain = localStorage.getItem("apiUrl") || '';
        if (memosDomain) {
            var url = new URL(memosDomain);
            var remoteUrl = new URL(memosUrl).origin;
            var pinText = pinnedFlag ? '取消置顶' : '置顶';
            if (url.origin && url.origin === remoteUrl) {
                editBtn += `<a class="btn3" onclick="leonus.memosPin('${memosDomain}', ${memosId}, ${!pinnedFlag})" rel="noopener noreferrer" title="${pinText}">
                            <i class="fa-solid fa-thumbtack"></i>${pinText}
                        </a>`;
                editBtn += `<a class="btn3" onclick="leonus.memosEdit('${memosDomain}', ${memosId})" rel="noopener noreferrer" title="编辑">
                            <i class="fa-regular fa-pen-to-square"></i>编辑
                        </a>`;
                editBtn += `<a class="btn3" onclick="leonus.memosArchive('${memosDomain}', ${memosId})" rel="noopener noreferrer" title="归档">
                            <i class="fas fa-archive"></i>归档
                        </a>`;
                editBtn += `<a class="btn3" onclick="leonus.memosDelete('${memosDomain}', ${memosId})" rel="noopener noreferrer" title="删除">
                            <i class="fa-regular fa-trash-can"></i>删除
                        </a>`;
            }
        }
        return editBtn;
    },
    //打开发布框
    openMemosEditForm: function (needEditForm) {
        if (needEditForm) {
            //打开编辑框
            var editFormDom = document.querySelector('#memoPage');
            if (editFormDom.classList.contains('d-none')) {
                editFormDom.classList.remove('d-none');
                localStorage.setItem("memos-editor-display", true);
            }
        }
        var memosOpenId = window.localStorage && window.localStorage.getItem("memos-access-token");
        if (!memosOpenId) {
            $.message({
                message: '请先填写好 API 链接!'
            })
            return false;
        }
        return true;
    },
    //置顶
    memosPin: (apiUrl, memosId, pinnedFlag) => {
        if (!leonus.openMemosEditForm(true)) {
            return;
        }
        var getUrl = apiUrl.replace(/api\/v1\/memo(.*)/, memos.path + '/' + memosId + '/organizer' + '$1') || '';
        if (getUrl && memosId) {
            var memoBody = {pinned: pinnedFlag};
            fetch(getUrl, {
                method: 'POST',
                body: JSON.stringify(memoBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (res) {
                if (res.status === 200) {
                    $.message({
                        message: pinnedFlag ? '置顶成功' : '取消置顶成功'
                    });
                    location.reload();
                }
            }).catch(err => {
                $.message({
                    message: '归档出错了，再检查一下吧'
                })
            })
        }
    },
    //将待编辑的memos数据赋值到发布框
    memosEdit: (apiUrl, memosId) => {
        if (!leonus.openMemosEditForm(true)) {
            return;
        }
        //将附件列表置空
        document.querySelector(".memos-image-list").innerHTML = '';
        var memosTextarea = document.querySelector(".common-editor-inputer");
        var submitBtn = document.querySelector('#content_submit_text');
        submitBtn.classList.add('d-none');
        var editMemoDom = document.querySelector('.edit-memos');
        editMemoDom.classList.remove('d-none');
        var getUrl = apiUrl.replace(/api\/v1\/memo(.*)/, memos.path + '/' + memosId + '$1') || '';
        if (getUrl && memosId) {
            fetch(getUrl).then(res => res.json()).then(resdata => {
                localStorage.setItem("memos-resource-list", resdata.resourceList);
                localStorage.setItem("memos-edit-url", getUrl);
                localStorage.setItem("memos-edit-id", memosId);
                memosTextarea.value = resdata.content;
                //可见性
                leonus.editVisibility(resdata.visibility);
                if (resdata.resourceList && resdata.resourceList.length > 0) {
                    let imageList = "";
                    let remoteResourceIdList = [];
                    for (var i = 0; i < resdata.resourceList.length; i++) {
                        imageList += '<div data-id="' + resdata.resourceList[i].id + '" class="memos-tag" onclick="leonus.deleteImage(this)"><div class="px-2 justify-content-center">' + resdata.resourceList[i].filename + '</div></div>'
                        remoteResourceIdList.push(resdata.resourceList[i].id);
                    }
                    localStorage.setItem("resourceIdList", JSON.stringify(remoteResourceIdList));
                    document.querySelector(".memos-image-list").insertAdjacentHTML('afterbegin', imageList);
                }
                memosTextarea.style.height = memosTextarea.scrollHeight + 'px';
                document.body.scrollIntoView({behavior: 'smooth'});
            })
        }

    },
    //归档memos
    memosArchive: (apiUrl, memosId) => {
        if (!leonus.openMemosEditForm(false)) {
            return;
        }
        var getUrl = apiUrl.replace(/api\/v1\/memo(.*)/, memos.path + '/' + memosId + '$1') || '';
        if (getUrl && memosId) {
            var memoBody = {id: memosId, rowStatus: "ARCHIVED"};
            fetch(getUrl, {
                method: 'PATCH', body: JSON.stringify(memoBody), headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (res) {
                if (res.status === 200) {
                    $.message({
                        message: '归档成功'
                    });
                    location.reload();
                }
            }).catch(err => {
                $.message({
                    message: '归档出错了，再检查一下吧'
                })
            })
        }
    },
    //删除memos
    memosDelete: (apiUrl, memosId) => {
        if (!leonus.openMemosEditForm(false)) {
            return;
        }
        var getUrl = apiUrl.replace(/api\/v1\/memo(.*)/, memos.path + '/' + memosId + '$1') || '';
        if (getUrl && memosId) {
            $.confirm({
                title: 'Warning!',
                content: '确认删除该条数据?',
                theme: 'supervan',
                closeIcon: true,
                animation: 'scale',
                type: 'red',
                icon: 'glyphicon glyphicon-question-sign',
                buttons: {
                    ok: {
                        text: '确认',
                        btnClass: 'btn-primary',
                        action: function () {
                            fetch(getUrl, {
                                method: 'DELETE', headers: {
                                    'Content-Type': 'application/json'
                                }
                            }).then(function (res) {
                                if (res.status === 200) {
                                    $.message({
                                        message: '删除成功'
                                    });
                                    location.reload();
                                }
                            }).catch(err => {
                                console.warn('Error msg: ' + err);
                                $.message({
                                    message: '删除出错了，再检查一下吧'
                                })
                            })
                        }
                    },
                    cancel: {
                        text: '取消',
                        btnClass: 'btn-primary',
                    }
                }
            });
        }
    },
    //保存编辑的memos
    editSubmit: () => {
        var memoUrl = localStorage.getItem("memos-edit-url");
        if (!memoUrl) {
            var memosId = localStorage.getItem("memos-edit-id");
            let memosDomain = localStorage.getItem("apiUrl") || '';
            if (!memosId || !memosDomain) {
                console.log('memosId of edited memos or memosDomain is null.');
                return;
            }
            memoUrl = memosDomain.replace(/api\/v1\/memo(.*)/, memos.path + '/' + memosId + '$1') || '';
        }
        var submitMemoBtn = document.querySelector('#content_submit_text');
        var editMemoDom = document.querySelector('.edit-memos');
        let memoBody = {
            content: document.querySelector(".common-editor-inputer").value,
            relationList: [],
            resourceIdList: JSON.parse(localStorage.getItem("resourceIdList")),
            visibility: localStorage.getItem("memoLock")
        }
        fetch(memoUrl, {
            method: 'PATCH',
            body: JSON.stringify(memoBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (res) {
            if (res.status === 200) {
                $.message({
                    message: '编辑成功'
                });
                submitMemoBtn.classList.remove("d-none");
                editMemoDom.classList.add("d-none");
                localStorage.removeItem("resourceIdList");
                localStorage.removeItem("contentNow");
                localStorage.removeItem("memos-edit-url");
                localStorage.removeItem("memos-edit-id");
                localStorage.removeItem("memos-resource-list");
                location.reload();
            }
        })
    },
    //取消编辑
    cancelEdit: () => {
        var memosTextarea = document.querySelector('.common-editor-inputer');
        var editMemoDom = document.querySelector('.edit-memos');
        if (!editMemoDom.classList.contains("d-none")) {
            memosTextarea.value = '';
            memosTextarea.style.height = 'inherit';
            editMemoDom.classList.add("d-none");
            document.querySelector('#content_submit_text').classList.remove("d-none");
            document.querySelector(".memos-image-list").innerHTML = '';
            localStorage.removeItem("resourceIdList");
            localStorage.removeItem("memos-resource-list");
            localStorage.removeItem("contentNow");
            localStorage.removeItem('relationList');
            localStorage.removeItem("memos-edit-url");
            localStorage.removeItem("memos-edit-id");
        }
    },
    //删除附件图片
    deleteImage: (e) => {
        if (e) {
            let memoId = e.getAttribute("data-id")
            let memosResource = window.localStorage && JSON.parse(window.localStorage.getItem("resourceIdList"));
            let memosResourceList = memosResource.filter(function (item) {
                return item != memoId
            });
            window.localStorage && window.localStorage.setItem("resourceIdList", JSON.stringify(memosResourceList));
            e.remove()
        }
    },
    //可见性判定
    editVisibility: (visibility) => {
        let v = visibility || 'PUBLIC';
        let tv = '所有人可见';
        if (v == "PUBLIC") {
            tv = "所有人可见"
        } else if (v == "PRIVATE") {
            tv = "仅自己可见"
        } else if (v == "PROTECTED") {
            tv = "登录用户可见"
        }
        localStorage.setItem("memoLock", v);
        document.querySelector("#lock-now").value = tv;
    }
};