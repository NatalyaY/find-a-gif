'use strict';

import { setUrl } from './getGifs.js'
import { setListener, clear, detouchListenersFromModule, setFnOnLoad, saveAbortHandler } from "./main.js"
import { addKwrd } from './random.js'
import { Gallery } from './gallery.js'


let searchRandom = setUrl('random');
const loader = document.createElement('img');
loader.src = '/img/2.gif';
loader.classList.add('loader', 'loader_category');
const layer = document.createElement('div');
layer.classList.add('layer', 'layer_category');
let controller;
let ownControl = {};
ownControl.controller = '';
ownControl.galleryInstance = '';
let abortHandlers = {};
let loading;


const categories = {
    'Actions': ['crying', 'dancing', 'sleeping', 'eating', 'falling', 'smiling', 'laughing'],
    'Adjectives': ['black and white', 'cold', 'cute', 'kawai', 'nostalgia', 'slow motion'],
    'Animals': ['cat', 'dog', 'coat', 'coala', 'panda', 'hedgehog', 'monkey', 'rabbit'],
    'Anime': ['naruto', 'dragon ball', 'sailor moon', 'pokemon', 'one piece'],
    'Art & Design': ['architecture', 'cinemagraph', 'glitch', 'loop', 'pixel', 'timelapse', 'typography'],
    'Cartoons & Comics': ['adventure times', 'futurama', 'simpsons', 'minions', 'rick and morty'],
    'Celebrities': ['leonardo dicaprio', 'emma watson'],
    'Decades': ['80s', '90s', 'vintage'],
    'Emotions': ['drunk', 'bored', 'confused', 'excited', 'frustrated', 'hungry', 'tired'],
    'Fashion & Beauty': ['chanel', 'dior', 'makeup', 'kate moss'],
    'Food & Drink': ['alcohol', 'bacon', 'coffee'],
    'Gaming': ['skyrim', 'battlefield'],
    'Greetings': ['flirting', 'good morning', 'i love you'],
    'Holidays': ['christmas', 'easter', 'halloween'],
    'Interests': ['baby', 'ballet', 'internet', 'winter', 'work', 'programming'],
    'Memes': ['everything fine', 'jhon travolta', 'office monkey'],
    'Movies': ['harry potter', 'star wars'],
    'Music': ['rammstein', 'marilyn manson'],
    'Nature': ['clouds', 'ocean', 'forest', 'moutains', 'sunrise'],
};
export function init() {
    return new Promise((resolve, reject) => {

        let promises = Object.keys(categories).map(createCategory);

        Promise.all(promises)
            .then(async (res) => {
                res.forEach(function(category) {
                    document.querySelector('.category-page__categories-list__container').append(category.categoryTxt);
                    document.querySelector('.category-page__all-categories').append(category.categoryBlock);
                });
                document.querySelector('.category-heading__heading').innerText = 'All categories';
                setListener('[data-category]')(categoryClickHandler);
                let setHover = setListener('.categories-list-img__category');
                setHover(gifOnHover, 'mouseover');
                setHover(gifOnUnhover, 'mouseout');
                setListener('.submit-button')(submit);
                await getController();
                setFnOnLoad(getController);
                setFnOnLoad(gallerySetInfiniteLoad);
                setFnOnLoad(gallerySetAlinment);

                resolve();
            })
            .catch((e) => {
                document.querySelector('.category-heading__heading').innerText = e;
                reject(e);
            });
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

export async function SubPagesHandler(params) {
    let subPages = params[0];
    if (params[1]) {
        let search = params[1].slice(1);
        addKwrd(decodeURI(search));
        let input = document.querySelector('input[name="search"]');
        input.value = decodeURI(search);
        await renderGifs({ key: decodeURI(search), saveSearchForm: true, place: document.querySelector('.category-page__content'), ownControl });
    } else {
        await categoryClickHandler(decodeURI(subPages[subPages.length - 1]))
    };
}

function submit(e) {
    return abortHandlers.submit = new Promise(async (resolve, reject) => {
        loading = true;
        e.preventDefault();

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        let input = document.querySelector('input[name="search"]');
        if (input.value) {
            let keyword = input.value;
            input.classList.remove('invalid');
            let pageName = window.location.pathname.slice(1).split('/')[0];
            let href = `/${pageName}/?${keyword}`;
            if (ownControl.controller.signal.aborted) {
                return resolve();
            };
            history.pushState(null, null, href);
            addKwrd(keyword);
            loading = false;
            await renderGifs({ key: keyword, saveSearchForm: true, place: document.querySelector('.category-page__content'), ownControl });
            return resolve();
        } else {
            input.classList.add('invalid');
            input.focus();
            loading = false;
            return resolve();
        };
    })
};

function gifOnHover(e) {
    let gifImg = e.currentTarget.querySelector('.category__img');
    let animated = e.currentTarget.querySelector('.animated');
    animated.style.opacity = 1;
};

function gifOnUnhover(e) {
    let gifImg = e.currentTarget.querySelector('.category__img');
    let animated = e.currentTarget.querySelector('.animated');
    animated.style.opacity = 0;
};

function createCategory(key) { // -> {category.name, category.menu_item, category.image_block}
    return abortHandlers.createCategory = new Promise(async (resolve, reject) => {

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        let gifURLs;

        try {
            gifURLs = await setUrl('random')(key, 1);
        } catch (e) {
            return resolve(e)
        }

        let category = {};

        if (categories[key]) { // if it's a parent category to be shown in left menu it will create a menu item
            let categoryTxt = document.createElement('p');
            categoryTxt.classList.add('categories-list__category');
            categoryTxt.innerText = key;
            categoryTxt.dataset.category = key.trim();
            category.categoryTxt = categoryTxt;
        };

        category.name = key;

        let categoryBlock = document.createElement('div');
        categoryBlock.classList.add('categories-list-img__category');
        categoryBlock.dataset.category = key.trim();

        let categoryWrap = document.createElement('div');
        categoryWrap.classList.add('category__wrap');

        let urls = Object.values(gifURLs.gifs[0])[0];

        let width = urls['fixed_height'].width;
        let height = urls['fixed_height'].height;
        let url = urls['fixed_height'].url;
        let urlStill = urls['fixed_height_still'].url;

        let categoryImg = new Image();
        categoryImg.style.width = `${width}px`;
        categoryImg.style.height = `${height}px`;
        categoryImg.src = urlStill;
        categoryImg.classList.add('category__img');

        let animatedCategoryImg = new Image();
        animatedCategoryImg.src = url;
        animatedCategoryImg.classList.add('animated');
        animatedCategoryImg.classList.add('category__img');

        categoryImg.after(animatedCategoryImg);

        let categoryNameWrap = document.createElement('div');
        categoryNameWrap.classList.add('category__nameWrap', 'flex');

        let categoryName = document.createElement('p');
        categoryName.classList.add('category__name');
        categoryName.innerText = key;

        categoryNameWrap.append(categoryName);
        categoryWrap.append(categoryNameWrap, categoryImg, animatedCategoryImg);
        categoryBlock.append(categoryWrap);
        category.categoryBlock = categoryBlock;

        resolve(category);

    });
}

async function categoryClickHandler(e) {
    if (loading) await Promise.all(Object.values(abortHandlers));

    return abortHandlers.showSubCategories = new Promise(async (resolve, reject) => {

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        if (ownControl.controller.signal.aborted) {
            return resolve();
        };

        loading = true;
        document.querySelector('.category-page__content').append(layer, loader);

        let category;

        if (e.target && e.target.dataset.category) {
            category = e.target.dataset.category;
        } else if (e.currentTarget && e.currentTarget.dataset.category) {
            category = e.currentTarget.dataset.category;
        } else category = e;


        ownControl.controller.abort();

        if (ownControl.galleryInstance && ownControl.galleryInstance.abortHandler) {
            await ownControl.galleryInstance.abortHandler;
        };

        detouchListenersFromModule('document');

        if (!controller.signal.aborted) {
            ownControl.controller = new AbortController();
        }


        let subCategories = categories[category];

        //set URL
        let path = window.location.pathname.slice(1).split('/');
        let subpage = path[path.length - 1];


        if (!subpage || subpage != category) {
            let pageName = path[0];
            let href = (subCategories) ? `/${pageName}/${category}` : `/${window.location.pathname.slice(1)}/${category}`;
            history.pushState(null, null, href);
        }


        if (!subCategories) { //is it a parent category (need to render subcategories) OR a subcategory (need to display gifs)
            loading = false;
            await renderGifs({ key: category, place: document.querySelector('.category-page__content'), ownControl: ownControl });
        } else {
            loading = false;
            await showSubCategories(category);
        };

        loader.remove();
        layer.remove();
        resolve()

    })
}

function showSubCategories(category) {

    return abortHandlers.showSubCategories = new Promise(async (resolve, reject) => {

        loading = true;
        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        let contentSection = document.querySelector('.category-page__content');
        let subCategories = categories[category];

        let allCategories = document.querySelector('.category-page__all-categories');
        let subCategoriesBlock = Array.from(document.querySelectorAll('.category-page__subcategories'));
        let gifsBlock = document.querySelector('.gifsBlock');
        let searchForm = document.querySelector('.searh-form-container');

        [allCategories, subCategoriesBlock].forEach(function(elem) {
            if (elem) {
                if (Array.isArray(elem)) {
                    elem.forEach(function(el) {
                        el.style.display = 'none';
                    });
                } else
                    elem.style.display = 'none';
            }
        });

        if (searchForm) {
            searchForm.style.position = 'absolute';
            searchForm.style.visibility = 'hidden';
            searchForm.style.opacity = 0;
        };

        detouchListenersFromModule('document');

        if (gifsBlock) {
            detouchListenersFromModule(gifsBlock);
            gifsBlock.remove();
            ownControl.galleryInstance = '';
        };


        // check if needed conent already exist and was hiden

        if (document.getElementById(category)) {
            document.getElementById(category).style.display = '';
            return resolve();
        };

        // if no needed content - create it

        let subCategoriesContent = document.createElement('section');
        subCategoriesContent.classList.add('categories', 'content__elem', 'category-page__subcategories');
        subCategoriesContent.id = category;

        subCategoriesContent.append(makeHeader('Subcategories in category ', category));

        contentSection.append(subCategoriesContent);

        let promises = subCategories.map(createCategory);

        Promise.all(promises)
            .then((res) => {
                res.forEach(function(category) {
                    if (category.categoryBlock) {
                        subCategoriesContent.append(category.categoryBlock);
                    };
                });
            })
            .then(() => {
                let setHover = setListener('.categories-list-img__category');
                setHover(gifOnHover, 'mouseover');
                setHover(gifOnUnhover, 'mouseout');
                setListener('[data-category]')(
                    categoryClickHandler
                );
            })
            .then(() => {
                setListener('.category-heading__back')(goBack.bind(ownControl));
                loading = false;
                resolve();
            })
    })
}

export async function renderGifs({
    saveSearchForm = false,
    key = '',
    limit = 5,
    place = document.querySelector('.pages-content'),
    headerText = 'Gifs from category ',
    header = true,
    minPadding = 5,
    maxPadding = false,
    infiniteLoad = true,
    tagCont = '',
    ownControl = ''
}) {

    return abortHandlers.renderGifs = new Promise(async (resolve, reject) => {

        loading = true;
        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        let searchForm = document.querySelector('.searh-form-container');
        let allCategories = document.querySelector('.category-page__all-categories');
        let subCategoriesBlock = Array.from(document.querySelectorAll('.category-page__subcategories'));
        let gifsBlock = document.querySelector('.gifsBlock');
        let tags = document.getElementById("sortedKwrds");
        let tagsSortSelect = document.querySelector('.sortContainer');

        if (!saveSearchForm) {

            if (searchForm) {
                searchForm.style.position = 'absolute';
                searchForm.style.visibility = 'hidden';
                searchForm.style.opacity = 0;
            };

        };

        [allCategories, tags, tagsSortSelect, subCategoriesBlock].forEach(function(elem) {
            if (elem) {
                if (Array.isArray(elem)) {
                    elem.forEach(function(el) {
                        el.style.display = 'none';
                    });
                } else
                    elem.style.display = 'none';
            }
        });

        detouchListenersFromModule('document');

        if (gifsBlock) {
            detouchListenersFromModule(gifsBlock);
            gifsBlock.remove();
            ownControl.galleryInstance = '';
        };

        let GifsBlock = document.createElement('section');
        GifsBlock.classList.add('content__elem', `gifsBlock`);
        GifsBlock.id = key || 'trending';

        if (header) {
            GifsBlock.append(makeHeader(headerText, key || 'trending'));
        }

        let Gifs = document.createElement('section');
        Gifs.classList.add('gifsList', 'content__elem');
        GifsBlock.append(Gifs);
        place.append(GifsBlock);

        let res;

        try {
            let controller;
            if (ownControl.controller.signal.aborted) {
                controller = new AbortController();
            };

            res = key ? await setUrl('search')(key, limit, controller || ownControl.controller) : await setUrl('trending')(key, limit, controller || ownControl.controller);
            let gallery = await new Gallery(Gifs, res, { infiniteLoad, minPadding, maxPadding, controller: controller || ownControl.controller });
            ownControl.galleryInstance = res;
            ownControl.gallery = gallery;
            // gallery.then(async (res) => {

            if (controller) {
                controller.abort();
                if (ownControl.galleryInstance && ownControl.galleryInstance.abortHandler) {
                    await ownControl.galleryInstance.abortHandler;
                };
            };
            setListener('.category-heading__back')(goBack.bind(ownControl));
            loading = false;
            resolve();

            // })

        } catch (e) {
            console.log(e);
            document.querySelector('.gifsList').innerText = e.message;
            setListener('.category-heading__back')(goBack.bind(ownControl));
            loading = false;
            resolve();
        }

    })
}


function loadCategory(category) {
    return new Promise(async (resolve, reject) => {
        let categoryInfo = {};
        if (categories[category]) {
            let categoryTxt = document.createElement('p');
            categoryTxt.classList.add('categories-list__category');
            categoryTxt.innerText = category;
            categoryTxt.dataset.category = category.trim();
            categoryInfo.categoryTxt = categoryTxt;
        };

        categoryInfo.category = category;


        let categoryBlock = document.createElement('div');
        categoryBlock.classList.add('categories-list-img__category');
        categoryBlock.dataset.category = category.trim();


        let categoryWrap = document.createElement('div');
        categoryWrap.classList.add('category__wrap');
        let res;

        try {
            res = await fetchGifs(category, { cat: 'true' });
            let categoryImg = res.images[0];
            categoryImg.classList.add('category__img');
            let animatedCategoryImg;
            if (categoryImg.dataset.gif) {
                animatedCategoryImg = new Image();
                animatedCategoryImg.src = categoryImg.dataset.gif;
                animatedCategoryImg.classList.add('animated');
                animatedCategoryImg.classList.add('category__img');
                categoryImg.after(animatedCategoryImg);
            };

            let categoryNameWrap = document.createElement('div');
            categoryNameWrap.classList.add('category__nameWrap', 'flex');

            let categoryName = document.createElement('p');
            categoryName.classList.add('category__name');
            categoryName.innerText = category;

            categoryNameWrap.append(categoryName);
            categoryWrap.append(categoryNameWrap, categoryImg);
            if (animatedCategoryImg) categoryWrap.append(animatedCategoryImg);
            categoryBlock.append(categoryWrap);
            categoryInfo.categoryBlock = categoryBlock;
            resolve(categoryInfo);
        } catch (e) {
            console.log(e);
            reject(e.message);
        };
    });
};

export function setCategoryName(e, category) {
    let pageName = window.location.pathname.slice(1).split('/')[0];
    let href;
    if (category[0] == '?') {
        href = `/${pageName}/${category}`;
        history.pushState(null, null, href);
        return;
    };
    href = (categories[category]) ? `/${pageName}/${category}` : `/${window.location.pathname.slice(1)}/${category}`;
    history.pushState(null, null, href);
    showSubCategories(e);
};

function fetchGifs(key = '', { ...options } = {}) {
    let {
        cat = false,
            limit = '10',
            searchEx = false,
            trending = false,
    } = { ...options };
    return new Promise(async (resolve, reject) => {

        let search, preview;

        if (cat) {
            search = setUrl('random');
            preview = 'fixed_height';

        } else {
            search = trending ? setUrl('trending') : setUrl('search');
            preview = 'fixed_height';
        };

        let searchRes;

        try {
            let obj = await import("./main.js");
            searchRes = (searchEx) ? await searchEx.setUrl({ controller: obj.controller }) : await search(key, limit, obj.controller);
            if (!cat) {
                resolve(searchRes);
            };
            let ids = Object.keys(searchRes.gifs[searchRes.gifs.length - 1]);
            let images = [];

            ids.forEach(function(id) {
                let urls = searchRes.gifs.find(item => item[id])[id];

                let width = urls[preview].width;
                let height = urls[preview].height;
                let url = urls[preview].url;

                let img = new Image();
                img.style.width = `${width}px`;
                img.style.height = `${height}px`;

                let previewStill = `${preview}_still`;
                let urlStill = urls[previewStill].url;
                img.src = urlStill;
                img.dataset.gif = url;
                images.push(img);

                resolve({ images, searchRes });

            });
        } catch (e) {
            reject(e)
        }


    });
};

function showPopup() {
    let popup = document.getElementById('gifPopup').content.cloneNode(true);
    let scrollWidth = window.innerWidth - document.body.offsetWidth;

    let overlay = document.createElement('div');
    overlay.classList.add('overlay');

    function closePopup(e) {
        controller.abort();
        detouchListenersFromModule(document.querySelector('.gifPopup'));
        detouchListenersFromModule(document.querySelector('.overlay'));
        document.querySelector('.gifPopup').remove();
        document.querySelector('.overlay').remove();
        document.getElementsByTagName('html')[0].style.overflow = "";
        document.body.style.paddingRight = '';
    };

    popup.querySelector('.gifPopup').append(loader);
    document.body.append(overlay, popup);

    setListener('.overlay', '.close')(closePopup);

    document.getElementsByTagName('html')[0].style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollWidth}px`;
};

function makeHeader(text, category = '') {
    let header = document.getElementById('category-header').content.cloneNode(true);
    let back = header.querySelector('.category-heading__back');

    header.querySelector('.category-heading__heading').innerText = text;
    if (category) {
        let span = document.createElement('span');
        span.innerText = category;
        span.classList.add('category-heading__name');
        header.querySelector('.category-heading__heading').append(span);
    }
    return header;
};

async function goBack(e) {
    return abortHandlers.goBack = new Promise(async (resolve, reject) => {
        e.preventDefault();

        let timer = setTimeout(() => {}, 0);
        await timer;
        clearTimeout(timer);

        if (this.controller.signal.aborted) {
            return resolve();
        };

        loading = true;

        detouchListenersFromModule('document');

        this.controller.abort();

        if (this.galleryInstance && this.galleryInstance.abortHandler) {
            await this.galleryInstance.abortHandler;
        };

        this.controller = new AbortController();

        let href;
        let pageName = window.location.pathname.slice(1).split('/')[0];

        if (document.querySelector('select')) {
            let type = document.querySelector('select').value;
            let tags = document.getElementById("sortedKwrds");
            let tagsSortSelect = document.querySelector('.sortContainer');
            [tags, tagsSortSelect].forEach((elem) => {
                if (elem) {
                    elem.style.display = '';
                };
            });
            href = `/${pageName}/${type}`;

        } else href = `/${pageName}`;

        history.pushState(null, null, href);


        let searchForm = document.querySelector('.searh-form-container');
        let allCategories = document.querySelector('.category-page__all-categories');
        let subCategoriesBlock = Array.from(document.querySelectorAll('.category-page__subcategories'));
        let gifsBlock = document.querySelector('.gifsBlock');

        if (allCategories) {
            allCategories.style.display = '';
        };

        if (searchForm) {
            searchForm.style.position = 'static';
            searchForm.style.visibility = 'visible';
            searchForm.style.opacity = 1;
        };

        if (Array.isArray(subCategoriesBlock)) {
            subCategoriesBlock.forEach(function(el) {
                el.style.display = 'none';
            });
        } else subCategoriesBlock.style.display = 'none';


        if (gifsBlock) {
            detouchListenersFromModule(gifsBlock);
            gifsBlock.remove();
            this.galleryInstance = '';
        };

        let input = document.querySelector('input[name="search"]');
        if (input && input.value != '') {
            input.value = ''
        };

        resolve();

    })
};

export async function makeGifsBlock({ ...options } = {}) {
    let {
        categoryClass = 'categoryGifs',
            trending = false,
            key = '',
            place = document.querySelector('.pages-content'),
            headerText = 'Gifs from category ',
            header = true,
    } = { ...options };

    let categoryGifs = document.createElement('section');
    categoryGifs.classList.add('content__elem', `category-page__${categoryClass}`);

    if (header) {
        categoryGifs.append(makeHeader(headerText, key));
    };

    let Gifs = document.createElement('section');
    Gifs.classList.add('gifsList', 'content__elem');
    categoryGifs.append(Gifs);
    place.after(categoryGifs);

    setListener('.category-heading__back')(goBack)
    let res;

    try {
        res = trending ? await fetchGifs(key, { trending: true }) : await fetchGifs(key);
        let gallery = new Gallery(Gifs, res, { infiniteLoad: false });
        await gallery;
    } catch (e) {
        console.log(e);
        document.querySelector('.gifsList').innerText = e.message;
    }
};