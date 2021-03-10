const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

// TODO - Globalizar Variavel
/**
 * Necessario para executar localmente na maquina
 * Caso sua maquina esteja exeuctando um sistema operacional X86 altere a string win32 para C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
 */

// const chromeExecPaths = {
//     win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     linux: 'usr/bin/google-chrome',
//     darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// }

/**
 *  Função que recupera os animes e o link da proxima pagina que estão no navegador
 *  recebe um "PAGE" como parametro do tipo puppeteer.newPage();
 */
async function animesEvaluate(page) {
    //Retorna o resultado da função assincrona evaluate
    return await page.evaluate(() => {
        dadoslista = [];

        //Verifica se o retorno foi maior que 0
        if (document.querySelectorAll('body > div.mwidth > div.listaPagAnimes > div').length >= 1) {
            //Recupera os animes
            PageAnimes = document.querySelectorAll('body > div.mwidth > div.listaPagAnimes > div');
            //ForEach nos animes recuperados da pagina
            PageAnimes.forEach(element => {
                /**
                 * Processa os campos necessarios e adiciona no array
                 */
                dadoslista.push({
                    "title": element.children[0].title,
                    "cover":element.children[0].children[0].children[0].src,
                    "pageLink": element.children[0].href,
                })
            });
        } else {
            //Recupera os animes
            PageAnimes = document.querySelectorAll('body > div.mwidth > div.listaPagAnimes > a');
            //Processamento de dados
            PageAnimes.forEach(element => {
                /**
                 * Processa os campos necessarios e adiciona no array
                 */
                dadoslista.push({
                    "title": element.title,
                    "pageLink": element.href,
                })
            });
        }
        //Array que armazena os animes

        //Variavel que vai receber o link de próxima pagina
        let nextpage;
        //Try Catch para evitar exception e quebrar o endpoint
        try {
            //Tenta recuperar o elemento que contem o link da proxima pagina
            nextpage = document.querySelector('a.next')
            //Se ele !=null a variavel nextpage recebe o endereço presente no atributo HREF
            if (nextpage != null) {
                nextpage = nextpage.getAttribute('href');
            } else {
                //caso nextpage seja nulo retorna string vazia
                nextpage = '';
            }
        } catch (err) {
            //Em caso de erro retorna o erro
            throw new Error(err);
        }

        /**
         * Retorna o array e o link da proxima pagina caso exista
         */
        return {
             dadoslista,
            "nextpage": nextpage ?? ''
        }
    })
}

/**
 * Rota que recupera os animes da lista de todos os animes e retorna o link da proxima pagina caso exista
 * @param {* url} req 
 * @param {*} res 
 */
export default async function (req, res) {
    /**
     * Carrega o local padrão do chrome de acordo com o seu sistema operacional com base na plataforma em que está rodando
     */
    // let exec = chromeExecPaths[process.platform];

    /**
     * Recupera a ULR que vem via parametro na URL no endpoint da rota
    */
    let { url } = req.query

    /**
     * Caso url esteja vazio 
     * url recebe o link da primeira pagina de animes como valor
     */
    if (url === '') {
        url = 'https://www.anitube.site/lista-de-animes-legendados-online/'
    }
    /**
     * Inicialização do navegador
     */
    const browser = await puppeteer.launch({
        //Carrega os argumentos de execução
        args: chrome.args,
        /**
         * Recupera o local do executavel no dispositivo
         * altere o 'await chrome.executablePath' para 'exec'
         * e você conseguira executar esse endpoint localmente
         */
        executablePath: await chrome.executablePath,
        //Define se é para abrir a janela do navegador ou não.
        headless: chrome.headless,
        //Define o tamanho padrão da endpoint
        defaultViewport: {width: 1024,height:768}
    });

    //Instancia uma nova guia no navegador
    const page = await browser.newPage();

    //define o user agent desssa guia de forma aleatoria com o uso da biblioteca 'random-useragent'
    page.setUserAgent(randomUseragent.getRandom())
    //Ativa a interceptação de requisição nessa guia
    page.setRequestInterception(true);

    /**
     * Quando acontece uma requisição ele vai executar um processamento
     */
    page.on('request', (request) => {
        /**
         * Se for imagem, css ou fonte vai abortar a solicitação
         * Para aumentar a performance e economizar largura de banda
         */
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
            request.abort();
        } else {
            //Caso a requisição não seja compativel com nenhum dos critérios apenas continua normalmente
            request.continue();
        }
    });

    //Guia navega até a url que chegou via parametro e aguarda que as atividades de rede estejam completas
    await page.goto(url, { waitUntil: 'networkidle2' });

    /**
     * Processamento de dados
     */
    let animeslista = await animesEvaluate(page)

    //fecha o navegador
    await browser.close();

    /**
     * Variavel que armazena uma data
     * Ela é usada para manter controle da data de cache no servidor 
     */
    let daa = new Date();
    //Define o tempo de cache no servidor
    /**
     * Caso já tenha acontecido uma requisição nesse periodo de tempo
     * o servidor vai retornar o cache da ultima requisição com sucesso!
     * caso o cache já tenha expirado vai executar todo o código do endpoint e definir um novo cache
     */
    if(Object.keys(animeslista['dadoslista']).length > 0){
        res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');
        res.status(200).send({
            animeslista,
            "data": daa
        });
    }
    else{
        res.status(500).send('Falha ao carregar resultados');
    }
}