'use strict';

import { detouchListenersFromModule, setListener, clear, setFnOnLoad, setFnOnUnLoad, saveAbortHandler } from "./main.js"
import { setUrl } from './getGifs.js'
import { DBQuery } from './statFromDB.js'

const db = firebase.firestore();
const kwrds = db.collection("kwrdStat");

const loader = document.createElement('img');
loader.src = '/img/2.gif';
loader.classList.add('loader');
const searchRandom = setUrl('random');
let loading;
let controller;
let ownController;
let abortHandlers = {};


export function init() {
    return new Promise(async (resolve, reject) => {
        if (DBQuery.kwrdsArr.length == 0) await DBQuery.setSnapshot();
        await new DBQuery('recent', { id: 'recentStatKwrds', place: 'recentStat', limit: 15 });
        await new DBQuery('popular', { id: 'topStatKwrds', place: 'topStat', limit: 3, 'qty': true, 'numeric': true });
        setListener('.submit-button')(submit);
        setListener('.refreshBtn')(refresh);
        setListener('.kwrd')(kwrdApply);
        setListener('.random_statContainer')(addedKwrd, 'added');
        setFnOnLoad(() => {
            return new Promise((resolve, reject) => {
                DBQuery.handleStoredChanges();
                resolve();
            });
        });
        await getController();
        setFnOnLoad(getController);
        resolve();

    });
};

function getController() {
    return new Promise(async (resolve, reject) => {
        let obj = await import("./main.js");
        controller = obj.controller;
        ownController = new AbortController();

        controller.signal.addEventListener('abort', async function(e) {
            ownController.abort();
            if (Object.keys(abortHandlers).length != 0) {
                let abortHandler = Promise.all(Object.values(abortHandlers));
                saveAbortHandler(abortHandler);
            };
        });
        resolve();
    });
}


function addedKwrd(e) {
    setListener('.kwrd')(kwrdApply);
};

async function submit(e) {
    e.preventDefault();
    if (loading) await Promise.all(Object.values(abortHandlers));

    return abortHandlers.refresh = new Promise(async (resolve, reject) => {

        loading = false;

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        if (ownController.signal.aborted) resolve();
        let input = document.querySelector('input[name="search"]');

        if (input.value) {
            let keyword = input.value;
            input.classList.remove('invalid');
            setCategoryName(e, `?${input.value}`);
            await getGif(keyword);
            loading = false;
            resolve();
        } else {
            input.classList.add('invalid');
            input.focus();
            loading = false;
            resolve();
        };
    });
};

async function refresh(e) {
    if (loading) await Promise.all(Object.values(abortHandlers));
    return abortHandlers.refresh = new Promise(async (resolve, reject) => {

        loading = true;

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        if (ownController.signal.aborted) {
            loading = false;
            return resolve();
        };

        let keyword = decodeURI(window.location.search.slice(1));

        await getGif(keyword, 1);
        loading = false;
        resolve();
    });
};

async function kwrdApply(e) {
    if (loading) {
        ownController.abort();
        await Promise.all(Object.values(abortHandlers));
        ownController = new AbortController();
    };

    return abortHandlers.kwrdApply = new Promise(async (resolve, reject) => {
        loading = true;

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        if (ownController.signal.aborted) {
            loading = false;
            return resolve();
        };

        let keyword = e.target.textContent;
        let input = document.querySelector('input[name="search"]');
        input.value = keyword;
        setCategoryName(e, `?${keyword}`);

        await getGif(e.target.textContent);
        loading = false;

        resolve();

    });
};

function setCategoryName(e, category) {
    let pageName = window.location.pathname.slice(1).split('/')[0];
    let href = `/${pageName}/${category}`;
    history.pushState(category, null, href);
};

export function SubPagesHandler(params) {
    if (params[1]) {
        let search = params[1].slice(1);
        let input = document.querySelector('input[name="search"]');
        input.value = search;
        getGif(decodeURI(search));
    };
}


async function getGif(keyword, refresh = 0) {
    return abortHandlers.getGif = new Promise(async (resolve, reject) => {

        loading = true;
        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        const imgWrapper = document.querySelector('.img-container-img');
        const msg = document.querySelector('.msg');
        const msgContainer = document.querySelector('.img-container-header');
        const refreshBtn = document.querySelector('.refreshBtn');
        const imgContainer = document.querySelector('.img-container');
        const searhForm = document.querySelector('.searh-form-container');
        const submitButton = document.querySelector('.submit-button');
        let input = document.querySelector('input[name="search"]');

        if (ownController.signal.aborted) {
            loading = false;
            return resolve();
        };

        try {
            addKwrd(keyword);
            if (refresh) {
                imgWrapper.classList.remove('visible');
                msgContainer.after(loader);
                refreshBtn.setAttribute('disabled', 'disabled');
            } else {
                imgWrapper.classList.remove('visible');
                imgContainer.classList.remove('visible');
                document.querySelector('.search-form').after(loader);
            };

            msg.classList.remove('invalid-message');
            clear(imgWrapper);
            submitButton.setAttribute('disabled', 'disabled');

            let search = await searchRandom(keyword, ownController);
            let id = Object.keys(search.gifs[search.gifs.length - 1])[0];
            let content = await search.getLargeGif(id, true, true, ownController);
            imgWrapper.append(content.img, content.shareContent);
            document.querySelector('.msg').innerHTML = `Here is a random gif about <span class="msg-kwrd">${keyword}</span>`;
            let makeImgVisible = new Promise((resolve, reject) => {
                setTimeout(() => {
                    document.querySelector('.img-container').classList.add('visible');
                    document.querySelector('.img-container-img').style.display = '';
                    document.querySelector('.img-container-img').classList.add('visible');
                    resolve();
                }, 0);
            });
            await makeImgVisible;
            document.querySelector('.refreshBtn').style.display = 'block';
            if (document.querySelector('.loader')) document.querySelector('.loader').remove();
            document.querySelector('.refreshBtn').removeAttribute('disabled');
            document.querySelector('.submit-button').removeAttribute('disabled');
            loading = false;
            resolve();
        } catch (e) {
            if (e.message == 'The user aborted a request.') {
                input.value = '';
                refreshBtn.removeAttribute('disabled');
                submitButton.removeAttribute('disabled');
                loader.remove();
                refreshBtn.style.display = 'none';
                imgWrapper.style.display = 'none';
                loading = false;
                let pageName = window.location.pathname.slice(1).split('/')[0];
                let href = `/${pageName}`;
                history.pushState(null, null, href);
                return resolve();
            };
            msg.classList.add('invalid-message');
            msg.innerText = `Oops! ${e.message}`
            refreshBtn.removeAttribute('disabled');
            submitButton.removeAttribute('disabled');
            loader.remove();
            imgContainer.classList.add('visible');
            refreshBtn.style.display = 'none';
            imgWrapper.style.display = 'none';
            loading = false;
            resolve();
        };
    });
};

export function addKwrd(keyword) {
    kwrds.doc(`${keyword}`).set({
        word: keyword.trim(),
        qty: firebase.firestore.FieldValue.increment(1),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
};