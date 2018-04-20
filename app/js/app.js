var convert = require('color-convert');
var Fuse = require("fuse.js");
var nearestColor = require('nearest-color');
var tinycolor = require("tinycolor2"); 
var Handlebars = require('handlebars');
const tippy = require('tippy.js')

// All color names in json var
var hexArr = {}
var colorNamesJson = [];

(function () {

    var rgbSlider  = (function () {

        var R = document.querySelector('.js-rgbR'),
            G = document.querySelector('.js-rgbG'),
            B = document.querySelector('.js-rgbB'),
            rgbSliders = document.querySelector('.rgbSliders'),
            input = document.querySelector('.js-searchInput');

        var events = function () {
            let sliders = rgbSliders.getElementsByTagName('input');
            
            for (let i = 0; i < sliders.length; i++) {
                sliders[i].addEventListener('change', search);
                sliders[i].addEventListener('input', () => {
                    setSlider(sliders[i]);
                    setInputField();
                });
            }

        };

        var search = function() {
            let hex = getHex();
            searchEngine.hex(hex);
        };

        var setSlider = function(slider) {
        
           R.style.backgroundImage = `linear-gradient(to right, rgb(0, ${G.value}, ${B.value}), rgb(255, ${G.value}, ${B.value}))`;           
           G.style.backgroundImage = `linear-gradient(to right, rgb(${R.value}, 0, ${B.value}), rgb(${R.value}, 255, ${B.value}))`;           
           B.style.backgroundImage = `linear-gradient(to right, rgb(${R.value}, ${G.value}, 0), rgb(${R.value}, ${G.value}, 255))`;  
          
           slider.parentElement.children[2].innerHTML = slider.value;
        }

        var setInputField = function() {
            let hex = getHex(),
                col = tinycolor(hex);

            input.style.backgroundColor = hex;
            input.value = hex;

            if(col.isDark()){
                input.style.color = '#fff';
            } else {
                input.style.color = '#000';
            }

            document.querySelector('.main-title').style.color = hex;
        };

        var setSliders = function(r, g, b) {
            R.value = r;
            G.value = g;
            B.value = b;

            R.parentElement.children[2].innerHTML = r;
            R.style.backgroundImage = `linear-gradient(to right, rgb(0, ${G.value}, ${B.value}), rgb(255, ${G.value}, ${B.value}))`;

            G.parentElement.children[2].innerHTML = g;
            G.style.backgroundImage = `linear-gradient(to right, rgb(${R.value}, 0, ${B.value}), rgb(${R.value}, 255, ${B.value}))`;
            
            B.parentElement.children[2].innerHTML = b;
            B.style.backgroundImage = `linear-gradient(to right, rgb(${R.value}, ${G.value}, 0), rgb(${R.value}, ${G.value}, 255))`; 

            setInputField();
        };

        // outils
        var getHex = function () {
            let r_hex = parseInt(R.value, 10).toString(16),
                g_hex = parseInt(G.value, 10).toString(16),
                b_hex = parseInt(B.value, 10).toString(16);
            
            return "#" + pad(r_hex) + pad(g_hex) + pad(b_hex);
        };

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

    // Init and store color database
    colorNames.init();

    // Search engine
    var searchEngine = (function (rgbSlider) {
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
                brightness: col.getBrightness(),
                triad: col.triad(),
                tetrad: col.tetrad(),
                monochromatic: col.monochromatic(),
                analogous: col.analogous(),
                splitcomplement: col.splitcomplement(),
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
           
            document.querySelector(options.searchInput).addEventListener('keypress', (e) => {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {
                    search();
                }
            });

            document.querySelector(options.searchInput).addEventListener('click', function (e) {
                rgbSlider.show();
            });

            // Clean input field
            document.querySelector('.delete.overinput').addEventListener('click',function(){
                document.querySelector(options.searchInput).value = '';
                document.querySelector(options.searchInput).focus();
            });

        };

        var cardEvents = function () {
            let jsMatched = document.querySelectorAll('.js-matched');
            for (var i = 0; i < jsMatched.length; i++) {
                jsMatched[i].addEventListener('click', function () {
                    
                    searchByHex(this.innerHTML);
                    rgbSlider.set(this.innerHTML);
                });
            }

            // Tooltips
            let colBox = document.querySelectorAll('.js-col-hover');
            for (let i = 0; i < colBox.length; i++) {

                tippy(colBox[i], { 
                    dynamicTitle: true,
                    arrow: true,
                    interactive: true,
                    arrowType: 'sharp'
                });
                colBox[i].title = tinycolor(colBox[i].style.backgroundColor).toHexString();

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
                UIcontroller.showError({message:hex +' is not a valid hex color'});
                document.querySelector(options.searchInput).value = '';                        
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
                UIcontroller.showError({message:'Sorry, no results were found.'});
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

    })(rgbSlider);

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
            showError: function(context) {
                var tpl = document.getElementById(elm.noResults).innerHTML;
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
