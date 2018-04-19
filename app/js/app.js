var convert = require('color-convert');
var Fuse = require("fuse.js");
var nearestColor = require('nearest-color');
var tinycolor = require("tinycolor2"); 
var Handlebars = require('handlebars');    

// All color names in json var
var hexArr = {}
var colorNamesJson = [];

(function () {

    var rgbSlider  = (function () {

        var R = document.querySelector('.js-rgbR'),
            G = document.querySelector('.js-rgbG'),
            B = document.querySelector('.js-rgbB'),
            rgbSliders = document.querySelector('.rgbSliders'),
            input = document.querySelector('.js-searchInput'),
            updatePending;

        var events = function () {
            // overlap https://stackoverflow.com/questions/202060/how-do-i-set-up-a-timer-to-prevent-overlapping-ajax-calls
            R.addEventListener('input', function () {
                this.style.backgroundColor = `rgb(${this.value}, 0, 0)`;
                this.parentElement.children[2].innerHTML = this.value;
                setInputField();
            });

            G.addEventListener('input', function () {
                this.style.backgroundColor = `rgb(0, ${this.value}, 0)`;
                this.parentElement.children[2].innerHTML = this.value;
                setInputField();
            });

            B.addEventListener('input', function () {
                this.style.backgroundColor = `rgb(0, 0, ${this.value})`;
                this.parentElement.children[2].innerHTML = this.value;
                setInputField();
            });

            R.addEventListener('change', function () {
                setColor();
            });

            G.addEventListener('change', function () {
                setColor();
            });

            B.addEventListener('change', function () {
                setColor();
            });
        };

        var setInputField = function() {
            let r_hex = parseInt(R.value, 10).toString(16),
                g_hex = parseInt(G.value, 10).toString(16),
                b_hex = parseInt(B.value, 10).toString(16),
                hex = "#" + pad(r_hex) + pad(g_hex) + pad(b_hex),
                col = tinycolor(hex);

            input.style.backgroundColor = hex;
            input.value = hex;

            if(col.isDark()){
                input.style.color = '#fff';
            } else {
                input.style.color = '#000';
            }
        };

        var update = function() {
            var updatePending = false;
            setColor();
        };

        var delayedUpdate = function() {
            if (updatePending) {
                clearTimeout(updatePending);
            }
        
            updatePending = setTimeout(update, 250);
        };

        var setSliders = function(r, g, b) {
            R.value = r;
            R.parentElement.children[2].innerHTML = r;
            R.style.backgroundColor = `rgb(${r}, 0, 0)`;

            G.value = g;
            G.parentElement.children[2].innerHTML = g;
            G.style.backgroundColor = `rgb(0, ${g}, 0)`;
            
            B.value = b;
            B.parentElement.children[2].innerHTML = b;
            B.style.backgroundColor = `rgb(0, 0, ${b})`;

            let hex = getHex(r,g,b);
            setInputField(hex);
        };

        var getHex = function (r,g,b) {
            let r_hex = parseInt(r, 10).toString(16),
                g_hex = parseInt(g, 10).toString(16),
                b_hex = parseInt(b, 10).toString(16);
            
            return "#" + pad(r_hex) + pad(g_hex) + pad(b_hex);
        };

        var setColor = function(hex) {

            if(typeof hexc === 'undefined') {

                var r_hex = parseInt(R.value, 10).toString(16),
                    g_hex = parseInt(G.value, 10).toString(16),
                    b_hex = parseInt(B.value, 10).toString(16),

                hex = "#" + pad(r_hex) + pad(g_hex) + pad(b_hex);
            }

            let col = tinycolor(hex);

            if(col.isDark()){
                input.style.color = '#fff';
            } else {
                input.style.color = '#000';
            }

            input.style.backgroundColor = hex;
            input.value = hex;
            searchEngine.hex(hex);
        };

        // outils
        var pad = function(n){
            return (n.length<2) ? "0"+n : n;
        };

        var hideSliders = function() {
            rgbSliders.classList.add("hidden");
        };
        var showSliders = function() {
            rgbSliders.classList.remove("hidden");
        };

        return {
            init: function () {
              events();
              /*setSliders(
                Math.floor(Math.random() * 255), 
                Math.floor(Math.random() * 255), 
                Math.floor(Math.random() * 255), 
              );*/
            },
            set: function (hex) {
                let rgb = tinycolor(hex).toRgb();
                setSliders(rgb.r,rgb.g,rgb.b);
            },
            hide: function() {
                hideSliders();
            },
            show: function() {
                showSliders();
            }
        }
    })();

    // Color names
    var colorNames = (function () {

        var colornamesFile = './assets/vendor/color-name-list/colornames.json';

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
                isDark: col.isDark(),
                brightness: col.getBrightness()
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
           
            document.querySelector(options.searchInput).addEventListener('keypress', function (e) {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {
                    search();
                }
            });
            document.querySelector(options.searchInput).addEventListener('click', function (e) {
                rgbSlider.show();
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
                document.querySelector('.js-searchInput').style.backgroundColor = hex;
                let col = tinycolor(hex);

                if(col.isDark()){
                    document.querySelector('.js-searchInput').style.color = '#fff';
                } else {
                    document.querySelector('.js-searchInput').style.color = '#000';
                }

                rgbSlider.set(hex);

            } else {
                searchByString(query);
                document.querySelector('.js-searchInput').style.backgroundColor = '';
                document.querySelector('.js-searchInput').style.color = '#000';

            }
            rgbSlider.hide();
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
            
            if(colors.length > 0) {
                UIcontroller.showCards(colors);
            } else {
                UIcontroller.showNoResults();
            }
        }

        return {
            init: function () {
                events();
            },
            cardEvents: function () {
                cardEvents();
            },
            hex: function (hex) {
                searchByHex(hex);
            },
        }

    })();

    document.addEventListener("DOMContentLoaded", function(event) {
        searchEngine.init();
        rgbSlider.init();
    });

    var UIcontroller = (function() {

        var elm = {
            container: 'results',
            card: 'hb-card',
            cardEach: 'hb-each-card',
            noResults: 'hb-no-results',
        };

        return {
            showResult: function(context) {
                var tpl = document.getElementById(elm.card).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.container).innerHTML = templateScript(context);
                searchEngine.cardEvents();
            },
            showNoResults: function() {
                var tpl = document.getElementById(elm.noResults).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.container).innerHTML = templateScript();
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
