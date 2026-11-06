import os
import sys
import json
import re
import requests
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
from bottle import Bottle, request, response, static_file
from waitress import serve

app = Bottle()

if getattr(sys, 'frozen', False):
    BUNDLE_DIR = sys._MEIPASS
    APP_DIR = os.path.dirname(sys.executable)
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    APP_DIR = BUNDLE_DIR

STATIC_DIR = os.path.join(BUNDLE_DIR, "static")
DATA_DIR = os.path.join(APP_DIR, "data")
CACHE_DIR = os.path.join(DATA_DIR, "cache")
USER_STATE_FILE = os.path.join(DATA_DIR, "user_state.json")
CHAPTERS_FILE = os.path.join(DATA_DIR, "chapters.json")
BUNDLED_CHAPTERS_FILE = os.path.join(BUNDLE_DIR, "data", "chapters.json")

os.makedirs(CACHE_DIR, exist_ok=True)

if not os.path.exists(CHAPTERS_FILE) and os.path.exists(BUNDLED_CHAPTERS_FILE):
    try:
        import shutil
        shutil.copyfile(BUNDLED_CHAPTERS_FILE, CHAPTERS_FILE)
    except Exception:
        pass

CONTENT_ID = "1461277"

# HTTP 连接池会话 (复用 TCP 连接，大幅降低延迟)
http_session = requests.Session()
http_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})

prefetch_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="PrefetchWorker")

@app.hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

@app.route('/')
def index():
    return static_file("index.html", root=STATIC_DIR)

@app.route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root=STATIC_DIR)

@app.route('/api/chapters')
def get_chapters():
    response.content_type = 'application/json; charset=utf-8'
    if os.path.exists(CHAPTERS_FILE):
        with open(CHAPTERS_FILE, 'r', encoding='utf-8') as f:
            return f.read()
    elif os.path.exists(BUNDLED_CHAPTERS_FILE):
        with open(BUNDLED_CHAPTERS_FILE, 'r', encoding='utf-8') as f:
            return f.read()
    return json.dumps([])

def clean_html_with_bs4(raw_html, page_title):
    if not raw_html:
        return "", []

    soup = BeautifulSoup(raw_html, 'html.parser')

    # 1. 提取重点道具（生成速览胶囊）
    highlights = set()
    text_content = soup.get_text()
    
    bracket_items = re.findall(r'【([^】]+)】', text_content)
    for it in bracket_items:
        it_clean = it.strip()
        if 1 < len(it_clean) <= 15:
            highlights.add(f"【{it_clean}】")
    
    keywords = ["黄金种子", "圣杯露滴", "死根", "护符皮袋", "记忆石", "龙心脏", "石剑钥匙", "锻造石", "失色锻造石"]
    for kw in keywords:
        if kw in text_content:
            highlights.add(kw)

    # 2. 规范化图片结构
    for img in soup.find_all('img'):
        img_url = img.get('imageurl') or img.get('data-src') or img.get('src') or ''
        thumb_url = img.get('imagethumbnailurl') or img.get('data-src') or img_url
        if not img_url:
            img.decompose()
            continue

        figure = soup.new_tag('figure', attrs={'class': 'guide-figure'})
        new_img = soup.new_tag('img', attrs={
            'src': thumb_url,
            'data-full': img_url,
            'class': 'guide-img',
            'loading': 'lazy',
            'alt': page_title
        })
        hint = soup.new_tag('figcaption', attrs={'class': 'img-hint'})
        hint.string = "🔍 点击放大查看高清路线"
        figure.append(new_img)
        figure.append(hint)

        parent_frame = img.find_parent('div', class_='ImageFrame')
        parent_box = img.find_parent('div', class_='ImageBox')
        target_container = parent_box or parent_frame or img
        target_container.replace_with(figure)

    for div in soup.find_all('div', class_=['ImageBox', 'ImageFrame']):
        div.unwrap()

    # 3. 规范化超链接，防止 WebView2 宿主页面被误点击跳转覆盖
    for a in soup.find_all('a'):
        a['target'] = '_blank'
        a['rel'] = 'noopener noreferrer'

    # 4. 仅在段落内部做安全文字染色，绝不破坏属性与标签
    for p in soup.find_all('p'):
        p_html = str(p)
        for kw in list(highlights)[:8]:
            if kw in p.text:
                escaped_kw = re.escape(kw)
                p_html = re.sub(escaped_kw, f'<mark class="hl-tag">{kw}</mark>', p_html, count=2)
        try:
            new_p = BeautifulSoup(p_html, 'html.parser')
            p.replace_with(new_p)
        except Exception:
            pass

    return str(soup), sorted(list(highlights))

def fetch_single_page(page_num):
    cache_path = os.path.join(CACHE_DIR, f"page_{page_num}.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass

    api_url = f"https://router.gamersky.com/@/postPage/index/6.0.0/0?contentId={CONTENT_ID}&contentType=tieZi/gongLue&pageNum={page_num}"
    try:
        resp = http_session.get(api_url, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            post = data.get('post', {})
            page_names = post.get('pageNames', [])
            total_pages = len(page_names) if page_names else 199
            page_title = page_names[page_num - 1] if 0 < page_num <= len(page_names) else f"第 {page_num} 节"
            raw_html = post.get('contentInHtml', '')

            cleaned_html, highlights = clean_html_with_bs4(raw_html, page_title)

            result = {
                "page": page_num,
                "title": page_title,
                "html": cleaned_html,
                "highlights": highlights,
                "total": total_pages,
                "prev": page_num - 1 if page_num > 1 else None,
                "next": page_num + 1 if page_num < total_pages else None
            }

            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            return result
        else:
            raise RuntimeError(f"Gamersky API returned HTTP {resp.status_code}")
    except Exception as e:
        return {
            "error": str(e),
            "page": page_num,
            "title": f"第 {page_num} 节",
            "highlights": [],
            "html": f"<div class='error-box'><h4>⚠️ 攻略加载重试中</h4><p>无法连接游民星空服务器，请检查网络。</p><p class='err-msg'>{str(e)}</p></div>"
        }

def trigger_prefetch(page_num, total=199):
    targets = []
    if page_num + 1 <= total: targets.append(page_num + 1)
    if page_num - 1 >= 1: targets.append(page_num - 1)
    
    for p in targets:
        cache_path = os.path.join(CACHE_DIR, f"page_{p}.json")
        if not os.path.exists(cache_path):
            prefetch_pool.submit(fetch_single_page, p)

@app.route('/api/page/<page_num:int>')
def get_page(page_num):
    response.content_type = 'application/json; charset=utf-8'
    result = fetch_single_page(page_num)
    trigger_prefetch(page_num, result.get('total', 199))
    return json.dumps(result, ensure_ascii=False)

@app.route('/api/user_state', method='GET')
def get_user_state():
    response.content_type = 'application/json; charset=utf-8'
    if os.path.exists(USER_STATE_FILE):
        try:
            with open(USER_STATE_FILE, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception:
            pass
    
    default_state = {
        "currentPage": 21,
        "opacity": 90,
        "isMini": False,
        "fontSize": 14,
        "windowPos": {"x": 1400, "y": 60, "w": 480, "h": 760},
        "checklist": {},
        "currentTab": "guide"
    }
    return json.dumps(default_state, ensure_ascii=False)

@app.route('/api/user_state', method='POST')
def save_user_state():
    try:
        data = request.json
        if data:
            with open(USER_STATE_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return json.dumps({"status": "ok"})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
    return json.dumps({"status": "invalid_payload"})

def start_server(port=28795):
    serve(app, host='127.0.0.1', port=port, threads=6, _quiet=True)

if __name__ == '__main__':
    start_server()
