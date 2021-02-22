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
 * Função assincrona que retorna os animes do resultado da pesquisa
 */
async function animesEvaluate(page){
    //Retorno da função é o resultado da operaçao assincrona EVALUATE
    return await page.evaluate(()=>{
        //Recupera os animes presentes na pagina
        PageAnimes = document.querySelectorAll('body > div.mwidth > div.searchPagContainer > div ')
        //Array que armazena os resultados
        dadosbusca = [];
        //Variavel que vai receber o link de próxima pagina
        let nextpage;
        //Try Catch para evitar exception e quebrar o endpoint
        try{
            //Tenta recuperar o elemento que contem o link da proxima pagina
            nextpage = document.querySelector('a.next')
            //Se ele !=null a variavel nextpage recebe o endereço presente no atributo HREF
            if(nextpage != null){
                nextpage = nextpage.getAttribute('href');
            }else{
                //caso nextpage seja nulo retorna string vazia
                nextpage = '';
            }
        }catch(err){
            //Em caso de erro retorna o erro
            throw new Error(err);
        }
        //Percorre o array de animes recuperados e faz o processamento
        PageAnimes.forEach(element => {
            /**
             * Processa os dados da busca e adiciona no array de resultados
             */
            dadosbusca.push({
                "title":element.children[0].title,
                "cover":element.children[0].children[0].children[0].src,
                "sub":element.children[0].children[0].children[1].innerHTML,
                "pageLink":element.children[0].href,
            })
        });
        //Retorno da função
        return {
            dadosbusca,
            "nextpage": nextpage??''
        }
    })
}
/**
 * endpoint que faz as busca na API
 */
export default async function(req,res){
    /**
     * Carrega o local padrão do chrome de acordo com o seu sistema operacional com base na plataforma em que está rodando
     */
    // let exec = chromeExecPaths[process.platform];
    
    /**
     * Recupera a ULR que vem via parametro na URL no endpoint da rota
    */
    let {url,busca} =  req.query

    //Caso a busca seja vazia retorna um erro
    if(busca === ''){
        res.status(500).send('Necessario informar algo na busca')
        //Caso envie a busca e o link da proxima pagina url recebe nextpage
    }else if(url != ''){
        url = url;
        //Caso falhe em tudo url recebe a uri base de busca
    }else{
        url = `https://www.anitube.site/?s=${busca}`
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
    let animesbusca = await animesEvaluate(page)

    //fecha o navegador
    await browser.close();

    /**
     * Variavel que armazena uma data
     * Ela é usada para manter controle da data de cache no servidor 
     */
    let daa = new Date();
    if(Object.keys(animesbusca['dadosbusca']).length > 0){
        //Define o tempo de cache no servidor
    res.setHeader('Cache-Control', 's-maxage=3600')
    /**
     * Caso já tenha acontecido uma requisição nesse periodo de tempo
     * o servidor vai retornar o cache da ultima requisição com sucesso!
     * caso o cache já tenha expirado vai executar todo o código do endpoint e definir um novo cache
     */
    res.status(200).send({animesbusca,
                        "data":daa});
    }
    else{
        res.status(500).send('Falha ao carregar resultados');
    }
    
    // res.send('ok')
}