const cheerio = require('cheerio');
const request = require('request-promise');
const rua = require('random-useragent');

export default async function(req, res){
    let response = await request({
        uri: 'https://anitube.site',
        headers:{
            "User-Agent":rua.getRandom(),
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-encoding": "gzip, deflate, br",
            "cache-control": "no-cache"
        },
        gzip: true
    });
    let $ = cheerio.load(response);
    //Episodios recentes - OK
    let episodios = [];
    $('.epiContainer > .epiSubContainer > .epiItem').each((i,v) =>{
        episodios.push({
            "titulo":$(v).children('a').attr('title'),
            "link":$(v).children('a').attr('href'),
            "capa":$(v).children('a').children('.epiItemImg').children('img').attr('src')
        })
    })
    let maisVisualisados = [];
    let animesRecentes = [];
    let lancamentosdoDia = [];
    $('div.aniContainer').each((i,v) =>{
        $(v).children('.main-carousel').children('.aniItem').each((idx, el)=>{
            if(i == 0){
                maisVisualisados.push({
                    "titulo":$(el).children('a').attr('title'),
                    "link":$(el).children('a').attr('href'),
                    "capa":$(el).children('a').children('.aniItemImg').children('img').attr('src')
                });
            }else if(i == 1){
                animesRecentes.push({
                    "titulo":$(el).children('a').attr('title'),
                    "link":$(el).children('a').attr('href'),
                    "capa":$(el).children('a').children('.aniItemImg').children('img').attr('src')
                });
            }else{
                lancamentosdoDia.push({
                    "titulo":$(el).children('a').attr('title'),
                    "link":$(el).children('a').attr('href'),
                    "capa":$(el).children('a').children('.aniItemImg').children('img').attr('src')
                });
            }
        })
    })
    if(Object.keys(maisVisualisados).length > 0 
    && Object.keys(lancamentosdoDia).length > 0 
    && Object.keys(animesRecentes).length > 0 
    && Object.keys(episodios).length > 0){
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send({
            maisVisualisados,
            animesRecentes,
            lancamentosdoDia,
            episodios
        });
    }
    res.status(500).send('Algo deu errado');
}