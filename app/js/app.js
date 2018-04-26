var namedColors = require('color-name-list');
var convert = require('color-convert');
var Fuse = require("fuse.js");
var nearestColor = require('nearest-color');
var tinycolor = require("tinycolor2"); 
var Handlebars = require('handlebars');
var noUiSlider = require('nouislider');
var wNumb = require('wnumb');
const tippy = require('tippy.js')

// All color names in json var
var hexArr = {}
var colorNamesJson = [];

(function () {

    // Elementi importanti dell'interfaccia
    var GUI = (function () {
        return {
            title: '.main-title',
            searchInput: '.js-searchInput',
        };
    })();

    var rgbSlider = (function () {
        
        var RGB = [0,0,0],
            active_class = 'noUi-active',
            sliders = document.getElementById('rgbSliders').querySelectorAll('.range-slider'),
            searchInput = document.querySelector(GUI.searchInput);

        var events = function () {
            
            [].slice.call(sliders).forEach(function( slider, i ) {
                
                // Inizializzo lo slider
                noUiSlider.create(slider, {
                    start: [0],
                    step: 1,
                    tooltips: [ true ],
                    range: {
                        'min': 0,
                        'max': 255
                    },
                    format: wNumb({
                        decimals: 0,
                    })
                });
                
                // Mentre muovo lo slider
                slider.noUiSlider.on('update', function(val) {
                    
                    // Aggiorno l'array dei colori con il colore corrente
                    RGB[i] = val[0];

                    if(val[0] > 0) {
                        slider.classList.add(active_class);
                    }

                    setInputField();
                    bgSlider(slider.id);
                });

                // Quando ho finito di muovere
                slider.noUiSlider.on('set', function(val) {               
                    slider.classList.remove(active_class);
                    search();
                });

            });
        };

        var bgSlider = function(id) {

            [].slice.call(sliders).forEach(function( slider, index ){
                let bgStyle, 
                    R = RGB[0], 
                    G = RGB[1], 
                    B = RGB[2];

                switch (slider.id) {
                    case 'R':
                        bgStyle = `linear-gradient(to right, rgb(0, ${R}, ${G}), rgb(255, ${R}, ${G}))`;
                        break;

                    case 'G':
                        bgStyle = `linear-gradient(to right, rgb(${B}, 0, ${G}), rgb(${B}, 255, ${G}))`;
                        break;

                    case 'B':
                        bgStyle = `linear-gradient(to right, rgb(${B}, ${R}, 0), rgb(${B}, ${R}, 255))`;
                        break;
                }

                if(slider.children[0] !== undefined) {
                    slider.children[0].style.backgroundImage = bgStyle;
                }
                
            });
         }

         var setSliders = function(R, G, B) {

            RGB = [R, G, B];

            [].slice.call(sliders).forEach(function (slider, index) {
            
                switch (slider.id) {
                    case 'R':
                        slider.noUiSlider.set(R);
                        break;

                    case 'G':
                        slider.noUiSlider.set(G);
                        break;

                    case 'B':
                        slider.noUiSlider.set(B);
                        break;
                }

            });

            setInputField();
        };

        var setInputField = function() {
            let hex = getHex(),
                col = tinycolor(hex);

            searchInput.style.backgroundColor = hex;
            searchInput.value = hex;

            if(col.isDark()){
                searchInput.style.color = '#fff';
            } else {
                searchInput.style.color = '#000';
            }

            document.querySelector(GUI.title).style.color = hex;
        };
        
        var search = function() {
            let hex = getHex();
            searchEngine.hex(hex);
        };

        // outils
        var getHex = function () {

            let hex = [];

            RGB.forEach((e, i) => {
                let chex = parseInt(e, 10).toString(16);
                hex[i] = pad(chex);
            });

            return '#' + hex.join('');
        };

        var pad = function(n){
            return (n.length<2) ? "0"+n : n;
        };
            
        return {
            init: function () {
                events();
            },
            set: function (hex) {
                let rgb = tinycolor(hex).toRgb();
                setSliders(rgb.r,rgb.g,rgb.b);
            },
        }

    })();

    // Color names
    var colorNames = (function () {

        // var colornamesFile = './assets/vendor/color-name-list/colornames.json';

        // var loadJSON = function (callback) {
        //     console.log('Load items from file');  
        //     var xobj = new XMLHttpRequest();
        //     xobj.overrideMimeType("application/json");
        //     xobj.open('GET', colornamesFile, true);
        //     xobj.onreadystatechange = function () {
        //         if (xobj.readyState == 4 && xobj.status == "200") {
        //             // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
        //             callback(xobj.responseText);
        //         }
        //     };
        //     xobj.send(null);
        // }

        return {
            init: function () {

                namedColors.colorNameList.forEach(color => {
                    hexArr[color.name] = color.hex
                });
                // colorNamesJson = JSON.parse(localStorage.getItem('colorNames'));
                // hexArr = JSON.parse(localStorage.getItem('hexArr'));

                // if(colorNamesJson === null) {
                //     loadJSON(function (response) {
                //         let colorNamesResponse = JSON.parse(response);
                        
                //         colorNamesJson = JSON.parse(localStorage.getItem('colorNames'));               
                        
                //         let byHexIndex = {};
                //         for (var i = 0; i < colorNamesResponse.length; i++) {
                //             byHexIndex[colorNamesResponse[i].name] = colorNamesResponse[i].hex;
                //         }                      
                        
                //         localStorage.setItem('colorNames', response);
                //         localStorage.setItem('hexArr', JSON.stringify(byHexIndex));               

                //         colorNamesJson = JSON.parse(localStorage.getItem('colorNames'));
                //         hexArr = JSON.parse(localStorage.getItem('hexArr'));

                //     });
                // }
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

        var events = function () {
           
            document.querySelector(GUI.searchInput).addEventListener('keypress', (e,el) => {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {
                    search();
                    document.querySelector(GUI.searchInput).blur();
                }
            });

            // document.querySelector(GUI.searchInput).addEventListener('click', function (e) {
            //     rgbSlider.show();
            // });

            // Clean input field
            document.querySelector('.delete.overinput').addEventListener('click',function(){
                document.querySelector(GUI.searchInput).value = '';
                document.querySelector(GUI.searchInput).focus();
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
            var query = document.querySelector(GUI.searchInput).value;

            if (query[0] == '#') {
                let hex = query;
                searchByHex(hex);
                document.querySelector(GUI.searchInput).style.backgroundColor = hex;
                let col = tinycolor(hex);

                if(col.isDark()){
                    document.querySelector(GUI.searchInput).style.color = '#fff';
                } else {
                    document.querySelector(GUI.searchInput).style.color = '#000';
                }

                rgbSlider.set(hex);

            } else {
                searchByString(query);
                document.querySelector(GUI.searchInput).style.backgroundColor = '';
                document.querySelector(GUI.searchInput).style.color = '#000';

            }
            //rgbSlider.hide();
        };

        var searchByHex = function(hex) {

            var nearest = nearestColor.from(hexArr);
            var match = nearest(hex);

            if(!isHexColor(hex)){
                UIcontroller.showError({message:hex +' is not a valid hex color'});
                document.querySelector(GUI.searchInput).value = '';                        
            } else {
                let newColor = new Color(match.name, hex, match.value);
                if(match.distance === 0){
                    newColor.title = match.name;
                } else {
                    newColor.different = true;
                }
                
                UIcontroller.showResult(newColor);
                document.querySelector(GUI.searchInput).value = hex;         
            }
        }

        var searchByString = function(query) {
            let colorSearch = new Fuse(namedColors.colorNameList, {
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
