const request = require('request-promise');
const cheerio = require('cheerio');
const rua = require('random-useragent');

export default async function( req, res){
    const { url } = req.query;
    console.log(url)
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
        await request(options).then(function (body){
            //Pega o corpo da request e coloca na variavel $
            let $ = cheerio.load(body);

            //recupera a tag script que possui o conteudo que desejo
            let textNode = $('#video > script')[5].children[0]
            //Se não for uma string vazia faz o processamento do corpo
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
        }).catch(function(err){res.status(500).send(err)})
        res.status(200).send({data:json});
    }else{res.status(500).send('Algo deu errado. Verifique a requisição e tente novamente')}
    
    
}