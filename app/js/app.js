var convert = require('color-convert');
var Fuse = require("fuse.js");
var nearestColor = require('nearest-color');
var tinycolor = require("tinycolor2"); 
var Handlebars = require('handlebars');    

// All color names in json var
var hexArr = {}
var colorNamesJson = [];
var picker = new CP(document.querySelector('.js-searchInput'));

(function () {

    // Color names
    var colorNames = (function () {

        var colornamesFile = '/color-names/assets/vendor/color-name-list/colornames.json';

        var loadJSON = function (callback) {
            console.log('Load items from file');  
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
                
                colorNamesJson = JSON.parse(localStorage.getItem('colorNames'));
                hexArr = JSON.parse(localStorage.getItem('hexArr'));

                if(colorNamesJson === null) {
                    loadJSON(function (response) {
                        let colorNamesResponse = JSON.parse(response);
                        
                        colorNamesJson = JSON.parse(localStorage.getItem('colorNames'));               
                        
                        let byHexIndex = {};
                        for (var i = 0; i < colorNamesResponse.length; i++) {
                            byHexIndex[colorNamesResponse[i].name] = colorNamesResponse[i].hex;
                        }                      
                        
                        localStorage.setItem('colorNames', response);
                        localStorage.setItem('hexArr', JSON.stringify(byHexIndex));
                        console.log('store items in local storage');                   

                        colorNamesJson = JSON.parse(localStorage.getItem('colorNames'));
                        hexArr = JSON.parse(localStorage.getItem('hexArr'));

                    });
                }
            },
            json: function () {
                return colorNamesJson;
            }
        }


    })();

    colorNames.init();

    // Search engine
    var searchEngine = (function () {
        var options = {
            searchButton: '.js-search',
            searchInput: '.js-searchInput',
            max: 50
        };

        var Color = function(name, value, matched) {
            let col = tinycolor(value);
            
            this.name = name;
            this.value = value;
            this.matched = matched;
            this.different = false;
            this.specs = {
                isDark: col.isDark()
            }
        };

        Color.prototype.title = function() {
            if(this.value !== this.matched) {
                return this.value;
            } else {
                return this.name;
            }
        };
        
        Color.prototype.spaces = function() {
            let spaces = [
                { title: "rgb", value: convert.hex.rgb(this.value)},
                { title: "hsl", value: convert.hex.hsl(this.value)},
                { title: "cmyk", value: convert.hex.cmyk(this.value)},
                { title: "lab", value: convert.hex.lab(this.value)},
                { title: "hsv", value: convert.hex.hsv(this.value)},
                { title: "hwb", value: convert.hex.hwb(this.value)}
            ];

            return spaces;
        };

        // Color.prototype.specs = function() {
        //     let col = tinycolor(this.value);
        //     return {
        //         isDark: col.isDark()
        //     };
        // };

        var events = function () {

            picker.on("stop", function(color) {
                searchByHex('#' + color);
            });
            
            document.querySelector(options.searchInput).addEventListener('keypress', function (e) {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {
                    picker.exit();
                    search();
                }
            });
        };

        var cardEvents = function () {
            let jsMatched = document.querySelectorAll('.js-matched');
            for (var i = 0; i < jsMatched.length; i++) {
                jsMatched[i].addEventListener('click', function () {
                    searchByHex(this.innerHTML);
                });
            }
        };

        var isHexColor = function(hex) {
            return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
        };

        var search = function () {
            var query = document.querySelector(options.searchInput).value;

            if (query[0] == '#') {
                let hex = query;
                searchByHex(hex);
            } else {
                searchByString(query);
            }
        };

        var searchByHex = function(hex) {

            var nearest = nearestColor.from(hexArr);
            var match = nearest(hex);

            if(!isHexColor(hex)){
                //console.log('Colore non valido');
            } else {
                let newColor = new Color(match.name, hex, match.value);
                if(match.distance === 0){
                    newColor.title = match.name;
                } else {
                    newColor.different = true;
                }
                
                UIcontroller.showResult(newColor);
                document.querySelector(options.searchInput).value = hex;         
            }
        }

        var searchByString = function(query) {
            let colorSearch = new Fuse(colorNamesJson, {
                shouldSort: true,
                includeScore: true,
                threshold: 0.3,
                location: 0,
                distance: 100,
                maxPatternLength: 32,
                minMatchCharLength: 1,
                keys: [
                    "name",
                    "hex"
                ]
            });

            let allResults = colorSearch.search(query);
            let max = options.max > allResults.length ? allResults.length : options.max;
            let results = [];
            
            let colors = [];
            for (var i = 0; i < max; i++) {
                let newColor = new Color(allResults[i].item.name, allResults[i].item.hex, allResults[i].item.hex);
                colors.push(newColor);
                //console.log(allResults[i]);
            }
            
            let cards = colors;

            UIcontroller.showCards(cards);
        }

        return {
            init: function () {
                events();
            },
            cardEvents: function () {
                cardEvents();
            },
        }

    })();

    document.addEventListener("DOMContentLoaded", function(event) {
        searchEngine.init();
    });

    var UIcontroller = (function() {

        var elm = {
            container: 'results',
            card: 'hb-card',
            cardEach: 'hb-each-card'
        };

        return {
            showResult: function(context) {
                var tpl = document.getElementById(elm.card).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.container).innerHTML = templateScript(context);
                searchEngine.cardEvents();
            },
            showCards: function(context) {
                var tpl = document.getElementById(elm.cardEach).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.container).innerHTML = templateScript(context);
                searchEngine.cardEvents();
            }
        };
    })();
    
})();

console.log('app start');
