'use strict';

const db = firebase.firestore();
const kwrds = db.collection("kwrdStat");
let snap;


function headers(id, type, tmpl) {
    let li = document.querySelectorAll(`#${id} li`);
    let nav;
    if (!document.querySelector(`.${id}nav`)) {
        nav = document.createElement('div');
        nav.classList.add(`${id}nav`, 'tags_nav');
        document.getElementById(id).prepend(nav);
    } else {
        nav = document.querySelector(`.${id}nav`);
        for (let i = li.length - 1; i >= 0; i--) {
            nav.after(li[i]);
        };
    };

    let navLinks = document.querySelectorAll(`.${id}nav .tags_nav__navLink`);
    let kwrdsBlocks = document.querySelectorAll(`#${id} .kwrdBlock`);

    [kwrdsBlocks, navLinks].forEach(function(el) {
        if (el.length != 0) {
            el.forEach(function(elem) {
                elem.remove();
            });
        };
    });

    function createHeaderAndNav(range, innerText = range) {
        let header = document.createElement('h2');
        header.setAttribute('id', range);
        header.classList.add(`${id}__rangeHeader`, 'tags_sortedsortedKwrds_rangeHeader');
        header.innerText = innerText;
        let navLink = document.createElement('a');
        navLink.href = `#${range}`;
        navLink.innerText = range;
        navLink.classList.add('tags_nav__navLink', `${id}nav__navLink`);
        return { 'header': header, 'navLink': navLink };
    };

    function createWordsBlocks() {
        let headers = document.querySelectorAll(`#${id} h2`);
        for (let i = 0; i < headers.length; i++) {
            let wordsBlock = document.createElement(tmpl.content.firstElementChild.tagName);
            wordsBlock.classList.add('wordsBlock', `${id}__wordsBlock`);
            headers[i].after(wordsBlock);
            let wordContent = wordsBlock.nextElementSibling;
            while ((wordContent) && (wordContent.tagName != 'H2')) {
                wordsBlock.append(wordContent);
                wordContent = wordsBlock.nextElementSibling;
            };
            let rangeBlock = document.createElement('div');
            rangeBlock.classList.add('kwrdBlock', `${id}__kwrdBlock`);
            rangeBlock.setAttribute('id', headers[i].id);
            headers[i].before(rangeBlock);
            rangeBlock.append(headers[i], wordsBlock);
        };
    };

    switch (type) {
        case 'popular':
            for (let i = 0; i < li.length; i += 50) {
                if (li[i]) {
                    let range = li[i + 50] ? `${i+1}-${i+50}` : `${i+1}+`;
                    let content = createHeaderAndNav(range, `Top ${range}`);
                    nav.append(content.navLink);
                    li[i].before(content.header);
                };
            };
            createWordsBlocks();
            break;
        case 'alphabet':
            for (let i = 0; i < li.length; i++) {
                let word = li[i].querySelector('.kwrd') || li[i];
                let prevWord;
                if (li[i - 1]) {
                    prevWord = li[i - 1].querySelector('.kwrd') || li[i - 1];
                };

                if ((!prevWord) || (word.innerText[0].toLowerCase() != prevWord.innerText[0].toLowerCase())) {
                    let range = word.innerText[0].toLowerCase();
                    let content = createHeaderAndNav(range);
                    nav.append(content.navLink);
                    li[i].before(content.header);
                };

            };
            createWordsBlocks();
            break;
        case 'recent':
            let today = new Date(new Date().setHours(23, 59, 59, 59));
            let todayDay = today.getDate();
            let todayMonth = today.getMonth();
            let todayYear = today.getFullYear();
            let yest = new Date(todayYear, todayMonth, todayDay - 1, today.getHours(), today.getMinutes(), today.getSeconds(), today.getMilliseconds());
            let thisWeek = new Date(todayYear, todayMonth, todayDay - 2);
            let lastWeek = new Date(todayYear, todayMonth, todayDay - 6);
            let twoWeeks = new Date(todayYear, todayMonth, todayDay - 13);
            let lastMonth = new Date(todayYear, todayMonth - 1, todayDay - 1);
            let older = new Date(todayYear, todayMonth - 1, todayDay - 2);
            let liArray = Array.from(li);
            let ranges = [
                { 'rangeName': 'today', 'rangeVal': today },
                { 'rangeName': 'yesterday', 'rangeVal': yest },
                { 'rangeName': 'this week', 'rangeVal': thisWeek },
                { 'rangeName': 'last week', 'rangeVal': lastWeek },
                { 'rangeName': 'two weeks', 'rangeVal': twoWeeks },
                { 'rangeName': 'last month', 'rangeVal': lastMonth },
                { 'rangeName': 'older', 'rangeVal': older }
            ];

            if (li[0]) {
                let range = ranges[0].rangeName;
                let content = createHeaderAndNav(range, `${range} searches`);
                nav.append(content.navLink);
                li[0].before(content.header);
            } else return;

            for (let i = 1; i < ranges.length; i++) {
                let index = liArray.findIndex((el) => el.dataset.time < +ranges[i].rangeVal);
                let range = ranges[i].rangeName;
                let content = createHeaderAndNav(range, `${range} searches`);
                nav.append(content.navLink);
                (index == -1) ? document.getElementById(`${id}`).append(content.header): li[index].before(content.header);
                let prevElem = content.header.previousElementSibling;
                if ((prevElem) && (prevElem.tagName == 'H2')) {
                    let p = document.createElement('p');
                    p.classList.add('noElemMsg');
                    p.innerText = 'No searches';
                    prevElem.after(p);
                };
                if (i == ranges.length - 1) {
                    if ((!content.header.nextElementSibling) || (content.header.nextElementSibling.tagName != 'LI')) {
                        let p = document.createElement('p');
                        p.classList.add('noElemMsg');
                        p.innerText = 'No searches';
                        content.header.after(p);
                    };
                };
            };
            createWordsBlocks();
            break;
    };

    let event = new Event("modified", { bubbles: true });
    document.getElementById(id).dispatchEvent(event);
};



class DBQuery {
    static query = kwrds;
    static instances = [];
    static kwrdsArr = [];
    static sortedArrs = {};

    constructor(type, { ...options } = {}) {
        this.type = type;
        this.noChange = false;
        this.id = options.id;
        delete options.id;
        this.options = { ...options };
        this.unhandledChanges = [];

        DBQuery.instances.push(this);
        this.sort(DBQuery.kwrdsArr.slice(0));
        return this.render(this.sortedArr, true);
    }

    static setSnapshot() {
        return snap = new Promise(function(resolve, reject) {
            DBQuery.query.onSnapshot(function(snapshot) {
                if (snapshot.metadata.hasPendingWrites) return;
                if (snapshot._snapshot.oldDocs.size == 0) {
                    snapshot.docs.forEach(function(doc) {
                        if (doc.data().word.trim()) {
                            let data = doc.data();
                            data.word = data.word.trim().replace(/\n/g, '');
                            DBQuery.kwrdsArr.push(data);
                        };
                    });
                } else {
                    snapshot.docChanges().forEach(function(change) {
                        let index = DBQuery.kwrdsArr.findIndex((el) => el.word == change.doc.data().word);
                        if ((change.type == 'removed') && (index)) {
                            DBQuery.kwrdsArr.splice(index, 1);
                        } else {
                            if (change.doc.data().word.trim()) {
                                let data = change.doc.data();
                                data.word = data.word.trim().replace(/\n/g, '');
                                if (index >= 0) {
                                    DBQuery.kwrdsArr[index] = change.doc.data();
                                } else {
                                    DBQuery.kwrdsArr.push(change.doc.data())
                                };
                            };
                        };
                    });
                };
                if (DBQuery.instances.length != 0) {
                    snapshot.docChanges().forEach(function(change) {
                        DBQuery.instances.map((instance) => instance.render(change));
                    });
                };
                resolve();
            });
        });
    }

    sort(arr) {
        switch (this.type) {
            case 'popular':
                this.sortedArr = arr.sort((a, b) => {
                    return -a['qty'] + b['qty'];
                });
                break;
            case 'alphabet':
                this.sortedArr = arr.sort((a, b) => {
                    return a['word'].toLowerCase() > b['word'].toLowerCase() ? 1 : -1;
                });
                break;
            case 'recent':
                this.sortedArr = arr.sort((a, b) => {
                    return -a.timestamp.toMillis() + b.timestamp.toMillis();
                });
                break;
        };
    }

    static handleStoredChanges() {
        if (DBQuery.instances.length != 0) {
            DBQuery.instances.filter((el) => document.getElementById(el.id)).forEach(function(instance) {
                if (instance.unhandledChanges.length != 0) {
                    let changes = instance.unhandledChanges.splice(0);
                    changes.map((change) => instance.render.call(instance, change));
                    return;
                };
            });
        };
    }

    render(docs, firstAdd = false) {
        return new Promise((resolve, reject) => {
            let li;
            if (firstAdd) {
                if (!this.tmpl) {
                    let tmpl = document.createElement('template');
                    let li = document.createElement('li');
                    if (this.options.qty) {
                        let word = document.createElement('span');
                        word.classList.add('kwrd');
                        word.dataset.type = this.type;
                        let wordWrap = document.createElement('div');
                        wordWrap.classList.add('wordWrap');
                        wordWrap.append(word);
                        li.append(wordWrap);
                        let qty = document.createElement('span');
                        qty.classList.add('qty');
                        li.classList.add('itemMltp')
                        li.append(qty);
                    } else {
                        li.classList.add('kwrd');
                        li.dataset.type = this.type;
                    };
                    let list = this.options.numeric ? document.createElement('ol') : document.createElement('ul');
                    list.setAttribute('id', `${this.id}`);
                    list.classList.add('sortContent', `sortContent_${this.id}`);
                    list.append(li);
                    tmpl.content.append(list);
                    this.tmpl = tmpl;
                };
                let content = this.tmpl.content.cloneNode(true);
                content.querySelector('li').remove();
                let words = this.options.limit ? docs.slice(0, this.options.limit) : docs.slice(0);

                words.forEach(function(doc) {
                    let item = this.tmpl.content.querySelector('li').cloneNode(true);

                    if (item.querySelector('.kwrd')) {
                        item.querySelector('.kwrd').innerText = doc.word;
                    } else item.innerText = doc.word;

                    if (this.options.qty) item.querySelector('.qty').innerText = ': ' + doc.qty;
                    if (this.type == 'recent') item.dataset.time = doc.timestamp.toMillis();
                    content.firstElementChild.append(item);
                }.bind(this));

                document.getElementById(this.options.place).append(content);
                let elems = document.getElementById(this.id).querySelectorAll('.kwrd');
                words.forEach(function(word) {
                    let elem = Array.from(elems).find((el) => el.innerText == word.word);
                    if (!elem) return;
                    let width = elem.offsetWidth;
                    if (width > 100) {
                        elem.classList.add('withTooltip');
                        if (elem.parentNode.classList.contains('wordWrap')) {
                            elem.parentNode.classList.add('wordWrap__withTooltip');
                        };
                        elem.dataset.tooltip = word.word;
                    };
                });
                if (this.options.headers) headers(this.id, this.type, this.tmpl);
            } else {
                let elemContent = document.getElementById(this.id);
                if (!elemContent) {
                    this.unhandledChanges.push(docs);
                    return;
                };
                if (this.unhandledChanges.length != 0) {
                    this.unhandledChanges.push(docs);
                    let changes = this.unhandledChanges.splice(0);
                    changes.map((el) => this.render.call(this, el));
                    return;
                };
                li = elemContent.querySelectorAll('li');
                let type = docs.type;
                let data = docs.doc.data();
                let index;
                switch (type) {
                    case 'added':
                        this.sortedArr.push(data);
                        this.sort(this.sortedArr);
                        index = this.sortedArr.findIndex((el) => el.word == data.word);
                        addToHtml.call(this, data, index);
                        break;
                    case 'removed':
                        index = this.sortedArr.findIndex((el) => el.word == data.word);
                        this.sortedArr.splice(index, 1);
                        removeFromHtml.call(this, index);
                        break;
                    case 'modified':
                        let oldindex = this.sortedArr.findIndex((el) => el.word == data.word);
                        (oldindex == -1) ? this.sortedArr.push(data): this.sortedArr[oldindex] = data;
                        this.sort(this.sortedArr);
                        let newindex = this.sortedArr.findIndex((el) => el.word == data.word);
                        if (newindex == oldindex) {
                            if (this.options.qty) {
                                if ((this.options.limit) && (newindex > this.options.limit)) return;
                                li[newindex].querySelector('.qty').innerText = ': ' + data.qty;
                            };
                        } else {
                            removeFromHtml.call(this, oldindex);
                            addToHtml.call(this, data, newindex);
                        };
                        break;
                };
                if (this.options.limit) {
                    let currentContent = document.getElementById(this.id).querySelectorAll('li');
                    if (this.options.limit > currentContent.length) {
                        addToHtml.call(this, this.sortedArr[currentContent.length], currentContent.length);
                    } else if (this.options.limit < currentContent.length) {
                        removeFromHtml.call(this, currentContent.length - 1);
                    };
                };
                if ((this.options.headers) && (!this.noChange)) headers(this.id, this.type, this.tmpl);
            };

            function addToHtml(data, index) {
                let li = document.getElementById(this.id).querySelectorAll('li');
                if ((this.options.limit) && (index > this.options.limit)) return;
                let item = this.tmpl.content.querySelector('li').cloneNode(true);
                if (item.querySelector('.kwrd')) {
                    item.querySelector('.kwrd').innerText = data.word;
                } else item.innerText = data.word;

                if (this.options.qty) item.querySelector('.qty').innerText = ': ' + data.qty;
                if (this.type == 'recent') item.dataset.time = data.timestamp.toMillis();
                let currentWord;
                if (li[index]) {
                    currentWord = li[index].querySelector('.kwrd') || li[index];
                };

                if (currentWord) {
                    if (currentWord.innerText == data.word) {
                        li[index].replaceWith(item);
                        this.noChange = true;
                    } else li[index].before(item);
                } else li[index - 1].after(item);

                let elems = document.getElementById(this.id).querySelectorAll('.kwrd');
                let elem = Array.from(elems).find((el) => el.innerText == data.word);
                if (elem) {
                    let width = elem.offsetWidth;
                    if (width > 100) {
                        elem.classList.add('withTooltip');
                        if (elem.parentNode.classList.contains('wordWrap')) {
                            elem.parentNode.classList.add('wordWrap__withTooltip');
                        };
                        elem.dataset.tooltip = data.word;
                    };
                };
                let event = new Event("added", { bubbles: true });
                document.getElementById(this.id).dispatchEvent(event);
            };

            function removeFromHtml(index) {
                let li = document.getElementById(this.id).querySelectorAll('li');
                if ((this.options.limit) && (index > this.options.limit)) return;
                if (li[index]) {
                    let event = new Event("removed", { bubbles: true });
                    li[index].dispatchEvent(event);
                    let list = li[index].parentNode;
                    li[index].remove();
                    let count = document.getElementById(this.id).querySelectorAll('li').length;
                    if (this.options.headers) {
                        if (list.childElementCount == 0) {
                            let id = list.parentNode.id;
                            list.parentNode.remove();
                            let navLinks = document.querySelector(`.${this.id}nav`).childNodes;
                            let linkIndex = Array.from(navLinks).findIndex((el) => el.hash == `#${id}`);
                            navLinks[linkIndex].remove();
                            this.noChange = true;
                        };
                    };

                };

            };
            resolve(this);
        });
    }
};

export { DBQuery }