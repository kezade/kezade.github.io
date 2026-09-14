// 配置项
const API_URL = 'https://gcore.jsdelivr.net/gh/zyxelva/hexo-circle-of-friends/data.json';
const CACHE_KEY = 'friend-circle-data-cache';
const CACHE_TIME_KEY = 'friend-circle-data-cache-time';
// 缓存有效期（例如：30分钟 = 30 * 60 * 1000 毫秒）
const CACHE_TTL = 30 * 60 * 1000;

// 弹幕相关配置
const TRACK_HEIGHT = 50;
const TRACK_GAP = 8;
const MIN_SPEED = 12;
const MAX_SPEED = 25;
const SPAWN_INTERVAL = 800;

// 全局变量，用于存储当前弹幕生成器的定时器，以便更新时清除
let danmakuIntervalId = null;
let currentTrack = 0;

/**
 * 渲染统计数据和底部时间
 */
function renderStats(data) {
    const stats = data.statistical_data || {};
    document.getElementById('stat-friends').textContent = stats.friends_num ?? '--';
    document.getElementById('stat-active').textContent = stats.active_num ?? '--';
    document.getElementById('stat-articles').textContent = stats.article_num ?? '--';
    document.getElementById('update-time').textContent = stats.last_updated_time || '未知';
}

/**
 * 核心弹幕渲染函数
 * @param {Array} articles - 文章数据数组
 */
function renderDanmaku(articles) {
    const stage = document.getElementById('danmaku-stage');
    const template = document.getElementById('danmaku-template'); // 确保你的 HTML 中有这个 template
    if (!stage || !template) return;

    // 1. 清除旧的弹幕和定时器
    stage.innerHTML = '';
    if (danmakuIntervalId) {
        clearInterval(danmakuIntervalId);
        danmakuIntervalId = null;
    }
    currentTrack = 0;

    if (!articles || articles.length === 0) {
        console.warn('没有弹幕数据可供渲染');
        return;
    }

    // 2. 动态计算轨道数
    const trackCount = Math.max(Math.floor(stage.clientHeight / (TRACK_HEIGHT + TRACK_GAP)), 1);

    // 3. 创建单条弹幕
    function createDanmaku(article) {
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.danmaku-item');
        const avatar = clone.querySelector('.danmaku-avatar');
        const content = clone.querySelector('.danmaku-content');

        item.href = article.link;
        avatar.src = article.avatar || '';
        avatar.alt = article.author || '';
        content.textContent = article.title;

        // 计算垂直位置
        const top = currentTrack * (TRACK_HEIGHT + TRACK_GAP);
        item.style.top = `${top}px`;
        currentTrack = (currentTrack + 1) % trackCount;

        // 随机动画参数
        const duration = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        item.style.animationDuration = `${duration}s`;
        const delay = Math.random() * 3000; // 初始延迟稍微缩短，让弹幕更快出现
        item.style.animationDelay = `${delay}ms`;

        item.addEventListener('animationend', () => item.remove());
        stage.appendChild(item);
    }

    // 4. 启动弹幕生成器
    let articleIndex = 0;
    // 先立即生成一批
    for (let i = 0; i < Math.min(8, articles.length); i++) {
        createDanmaku(articles[articleIndex]);
        articleIndex++;
    }
    // 然后定时生成
    danmakuIntervalId = setInterval(() => {
        if (articleIndex >= articles.length) {
            articleIndex = 0; // 循环
        }
        createDanmaku(articles[articleIndex]);
        articleIndex++;
    }, SPAWN_INTERVAL);
}

/**
 * 主流程：加载数据（缓存优先，后台更新）
 */
async function initFriendCircle() {
    let cachedData = null;
    let cachedTime = 0;

    // 1. 尝试从 localStorage 读取缓存
    try {
        const rawCache = localStorage.getItem(CACHE_KEY);
        const rawTime = localStorage.getItem(CACHE_TIME_KEY);
        if (rawCache) {
            cachedData = JSON.parse(rawCache);
            cachedTime = rawTime ? parseInt(rawTime, 10) : 0;
        }
    } catch (e) {
        console.warn('读取 localStorage 缓存失败:', e);
    }

    // 2. 如果有缓存，立即渲染（保证快速显示）
    if (cachedData && cachedData.article_data) {
        console.log('使用缓存数据渲染');
        renderStats(cachedData);
        renderDanmaku(cachedData.article_data);
    } else {
        console.log('无缓存，等待网络数据');
    }

    // 3. 检查缓存是否过期，或者是否需要后台更新
    // 如果缓存很新（在 TTL 内），可以跳过网络请求以节省流量
    // 这里我们设定：如果缓存存在但已过期，或者没有缓存，都去请求网络
    const isCacheExpired = (Date.now() - cachedTime) > CACHE_TTL;

    // 如果缓存不存在或已过期，则发起网络请求
    if (!cachedData || isCacheExpired) {
        console.log('缓存不存在或已过期，发起网络请求...');
        try {
            const response = await fetch(API_URL, {cache: 'no-store'}); // 强制不缓存 HTTP 响应
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const newData = await response.json();

            // 4. 比较 last_updated_time，决定是否需要更新 UI
            const oldTime = cachedData?.statistical_data?.last_updated_time;
            const newTime = newData?.statistical_data?.last_updated_time;

            if (newTime && newTime !== oldTime) {
                console.log('发现新数据，更新页面和缓存。旧时间:', oldTime, '新时间:', newTime);

                // 更新缓存
                localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
                localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

                // 重新渲染
                renderStats(newData);
                renderDanmaku(newData.article_data);
            } else {
                console.log('数据没有变化，无需更新 UI。');
                // 即使数据没变，也更新一下缓存时间，避免每次刷新都请求
                localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
            }

        } catch (error) {
            console.error('获取最新朋友圈数据失败:', error);
            // 如果网络请求失败，但之前有缓存，页面已经用缓存渲染了，可以接受
            if (!cachedData) {
                // 如果连缓存都没有，显示错误状态
                document.getElementById('update-time').textContent = '数据获取失败';
            }
        }
    } else {
        console.log('缓存有效，跳过网络请求。');
    }
}

// 页面加载后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFriendCircle);
} else {
    initFriendCircle();
}

// 处理 View Transitions（如果启用了）
document.addEventListener('astro:page-load', initFriendCircle);