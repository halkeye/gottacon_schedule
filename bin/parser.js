#!/usr/bin/env node
var 
    fs = require('fs'),
    cheerio = require('cheerio');
var $; /* cheerio */
var games = [];

fs.readFile(__dirname + '/../_tmp/GottaCon 2013   Gaming Schedule   Friday, Feb 1 2013.htm', function (err, data) {
    if (err) throw err;
    $ = cheerio.load(data);
    process.nextTick(postFileLoad);
});

var postFileLoad = function() {
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
                title: $gameCell.find("table tr td span b a").text()
            };

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
            }
            games.push(data);
        });
    });
    process.nextTick(doneProcessingFile);
};
var doneProcessingFile = function() {
    console.log(games);
};
