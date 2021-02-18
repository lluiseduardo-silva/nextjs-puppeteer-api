const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const chromeExecPaths = {
    win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    linux: 'usr/bin/google-chrome',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

export default async function handle(req,res){

    let execPath = chromeExecPaths[process.platform]
    
    let {url} =  req.body

    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
        defaultViewport: {width: 1024,height:768}
    });

    const page = await browser.newPage();

    page.setRequestInterception(true);

    let sources = [];
    page.on('request', (request)=>{
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else if (['.m3u8','.mp4'].some(v => request.url().includes(v)) || ['video/mp4'].some(v => request.url().includes(v))){
            if(request.url().indexOf('anitube') == -1){
                sources.push(request.url());
            }
            request.continue();
        }
        else{
            request.continue();
        }
    });

    await page.goto(url);

    await browser.close();


    res.status(200).send(sources)
}