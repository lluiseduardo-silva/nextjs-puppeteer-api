const request = require('request-promise');
const cheerio = require('cheerio');
const rua = require('random-useragent');

export default async function( req, res){
    const { url } = req.query;
    var options = {
        url: url,
        headers:{
            'User-Agent':rua.getRandom()
        }
    }
    if(url != undefined){
        console.log(options.headers['User-Agent'])
        let json;
        //Inicia a request
        let response = await request({
            uri: url,
            headers:{
                "User-Agent":rua.getRandom(),
                "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "cache-control": "no-cache"
            },
            gzip: true
        });

        let $ = cheerio.load(response);

        let textNode = $('#video > script')[5].children[0]

        if (textNode){
            var scriptText = textNode.data.replace(/\r?\n|\r/g, "")
                                        .replace(/file:/g, '"file":')
                                        .replace(/label:/g, '"label":')
                                        .replace(/type:/g, '"type":')
                                        .replace(/default:/g, '"default":')
                                        .replace(/'/g,'"');

            //Executa o Regex para recuperar apenas o conteudo que desejo
            var jsonString = /sources:(.*)}\);const/.exec(scriptText)[1];
            //Pega o indice do fechamento do array para formatação dos dados
            let index=jsonString.indexOf(']');
            // Pega apenas o conteudo do array
            let sources = jsonString.substr(0,index+1);
            // Transforma em JSON
           json = JSON.parse(sources);
            //Retorna o resultado
        }

        let nextEpName = $('#proximoEPLink').attr('title');
        let nextEpLink = $('#proximoEPLink').attr('href');

        let backEpName = $('div.pagEpiGroupControles > a:nth-child(1)').attr('title');
        let backEpLink = $('div.pagEpiGroupControles > a:nth-child(1)').attr('href');


        if(Object.keys(json).length > 0){
            //Define o tempo de cache no servidor
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        /**
         * Caso já tenha acontecido uma requisição nesse periodo de tempo
         * o servidor vai retornar o cache da ultima requisição com sucesso!
         * caso o cache já tenha expirado vai executar todo o código do endpoint e definir um novo cache
         */
         res.status(200).send({
             data:json,
             next:{
                 nextEpName:nextEpName == 'Sem Próximo Episódio' ? '':nextEpName,
                 nextEpLink:nextEpLink??''
                },
            back:{
                backEpName: backEpName == 'Sem Episódio Anterior' ? '':backEpName,
                backEpLink:backEpLink??''
            },
            detalhes: $('.pagEpiGroupControles > a:nth-child(2)').attr('href'),
            epLink: url,
        });
        }
        
    }else{res.status(500).send('Algo deu errado. Verifique a requisição e tente novamente')}
    
    
}