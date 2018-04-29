//var namedColors = require('color-name-list'); //600k 50%
var convert = require('color-convert'); //25k
var Fuse = require("fuse.js"); //20k
var nearestColor = require('nearest-color'); //10k
var tinycolor = require("tinycolor2"); //30k
var Handlebars = require('handlebars'); //300k
var noUiSlider = require('nouislider'); //60k
var wNumb = require('wnumb'); //10k
//var tippy = require('tippy.js') //200k

// All color names in json var
var hexArr = {}
var colorNamesJson = [];

(function () {

    // if ('serviceWorker' in navigator) {
    //     window.addEventListener('load', function () {
    //         navigator.serviceWorker.register('./sw.js', {scope: '/'})
    //         .then(function (registration) {
    //             // Registration was successful
    //             console.log('ServiceWorker registration successful with scope: ', registration.scope);
    //         }, function (err) {
    //             // registration failed :(
    //             console.log('ServiceWorker registration failed: ', err);
    //         });
    //     });
    // }

    var colornamesFile = './assets/vendor/color-name-list/colornames.json';

    // Elementi importanti dell'interfaccia
    var GUI = (function () {
        return {
            title: '.main-title',
            searchInput: '.js-searchInput',
            reset: '.delete.overinput',
            container_id: 'results',
        };
    })();

    var rgbSlider = (function () {

        var RGB = [0,0,0],
            active_class = 'noUi-active',
            sliders = document.getElementById('rgbSliders').querySelectorAll('.range-slider'),
            searchInput = document.querySelector(GUI.searchInput);

        var initSlider = function() {
            // Inizializzo gli slider
            sliders.forEach(slider => {
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
            });
        };

        var events = function () {

            sliders.forEach((slider, index) => {

                // Mentre muovo lo slider
                slider.noUiSlider.on('update', function(val) {

                    // Aggiorno l'array dei colori con il colore corrente
                    RGB[index] = val[0];

                    if(val[0] > 0) {
                        slider.classList.add(active_class);
                        setInputField();
                    }

                    bgSlider(slider.id);
                });
                
                // Quando ho finito di muovere
                slider.noUiSlider.on('set', function(val) {
                    let hex = getHex();
                    slider.classList.remove(active_class);
                    hashNav.add(hex);
                    search();
                });

            });
        };

        var bgSlider = function(id) {
            // Imposta il gradiente di sfondo a ogni slider
            sliders.forEach((slider, index) => {
                let bgStyle,
                    // intervalli
                    Ri = [RGB[0],RGB[0]],
                    Gi = [RGB[1],RGB[1]],
                    Bi = [RGB[2],RGB[2]];

                switch (slider.id) {
                    case 'R':
                        Ri = [0,255];
                        break;

                    case 'G':
                        Gi = [0,255];
                        break;

                    case 'B':
                        Bi = [0,255];
                        break;
                }

                bgStyle = `linear-gradient(to right, rgb(${Ri[0]}, ${Gi[0]}, ${Bi[0]}), rgb(${Ri[1]}, ${Gi[1]}, ${Bi[1]}))`;

                if(slider.children[0] !== undefined) {
                    slider.children[0].style.backgroundImage = bgStyle;
                }

            });
        };

         var setSliders = function(R, G, B) {

            RGB = [R, G, B];

            // Imposta ogni slider sul valore impostato
            sliders.forEach((slider, index) => {
                slider.noUiSlider.set(RGB[index]);
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

        var reset = function() {
            let inputS = document.querySelector(GUI.searchInput);

            // Riporta il colore allo status iniziale
            RGB = [0,0,0];
            
            // Riporta gli sliders su 0
            sliders.forEach((slider, index) => {
                slider.noUiSlider.off();
                slider.noUiSlider.reset();
            });

            // Svuota il campo di ricerca
            inputS.value = '';
            inputS.style.backgroundColor = '';
            inputS.style.color = '';
            inputS.focus();

            // Elimina le card
            document.getElementById(GUI.container_id).innerHTML = '';
            document.querySelector(GUI.title).style.color = '';

            // ricrea gli eventi
            events();
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
                initSlider();
                events();
            },
            set: function (hex) {
                let rgb = tinycolor(hex).toRgb();
                setSliders(rgb.r,rgb.g,rgb.b);
            },
            reset: function () {
                reset();
            },
        }

    })();

    var hashNav = (function () {
        var page = window.location.hash;
        var hashHistory = [];
        var historyLength;
        var colorHistory = [];

        var detectBackOrForward = function (onBack, onForward) {
            hashHistory = [window.location.hash];
            historyLength = window.history.length;

            return function () {
                var hash = window.location.hash, length = window.history.length;
                if (hashHistory.length && historyLength == length) {
                    if (hashHistory[hashHistory.length - 2] == hash) {
                        hashHistory = hashHistory.slice(0, -1);
                        onBack();
                    } else {
                        hashHistory.push(hash);
                        onForward();
                    }
                } else {
                    hashHistory.push(hash);
                    historyLength = length;
                }
            }
        };

        var events = function() {
            window.addEventListener("hashchange", detectBackOrForward(
                function () {
                    let hash = hashHistory[hashHistory.length-1];
                    if(hash != ""){
                        jump(hash);
                    }
                },
                function () {
                    let hash = hashHistory[hashHistory.length-1];
                    if(hash != ""){
                        jump(hash);
                    }
                },
                
            ));
            window.addEventListener("hashchange", function(){
                
                colorHistory.push(window.location.hash);
                colorHistory = colorHistory.filter( onlyUnique );
  
            });
        };

        var jump = function(page) {
            rgbSlider.set(page);
        };

        var onlyUnique = function(value, index, self) { 
            return self.indexOf(value) === index;
        };

        var isHexColor = function(hex) {
            return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
        };

        return {
            init: function() {
                if(page !== ""){
                    jump(page);
                }
                events();
            },
            add: function(hash) {
                document.location.hash = hash;
            },
            set: function() {
                colorHistory.push(window.location.hash);
                colorHistory = colorHistory.filter( onlyUnique );
            },
            get: function() {
                return colorHistory;
            }
        }
    })();
/*
    var collection = (function(Color){

        var colors = [];

        var events = function() {

            document.querySelector(GUI.title).addEventListener('click', function () {

                let colArr = [];
                for (var i = 0; i < colors.length; i++) {
                    colArr[i] = searchEngine.get(colors[i]);
                }
                
                if (colArr.length > 0) {
                    UIcontroller.showCards(colArr);
                } else {
                    UIcontroller.showError({ message: 'Sorry, no results were found.' });
                }

            });

            let collect = document.querySelectorAll('.collect');

            collect.forEach(btn => {
                btn.addEventListener('click', function () {
                    colors.push(this.attributes[1].value);
                    colors = colors.filter( onlyUnique );

                    this.classList.add('ion-ios-checkmark');             
                    this.classList.remove('ion-ios-circle-outline');
                });
            });

            colors.forEach(color => {
                let cltd = document.querySelector(`[data-hex="${color}"]`);
                cltd.classList.add('ion-ios-checkmark');             
                cltd.classList.remove('ion-ios-circle-outline');             
            });


        };

        var onlyUnique = function(value, index, self) { 
            return self.indexOf(value) === index;
        };
        return {
            init: function() {
                events();
            }
        }
    })(searchEngine);
*/
    // Color names
    var colorNames = (function () {

        var loadJSON = function (callback) {
            console.log('Load items from file');
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', colornamesFile, true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    //Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                    callback(xobj.responseText);
                }
            };
            xobj.send(null);
        }

        return {
            init: function () {

                // namedColors.colorNameList.forEach(color => {
                //     hexArr[color.name] = color.hex
                // });
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
            document.querySelector(GUI.reset).addEventListener('click',function(){
                rgbSlider.reset();
            });
            
        };

        var cardEvents = function () {

            // Modal
            let cont = document.getElementById('results');
            //let colBox = document.querySelectorAll('.js-col-hover');
            let colBox = cont.getElementsByClassName('js-col-hover');
            Object.keys(colBox).forEach(function(index) {
                let box = colBox[index];
                box.addEventListener('click', handleCardEvents);
                box.elm = box;
            });

        };

        var handleCardEvents = function(box){
            
            let rgbCol = box.target.elm.style.backgroundColor,
                hexCol = '#' + tinycolor(rgbCol).toHex(),
                nearest = nearestColor.from(hexArr),
                match = nearest(hexCol);

            let newColor = new Color(match.name, hexCol, match.value);
            if(match.distance === 0){
                newColor.title = match.name;
            } else {
                newColor.different = true;
            }
            
            UIcontroller.showModal(newColor);
        };

        var clickHex = function() {
            let jsMatched = document.querySelectorAll('.js-matched');
            for (var i = 0; i < jsMatched.length; i++) {
                jsMatched[i].addEventListener('click', handleClickHex );
            }
        };
        
        var destroyClickHex = function() {
            let jsMatched = document.querySelectorAll('.js-matched');
            for (var i = 0; i < jsMatched.length; i++) {
                jsMatched[i].removeEventListener('click', handleClickHex);
            }
        };

        var handleClickHex = function(){
            rgbSlider.set(this.innerHTML);
            modal.closeAll();
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
            clickHex: function () {
                clickHex();
            },
            hex: function (hex) {
                searchByHex(hex);
            },
            get: function (hex) {
                let nearest = nearestColor.from(hexArr);
                let match = nearest(hex);
                return match;
            },
        }

    })(rgbSlider);

    var modal = (function () {

        var elements = {
            target: 'data-target',
            active: 'is-active',
            button: '.modal-button',
            close: '.modal-close',
            buttonClose: '.modal-button-close',
            background: '.modal-background'
        };

        var onClickEach = function (selector, callback) {
            var arr = document.querySelectorAll(selector);
            arr.forEach(function (el) {
                el.addEventListener('click', callback);
            })
        };

        var events = function () {
            onClickEach(elements.button, openModal);

            onClickEach(elements.close, closeModal);
            onClickEach(elements.buttonClose, closeAll);
            onClickEach(elements.background, closeModal);

            // Close all modals if ESC key is pressed
            document.addEventListener('keyup', function(key){
                if(key.keyCode == 27) {
                    closeAll();
                }
            });
        };

        var closeAll = function() {
            var openModal = document.querySelectorAll('.' + elements.active);
            openModal.forEach(function (modal) {
                modal.classList.remove(elements.active);
            })
            unFreeze();            
        };

        var openModal = function (e) {
            var modal = this.getAttribute(elements.target);
            freeze();
            document.getElementById(modal).classList.add(elements.active);
        };

        var closeModal = function () {
            var modal = this.parentElement.id;
            document.getElementById(modal).classList.remove(elements.active);
            unFreeze();
        };

        // Freeze scrollbars
        var freeze = function () {
            document.getElementsByTagName('html')[0].style.overflow = "hidden"
            document.getElementsByTagName('body')[0].style.overflowY = "scroll";
        };
        
        var unFreeze = function () {
            document.getElementsByTagName('html')[0].style.overflow = ""
            document.getElementsByTagName('body')[0].style.overflowY = "";
        };

        return {
            init: function () {
                events();
            },
            closeAll: function () {
                closeAll();
            },
        }
    })();

    document.addEventListener("DOMContentLoaded", function(event) {
        searchEngine.init();
        rgbSlider.init();
        hashNav.init();
        modal.init();
    });

    // var hashHistory;
    // var historyLength;

    // var detectBackOrForward = function (onBack, onForward) {
    //     hashHistory = [window.location.hash];
    //     historyLength = window.history.length;

    //     return function () {
    //         var hash = window.location.hash, length = window.history.length;
    //         if (hashHistory.length && historyLength == length) {
    //             if (hashHistory[hashHistory.length - 2] == hash) {
    //                 hashHistory = hashHistory.slice(0, -1);
    //                 onBack();
    //             } else {
    //                 hashHistory.push(hash);
    //                 onForward();
    //             }
    //         } else {
    //             hashHistory.push(hash);
    //             historyLength = length;
    //         }
    //     }
    // };

    // window.addEventListener("hashchange", detectBackOrForward(
    //     function () {
    //         let hex = hashHistory[hashHistory.length-1];
    //         rgbSlider.set(hex);
    //     },
    //     function () {
    //         let hex = hashHistory[hashHistory.length-1];
    //         rgbSlider.set(hex);
    //     }
    // ));

    var UIcontroller = (function() {

        var elm = {
            container: 'results',
            modalContainer: 'modalContainer',
            card: 'hb-card',
            modalCard: 'hb-modal-card',
            cardEach: 'hb-each-card',
            noResults: 'hb-no-results',
        };

        return {
            showResult: function(context) {
                var tpl = document.getElementById(elm.card).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.container).innerHTML = templateScript(context);
                modal.init();
                searchEngine.cardEvents();
                searchEngine.clickHex();
            },
            showModal: function(context, e) {
                var tpl = document.getElementById(elm.modalCard).innerHTML;
                var templateScript = Handlebars.compile(tpl);

                document.getElementById(elm.modalContainer).innerHTML = templateScript(context);
                searchEngine.clickHex();
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
                modal.init();
                searchEngine.cardEvents();
            }
        };
    })();

})();
