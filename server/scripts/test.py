import requests
import pyautogui

pyautogui.PAUSE = 0.001
with open("lorenipsum.txt") as read:
    for c in read.read():
        pyautogui.typewrite(c)