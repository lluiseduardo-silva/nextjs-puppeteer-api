const chrome = require("chrome-aws-lambda")
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

/**
 * constante com os locais de instalação do chrome padrão em cada sistema operacional
 * constant with the default chrome installation locations on each operating system
 */
// const chromeExecPaths = {
//     win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     linux: 'usr/bin/google-chrome',
//     darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// }

export default async function handler(req, res) {

    //Configuration needed to run locally
    // let exePath = chromeExecPaths[process.platform]
    
    //Instancia do navegador
    //Browser instance
    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
        defaultViewport: {width: 1024,height:768}
    });

    //Cria uma nova aba no navegador
    //Creates a new tab in the browser
    const page = await browser.newPage();

    //Define um useragente aleatorio
    //Defines a random user agent
    page.setUserAgent(randomUseragent.getRandom())

    //Ativa interceptação de requisição
    //Enables requests interception
    page.setRequestInterception(true);

    //Otimização de uso de rede
    //Network usage optimization
    page.on('request', (request)=>{
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else{
            request.continue();
        }
    });
    //Navega até a pagina
    //Navigate to the page
    await page.goto('https://anitube.site');

    //Processamento de dados assincrono
    //Asynchronous data processing
    let data = await page.evaluate(()=>{
        /*
            Animes com mais Visualização
            Animes with more Preview
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

       /**
        * Recupera os ultimos episodios lançados na home
        * Recovers the last episodes released on the home
        */
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
           Recently added anime
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
           Anime with release scheduled for today
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
     * Browser closing
     */
    await browser.close();

    /**
     * Data para controle de versão do cache
     * Date for versioning the cache
     */
    const daa = new Date();
    if(Object.keys(data['MaisAssistidos']).length > 0 && Object.keys(data['EpisodiosRecentes']).length > 0 && Object.keys(data['Adicionados']).length > 0 && Object.keys(data['Lancamentos']).length > 0){
    /**
     * Define que vai guardar a resposta desse endpoint em cache
     * Defines that it will cache the response of that endpoint
     * Caso o cache expire vai realizar todo o procedimento do endpoint novamente e definir um novo cache
     * If the cache expires it will perform the entire endpoint procedure again and define a new cache
     */
    res.setHeader('Cache-Control', 's-maxage=30')
    res.setHeader('Cache-Control', 'stale-while-revalidate')
    //Retorna os dados do endpoint
    //Returns endpoint data
    res.status(200).send({
        "animes": data,
        "data": daa
    });
    }
    else{
        res.status(500).send('Falha ao carregar resultados');
    }
    
  }