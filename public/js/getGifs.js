'use strict';

export function setUrl(searchType) {
    let type = searchType;
    return function(kwrd = '', limit = '25', controller = new AbortController()) {
        let gifs = new FindGifs(kwrd, type, limit, controller);
        return gifs;
    };
};


class FindGifs {
    baseUrl = 'https://api.giphy.com/v1/gifs/';
    apikey = 'NPqwMRXL6c7hT9TpjBDtKocR70X2iXvR';

    constructor(kwrd, type, limit, controller) {
        this.kwrd = kwrd;
        this.type = type;
        this.limit = limit;
        this.qtyMultiplier = 0;
        this.gifs = [];
        this.cumulativeGifs = {};
        this.controller = controller;
        this.fetchTimes = 0;
        this.offsetShift = 0;
        return this.setUrl();
    }

    setUrl({ customOffset = '', customLimit = '', controller = this.controller } = {}) {

        let limit = customLimit ? customLimit : this.limit;

        this.offset = customOffset ? customOffset : this.limit * this.qtyMultiplier + this.offsetShift;
        this.controller = controller;

        switch (this.type) {
            case 'search':
                this.params = `limit=${limit}&q=${this.kwrd}&offset=${this.offset}`;
                break;
            case 'random':
                this.params = `tag=${this.kwrd}`;
                break;
            case 'trending':
                this.params = `limit=${limit}&offset=${this.offset}`;
                break;
            default:
                throw new Error('Error type');
                break;
        };

        this.url = `${this.baseUrl}${this.type}?api_key=${this.apikey}&${this.params}`;
        return this.fetchQuery();
    }

    fetchQuery() {
        return new Promise(async (resolve, reject) => {
            this.fetchTimes++;
            let response;
            try {
                let url = this.url,
                    controllerSignal = this.controller.signal;
                response = await fetch(url, { mode: 'cors', signal: controllerSignal });
            } catch (e) {
                return reject(e);
            };

            if (response.status != '200') {
                if (this.fetchTimes <= 3) {
                    return await this.fetchQuery()
                        .then((res) => {
                            if (this.fetchTimes != 0) {
                                this.fetchTimes = 0;
                            };
                            return resolve(res)
                        })
                        .catch((e) => {
                            return reject(e)
                        });
                } else {
                    this.offsetShift = 0;
                    return reject(new Error('Server Error'));
                };
            };

            let json = await response.json();

            if (Object.keys(json.data).length == 0) {
                if (this.fetchTimes <= 3) {
                    return await this.setUrl({ customOffset: this.customOffset })
                        .then((res) => {
                            return resolve(res)
                        })
                        .catch((e) => {
                            return reject(e)
                        });
                } else {
                    this.offsetShift = 0;
                    return reject(new Error('No results'));
                };
            };

            this.fetchTimes = 0;

            if (!Array.isArray(json.data)) {
                this.cumulativeGifs[json.data.id] = json.data.images;
            } else {
                let currentGifs = this.gifs.reduce((arr, gif) => {
                    return arr.concat(Object.keys(gif));
                }, []);

                let cumulativeGifs = Object.keys(this.cumulativeGifs);

                let allCurrentGifs = currentGifs.concat(cumulativeGifs);

                this.jsonGifsAll = json.data.reduce((obj, gif) => {
                    obj[gif.id] = gif.images;
                    return obj;
                }, {});

                Object.keys(this.jsonGifsAll).forEach((gifId) => {
                    if (allCurrentGifs.includes(gifId)) {
                        delete this.jsonGifsAll[gifId];
                    };
                });

                Object.keys(this.jsonGifsAll).forEach((gifId) => {
                    this.cumulativeGifs[gifId] = this.jsonGifsAll[gifId];
                });

            };


            if (this.type != 'random') {
                let limit = this.customLimit ? this.customLimit : this.limit;
                if ((this.jsonGifsAll ? Object.keys(this.jsonGifsAll).length == limit : false) || (!Array.isArray(json.data))) {
                    this.qtyMultiplier++;
                    this.gifs.push(this.cumulativeGifs);
                    this.cumulativeGifs = {};
                    this.jsonGifsAll = {};
                    this.customLimit = '';
                    return resolve(this);
                } else {
                    this.customOffset = json.data.length + this.offset;
                    let limit = this.customLimit ? this.customLimit : this.limit;
                    this.customLimit = limit - Object.keys(this.jsonGifsAll).length;

                    if (json.data.length != Object.keys(this.jsonGifsAll).length) {
                        let shift = (this.customLimit >= 50) ? (this.customLimit % 50) : this.customLimit;
                        this.offsetShift += shift;
                    };
                    this.jsonGifsAll = {};
                    try {
                        await this.setUrl({ customLimit: this.customLimit, customOffset: this.customOffset });
                        return resolve(this);
                    } catch (e) {
                        if (this.controller.signal.aborted) {
                            return reject(e);
                        };

                        if (Object.keys(this.cumulativeGifs).length != 0) {
                            this.qtyMultiplier++;
                            this.gifs.push(this.cumulativeGifs);
                            this.cumulativeGifs = {};
                            this.jsonGifsAll = {};
                            this.customLimit = '';
                            this.isEnd = true;
                            this.offsetShift = 0;
                            this.error = e;
                            return resolve(this);
                        };
                    };
                };
            } else {
                this.qtyMultiplier++;
                this.gifs.push(this.cumulativeGifs);
                return resolve(this);
            };
        })
    }

    async getLargeGif(gifId, shareSave = true, controllerImport, isWidth = false) {

        let controller = controllerImport;

        try {
            let img = document.createElement('div');
            img.setAttribute('id', 'gif');
            let urls = this.gifs.find(item => item[gifId])[gifId];
            let src = urls.original.url.replace(/media\d?/, 'i');

            let height = urls.original.height;
            let width = urls.original.width;
            let aspectRatio = width / height;

            img.style.backgroundColor = 'gray';
            img.classList.add('loading');
            img.dataset.backgroundImage = `url(${src})`;

            let image = new Image();
            image.onload = () => {
                image.decode().then(()=>{
                    img.style.backgroundImage = `url(${src})`;
                    img.style.backgroundColor = '';
                    img.classList.remove('loading');
                    image = null;
                });
            };
            image.src = src;

            if (!isWidth) {
                img.style.height = height + 'px';
            } else img.style.maxWidth = width + 'px';
            img.style.aspectRatio = aspectRatio;
            img.dataset.width = width;

            let res = { 'img': img };
            if (shareSave) {
                if (!this.tmpl) {
                    this.tmpl = document.createElement('template');
                    this.tmpl.setAttribute('id', 'share-save');
                    let div = document.createElement('div');
                    div.classList.add('share-save', 'flex-row');
                    let share = document.createElement('div');
                    share.setAttribute('id', 'social');
                    ['vk', 'facebook', 'viber', 'whatsapp', 'telegram'].forEach(function(element) {
                        let btn = document.createElement('button');
                        btn.classList.add('button', 'share-button', 'btn');
                        btn.dataset.sharer = element;
                        btn.dataset.title = 'Awesome gif!';
                        btn.style.backgroundImage = `url(/img/${element}.png)`;
                        btn.setAttribute('onclick', 'Sharer.add(event)');
                        share.append(btn);
                    });
                    let dwnl = document.createElement('a');
                    dwnl.setAttribute('id', 'dwnl');
                    dwnl.setAttribute('download', '');
                    let btn = document.createElement('button');
                    btn.classList.add('btn', 'save_button');
                    let icon = document.createElement('span');
                    icon.classList.add('save_button__icon');
                    icon.setAttribute('src', '/img/save.png');
                    btn.innerText = 'Save!';
                    btn.prepend(icon);
                    dwnl.append(btn);
                    div.append(share, dwnl);
                    this.tmpl.content.append(div);
                };
                let shareContent = this.tmpl.content.cloneNode(true);
                let shareBtns = shareContent.querySelectorAll('.share-button');
                shareBtns.forEach(function(elem) {
                    elem.dataset.url = src;
                });
                let download = shareContent.getElementById('dwnl');
                let imgSource;

                try {
                    imgSource = await fetch(src, { signal: controller.signal });
                } catch (e) {
                    throw new Error('aborted');
                }

                let blob = await imgSource.blob();
                download.href = URL.createObjectURL(blob);
                res.shareContent = shareContent;
            };
            return res;
        } catch (e) {
            throw e;
        }
    }
}