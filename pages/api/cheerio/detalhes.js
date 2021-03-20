const cheerio = require('cheerio');
const request = require('request-promise');
const rua = require('random-useragent');

export default async function(req, res){
    const {url}= req.query;
    if(url == null || url == ''){
        res.status(404).send('Você precisa informar o parametro')
    }
    try{
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
        //Parsing dos generos
        let genero = $('#anime > div.animeFlexContainer > div.right > div > div:nth-child(2)').text();
        genero = genero.replace('Gênero: ', '')
        let resultados = genero.split(',').map((item) => item.trim())
        let episodios = [];
        $('.pagAniListaContainer > a').each((i,el)=>{
            episodios.push({
                "titulo":$(el).attr('title'),
                "link":$(el).attr('href')
            })
        })
        if($('body > div.pagAniTitulo > div > h1').text() == ''){
            throw Error('Elementos não encontrados');
        }
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).send({
            "titulo":$('body > div.pagAniTitulo > div > h1').text(),
            "capa":$('#capaAnime > img').attr('src'),
            "generos": resultados,
            "sinopse":$('#sinopse2').text(),
            episodios
        })
    }catch(ex){
        res.status(500).send(ex.message)
    }
}