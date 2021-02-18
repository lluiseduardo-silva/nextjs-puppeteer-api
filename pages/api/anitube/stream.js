const request = require('request')
const cheerio = require('cheerio');

export default async function handle(req,res){
    let {url} = req.body
    if(url == ''){
        res.status(500).send('URL é obrigatoria')
    }
    let dados = []
    let promise = new Promise(
        function(resolve,reject){
            request(url, (err,resonse,body)=>{
                let $ = cheerio.load(body);
                let textNode = $('#video > script')[5].children[0]
                if (textNode){
                    var scriptText = textNode.data.replace(/\r?\n|\r/g, "")
                                                .replace(/file:/g, '"file":')
                                                .replace(/label:/g, '"label":')
                                                .replace(/type:/g, '"type":')
                                                .replace(/default:/g, '"default":')
                                                .replace(/'/g,'"');
                    var jsonString = /sources:(.*)}\);/.exec(scriptText)[1];
                    let index=jsonString.indexOf(']');
                    let sources = jsonString.substr(0,index+1);
                    console.log(JSON.parse(sources));
                    dados.push(JSON.parse(sources));
                    resolve()
                }else{
                    reject()
                }
            })
        }
    )

    res.status(200).send(dados);
}