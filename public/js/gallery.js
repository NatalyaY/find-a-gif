'use strict';

import { setListener, clear, detouchListenersFromModule, setFnOnLoad, setFnOnUnLoad } from "./main.js"
import { saveAbortHandler } from "./main.js"

export class Gallery {

    constructor(target, instance, { minPadding = 10, maxPadding = false, qty = instance.limit, infiniteLoad = true, controller = '' } = {}) {
        this.target = target;
        this.instance = instance;
        this.options = { minPadding, maxPadding, qty, infiniteLoad, controller };
        this.controller = this.options.controller;
        this.controller.signal.addEventListener('abort', async () => {
            this.abortHandlers.removePreloader = this.removePreloader();
            this.controllerHandler();
        });
        this.columnHeights = [];
        this.times = 0;
        this.getGrid();
        this.getFilters();
        return this.render(true);
    }

    getGrid() {
        this.target = document.querySelector(`.${this.target.className.replace(/ /g, '.')}`);
        this.targetWidth = parseFloat(getComputedStyle(this.target).width);

        let id = Object.keys(this.instance.gifs[0]);
        let sampleImg = this.instance.gifs[0][id[0]]["fixed_width"];
        this.imageWidth = parseInt(sampleImg.width); // as the images width should be equal and be listed at [1] index in image's arr

        this.count = Math.floor(this.targetWidth / this.imageWidth);
        if ((this.count * this.imageWidth + (this.count - 1) * this.options.minPadding) > this.targetWidth) this.count = this.count - 1;
        if (((this.targetWidth - (this.count * this.imageWidth + (this.count - 1) * this.options.minPadding)) / 2 >= 30) || (this.count == 1)) {
            let imageWidth = (this.targetWidth - (++this.count - 1) * this.options.minPadding - 20) / this.count;
            this.resizeScale = imageWidth / this.imageWidth;
            this.imageWidth = imageWidth;
        } else {
            this.resizeScale = 1;
        };
        if (this.options.maxPadding) {
            this.options.padding = (this.targetWidth - this.count * this.imageWidth) / (this.count - 1);
            this.options.sidePadding = 0;
        } else {
            this.options.sidePadding = (this.targetWidth - (this.count * this.imageWidth + (this.count - 1) * this.options.minPadding)) / 2;
            this.options.padding = this.options.minPadding
        };
    }

    getFilters() {

        this.filersBlock = document.createElement('div');
        this.filersBlock.classList.add('gallery__filters', encodeURI(this.instance.kwrd) || "trending");

        let switchContainer = document.createElement('div');
        switchContainer.classList.add('switchContainer');

        let switchText = document.createElement('span');
        switchText.classList.add('switchContainer_Text');
        switchText.innerText = 'Infinite load';

        let switchbox = document.createElement('label');
        let checkbox = document.createElement('input');
        let slider = document.createElement('span');
        switchbox.classList.add('switchContainer_label');
        checkbox.type = 'checkbox';
        checkbox.classList.add('switchContainer_Checkbox');
        slider.classList.add('switchContainer_slider');
        checkbox.checked = this.options.infiniteLoad;
        if (this.options.infiniteLoad) {
            checkbox.setAttribute('checked', 1)
        };
        switchbox.appendChild(checkbox);
        switchbox.appendChild(slider);
        switchContainer.append(switchText);
        switchContainer.appendChild(switchbox);
        this.filersBlock.append(switchContainer);

        let qtySelectorContainer = document.createElement('div');
        qtySelectorContainer.classList.add('qtySelectorContainer');

        let qtyArr = [10, 25, 50, 100];

        qtyArr.forEach(function(elem) {
            let label = document.createElement('label');
            label.classList.add('qty__label');

            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'qty';
            radio.value = `${elem}`;
            radio.classList.add('qty__radio');
            if (this.options.qty == elem) {
                radio.setAttribute('checked', '1');
            };

            let span = document.createElement('span');
            span.classList.add('qty__span');
            span.innerText = `${elem}`;
            label.append(radio);
            label.append(span);
            qtySelectorContainer.append(label);
        }.bind(this));


        this.filersBlock.append(qtySelectorContainer);

        function qtyHandler(e) {
            document.querySelectorAll('.qtySelectorContainer input[checked]').forEach(function(elem) {
                elem.removeAttribute('checked');
            });
            e.target.setAttribute('checked', '1');
            this.setQty(parseFloat(e.target.value));
        };

        let alinmentSelectorContainer = document.createElement('div');
        alinmentSelectorContainer.classList.add('alinmentSelectorContainer');

        [0, 1].forEach(function(elem) {
            let label = document.createElement('label');
            label.classList.add('alinment__label');

            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'alinment';
            radio.value = `${elem}`;
            radio.classList.add('alinment__radio');

            if (this.options.maxPadding == elem) {
                radio.checked = true;
                radio.setAttribute('checked', '1');
            };

            let btn = document.createElement('div');
            btn.classList.add('alinment__btn');

            let span = document.createElement('span');
            span.classList.add('alinment__span', `alinment__span-${elem}`);

            btn.append(span);

            label.append(radio);
            label.append(btn);
            alinmentSelectorContainer.append(label);
        }.bind(this));
        this.filersBlock.append(alinmentSelectorContainer);


        function alinmentHandler(e) {
            document.querySelectorAll('.alinmentSelectorContainer input[checked]').forEach(function(elem) {
                elem.removeAttribute('checked');
            });
            e.target.setAttribute('checked', '1');
            this.setAlinment(parseFloat(e.target.value));
        };

        this.target.append(this.filersBlock);


        function checkboxHandler(e) {
            e.target.toggleAttribute('checked');
            this.setInfinite(e.target.checked);
        };

        setListener('.switchContainer_Checkbox')(checkboxHandler.bind(this), 'change');
        setListener('.alinmentSelectorContainer')(alinmentHandler.bind(this), 'change');
        setListener('.qtySelectorContainer')(qtyHandler.bind(this), 'change');


        this.imagesBlock = document.createElement('div');
        this.imagesBlock.classList.add('gallery__imagesBlock', encodeURI(this.instance.kwrd) || "trending");
        this.imagesBlock.style.position = 'relative';
        this.target.append(this.imagesBlock);

        this.gif = new Image();
        this.gif.src = '/img/2.gif';
        this.gif.style.margin = 'auto';
        this.gif.style.display = 'block';
        this.gif.style.position = 'absolute';
        this.gif.style.bottom = '99999px';
        this.gif.style.left = '50%';
        this.gif.classList.add('infiniteLoadGif');
        this.gif.classList.add('load_gif');
        this.gif.style.transform = 'translateX(-50%)';

        this.btn = document.createElement('button');
        this.btn.classList.add('moreBtn', 'btn');
        this.btn.innerText = 'More!';
        this.btn.style.position = 'absolute';
        this.btn.style.left = '50%';
        this.btn.style.bottom = '99999px';

        this.windowWeight = window.innerWidth;

        this.loader = this.gif.cloneNode();
        this.loader.style.bottom = '50%';
        this.loader.style.transform = 'translate(-50%,50%)';
        this.controller;
        this.popupHandler = this.showGifPopup.bind(this);
        this.abortHandlers = {};

        this.controllerHandler = () => {
            if (Object.keys(this.abortHandlers).length != 0) {
                this.abortHandler = Promise.all(Object.values(this.abortHandlers));
            };
        };

        this.controllerHandler = this.controllerHandler.bind(this);

        this.loading = false;

        this.resizeHandler = async () => {
            if (this.windowWeight == window.innerWidth) {
                return;
            };

            await this.abortHandlers.setAlinment;

            if (this.windowWeight == window.innerWidth) {
                return;
            };

            this.windowWeight = window.innerWidth;
            this.setAlinment(this.options.maxPadding);
        };

        setListener('window')(this.resizeHandler.bind(this), 'resize');

        this.removePreloader = () => {
            return new Promise(async (resolve, reject) => {
                let imagesBlock = document.querySelector('.gallery__imagesBlock');
                let wrappers = imagesBlock.querySelectorAll('.gifWrapper');
                wrappers.forEach(function(wrapper) {
                    let id = wrapper.dataset.id;
                    let preloader = wrapper.querySelector('.preloader');
                    let gif = wrapper.querySelector('.gallery__img');
                    if (preloader) preloader.remove();
                    if (gif.src != gif.dataset.src) gif.src = gif.dataset.src;
                });
                resolve();
            })
        };
    }

    render(isFirstTime) {

        return this.abortHandlers.render = new Promise(async (resolve, reject) => {
            this.loading = true;
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            function removePreloader(img) {
                let id = img.dataset.id;
                let imagesBlock = document.querySelector('.gallery__imagesBlock');
                let wrapper = imagesBlock.querySelector(`.gifWrapper[data-id="${id}"]`);
                let preloader = wrapper.querySelector('.preloader');
                let gif = wrapper.querySelector('.gallery__img');
                if (preloader) preloader.remove();
                gif.src = gif.dataset.src;
            };

            this.isEnd = this.instance.isEnd;
            let imagesBlock = document.querySelector('.gallery__imagesBlock');

            let iteraction = isFirstTime ? 0 : this.instance.gifs.length - 1;

            let ids = Object.keys(this.instance.gifs[iteraction]);
            let images = [];
            ids.forEach((id) => {
                let arr = [];
                arr.push(this.instance.gifs[iteraction][id]["fixed_width"].url, this.instance.gifs[iteraction][id]["fixed_width"].height, id);
                images.push(arr);
            });

            this.firstImage = 0;
            this.lastImage = images.length;
            this.columnHeights = [];

            for (let row = this.firstImage; row <= this.lastImage; row = row + this.count) { // rows: this.count images in 1 row
                for (let column = 0; column < this.count; column++) { // columns

                    if (!images[0]) {
                        break;
                    };

                    let customColumn;

                    if (!isFirstTime && (imagesBlock.querySelectorAll('.gifWrapper').length < this.count)) {
                        customColumn = imagesBlock.querySelectorAll('.gifWrapper').length;
                    };

                    let prevImg = imagesBlock.querySelectorAll('.gifWrapper')[imagesBlock.querySelectorAll('.gifWrapper').length - this.count];


                    let top, left, colNum;

                    if (prevImg) {
                        this.columnHeights = [];

                        for (let n = 0; n < this.count; n++) { // save heights of all columns to put the image in column with min height
                            let column = document.querySelectorAll(`.gifWrapper[data-column="${n+1}"]`);
                            let lastImg = column[column.length - 1];
                            let lastImgTop = parseFloat(lastImg.style.top);
                            let lastImgHeight = parseFloat(lastImg.style.height);
                            this.columnHeights.push(lastImgTop + lastImgHeight);
                        };

                        let minColumnNumber = this.columnHeights.indexOf(Math.min(...this.columnHeights)); // find the number of column with min height
                        let minColumn = document.querySelectorAll(`.gifWrapper[data-column="${minColumnNumber+1}"]`);
                        let lastImgMinColumn = minColumn[minColumn.length - 1];
                        if (prevImg != lastImgMinColumn) prevImg = lastImgMinColumn;

                        let prevTop = parseFloat(prevImg.style.top);
                        let prevHeight = parseFloat(prevImg.style.height);

                        top = prevTop + prevHeight + this.options.padding;
                        left = parseFloat(prevImg.style.left);
                        colNum = prevImg.dataset.column;

                    } else { // for first row

                        if ((column == 0) && !customColumn) {
                            left = this.options.sidePadding;
                        } else {
                            left = this.options.maxPadding ? (this.imageWidth + this.options.padding) * column :
                                (this.imageWidth + this.options.padding) * (customColumn || column) + this.options.sidePadding;
                        };
                        top = 0;
                        colNum = (customColumn || column) + 1;
                    };

                    let gifWrapper = document.createElement('div');
                    gifWrapper.classList.add('gifWrapper');


                    let img = document.createElement('img');
                    img.classList.add('gallery__img');
                    img.dataset.src = images[0][0];
                    img.src = '/img/placeholder.png';
                    let height = parseFloat(images[0][1]);
                    // img.style.position = 'absolute';
                    // img.style.left = left + 'px';
                    img.style.width = this.imageWidth + 'px';
                    img.style.height = height * this.resizeScale + 'px';
                    // img.style.top = top + 'px';
                    img.dataset.column = colNum;
                    img.dataset.id = images[0][2];

                    gifWrapper.style.left = left + 'px';
                    gifWrapper.style.width = img.style.width;
                    gifWrapper.style.height = img.style.height;
                    gifWrapper.style.top = top + 'px';
                    gifWrapper.style.position = 'absolute';
                    gifWrapper.style.overflow = 'hidden';
                    gifWrapper.dataset.id = images[0][2];
                    gifWrapper.dataset.column = colNum;

                    let preloader = document.createElement('div');
                    preloader.classList.add('preloader', 'loading');
                    preloader.style.width = '100%';
                    preloader.style.height = '100%';

                    images.shift();


                    gifWrapper.append(preloader, img)

                    imagesBlock.appendChild(gifWrapper);

                    this.columnHeights[img.dataset.column - 1] = top + height; // as the new img was added into DOM, the height of column, in which img was added, should be updated (it could be the last iteration in cicle)
                };
            };

            setListener('.gifWrapper')(this.popupHandler);
            let columnHeights = (this.columnHeights.length == '1') ? this.columnHeights[0] : Math.max(...this.columnHeights);

            if (this.options.infiniteLoad) {
                imagesBlock.style.height = columnHeights + this.options.sidePadding + 'px';
            };

            this.times++;
            this.target = document.querySelector(`.${this.target.className.replace(/ /g, '.')}`);

            if (this.isEnd) {
                if (this.infiniteLoadObserver) this.infinLoadObserver.disconnect();
                detouchListenersFromModule('.moreBtn', true);
                let btn = imagesBlock.querySelector('.moreBtn');
                if (btn) {
                    btn.parentNode.removeChild(btn);
                };

                let msg = document.createElement('p');
                msg.innerText = (this.instance.error.message == 'No results') ? 'No more results' : this.instance.error.message;
                msg.style.position = 'absolute';
                msg.style.left = '50%';
                msg.style.transform = 'translateX(-50%)';
                imagesBlock.append(msg);
                let msgHeight = parseInt(getComputedStyle(msg).height);
                imagesBlock.style.height = columnHeights + msgHeight + 100 + 'px';
                msg.style.bottom = 50 + 'px';
            };

            if (isFirstTime && !this.isEnd) {
                if (this.options.infiniteLoad) {
                    await this.infiniteLoadObserver();
                } else {
                    await this.setMoreBtn();
                };
            };

            this.gifsLazyLoadObserve(ids);

            if (this.controller.signal.aborted) {
                await this.removePreloader();
            };

            this.loading = false;

            resolve(this);
        })
    }

    async fnOnLoad() {
        if (this.options.infiniteLoad) {
            await this.infiniteLoadObserver();
        };
    }

    gifsLazyLoadObserve(ids) {
        return this.abortHandlers.gifsLazyLoadObserve = new Promise(async (resolve, reject) => {
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);
            let selectorsList = ids.map(id => `.gifWrapper[data-id="${id}"]`);
            let gifs = [];

            selectorsList.forEach((selector) => gifs.push(document.querySelector(selector)));


            if ("IntersectionObserver" in window) {
                this.lazyLoadObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // document.querySelector("body > header > section > div > nav > ul > li:nth-child(1) > a").click();
                            if (this.controller.signal.aborted) {
                                this.lazyLoadObserver.disconnect();
                                return;
                            };
                            let gif = entry.target.querySelector('.gallery__img');
                            let preloader = entry.target.querySelector('.preloader');
                            gif.onload = () => {
                                gif.decode().then(() => {
                                    if (preloader) preloader.remove();
                                    entry.target.classList.remove('loading');
                                });
                            };
                            gif.src = gif.dataset.src;
                            this.lazyLoadObserver.unobserve(entry.target);
                        }
                    });
                });

                gifs.forEach((gif) => {
                    this.lazyLoadObserver.observe(gif);
                });
            };
            resolve();
        });
    }

    infiniteLoadObserver() {
        return this.abortHandlers.infiniteLoadObserver = new Promise(async (resolve, reject) => {
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            let imagesBlock = document.querySelector('.gallery__imagesBlock');
            if (!imagesBlock) return resolve();

            let target = imagesBlock.lastChild;

            if ("IntersectionObserver" in window) {
                this.infinLoadObserver = new IntersectionObserver(async (entries, observer) => {
                    if (entries[0].isIntersecting) {

                        if (this.loading) await Promise.all(Object.values(this.abortHandlers));
                        this.abortHandlers.InfiniteLoadHandler = new Promise(async (resolve, reject) => {

                            this.loading = true;
                            let timer = setTimeout(() => {}, 0);
                            await timer;
                            clearTimeout(timer);
                            console.log('entries[0].isIntersecting ' + entries[0].target.dataset.id);

                            if (this.controller.signal.aborted) {
                                this.loading = false;
                                delete this.abortHandlers.InfiniteLoadHandler;
                                this.infinLoadObserver.disconnect();
                                return;
                            };

                            let imagesBlock = document.querySelector('.gallery__imagesBlock');
                            if (!imagesBlock) return resolve();
                            imagesBlock.append(this.gif);
                            this.gif.style.left = '50%';
                            let gifHeight = parseFloat(getComputedStyle(this.gif).height);
                            let maxHeight = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
                            imagesBlock.style.height = maxHeight + gifHeight + 10 + 'px';
                            this.gif.style.bottom = 0;

                            function renderMore() {
                                return new Promise(async (resolve, reject) => {

                                    try {
                                        await this.instance.setUrl({ controller: this.controller });
                                    } catch (e) {
                                        if (e.message == 'The user aborted a request.') {
                                            this.gif.remove();
                                            this.loading = false;
                                            return resolve('infin');
                                        };

                                        this.infinLoadObserver.disconnect();

                                        let msg = document.createElement('p');
                                        msg.innerText = (e.message == 'No results') ? 'No more results' : e.message;
                                        msg.style.position = 'absolute';
                                        msg.style.bottom = '0';
                                        msg.style.left = '50%';
                                        msg.style.transform = 'translateX(-50%)';
                                        this.gif.remove();
                                        this.loading = false;
                                        imagesBlock.append(msg);
                                        this.isEnd = true;
                                        delete this.abortHandlers.InfiniteLoadHandler;
                                        return resolve('infin');
                                    };


                                    this.render(false)
                                        .then(() => {

                                            this.infinLoadObserver.disconnect();

                                            let newTarget = imagesBlock.lastChild;
                                            this.infinLoadObserver.observe(newTarget);

                                            console.log('entries[0]end ' + entries[0].target.dataset.id + ' ,' + "newTarget: " + newTarget.dataset.id);


                                            this.gif.remove();
                                            this.loading = false;
                                            delete this.abortHandlers.infiniteLoadObserver;
                                            // this.infinLoadObserver.unobserve(entries[0]);
                                            resolve('infin');
                                        })
                                        .catch(() => {
                                            delete this.abortHandlers.infiniteLoadObserver;
                                            this.gif.remove();
                                            this.loading = false;
                                            resolve('infin');
                                        });
                                });

                            };

                            renderMore = renderMore.bind(this);
                            await renderMore();

                            this.gif.remove();
                            resolve('infin_final');

                        });

                    }
                });

                this.infinLoadObserver.observe(target);
            };
            resolve();
        });
    }

    async setInfinite(infiniteStatus) {
        return this.abortHandlers.setInfinite = new Promise(async (resolve, reject) => {
            if (this.loading) await Promise.all(Object.values(this.abortHandlers));
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            if (this.isEnd) {
                this.options.infiniteLoad = infiniteStatus;
                return resolve();
            };

            this.options.infiniteLoad = infiniteStatus;
            let imagesBlock = document.querySelector('.gallery__imagesBlock');

            if (this.options.infiniteLoad) {
                if (imagesBlock.querySelector('.moreBtn')) {
                    detouchListenersFromModule(imagesBlock.querySelector('.moreBtn'));
                    imagesBlock.querySelector('.moreBtn').parentNode.removeChild(imagesBlock.querySelector('.moreBtn'));
                };
                await this.infiniteLoadObserver();

            } else {
                if (this.infiniteLoadObserver) this.infinLoadObserver.disconnect();
                detouchListenersFromModule('document');
                await this.setMoreBtn();
            };
            resolve();

        });


    }

    async setMoreBtn() {

        return this.abortHandlers.setMoreBtn = new Promise(async (resolve, reject) => {
            this.loading = true;
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            let imagesBlock = document.querySelector('.gallery__imagesBlock');
            imagesBlock.append(this.btn);
            let btnHeight = parseFloat(getComputedStyle(this.btn).height);
            let maxHeight = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
            imagesBlock.style.height = (this.options.infiniteLoad) ? (maxHeight + this.options.sidePadding + 'px') :
                (maxHeight + parseFloat(getComputedStyle(this.btn).height) + 100 + 'px');
            let bottomSpace = (btnHeight + 100) / 2;
            this.btn.style.bottom = `${bottomSpace}px`;
            this.btn.style.transform = 'translate(-50%, 50%)';

            if (!this.moreBtnHandler) {
                this.moreBtnHandler = async function(e) {
                    if (this.loading) await Promise.all(Object.values(this.abortHandlers));
                    return this.abortHandlers.setMoreBtn = new Promise(async (resolve, reject) => {
                        let timer = setTimeout(() => {}, 0);
                        this.loading = true;
                        await timer;
                        clearTimeout(timer);
                        e.preventDefault();
                        let imagesBlock = document.querySelector('.gallery__imagesBlock');
                        if (!imagesBlock) return resolve();
                        let btn = imagesBlock.querySelector('.moreBtn');
                        btn.style.display = 'none';
                        imagesBlock.append(this.gif);
                        this.gif.style.left = '50%';
                        let gifHeight = parseFloat(getComputedStyle(this.gif).height);
                        let maxHeight = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
                        imagesBlock.style.height = maxHeight + gifHeight + 10 + 'px';
                        this.gif.style.bottom = 0;

                        try {
                            await this.instance.setUrl({ controller: this.controller });
                        } catch (e) {
                            if (e.message == 'The user aborted a request.') {
                                this.gif.remove();
                                this.controller.signal.removeEventListener('abort', this.controllerHandler);
                                this.loading = false;
                                return resolve('btn_aborted_Fetch');
                            };
                            detouchListenersFromModule('.moreBtn', true);
                            let btn = imagesBlock.querySelector('.moreBtn');
                            if (btn) {
                                btn.parentNode.removeChild(btn);
                            };

                            let msg = document.createElement('p');
                            msg.innerText = (e.message == 'No results') ? 'No more results' : e.message;
                            msg.style.position = 'absolute';
                            msg.style.bottom = '0';
                            msg.style.left = '50%';
                            msg.style.transform = 'translateX(-50%)';
                            this.btn.remove();
                            imagesBlock.append(msg);
                            this.isEnd = true;
                            return resolve('btn_aborted_noErrInFetch');
                        };

                        this.render(false).then(() => {
                                if (!this.isEnd) {
                                    imagesBlock.style.height = Math.max(...this.columnHeights) + btnHeight + 100 + 'px';
                                };
                                this.loading = false;
                                resolve();
                            })
                            .catch(() => {
                                this.loading = false;
                                resolve('btn_aborted_afterRender');
                            });
                        this.gif.remove();
                        btn.style.display = '';

                    });
                };
                this.moreBtnHandler = this.moreBtnHandler.bind(this);
            };

            setListener('.moreBtn')(this.moreBtnHandler);
            this.loading = false;
            resolve();
        });
    }


    async setAlinment(maxPadding) {
        if (this.loading) await Promise.all(Object.values(this.abortHandlers));

        return this.abortHandlers.setAlinment = new Promise(async (resolve, reject) => {
            this.loading = true;
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            if (this.controller.signal.aborted) {
                document.querySelectorAll('.alinmentSelectorContainer input').forEach(function(elem) {
                    elem.toggleAttribute('checked');
                });
                this.loading = false;
                return resolve();
            };

            let gifsBlock = document.querySelector(".gallery__imagesBlock");
            let filtersBlock = document.querySelector(".gallery__filters");
            let loader = this.gif.cloneNode();
            loader.style.bottom = '-50px';

            gifsBlock.style.visibility = 'hidden';
            filtersBlock.append(loader);

            let count = this.count;
            let oldPadding = this.options.padding;
            let oldSidePadding = this.options.sidePadding;
            let oldImageWidth = this.imageWidth;
            let imagesBlock = document.querySelector('.gallery__imagesBlock');
            this.options.maxPadding = maxPadding;
            let maxHeightOld = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
            let oldHeight = parseFloat(getComputedStyle(imagesBlock).height);
            let bottomPadding = oldHeight - maxHeightOld;
            this.getGrid();

            function changeAlinment(that) {
                return new Promise(async (resolve, reject) => {

                    if (that.count != count) {
                        that.loading = true;
                        let times = that.times;
                        that.times = 0;
                        that.instance.qtyMultiplier = 0;
                        that.instance.gifs = [];

                        if (that.options.infiniteLoad) {
                            if (that.infiniteLoadObserver) that.infinLoadObserver.disconnect();
                        };

                        let gifs = Array.from(imagesBlock.childNodes).filter((el) => el.className == 'gifWrapper');
                        gifs.forEach((gif) => imagesBlock.removeChild(gif));

                        that.instance.setUrl({ controller: that.controller })
                            .then(() => {
                                that.render(false)
                                    .then(async () => {
                                        that.loading = true;
                                        for (let i = 1; i < times; i++) {
                                            try {
                                                await that.instance.setUrl({ controller: that.controller });
                                                await that.render(false);
                                            } catch (e) {
                                                that.loading = false;
                                                resolve('alinm_err');
                                            }
                                        };
                                        if (that.options.infiniteLoad) {
                                            await that.infiniteLoadObserver();
                                        };
                                        that.loading = false;
                                        resolve('alinm_ok');
                                    })
                                    .catch(() => resolve('alinm_err1'));
                            })
                            .catch((e) => {
                                if (e.message == 'The user aborted a request.') {
                                    that.gif.remove();
                                    that.controller.signal.removeEventListener('abort', that.controllerHandler);
                                    return resolve('alinm_err_fetch');
                                } else reject(e);
                            });

                    } else {

                        that.loading = true;

                        let prevImgByColNum = {};

                        imagesBlock.querySelectorAll('.gifWrapper').forEach(function(elem) {

                            let left = parseFloat(elem.style.left);
                            let top = parseFloat(elem.style.top);
                            let currentWidth = parseFloat(elem.style.width);
                            let id = elem.dataset.id;
                            let column = elem.dataset.column;
                            let prevImg = prevImgByColNum[column] ? prevImgByColNum[column] : '';

                            let height;

                            that.instance.gifs.forEach((el) => {
                                if (el[id]) {
                                    height = el[id].fixed_width.height;
                                };
                            });

                            let newHight = height * this.resizeScale;
                            let heightPadding = that.options.maxPadding ? that.options.sidePadding : that.options.padding;
                            let newTop = prevImg ? prevImg.height + prevImg.top + that.options.padding : 0;

                            elem.style.top = newTop + 'px';
                            elem.style.width = that.imageWidth + 'px';
                            elem.style.height = newHight + 'px';

                            if (elem.dataset.column - 1 == 0) {
                                elem.style.left = left + that.options.sidePadding - oldSidePadding + 'px';
                            } else {
                                elem.style.left = left + that.options.sidePadding - oldSidePadding + (that.options.padding - oldPadding) * (elem.dataset.column - 1) + (that.imageWidth - currentWidth) * (elem.dataset.column - 1) + 'px';
                            };

                            prevImgByColNum[column] = { height: newHight, top: newTop };

                        }.bind(that));
                        resolve('alinm_ok_wo_rerender');
                    };
                });
            };

            await changeAlinment(this);
            gifsBlock.style.visibility = 'visible';
            loader.remove();
            let maxHeight = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
            imagesBlock.style.height = maxHeight + bottomPadding + 'px';
            this.loading = false;
            resolve();

        })
    }

    async setQty(qty) {
        if (this.loading) {
            await Promise.all(Object.values(this.abortHandlers));
        };

        if (document.querySelector('.qtySelectorContainer input[checked]').value != qty) {
            return;
        };

        return this.abortHandlers.setQty = new Promise(async (resolve, reject) => {
            if (this.controller.signal.aborted) {
                document.querySelectorAll('.qtySelectorContainer input').forEach((elem) => {
                    if (elem.value == this.options.qty) {
                        elem.setAttribute('checked', 1);
                    } else elem.removeAttribute('checked');
                });
                return resolve();
            };

            this.loading = true;
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            let imagesBlock = document.querySelector('.gallery__imagesBlock');
            let btn = imagesBlock.querySelector('.moreBtn');
            if (btn) btn.style.display = 'none';
            
            imagesBlock.append(this.gif);
            this.gif.style.left = '50%';
            let gifHeight = parseFloat(getComputedStyle(this.gif).height);
            let maxHeight = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
            imagesBlock.style.height = maxHeight + gifHeight + 10 + 'px';
            this.gif.style.bottom = 0;

            if (this.isEnd) {
                this.times = 0;
                this.options.qty = qty;
                while (imagesBlock.firstChild) {
                    imagesBlock.removeChild(imagesBlock.firstChild);
                };
                this.instance.limit = qty;
                this.instance.qtyMultiplier = 0;
                this.instance.gifs = [];
                this.instance.isEnd = false;
                await this.instance.setUrl({ controller: this.controller });
                await this.render(true);
                this.gif.remove();
                if (btn) btn.style.display = '';
                return resolve();
            };

            let diff = qty - this.options.qty;
            let currentQty = this.options.qty;

            function reRender(that) {
                return new Promise(async (resolve, reject) => {
                    if (diff < 0) {
                        diff = -diff * that.times;
                        let imgIds = [];

                        for (let i = 0; i < diff; i++) {
                            let j = that.instance.gifs.length - 1;
                            let imgIds = Object.keys(that.instance.gifs[j]);
                            let idNumber = imgIds.length - 1;
                            let id = imgIds[idNumber];

                            imagesBlock.removeChild(imagesBlock.querySelector(`[data-id="${id}"]`));

                            delete that.instance.gifs[j][id];
                            if (Object.keys(that.instance.gifs[j]).length == 0) {
                                that.instance.gifs.pop();
                            };
                        };

                        that.instance.offsetShift = 0;
                        resolve();
                    } else {
                        if (that.options.infiniteLoad) {
                            if (that.infiniteLoadObserver) that.infinLoadObserver.disconnect();
                        } else {
                            if (imagesBlock.querySelector('.moreBtn')) {
                                detouchListenersFromModule(imagesBlock.querySelector('.moreBtn'));
                                imagesBlock.querySelector('.moreBtn').parentNode.removeChild(imagesBlock.querySelector('.moreBtn'));
                            };
                        };

                        let offset = that.instance.limit * that.instance.qtyMultiplier;
                        that.options.qty = diff * that.times;
                        that.instance.limit = diff * that.times;

                        try {
                            await that.instance.setUrl({ controller: that.controller, customOffset: offset });
                            that.render(false)
                                .then(async () => {
                                    that.times--;
                                    that.instance.qtyMultiplier--;

                                    that.options.qty = qty;
                                    that.instance.limit = qty;

                                    if (!that.isEnd) {
                                        if (that.options.infiniteLoad) {
                                            await that.infiniteLoadObserver();
                                        } else {
                                            await that.setMoreBtn();
                                        };
                                    };
                                    resolve('qty');
                                })
                                .catch(() => { throw e; });
                        } catch (e) {
                            that.loading = false;
                            that.options.qty = currentQty;
                            that.instance.limit = currentQty;
                            if (!that.isEnd) {
                                if (that.options.infiniteLoad) {
                                    await that.infiniteLoadObserver();
                                } else {
                                    await that.setMoreBtn();
                                };
                            };
                            reject('qty');
                        }
                    };
                });
            };

            try {
                await reRender(this);
            } catch (e) {
                document.querySelectorAll('.qtySelectorContainer input').forEach((elem) => {
                    if (elem.value == currentQty) {
                        elem.setAttribute('checked', '1');
                    } else elem.removeAttribute('checked');
                });
                this.gif.remove();
                if (btn) btn.style.display = '';
                return resolve('qty_rejected');
            }

            this.gif.remove();
            if (btn) btn.style.display = '';

            if (!this.isEnd) {
                let maxHeight = Math.max(...Array.from(imagesBlock.querySelectorAll('.gifWrapper')).map((el) => parseFloat(el.style.height) + parseFloat(el.style.top)));
                imagesBlock.style.height = (this.options.infiniteLoad) ? (maxHeight + this.options.sidePadding + 'px') :
                    (maxHeight + parseFloat(getComputedStyle(imagesBlock.querySelector('.moreBtn')).height) + 100 + 'px');
            };

            this.options.qty = qty;
            this.instance.limit = qty;
            if (this.options.infiniteLoad) {
                await this.infiniteLoadObserver();
            };
            this.loading = false;
            resolve();
        })
    }

    async showGifPopup(e) {
        if (this.loading) await Promise.all(Object.values(this.abortHandlers));
        return this.abortHandlers.showGifPopup = new Promise(async (resolve, reject) => {
            this.loading = true;
            let timer = setTimeout(() => {}, 0);
            await timer;
            clearTimeout(timer);

            let controller = new AbortController();

            function popupAbortHandler() {
                closePopup().bind(this);
            };

            this.controller.signal.addEventListener('abort', popupAbortHandler);

            function showPopup(that) {
                if (controller.signal.aborted) throw new Error('aborted');
                let popup = document.createElement('aside');
                popup.classList.add('gifPopup');
                let popupContent = document.createElement('div');
                popupContent.classList.add('popupContent', 'flex');
                let closeBtn = document.createElement('img');
                closeBtn.classList.add('close');
                closeBtn.src = "/img/close.png";
                closeBtn.setAttribute('alt', 'close');

                popup.append(popupContent, closeBtn);

                let scrollWidth = window.innerWidth - document.body.offsetWidth;

                let overlay = document.createElement('div');
                overlay.classList.add('overlay');

                popupContent.append(that.loader);
                document.body.append(overlay, popup);

                setListener('.overlay', '.close')(closePopup);

                document.getElementsByTagName('html')[0].style.overflow = "hidden";
                document.body.style.paddingRight = `${scrollWidth}px`;
            };

            function closePopup() {
                if (!controller.signal.aborted) controller.abort();
                this.controller.signal.removeEventListener('abort', popupAbortHandler);
                detouchListenersFromModule(document.querySelector('.gifPopup'));
                detouchListenersFromModule(document.querySelector('.overlay'));
                document.querySelector('.gifPopup').remove();
                document.querySelector('.overlay').remove();
                document.getElementsByTagName('html')[0].style.overflow = "";
                document.body.style.paddingRight = '';
            };

            closePopup = closePopup.bind(this);

            try {
                let target = e.currentTarget || e.target;
                showPopup(this);

                let content = await this.instance.getLargeGif(target.dataset.id, true, controller);

                this.loader.remove();
                let popupContent = document.querySelector('.popupContent');
                popupContent.append(content.img, content.shareContent);
                let popup = document.querySelector('.gifPopup');
                let aspectRatio = parseFloat(content.img.style.aspectRatio);
                let width = parseFloat(content.img.dataset.width);
                let height = parseFloat(content.img.style.height);
                popup.style.width = width + 20 + 'px';
                popup.style.aspectRatio = (width + 20) / (height + 128);
                if (controller.signal.aborted) closePopup();
                this.loading = false;
                resolve();
            } catch (e) {
                if (document.querySelector('.gifPopup')) closePopup();
                this.loading = false;
                resolve();
            }
        })
    }
}