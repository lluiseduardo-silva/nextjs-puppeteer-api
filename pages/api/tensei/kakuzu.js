const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');

// TODO - Globalizar Variavel
/**
 * Necessario para executar localmente na maquina
 * Caso sua maquina esteja exeuctando um sistema operacional X86 altere a string win32 para C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
 */

// const chromeExecPaths = {
//     win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//     linux: 'usr/bin/google-chrome',
//     darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// }


/**
 * Função que recupera os detalhes do anime em questão  
 * recebe um PAGE do tipo puppeteer.browser.newPage();
 */
async function detalheEvaluate(page){
    /**
     * Retorna o conteudo da função assincrona EVALUATE
     */
    return await page.evaluate(()=>{
        /**
         * Recupera o array de episodios presente na pagina
         */
        episodesArray = document.querySelectorAll('body > div.pagAniLista > div.pagAniListaContainer> a');
        //Variavel que vai guardar os episodios processados da pagina
        episodioProcessado = [];
        //ForEach no array de episodios recuperados
        episodesArray.forEach(element =>{
            //Pricessamento de dados
            episodioProcessado.push({
                "titulo":element.title,
                "link":element.href
            })
        });
        //Retorno da função
        return {
            "titulo":document.querySelector('body > div.pagAniTitulo > div')?document.querySelector('body > div.pagAniTitulo > div').innerText: 'Sem titulo',
            "sinopse": document.querySelector('#sinopse2')?document.querySelector('#sinopse2').innerText: 'sem sinopse',
            "ano":document.querySelector('#anime > div.animeFlexContainer > div.right > div > div:nth-child(12)')?document.querySelector('#anime > div.animeFlexContainer > div.right > div > div:nth-child(12)').innerText : 'Ano Não expecificado' ,
            "capa":document.querySelector('#capaAnime > img')?document.querySelector('#capaAnime > img').src:'Capa Não encontrada',
            "pageLink":document.URL,
            "episodios":episodioProcessado
        }
    })
}
export default async function(req,res){
     /**
     * Carrega o local padrão do chrome de acordo com o seu sistema operacional com base na plataforma em que está rodando
     */
    // let exec = chromeExecPaths[process.platform];
    
    /**
     * Recupera a ULR que vem via parametro na URL no endpoint da rota
    */
    let {url} =  req.query

    /**
     * Caso url esteja vazio 
     * url recebe o link da primeira pagina de animes como valor
     */
    if(url === ''){
        url = 'https://www.anitube.site/lista-de-animes-online/'
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
    page.on('request', (request)=>{
        /**
         * Se for imagem, css ou fonte vai abortar a solicitação
         * Para aumentar a performance e economizar largura de banda
         */
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
        }else{
            //Caso a requisição não seja compativel com nenhum dos critérios apenas continua normalmente
            request.continue();
        }
    });

   //Guia navega até a url que chegou via parametro e aguarda que as atividades de rede estejam completas
   await page.goto(url, {waitUntil:'networkidle2'});

    /**
     * Processamento de dados
     */
    let data = await detalheEvaluate(page)

    //fecha o navegador
    await browser.close();

    /**
     * Variavel que armazena uma data
     * Ela é usada para manter controle da data de cache no servidor 
     */
    let daa = new Date();

    if(Object.keys(data).length > 0){
        //Define o tempo de cache no servidor
    res.setHeader('Cache-Control', 's-maxage=14400')
    /**
     * Caso já tenha acontecido uma requisição nesse periodo de tempo
     * o servidor vai retornar o cache da ultima requisição com sucesso!
     * caso o cache já tenha expirado vai executar todo o código do endpoint e definir um novo cache
     */
    res.status(200).send({"detalhes":data,
                        "data":daa});
    }
    else{
        res.status(500).send('Falha ao carregar resultados');
    }
    
}