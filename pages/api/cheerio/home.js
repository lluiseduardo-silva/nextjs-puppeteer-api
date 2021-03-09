export default async function ( req, res){
    try {
        var Spooky = require('spooky');
    } catch (e) {
    }
    
    var spooky = new Spooky({
            child: {
                transport: 'http'
            },
            casper: {
                logLevel: 'debug',
                verbose: true
            }
        }, function (err) {
            if (err) {
                e = new Error('Failed to initialize SpookyJS');
                e.details = err;
                throw e;
            }
    
            spooky.start(
                'https://anitube.site/');
            spooky.then(function () {
                this.emit('hello', 'Hello, from ' + this.evaluate(function () {
                    return document.title;
                }));
            });
            spooky.run();
        });
    
    spooky.on('error', function (e, stack) {
        console.error(e);
    
        if (stack) {
            console.log(stack);
        }
    });
}