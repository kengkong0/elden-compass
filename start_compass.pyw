# -*- coding: utf-8 -*-
"""
艾尔登法环·褪色者探索罗盘 - 静默无黑框启动脚本
双击直接启动，不会弹出任何 CMD / 控制台窗口
"""
import os
import sys

# 切换到当前脚本所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
sys.path.insert(0, BASE_DIR)

import main

if __name__ == '__main__':
    main.main()
