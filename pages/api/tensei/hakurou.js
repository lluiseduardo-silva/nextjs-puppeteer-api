const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

const chromeExecPaths = {
    win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    linux: 'usr/bin/google-chrome',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

export default async function handle(req,res){

    let exec = chromeExecPaths[process.platform];
    
    let {url} =  req.body

    const browser = await puppeteer.launch({
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });

    const page = await browser.newPage();

    page.setUserAgent(randomUseragent.getRandom())

    page.setRequestInterception(true);

    let sources = [];
    page.on('request', (request)=>{
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else if (['.m3u8','.mp4'].some(v => request.url().includes(v)) || ['video/mp4'].some(v => request.url().includes(v))){
            if(request.url().indexOf('anitube') == -1){
                sources.push({
                    "url":request.url(),
                    "headers":request.headers()
                });
            }
            request.continue();
        }
        else{
            request.continue();
        }
    });

    await page.goto(url, {waitUntil:'networkidle2'});

    await browser.close();


    res.status(200).send(sources)
}