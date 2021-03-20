const cheerio = require('cheerio');
const request = require('request-promise');
const rua = require('random-useragent');

export default async function(req, res){
    let response = await request({
        uri: 'https://www.anitube.site/lista-de-generos-online/',
        headers:{
            "User-Agent":rua.getRandom(),
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-encoding": "gzip, deflate, br",
            "cache-control": "no-cache"
        },
        gzip: true
    });
    let $ = cheerio.load(response);
    let generos = [];
    $('.generosPagContainer > a').each((i,el)=>{
        let slug = $(el).attr('href');
        let inx = slug.indexOf('=');
        slug = slug.substr(inx+1,slug.length);
        generos.push({"name":$(el).text(),"slug":slug.trim()})
    })
    if(Object.keys(generos).length > 0){
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send(generos)
    }
    else{
        res.status(500).send('Algo deu errado :p');
    }
}