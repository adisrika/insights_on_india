/**
 * Created by srikanth.adimulam on 2/7/16.
 */
var rp = require('request-promise'),
    cheerio = require('cheerio'),
    gp = require('promise'),
    pdf = require('html-pdf'),
    htmlToPdf = require('html-to-pdf'),
    fs = require('fs'),
    inputArgs = process.argv.slice(2),
    allDays = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'],
    mainPageOptions = {
        //uri: 'http://www.insightsonindia.com/',
        uri: 'http://www.insightsonindia.com/insights-daily-current-events-archives/',
        transform: function (body) {
            return cheerio.load(body);
        }
    },
    month, day, year, daysToDownload = [], linksToDownload = [];

if (inputArgs.length !== 2 && inputArgs.length !== 3) {
    console.log("Provide month, date as arguments to the program");
    console.log("node index.js yyyy mm dd");
}

year = inputArgs[0] || '2016';
month = inputArgs[1];
day = inputArgs[2];

daysToDownload = (day && [day]) || allDays;

rp(mainPageOptions)
    .then(function($){
        daysToDownload.forEach(function(day, index){
            var regexForCurrentEvents = "http://www.insightsonindia.com/" + year + "/" + month + "/" + day + "/insights-daily-current-events",
                regexForEditorial = "http://www.insightsonindia.com/" + year + "/" + month + "/" + day + "/insights-into-editorial",
                linkToCurrentEvents = $('a[href^="' + regexForCurrentEvents + '"]').attr('href'),
                linkToEditorial = $('a[href^="' + regexForEditorial + '"]').attr('href')

            if (linkToCurrentEvents) {
                linksToDownload.push(linkToCurrentEvents);
            }

            if (linkToEditorial) {
                linksToDownload.push(linkToEditorial);
            }
        });
        return linksToDownload;
    })
    .then(function(links){
        var promises = [];
        console.log(links);
        links.forEach(function(link, index) {
            promises.push(rp({
                uri: link,
                transform: function (body) {
                    return cheerio.load(body);
                }
            }));
        });
        return gp.all(promises);
    })
    .then(function(outputDoms){
        var promises = [];
        outputDoms.forEach(function(outputDom, index) {
            var linkSplits = linksToDownload[index].split('/');
            linkSplits.pop();
            var fileName = linkSplits.pop();
            /*var gpP = new gp(function(resolve, reject) {
                //console.log(outputDom('article').html());
                pdf.create(outputDom('article').html(), {
                    format: 'A4',
                    timeout: 60000
                }).toFile(fileName, function (err, res) {
                    if (err) {
                        return console.log(err);
                        reject('failure');
                    } else {
                        console.log(res);
                        resolve('success');
                    }
                });
            });*/
            var gpP = new gp(function(resolve, reject) {
                /*fs.writeFile(fileName + '.html', outputDom('article').html(), function(err){
                    if (err) throw err;
                    console.log('It\'s saved!');
                });*/
                htmlToPdf.convertHTMLString(outputDom('article').html(), './2015/' + fileName + '.pdf',
                    function (error, success) {
                        if (error) {
                            console.log('Oh noes! Errorz!');
                            console.log(error);
                            reject();
                        } else {
                            console.log('Woot! Success!');
                            console.log(success);
                            resolve();
                        }
                    }
                );
            });
            promises.push(gpP);
        });
        return gp.all(promises);
    })
    .then(function(){
        console.log(arguments);
    })
    .catch(function(err){
        console.log(err);
    });




