import os
import sys
import time
import json
import threading
import ctypes
from ctypes import wintypes
from PIL import Image, ImageDraw
import webview
import keyboard
import pystray

import server

# Windows API
user32 = ctypes.windll.user32
GWL_EXSTYLE = -20
WS_EX_LAYERED = 0x00080000
WS_EX_TRANSPARENT = 0x00000020
LWA_ALPHA = 0x00000002
SW_HIDE = 0
SW_SHOW = 5
SW_RESTORE = 9
HWND_TOPMOST = -1
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_SHOWWINDOW = 0x0040

WINDOW_TITLE = "艾尔登法环·褪色者探索罗盘"
SERVER_PORT = 28795
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(APP_DIR, "data")
USER_STATE_FILE = os.path.join(DATA_DIR, "user_state.json")

# 模块级持有的窗口引用（绝不放入 OverlayAPI 的公开属性，防止 pywebview 递归反射死循环）
_current_window = None

def create_tray_icon_image():
    """动态生成法环暗金律法符文托盘图标"""
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((6, 6, 58, 58), outline=(212, 175, 55, 255), width=4)
    draw.ellipse((18, 18, 46, 46), outline=(245, 215, 110, 255), width=3)
    draw.line((32, 2, 32, 62), fill=(245, 215, 110, 255), width=3)
    draw.line((2, 32, 62, 32), fill=(245, 215, 110, 255), width=3)
    return img

def safe_evaluate_js(script):
    """线程安全执行 JavaScript"""
    global _current_window
    try:
        if _current_window:
            _current_window.evaluate_js(script)
    except Exception:
        pass

def save_geometry():
    """保存窗口坐标与尺寸 (安全过滤最小化负坐标，防止窗体丢失)"""
    global _current_window
    try:
        if _current_window and os.path.exists(USER_STATE_FILE):
            x = _current_window.x
            y = _current_window.y
            w = _current_window.width
            h = _current_window.height
            
            # Windows 最小化时坐标为 -32000，必须过滤抛弃
            if x is not None and y is not None and x > -1000 and y > -1000:
                with open(USER_STATE_FILE, 'r', encoding='utf-8') as f:
                    state = json.load(f)
                state['windowPos'] = {
                    "x": int(x),
                    "y": int(y),
                    "w": int(w),
                    "h": int(h)
                }
                with open(USER_STATE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

class OverlayAPI:
    """仅向 JavaScript 暴露纯净方法，绝不携带复杂对象属性"""
    def __init__(self):
        self._hwnd = None
        self.is_visible = True
        self.is_clickthrough = False

    def _get_hwnd(self):
        if not self._hwnd:
            if _current_window and hasattr(_current_window, 'native') and _current_window.native:
                try:
                    self._hwnd = int(_current_window.native.Handle.ToInt64())
                except Exception:
                    pass
            if not self._hwnd:
                self._hwnd = user32.FindWindowW(None, WINDOW_TITLE)
        return self._hwnd

    def set_opacity(self, percent):
        hwnd = self._get_hwnd()
        if hwnd:
            alpha = int(255 * (max(20, min(100, percent)) / 100.0))
            style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
            user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style | WS_EX_LAYERED)
            user32.SetLayeredWindowAttributes(hwnd, 0, alpha, LWA_ALPHA)
            return {"status": "ok", "alpha": alpha}
        return {"status": "hwnd_not_found"}

    def toggle_clickthrough(self, enable=None):
        hwnd = self._get_hwnd()
        if enable is None:
            self.is_clickthrough = not self.is_clickthrough
        else:
            self.is_clickthrough = bool(enable)

        if hwnd:
            style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
            if self.is_clickthrough:
                user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style | WS_EX_LAYERED | WS_EX_TRANSPARENT)
            else:
                user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style & ~WS_EX_TRANSPARENT)
            
            safe_evaluate_js(f"window.dispatchEvent(new CustomEvent('clickthrough-changed', {{detail: {str(self.is_clickthrough).lower()}}}));")
            return {"status": "ok", "clickthrough": self.is_clickthrough}
        return {"status": "hwnd_not_found"}

    def toggle_visibility(self):
        hwnd = self._get_hwnd()
        if not hwnd:
            return

        if self.is_visible:
            user32.ShowWindow(hwnd, SW_HIDE)
            self.is_visible = False
        else:
            user32.ShowWindow(hwnd, SW_RESTORE)
            user32.SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW)
            self.is_visible = True

    def toggle_mini(self, is_mini):
        global _current_window
        if _current_window:
            if is_mini:
                _current_window.resize(360, 240)
            else:
                _current_window.resize(480, 760)
        return {"status": "ok"}

    def drag_window(self):
        """开始拖拽移动窗口 (Win32 原生平滑拖拽)"""
        hwnd = self._get_hwnd()
        if hwnd:
            user32.ReleaseCapture()
            user32.SendMessageW(hwnd, 0x00A1, 2, 0)
            save_geometry()
            return {"status": "ok"}
        return {"status": "hwnd_not_found"}

    def navigate_chapter(self, direction):
        safe_evaluate_js(f"window.navigateChapter && window.navigateChapter({direction});")

    def minimize(self):
        global _current_window
        if _current_window:
            _current_window.minimize()

    def open_external(self, url):
        """调用系统外部浏览器打开链接，防止污染和覆盖罗盘UI"""
        try:
            import webbrowser
            webbrowser.open(str(url))
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def close(self):
        save_geometry()
        global _current_window
        if _current_window:
            _current_window.destroy()

api = OverlayAPI()

def register_global_hotkeys():
    try:
        keyboard.add_hotkey('alt+m', api.toggle_visibility)
        keyboard.add_hotkey('f8', api.toggle_visibility)
        keyboard.add_hotkey('alt+q', api.toggle_clickthrough)
        keyboard.add_hotkey('alt+left', lambda: api.navigate_chapter(-1))
        keyboard.add_hotkey('alt+right', lambda: api.navigate_chapter(1))
    except Exception:
        pass

def run_system_tray():
    menu = pystray.Menu(
        pystray.MenuItem("显示 / 隐藏 (Alt+M)", lambda icon, item: api.toggle_visibility(), default=True),
        pystray.MenuItem("切换穿透 (Alt+Q)", lambda icon, item: api.toggle_clickthrough()),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("上一节 (Alt+←)", lambda icon, item: api.navigate_chapter(-1)),
        pystray.MenuItem("下一节 (Alt+→)", lambda icon, item: api.navigate_chapter(1)),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("退出", lambda icon, item: [icon.stop(), api.close(), os._exit(0)])
    )
    icon = pystray.Icon("EldenCompass", create_tray_icon_image(), "艾尔登法环·探索罗盘", menu)
    icon.run()

def load_saved_pos():
    screen_w = user32.GetSystemMetrics(0)
    screen_h = user32.GetSystemMetrics(1)
    def_w = 480
    def_h = min(780, screen_h - 100)
    def_x = max(0, screen_w - def_w - 40)
    def_y = 60

    if os.path.exists(USER_STATE_FILE):
        try:
            with open(USER_STATE_FILE, 'r', encoding='utf-8') as f:
                state = json.load(f)
            pos = state.get('windowPos', {})
            x = pos.get('x', def_x)
            y = pos.get('y', def_y)
            w = pos.get('w', def_w)
            h = pos.get('h', def_h)

            # 屏幕物理边界防护：确保窗口在可视范围内，防止换分辨率或拔插副屏导致飞出屏幕
            x = max(0, min(screen_w - 100, x))
            y = max(0, min(screen_h - 100, y))
            w = max(320, min(screen_w, w))
            h = max(240, min(screen_h, h))
            return (w, h, x, y)
        except Exception:
            pass
    return def_w, def_h, def_x, def_y

def main():
    global _current_window

    # 1. 启动 Waitress 多线程服务
    server_thread = threading.Thread(target=server.start_server, args=(SERVER_PORT,), daemon=True)
    server_thread.start()
    time.sleep(0.5)

    # 2. 注册全局热键与系统托盘
    threading.Thread(target=register_global_hotkeys, daemon=True).start()
    threading.Thread(target=run_system_tray, daemon=True).start()

    # 3. 创建置顶悬浮窗口
    win_w, win_h, pos_x, pos_y = load_saved_pos()

    _current_window = webview.create_window(
        title=WINDOW_TITLE,
        url=f"http://127.0.0.1:{SERVER_PORT}",
        width=win_w,
        height=win_h,
        x=pos_x,
        y=pos_y,
        on_top=True,
        frameless=True,
        easy_drag=False,
        js_api=api
    )

    webview.start(debug=False)
    save_geometry()
    os._exit(0)

if __name__ == '__main__':
    main()
