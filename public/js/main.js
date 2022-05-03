'use strict'

export let controller;

export function setListener(...elems) {
    let page = window.location.pathname.slice(1).split('/')[0];
    if (!page) page = 'mainpage';
    if (!listeners[page]) listeners[page] = {};
    for (let elem of elems) {
        if (!listeners[page][elem]) listeners[page][elem] = {};
    };
    return function(handler, event = 'click') {
        for (let elem of elems) {
            let listener = {};
            listener[`${elem}`] = listeners[page][elem];
            if ((listeners[page][elem][event]) && (listeners[page][elem][event]['fn'] == handler)) {
                attachListeners(listener);
                continue;
            };
            listeners[page][elem][event] = {};
            listeners[page][elem][event]['fn'] = handler;

            attachListeners(listener);
        };
    };
}

export function setFnOnLoad(handler) {
    let page = window.location.pathname.slice(1).split('/')[0];
    if (!FnOnLoad[page]) FnOnLoad[page] = [];
    FnOnLoad[page].push(handler);
}

export function setFnOnUnLoad(handler) {
    let page = window.location.pathname.slice(1).split('/')[0];
    if (!FnOnUnload[page]) FnOnUnload[page] = [];
    FnOnUnload[page].push(handler);
}

export function clear(elem) {
    while (elem.firstElementChild != null) {
        elem.removeChild(elem.firstElementChild);
    };
}

export function saveAbortHandler(fn) {
    let page = window.location.pathname.slice(1).split('/')[0];
    if (!page) page = 'mainpage';
    if (!pagesContent[page]) {
        pagesContent[page] = {};
    };
    pagesContent[page].abortHandler = fn;
}

export function detouchListenersFromModule(elemToClear, isParentElem = false) {
    let page = window.location.pathname.slice(1).split('/')[0];
    if ((elemToClear == 'document') || (elemToClear == 'window')) {
        if (!listeners[page] || !listeners[page][elemToClear]) return;

        Object.keys(listeners[page][elemToClear]).forEach(function(event) {
            let func = listeners[page][elemToClear][event]['fn'];
            elemToClear == 'window' ? window.removeEventListener(event, func) : document.removeEventListener(event, func);
        });
        delete listeners[page][elemToClear];
        return;
    };

    if (isParentElem) {
        if (!listeners[page][elemToClear]) return;
        Object.keys(listeners[page][elemToClear]).forEach(function(event) {
            let func = listeners[page][elemToClear][event]['fn'];
            listeners[page][elemToClear][event]['elems'].forEach(function(elem) {
                elem.removeEventListener(event, func);
            });
            delete listeners[page][elemToClear][event]['elems'];
        });
        return;
    };
    let elemsWithListeners = Object.keys(listeners[page]);
    elemsWithListeners.forEach(function(elem) {

        let NodesToClear = Array.from(elemToClear.querySelectorAll(elem));
        if (NodesToClear.length != 0) {

            Object.keys(listeners[page][elem]).forEach(function(event) {
                let func = listeners[page][elem][event]['fn'];
                NodesToClear.forEach(function(elemNode) {
                    elemNode.removeEventListener(event, func);
                    let index = listeners[page][elem][event]['elems'].findIndex((item) => item == elemNode);
                    listeners[page][elem][event]['elems'].splice(index, 1);
                });
            });

        };
    });
};


let pagesContent = {};
let listeners = {};
let FnOnLoad = {};
let FnOnUnload = {};
const menu = document.querySelector('.site-nav__menu');
let active;
const loader = document.createElement('img');
loader.src = '/img/2.gif';
loader.classList.add('loaderMain');
let layer = document.createElement('div');
layer.classList.add('layer');
let loading = '';
let loadPage;
let index = document.querySelector('.logo__container');
let prevPage;


function attachListeners(listeners) {
    Object.keys(listeners).forEach(function(elem) {
        Object.keys(listeners[elem]).forEach(function(event) {
            if (!listeners[elem][event]['elems']) {
                listeners[elem][event]['elems'] = [];
            };

            let func;
            let path = window.location.pathname.slice(1).split('/');
            if (!pagesContent[path[0]]) {
                pagesContent[path[0]] = {};
            }
            if (pagesContent[path[0]].instances) {
                let instance = window.location.search ? decodeURI(window.location.search.slice(1)) : decodeURI(path[path.length - 1]);
                func = listeners[elem][event]['fn'].bind(pagesContent[path[0]].instances[instance]);
            } else func = listeners[elem][event]['fn'];

            if ((elem == 'document') || (elem == 'window')) {
                if (listeners[elem][event]['elems'].includes(elem)) {
                    return;
                };

                elem == 'window' ? window.addEventListener(event, func) : document.addEventListener(event, func);
                listeners[`${elem}`][event]['elems'].push(elem);
                return;
            };
            let elemNodes = Array.from(document.querySelectorAll(elem));
            if (elemNodes.length == 0) {
                return;
            };

            elemNodes.forEach(function(elemNode) {
                if (listeners[elem][event]['elems'].includes(elemNode)) {
                    return;
                };
                elemNode.addEventListener(event, func);
                listeners[elem][event]['elems'].push(elemNode);
            });
        });
    });
}

function detouchListeners(target) {
    let inactive = [];
    Object.keys(pagesContent).map((elem) => {
        if (elem != target) {
            inactive.push(elem);
        };
    });
    if (inactive.length != 0) {
        inactive.forEach(function(page) {
            if (!listeners[page]) return;

            Object.keys(listeners[page]).forEach(function(elem) {
                Object.keys(listeners[page][elem]).forEach(function(event) {
                    let func = listeners[page][elem][event]['fn'];
                    if ((elem == 'document') || (elem == 'window')) {
                        elem == 'window' ? window.removeEventListener(event, func) : document.removeEventListener(event, func);
                        let index = listeners[page][elem][event]['elems'].findIndex((item) => item == elem);
                        listeners[page][elem][event]['elems'].splice(index, 1);
                        return;
                    };
                    let elemNodes = Array.from(document.querySelectorAll([elem]));
                    elemNodes.forEach(function(elemNode) {
                        elemNode.removeEventListener(event, func);
                        let index = listeners[page][elem][event]['elems'].findIndex((item) => item == elemNode);
                        listeners[page][elem][event]['elems'].splice(index, 1);
                    });
                });
            });
        });
    };
};

document.addEventListener("DOMContentLoaded", () => {
    let path = (localStorage.path) ? localStorage.path : window.location.pathname;
    path = path.split('/');
    let i = path.length - 1;

    while (i >= 0) {
        if (path[i] == '')
            path.splice(i, 1);
        i--;
    };

    path = path.join('/');

    let search = localStorage.search;

    let href = search ? `${path}/${search}` : path;
    history.pushState(null, null, href);
    localStorage.path = '';
    localStorage.search = '';
    if (path) {
        let menuItem = menu.querySelector(`a[data-page="${path.split('/')[0]}"`);
        if (menuItem) {
            active = menuItem.parentNode;
            active.classList.add('menu__item_active');
        };
    };

    getPage()
        .catch((e) => {
            console.log(e);
        });
});

addEventListener("popstate", function(e) {
    if (window.isHash) {
        window.isHash = false;
        return;
    };
    let path = window.location.pathname.slice(1);
    if (active) active.classList.remove('menu__item_active');
    if (path) {
        let menuItem = menu.querySelector(`a[data-page="${path.split('/')[0]}"`);
        if (menuItem) {
            active = menuItem.parentNode;
            active.classList.add('menu__item_active');
        };
    };
    getPage()
        .catch((e) => {
            console.log(e);
        });
}, false);


async function loadPageFromMenu(url) {
    if (controller) {
        controller.abort();
    };

    if (pagesContent[prevPage].abortHandler) {
        document.querySelector('.main__content').append(loader);
        document.querySelector('.main__content').append(layer);

        try {
            await pagesContent[prevPage].abortHandler;
        } catch (e) {
            console.log(e);
        }

        pagesContent[prevPage].abortHandler = '';
        loader.remove();
        layer.remove();
    };

    if (loading) {
        try {
            await loadPage;
        } catch (e) {
            console.log(e);
        }
        pagesContent[prevPage].content = document.querySelector('.pages-content').innerHTML;
        pagesContent[prevPage].header = document.querySelector('.pages-heading').innerHTML;
        pagesContent[prevPage].path = `${window.location.pathname.slice(1)}${window.location.search}`;
        history.pushState(null, null, url);
        getPage()
            .catch((e) => {
                console.log(e);
            });
    } else {
        pagesContent[prevPage].content = document.querySelector('.pages-content').innerHTML;
        pagesContent[prevPage].header = document.querySelector('.pages-heading').innerHTML;
        pagesContent[prevPage].path = `${window.location.pathname.slice(1)}${window.location.search}`;
        history.pushState(null, null, url);
        getPage()
            .catch((e) => {
                console.log(e);
            });
    };
}

index.addEventListener('click', function(e) {
    e.preventDefault();
    let menu__mobile_label = document.querySelector('.menu__mobile_label');
    if (menu__mobile_label.style.display != 'none') {
        let checkbox = document.querySelector('.menu__mobile_checkbox');
        checkbox.checked = 0;
    };
    let target = e.currentTarget;

    if (active) active.classList.remove('menu__item_active');
    active = '';
    prevPage = window.location.pathname.slice(1).split('/')[0];
    if (!prevPage) prevPage = 'mainpage';
    if (!pagesContent[prevPage]) {
        pagesContent[prevPage] = {};
    };

    try {
        loadPageFromMenu(`${target.dataset.page}`);
    } catch (e) {
        console.log(e);
    }
});


menu.addEventListener('click', function(e) {
    let target = e.target;
    let menu__mobile_label = document.querySelector('.menu__mobile_label');
    if (menu__mobile_label.style.display != 'none') {
        let checkbox = document.querySelector('.menu__mobile_checkbox');
        checkbox.checked = 0;
    };

    while (target != menu) {
        if (target.classList.contains('item__link')) {
            e.preventDefault();
            if (!target.parentNode.classList.contains('menu__item_active')) {
                if (active) active.classList.remove('menu__item_active');
                target.parentNode.classList.add('menu__item_active');
                active = target.parentNode;
                prevPage = window.location.pathname.slice(1).split('/')[0];
                if (!prevPage) prevPage = 'mainpage';
                if (!pagesContent[prevPage]) {
                    pagesContent[prevPage] = {};
                };

                let pathURL;
                if (pagesContent[target.dataset.page] && pagesContent[target.dataset.page].path) {
                    pathURL = pagesContent[target.dataset.page].path
                } else pathURL = target.dataset.page;


                try {
                    loadPageFromMenu(`/${pathURL}`);
                } catch (e) {
                    console.log(e);
                }
            };
            return;
        };
        target = target.parentNode;
    };
});

function getPage() {
    return loadPage = new Promise(async (resolve, reject) => {
        let target = window.location.pathname.slice(1).split('/')[0];
        let subPages = window.location.pathname.slice(1).split('/').slice(1);
        let searchParam = window.location.search;
        let totalPath = window.location.pathname.slice(1) + window.location.search;
        let params = [];
        [subPages, searchParam].forEach(function(elem) {
            if (elem && (elem.length != 0)) {
                params.push(elem);
            }
        });

        if (!target) {
            target = 'mainpage';
            console.log('target');
        };
        if ((pagesContent[target]) && (pagesContent[target].path == totalPath)) {
            detouchListeners(target);
            if (FnOnUnload[prevPage]) {
                await Promise.all(FnOnUnload[target]);
            };

            document.querySelector('.pages-heading').textContent = pagesContent[target].header;
            document.querySelector('.pages-content').innerHTML = pagesContent[target].content;
            controller = new AbortController();
            if (FnOnLoad[target]) {
                for (let i = 0; i < FnOnLoad[target].length; i++) {
                    await FnOnLoad[target][i]();
                };
            };
            attachListeners(listeners[target]);
        } else {
            loading = true;

            controller = new AbortController();

            detouchListeners(target);
            if (FnOnUnload[prevPage]) {
                await Promise.all(FnOnUnload[target]);
            };
            clear(document.querySelector('.pages-content'));

            document.querySelector('.main__content').append(loader);
            document.querySelector('.main__content').append(layer);
            let url = `${window.location.origin}/pages/${target}.html`;

            fetch(url, { mode: 'cors' })
                .then((response) => {
                    if (response.status != '200') throw new Error('Oops! No such page');
                    return response.text();
                })
                .then(async function load(html) {
                    if (html.length == 0) throw new Error('No results');
                    let modulePath = `./${target}.js`;
                    let module = await import(modulePath);
                    if (!module.init) {
                        throw new Error('No results');
                    };
                    document.querySelector('.pages-content').innerHTML = html;
                    document.querySelector('.pages-heading').textContent = (target != 'mainpage') ?
                        active.querySelector('.item__link').textContent : 'Get a gif!';

                    let init = module.init(controller);
                    init.then(async () => {
                            if (params.length != 0) {
                                if (!module.SubPagesHandler) {
                                    history.pushState(null, null, `/${target}`)
                                } else {
                                    module.SubPagesHandler(params)
                                }
                            };
                            if (listeners[target]) {
                                attachListeners(listeners[target]);
                            };
                        })
                        .then(() => {
                            loader.remove();
                            layer.remove();
                            loading = false;
                            resolve();
                        })
                        .catch((e) => {
                            console.log('error in module: ' + e.message);
                            loading = false;
                            layer.remove();
                            loader.remove();
                            reject('error in module');
                        })
                })
                .catch((e) => {
                    loader.remove();
                    document.querySelector('.pages-heading').textContent = e.message;
                    layer.remove();
                    loading = false;
                    reject(e.message);
                });
        };
    });
};