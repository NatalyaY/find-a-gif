'use strict';
import { renderGifs } from './category.js'
import { setFnOnLoad, saveAbortHandler } from "./main.js"

let ownControl = {};
ownControl.controller = '';
ownControl.galleryInstance = '';
let controller;
let abortHandlers = {};

export function init() {
    return new Promise(async (resolve, reject) => {
        await getController();
        await renderGifs({ trending: true, place: document.querySelector('.trending-page'), header: false, ownControl: ownControl });
        setFnOnLoad(getController);
        setFnOnLoad(gallerySetInfiniteLoad);
        setFnOnLoad(gallerySetAlinment);
        resolve();
    })
};

async function getController() {
    
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

        if (ownControl.gallery) {
            ownControl.gallery.controller = ownControl.controller;
        };

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