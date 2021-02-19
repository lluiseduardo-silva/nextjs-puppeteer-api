const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

// TODO - Globalizar Variavel
// Usado somente em ambiente local
// Para ambientes de produção substituir o executablePath: execPath por executablePath: await chrome.executablePath
// const chromeExecPaths = {
//     win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     linux: 'usr/bin/google-chrome',
//     darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// }
async function animesEvaluate(page){
    return await page.evaluate(()=>{
        PageAnimes = document.querySelectorAll('body > div.mwidth > div.listaPagAnimes > div');
        da = [];
        let nextpage;
        try{
            nextpage = document.querySelector('a.next').getAttribute('href');
        }catch(err){
            throw new Error(err);
        }
        PageAnimes.forEach(element => {
            da.push({
                "title":element.children[0].title,
                "cover":element.children[0].children[0].children[0].src,
                "sub":element.children[0].children[0].children[1].innerHTML,
                "pageLink":element.children[0].href,
            })
        });
        return {
            "animes":da,
            "nextpage":nextpage??''
        }
    })
}
export default async function(req,res){
    // let execPath = chromeExecPaths[process.platform]
    let {url} = req.query
    if(url === ''){
        url = 'https://www.anitube.site/lista-de-animes-online/'
    }
    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
        defaultViewport: {width: 1024,height:768}
    });

    const page = await browser.newPage();

    page.setUserAgent(randomUseragent.getRandom())

    page.setRequestInterception(true);

    page.on('request', (request)=>{
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else{
            request.continue();
        }
    });

    await page.goto(url);

    let data = await animesEvaluate(page)

    await browser.close();
    const daa = new Date();
    res.setHeader('Cache-Control', 's-maxage=604800')
    res.status(200).send({"data":data,
                        "date":daa});
    // res.send('ok')
}