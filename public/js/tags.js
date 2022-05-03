'use strict';

import { renderGifs } from './category.js'
import { setListener, detouchListenersFromModule, setFnOnLoad, setFnOnUnLoad, clear, saveAbortHandler } from "./main.js"
import { addKwrd } from './random.js'
import { DBQuery } from './statFromDB.js'

const alphabetOptions = { id: 'alphabet', place: 'sortedKwrds', 'headers': true };
const popularityOptions = { qty: true, numeric: true, id: 'popular', place: 'sortedKwrds', 'headers': true };
const recencyOptions = { id: 'recent', place: 'sortedKwrds', 'headers': true };
const sort = { 'popular': popularityOptions, 'recent': recencyOptions, 'alphabet': alphabetOptions };

let ownControl = {};
ownControl.controller = '';
ownControl.galleryInstance = '';
let abortHandlers = {};
let loading;
let controller;


export function init() {
    return new Promise((resolve, reject) => {
        showKwrds().then(async () => {
            setListener('select')(setSort, 'change');
            setFnOnLoad(() => {
                return new Promise((resolve, reject) => {
                    DBQuery.handleStoredChanges();
                    resolve();
                });
            });
            await getController();
            setFnOnLoad(getController);
            setFnOnLoad(gallerySetInfiniteLoad);
            setFnOnLoad(gallerySetAlinment);
            resolve();
        })
    });

};

function getController() {
    return new Promise(async (resolve, reject) => {
        let obj = await import("./main.js");
        controller = obj.controller;
        ownControl.controller = new AbortController();

        if (ownControl.galleryInstance) {
            ownControl.galleryInstance.controller = ownControl.controller;
        };

        if (ownControl.gallery) {
            ownControl.gallery.controller = ownControl.controller;
        };

        controller.signal.addEventListener('abort', async function(e) {

            ownControl.controller.abort();

            if (ownControl.galleryInstance) {
                if (ownControl.galleryInstance.abortHandler) {
                    abortHandlers.galleryInstance = ownControl.galleryInstance.abortHandler;
                };
            };

            if (ownControl.gallery) {
                if (ownControl.gallery.abortHandler) {
                    abortHandlers.gallery = ownControl.gallery.abortHandler;
                };
            };

            if (Object.keys(abortHandlers).length != 0) {

                let abortHandler = Promise.all(Object.values(abortHandlers));
                saveAbortHandler(abortHandler);

            };
        });

        if (ownControl.galleryInstance) {
            ownControl.galleryInstance.controller = ownControl.controller;
        };

        resolve();
    });
}

async function gallerySetInfiniteLoad() {
    if (ownControl.gallery) {
            await ownControl.gallery.fnOnLoad();
        };
}

async function gallerySetAlinment() {
    if (ownControl.gallery) {
            await ownControl.gallery.resizeHandler();
        };
}

function modified(e) {
	let type = document.querySelector('select').value;
    setListener(`[data-type=${type}]`)(renderGifsByKey);
    setListener('.tags_nav__navLink')(() => window.isHash = true);
};

export function SubPagesHandler(params) {
    let subPages = params[0];
    if (params[1]) {
        let search = params[1].slice(1);
        let pageName = window.location.pathname.slice(1).split('/')[0];
        let href = `/${pageName}/?${search}`;
        addKwrd(decodeURI(search));
        document.querySelector('.sortContent').style.display = 'none';
        let imagesBlock = document.createElement('div');
        imagesBlock.classList.add('gifsBlock_tags');
        document.getElementById('sortedKwrds').after(imagesBlock);
        renderGifs({
            key: search,
            place: document.querySelector('.gifsBlock_tags'),
            headerText: 'Gifs by tag ',
            tagCont: 'alphabet',
            ownControl: ownControl
        });
    } else {
        let searchType = subPages[0];
        if (['alphabet', 'popular', 'recent'].includes(searchType)) {
            document.getElementById('sort').value = searchType;
            document.getElementById('sort').dispatchEvent(new Event('change'));
        };
    };
}

function renderGifsByKey(e) {
    return abortHandlers.renderGifsByKey = new Promise(async (resolve, reject) => {
        e.preventDefault();
        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);
        if (loading) await Promise.all(Object.values(abortHandlers));
        if (ownControl.controller.signal.aborted) resolve();
        loading = true;
        let keyword = e.currentTarget.innerText;
        let pageName = window.location.pathname.slice(1).split('/')[0];
        let href = `/${pageName}/?${keyword}`;
        history.pushState(null, null, href);
        addKwrd(keyword);
        let imagesBlock = document.createElement('div');
        imagesBlock.classList.add('gifsBlock_tags');
        document.getElementById('sortedKwrds').after(imagesBlock);
        await renderGifs({
            key: keyword,
            place: document.querySelector('.gifsBlock_tags'),
            headerText: 'Gifs by tag ',
            tagCont: e.currentTarget.dataset.type,
            ownControl: ownControl
        });
        loading = false;
        resolve();
    });
};

function setSort(event) {
    return abortHandlers.setSort = new Promise(async (resolve, reject) => {
        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);
        if (loading) await Promise.all(Object.values(abortHandlers));
        if (ownControl.controller.signal.aborted) resolve();
        let currentContent = document.querySelectorAll('.sortContent');
        let options = Array.from(document.querySelector("#sort").options);
        let currentSortType;
        options.forEach(function(elem) {
            if (elem.hasAttribute('selected')) {
                currentSortType = elem.value;
            };
            if (elem.selected) {
                elem.setAttribute('selected', 'true');
            } else elem.removeAttribute('selected');
        });
        let sortTypeHtml = document.querySelector('.sortContainer__sortType');
        let type = document.querySelector('select').value;
        sortTypeHtml.innerText = type;
        let pageName = window.location.pathname.slice(1).split('/')[0];
        if (event.isTrusted) {
            history.pushState(null, null, `/${pageName}/${type}`);
        };
        currentContent.forEach(function(elem) {
            if (elem) {
                if (elem.id != type) { elem.style.display = 'none' }
            };
        });
       if (document.getElementById(type)) {
            document.getElementById(type).style.display = '';
            return resolve();
        };
        if (ownControl.controller.signal.aborted) {
            currentContent.forEach(function(elem) {
                if (elem) {
                    if (elem.id != type) { elem.style.display = '' };
                };
            });
            options.forEach(function(elem) {
                if (elem.value == currentSortType) {
                    elem.setAttribute('selected', 'true');
                } else elem.removeAttribute('selected');
            });
            if (event.isTrusted) {
                history.pushState(null, null, `/${pageName}/${currentSortType}`);
            };
            return resolve();
        }
        showKwrds().then(() => resolve());
    });
};

function showKwrds() {
    return abortHandlers.showKwrds = new Promise(async (resolve, reject) => {
        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);
        loading = true;
        let type = document.querySelector('select').value;
        if (DBQuery.kwrdsArr.length == 0) await DBQuery.setSnapshot();
        let search = new DBQuery(type, sort[type]);
        await search;
        setListener(`.sortContent_${type}`)(modified, 'modified');
        setListener(`[data-type=${type}]`)(renderGifsByKey);
        setListener('.tags_nav__navLink')(() => window.isHash = true);
        loading = false;
        resolve();
    });
}