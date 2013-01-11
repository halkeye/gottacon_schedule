#!/usr/bin/env node
var 
    fs = require('fs'),
    cheerio = require('cheerio');
var games = {}; /* by event id */
var descriptions = {}; /* by description id */

var outstandingFiles = {};
fs.readdir(__dirname + '/../_tmp/', function(err, files) {
    files.forEach(function(file) {
        outstandingFiles[file] = 1;
        fs.readFile(__dirname + '/../_tmp/' + file, function (err, data) {
            if (err) throw err;
            var $ = cheerio.load(data);
            if ($('title').text().match(/description/i))
            {
                /* Loading Descriptions */
                process.nextTick(function() {
                    processDescriptions($, function() {
                        delete outstandingFiles[file];
                    });
                });
            }
            else
            {
                /* Loading Schedules */
                process.nextTick(function() {
                    processSchedule($, function() {
                        delete outstandingFiles[file];
                    });
                });
            }
        });
    });
    /* There has to be a callback way to handle this, but lazy for non long running script */
    var waitForFinish = setInterval(function() {
        if (Object.keys(outstandingFiles).length === 0)
        {
            process.nextTick(doneProcessingFile);
            clearInterval(waitForFinish);
        }
    });
});

var processDescriptions = function($, callback) {
    var $block = $('table table td').eq(1);
    var removeIdRegex   = /^\"(\d+)\">/;
    var removeHtmlRegex = /<(?:.|\n)*?>/gm;
    /* FIXME - use a safer module? */
    var removeHtml = function(arr)
    {
        return arr.join("\n").replace(removeHtmlRegex, '').trim();
    };
    

    var matches = $block.html().split('<a name='); // .match(/<a name=\"\d+\">[\s\S]*(?!<a name)/g);
    matches.forEach(function(str) {
        str = str.trim();
        if (str.length === 0) return;

        var desc = { gameIds: [] };
        desc.id = parseInt(str.match(removeIdRegex)[1],10);
        /* Remove the id and process remaining strings */
        str = str.replace(removeIdRegex, '');
        var lines = str.split("\n");
        /* Title in the original <a> */
        desc.title = removeHtml(lines.splice(0,1));
        /* Organizier is next line */
        desc.organizer = removeHtml(lines.splice(0,1)).replace(/^By /,'').replace(/\.$/,'');
        /* Day (probably not needed) is next */
        desc.day = removeHtml(lines.splice(0,1)).replace('Day:','');
        /* Start Time (probably not needed */
        desc.startTime = removeHtml(lines.splice(0,1)).replace('Start Time: ','');
        /* Number of participants. Throw away as I don't want to parse it */
        lines.splice(0,1); // Number of participants:
        /* Remainder is descripion */
        desc.desc = removeHtml(lines);
        /* Save description */
        descriptions[desc.id] = desc;
    });
    process.nextTick(callback);
};

var processSchedule = function($, callback) {
    var $gameCells = $('.tableframe table');
    var pageDate;
    var slots = [];
    $gameCells.children().each(function(idx, elm) {
        var $row = $(elm);
        if (idx === 0) 
        {
            pageDate = $row.children(0).text();
            return false;
        }
        if (idx === 1) 
        {
            $row.children().each(function(idx, elm) {
                var txt = $(elm).text().split("\n");
                slots.push({'time':txt[2], 'slot': parseInt(txt[1].replace('Slot ',''),10)});
            });
            return false;
        }
        $row.children().each(function(idx, elm) {
            var $gameCell = $(elm);
            if ($gameCell.children().length === 0) return true;

            var data = {
                players: []
            };

            var $title = $gameCell.children(0 /*table*/ ).children(0/*tr*/).children(0/*td*/).find('a');
            if ($title)
            {
                var arr = $title.text().split(' - ');
                data.type = arr[0];
                data.title = arr.slice(1).join(' - ');
                data.eventId = parseInt($title.attr('name'),10);
                data.descId = parseInt($title.attr('href').match(/list.php\#(\d+)\'/)[1],10);
            }

            if (1)
            {
                var line = $gameCell.find("table tr").eq(1).children(0).html();
                //1 table<br> 1 judge (waitlisting)<br>0 players (4 open seats)
                ///1 table<br>0 judges (1 needed)<br>1 player (29 open seats)
                var matches = line.match(/(\d+)\s*tables?\s*<br>\s*(\d+)\s*judges?.*<br>(\d+)\s*players?\s*\((\d+)?/);
                if (!matches) 
                {
                    console.log(line);
                    throw {}; // lazy
                }
                else
                {
                    data.tableCount = parseInt(matches[1],10);
                    data.judgeCount = parseInt(matches[2],10);
                    data.playerCount = parseInt(matches[3],10);
                    data.openSpotCount = parseInt(matches[4],10);
                    data.slot = slots[idx].slot;
                    data.time = slots[idx].time;
                }
                if (data.playerCount > 0)
                {
                    $gameCell.find("table tr").eq(5).children(0).children().each(function(idx, elm) {
                        var txt = $(elm).text().trim();
                        if (txt.length === 0) return; /* Skip padding text */
                        data.players.push(txt);
                    });
                }
            }
            if (games[data.eventId])
            {
                console.log("Data is duplicated:", data, games[data.eventId]);
                throw {};
            }
            games[data.eventId] = data;
        });
    });
    process.nextTick(callback);
};
var doneProcessingFile = function() {
    /* Check all the sessions we found and make sure they have a description when all said and done */
    Object.keys(games).forEach(function(gameId) {
        var game = games[gameId];
        if (!descriptions[game.descId]) {
            console.log("Can't find desc for game:", game);
        }
        descriptions[game.descId].gameIds.push(gameId);
    });
    /* Find any descriptions with no games */
    Object.keys(descriptions).forEach(function(descId) {
        if (descriptions[descId].gameIds.lenght === 0) {
            console.log("Found unused description", descriptions[descId]);
        }
    });
    console.log("Assumed all good, outputting");
};
