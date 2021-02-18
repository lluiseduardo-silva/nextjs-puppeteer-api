const chrome = require("chrome-aws-lambda")
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

const chromeExecPaths = {
    win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    linux: 'usr/bin/google-chrome',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

export default async function handler(req, res) {

    let exePath = chromeExecPaths[process.platform]
    
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
    
    await page.goto('https://anitube.site');

    let data = await page.evaluate(()=>{
        /*
            Animes com mais Visualização
        */ 
       MaisV = document.querySelectorAll('body > div:nth-child(5) > div.main-carousel.flickity-enabled.is-draggable > div > div > div');
       ma = [];
       MaisV.forEach(element => {
           ma.push({
               "title":element.children[0].title,
               "cover":element.children[0].children[0].children[0].src,
               "sub":element.children[0].children[0].children[1].innerHTML,
               "pageLink":element.children[0].href,
           })
       });

       /*Recupera os ultimos episodios lançados na homePage*/
       EpisodiosL = document.querySelectorAll('body > div.epiContainer > div.epiSubContainer > div')
       el = [];
       EpisodiosL.forEach(element => {
           el.push({
               "titulo": element.children[0].title,
               "linkVisualizaçaoEP": element.children[0].href,
               "thumbnail":element.children[0].children[0].children[0].src,
               "tipo":element.children[0].children[0].children[1].innerHTML,
           })
           console.log(element.children[0].children[0].children[1].innerHTML)
       });

       /*
           Animes adicionados Recentementes
       */ 
       RecentesA = document.querySelectorAll('body > div:nth-child(7) > div.main-carousel.flickity-enabled.is-draggable > div > div > div');
       ar = [];
       RecentesA.forEach( element =>{
           ar.push({
               "title":element.children[0].title,
               "cover":element.children[0].children[0].children[0].src,
               "tipo":element.children[0].children[0].children[1].innerHTML,
               "pageLink":element.children[0].href,
           })
       });

       /*
           Animes com Lançamento programado para hoje
       */
       LancamentosD = document.querySelectorAll('body > div:nth-child(8) > div.main-carousel.flickity-enabled.is-draggable > div > div > div');
       ld = [];
       LancamentosD.forEach(element => {
           ld.push({
               "title":element.children[0].title,
               "cover":element.children[0].children[0].children[0].src,
               "sub":element.children[0].children[0].children[1].innerHTML,
               "pageLink":element.children[0].href,
           })
       });
       return{
           "MaisAssistidos": ma,
           "EpisodiosRecentes":el,
           "Adicionados": ar,
           "Lancamentos": ld
       }
    });

    await browser.close();
    res.setHeader('Cache-Control', 's-max-age=180, stale-while-revalidate')

    const daa = new Date();

    res.status(200).send({
        "animes": data,
        "data": daa
    });
  }