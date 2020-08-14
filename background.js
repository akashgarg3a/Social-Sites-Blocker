let allBlockedUrls = [];
const TIME_ALLOWED_PER_DAY_IN_SECONDS = 10;

async function stater() {

    await saveToStorage('www.facebook.com', 0);

    let allBlockedUrls = await getAllKeys();

    (async function pollToGetHost(){
        let tab = await getUrl(); 
        
        if(tab !== undefined && tab.url !== '') {
            console.log(tab);
            let url =await getHostName(tab.url);
            
            if(allBlockedUrls.indexOf(url) != -1) {
                // await closeTab(tab.id);
                let timeSpent = await getFromStroage(url);
                console.log(url + " , " + timeSpent);

                await setBadgeText((TIME_ALLOWED_PER_DAY_IN_SECONDS - timeSpent) + "");
                if(timeSpent >= TIME_ALLOWED_PER_DAY_IN_SECONDS) {
                    await closeTab(tab.id);
                } else {
                    await saveToStorage(url, timeSpent + 1);
                }
            } else {
                await setBadgeText('');
            }
        }
        setTimeout(pollToGetHost, 1000);
    })()
}

function setBadgeText(text) {
    return new Promise(function(resolve, reject) {
        chrome.browserAction.setBadgeText({text:text}, function() {
            resolve();
        })
    })
}

function closeTab(tabId) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.remove(tabId, function() {
            resolve();
        })
    })
}

function getFromStroage(key) {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get([key], function(result) {
            console.log(result[key]);
            resolve(result[key]);
        });
    })
}

function getAllKeys() {
    return new Promise(function(resolve, reject) {

        chrome.storage.sync.get(null, function(items) {
            var allKeys = Object.keys(items);
            console.log(allKeys);
            resolve(allKeys);
        });
    })
}

function getHostName(url) {
    let host = new URL(url).hostname;
    return host;
}

async function getUrl(){
    return new Promise(function(resolve, reject) {
        try{
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var tab = tabs[0];
                resolve(tab);
                // `domain` now has a value like 'example.com'
              })
        }catch(e) {
            reject(e);
        }
    })
}

function saveToStorage(key, value) {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.set({ [key]: value}, function () {
            console.log([key] + 'to' + value);
            resolve();
        })
    })
}

stater();

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        if(request.blockUrl != undefined) {
            await saveToStorage(request.blockUrl, 0);
            allBlockedUrls.push(request.blockUrl);
        }
    }
)