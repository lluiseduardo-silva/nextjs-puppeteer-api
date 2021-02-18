const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// TODO - Globalizar Variavel
// Usado somente em ambiente local
// Para ambientes de produção substituir o executablePath: execPath por executablePath: await chrome.executablePath
// const chromeExecPaths = {
//     win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     linux: 'usr/bin/google-chrome',
//     darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// }

async function detalheEvaluate(page){
    return await page.evaluate(()=>{
        episodesArray = document.querySelectorAll('body > div.pagAniLista > div.pagAniListaContainer> a');

        episodioProcessado = [];
        episodesArray.forEach(element =>{
            episodioProcessado.push({
                "titulo":element.title,
                "link":element.href
            })
        });
        return {
            "titulo":document.querySelector('body > div.pagAniTitulo > div').innerText,
            "sinopse":document.querySelector('#sinopse2').innerText,
            "ano":document.querySelector('#anime > div.animeFlexContainer > div.right > div > div:nth-child(9)').innerText,
            "capa":document.querySelector('#capaAnime > img').src,
            "episodios":episodioProcessado
        }
    })
}
export default async function(req,res){
    // let execPath = chromeExecPaths[process.platform]

    let {url} = req.body

    if(url === ''){
        res.status(500).send('URL é obrigatoria')
    }

    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
        defaultViewport: {width: 1024,height:768}
    });

    const page = await browser.newPage();

    page.setRequestInterception(true);

    page.on('request', (request)=>{
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else{
            request.continue();
        }
    });

    await page.goto(url);

    let data = await detalheEvaluate(page)

    await browser.close();

    res.status(200).json(JSON.stringify(data))
    // res.send('ok')
}