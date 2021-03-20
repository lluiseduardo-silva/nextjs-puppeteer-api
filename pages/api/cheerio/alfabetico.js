const cheerio = require('cheerio');
const request = require('request-promise');
const rua = require('random-useragent');

export default async function(req, res){
    const {letra,url} = req.query;
    let response = await request({
        uri: url ? url : `https://www.anitube.site/lista-de-animes-online/?letra=${letra}`,
        headers:{
            "User-Agent":rua.getRandom(),
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-encoding": "gzip, deflate, br",
            "cache-control": "no-cache"
        },
        gzip: true
    });
    let $ = cheerio.load(response);
    let resultados = [];
    if($('.listaPagAnimes > a').length > 0){
        $('.listaPagAnimes > a').each((i, el)=>{
            resultados.push({"titulo":$(el).children('a').attr('title'),
            "link":$(el).children('a').attr('href'),
            "capa":$(el).children('a').children('.aniItemImg').children('img').attr('src')});
        })
    }else{
        $('.listaPagAnimes > div').each((i, el)=>{
            resultados.push({"titulo":$(el).children('a').attr('title'),
            "link":$(el).children('a').attr('href'),
            "capa":$(el).children('a').children('.aniItemImg').children('img').attr('src')});
        })
    }
    if(Object.keys(resultados).length > 0){
        res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');
        res.status(200).send({resultados,nextPage:$('.next').attr('href')});
    }
    else{
        res.status(404).send('Não encontramos nada');
    }
    
}