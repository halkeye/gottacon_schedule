#!/usr/bin/env node
var 
    fs = require('fs'),
    cheerio = require('cheerio');
var games = {}; /* by event id */
var descriptions = {}; /* by description id */

fs.readdir(__dirname + '/../_tmp/', function(err, files) {
    files.forEach(function(file) {
        fs.readFile(__dirname + '/../_tmp/' + file, function (err, data) {
            if (err) throw err;
            var $ = cheerio.load(data);
            if ($('title').text().match(/description/i))
            {
                /* Loading Descriptions */
            }
            else
            {
                /* Loading Schedules */
                process.nextTick(function() {
                    processSchedule($);
                });
            }
        });
    });
});

var processSchedule = function($) {
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
            };

            var $title = $gameCell.children(0 /*table*/ ).children(0/*tr*/).children(0/*td*/).find('a');
            if ($title)
            {
                data.title = $title.text();
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
            }
            if (games[data.eventId])
            {
                console.log("Data is duplicated:", data, games[data.eventId]);
                throw {};
            }
            games[data.eventId] = data;
        });
    });
    process.nextTick(doneProcessingFile);
};
var doneProcessingFile = function() {
    console.log(games);
};
