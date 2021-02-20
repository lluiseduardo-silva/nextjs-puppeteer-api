const chrome = require("chrome-aws-lambda")
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

/**
 * constante com os locais de instalação do chrome padrão em cada sistema operacional
 */
// const chromeExecPaths = {
//     win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     linux: 'usr/bin/google-chrome',
//     darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// }

export default async function handler(req, res) {

    //Configuração necessaria para executar localmente
    // let exePath = chromeExecPaths[process.platform]
    
    //Instancia do navegador
    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
        defaultViewport: {width: 1024,height:768}
    });

    //Cria uma nova aba no navegador
    const page = await browser.newPage();

    //Define um useragente aleatorio
    page.setUserAgent(randomUseragent.getRandom())

    //Ativa interceptação de requisição
    page.setRequestInterception(true);

    //Otimização de uso de rede
    page.on('request', (request)=>{
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else{
            request.continue();
        }
    });
    //Navega até a pagina
    await page.goto('https://anitube.site');

    //Processamento de dados assincrono
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

    /**
     * Fechamento do navegador
     */
    await browser.close();

    /**
     * Data para controle de versão do cache
     */
    const daa = new Date();
    if(Object.keys(data['MaisAssistidos']).length > 0 && Object.keys(data['EpisodiosRecentes']).length > 0 && Object.keys(data['Adicionados']).length > 0 && Object.keys(data['Lancamentos']).length > 0){
        //Define o tempo de cache no servidor
    res.setHeader('Cache-Control', 's-maxage=3600')
    /**
     * Define que vai guardar a resposta desse endpoint em cache
     * Caso o cache expire vai realizar todo o procedimento do endpoint novamente e definir um novo cache
     */
    res.setHeader('Cache-Control', 's-maxage=3600')
    //Retorna os dados do endpoint
    res.status(200).send({
        "animes": data,
        "data": daa
    });
    }
    else{
        res.status(500).send('Falha ao carregar resultados');
    }
    
  }