var convert = require('color-convert');

window.convert = convert;

// All color names in json var
var colorSearch = [];
var hexArr = {}
var colorNamesJson = [];

(function () {
    // Color names
    var colorNames = (function () {

        var fuseOptions = {
            shouldSort: true,
            includeScore: false,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                "name",
                "hex"
            ]
        }

        var colornamesFile = '/assets/vendor/color-name-list/colornames.json';

        var loadJSON = function (callback) {
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', colornamesFile, true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                    callback(xobj.responseText);
                }
            };
            xobj.send(null);
        }

        return {
            init: function () {
                loadJSON(function (response) {
                    colorNamesJson = JSON.parse(response);

                    for (var i = 0; i < colorNamesJson.length; i++) {
                        hexArr[colorNamesJson[i].name] = colorNamesJson[i].hex;
                    }

                    // Fuse
                    colorSearch = new Fuse(colorNamesJson, fuseOptions);
                });
            },
            json: function () {
                return colorNamesJson;
            }
        }


    })();

    colorNames.init();

    // ClosestHex
    var closestHex = (function () {

        var isHexColor = function(hex) {
            return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
        };

        return {
            get: function (hex) {
                var nearest = nearestColor.from(hexArr);
                var match = nearest(hex);

                if(!isHexColor(hex)){
                    console.log('Colore non valido');
                } else {
                    console.log(match); 
                    UIcontroller.showResult(match);
                }

                console.log(colorNamesJson[match.index]);
                alert('qui');
            }
        }

    })();

    // Search engine
    var searchEngine = (function () {
        var options = {
            searchButton: '.js-search',
            searchInput: '.js-searchInput',
            max: 10
        };

        var events = function () {
            document.querySelector(options.searchButton).addEventListener('click', search);

            document.querySelector(options.searchInput).addEventListener('keypress', function (e) {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {
                    search();
                }
            });
        };

        var isHexColor = function(hex) {
            return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
        };

        var search = function () {
            var query, allResults, max, results, colors = [];
            query = document.querySelector(options.searchInput).value;

            if (query[0] == '#') {
                var hex = query;
                var nearest = nearestColor.from(hexArr);
                var match = nearest(hex);

                if(!isHexColor(hex)){
                    console.log('Colore non valido');
                } else {
                    UIcontroller.showResult(match);
                }


            } else {
                allResults = colorSearch.search(query);
                max = options.max > allResults.length ? allResults.length : options.max;
                results = [];

                for (var i = 0; i < max; i++) {
                    colors.push(allResults[i])
                }

                console.log(colors);
            }
        };

        return {
            init: function () {
                events();
            },
        }

    })();

    searchEngine.init();

    var UIcontroller = (function() {

        var elm = {
            container: 'results',
            card: 'hb-card'
        };

        return {
            showResult: function(context) {
                var tpl = document.getElementById(elm.card).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.container).innerHTML = templateScript(context);
            }
        };
    })();
        
})();


console.log('app start');
