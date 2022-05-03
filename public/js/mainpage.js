'use strict';
import { setListener } from "./main.js"

export function init() {
    return new Promise((resolve, reject) => {
        setListener('.mainblock')(simulateMenuClick);
        resolve();
    });
};

function simulateMenuClick(e) {
    let page = e.currentTarget.dataset.page;
    let menu = document.querySelector('.site-nav__menu');
    let menuItem = menu.querySelector(`a[data-page="${page}"]`);
    menuItem.dispatchEvent(new Event('click', { bubbles: true }));
};