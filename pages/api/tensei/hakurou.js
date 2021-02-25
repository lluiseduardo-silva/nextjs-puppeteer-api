const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const randomUseragent = require('random-useragent');


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
 * endpoint da rota na API
 * Esta rota processa as requisições da pagina e tenta retornar todos os links com seus Headers que possuam .m3u8, .mp4, video/mp4 na url
 */
export default async function handle(req,res){

    /**
     * Carrega o local padrão do chrome de acordo com o seu sistema operacional com base na plataforma em que está rodando
     */
    // let exec = chromeExecPaths[process.platform];
    
    /**
     * Recupera a ULR que vem via parametro na URL no endpoint da rota
    */
    let {url} =  req.query

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
    });
    //Instancia uma nova guia no navegador
    const page = await browser.newPage();

    //define o user agent desssa guia de forma aleatoria com o uso da biblioteca 'random-useragent'
    page.setUserAgent(randomUseragent.getRandom())
    //Ativa a interceptação de requisição nessa guia
    page.setRequestInterception(true);

    //Variavel onde armazena o retorno
    let sources = [];
    /**
     * Quando acontece uma requisição ele vai executar um processamento
     */
    page.on('request', (request)=>{
        //Se for imagem, css ou fonte vai abortar a solicitação
        //Para aumentar a performance e economizar largura de banda
        if(['image','stylesheet','font'].includes(request.resourceType())){
            request.abort();
            /**
             * Caso tenha na url alguma dessa informações 
             * Vai recuperar a url da requisição e o cabeçalho
             */
        }else if (['.m3u8','.mp4','video/mp4','.MP4','.mkv','.M3U8'].some(v => request.url().includes(v))){
            //Caso o conteudo da url tenha anitube não adiciona a url
            if(request.url().indexOf('anitube') == -1){
                //se não tiver anitube no conteudo adicona a url e o cabeçalho ao array
                sources.push({
                    "url":request.url(),
                    "headers":request.headers()
                });
            }
            //continua com a requisição
            request.continue();
        }
        //Caso a requisição não seja compativel com nenhum dos critérios apenas continua normalmente
        else{
            request.continue();
        }
    });
    //Guia navega até a url que chegou via parametro e aguarda que as atividades de rede estejam completas
    await page.goto(url, {waitUntil:'networkidle2'});

    //fecha o navegador
    await browser.close();

    /**
     * Variavel que armazena uma data
     * Ela é usada para manter controle da data de cache no servidor 
     */
    let daa = new Date();

    if(Object.keys(sources).length > 0){
        //Define o tempo de cache no servidor
    res.setHeader('Cache-Control', 's-maxage=240')
    /**
     * Caso já tenha acontecido uma requisição nesse periodo de tempo
     * o servidor vai retornar o cache da ultima requisição com sucesso!
     * caso o cache já tenha expirado vai executar todo o código do endpoint e definir um novo cache
     */
    res.status(200).send({"fontes":sources,
                        "data":daa});
    }
    else{
        res.status(500).send('Falha ao carregar resultados');
    }
    
}