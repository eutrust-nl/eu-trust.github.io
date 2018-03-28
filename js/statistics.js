const BASE_URL = "https://opendata.cbs.nl/ODataApi/odata/80518ENG/";
const TYPED_DATA_SET = "TypedDataSet";
const TABLE_INFOS = "TableInfos";
const DATA_PROPERTIES = "DataProperties";
const COUNTRIES = "Countries";
const PERSONAL_CHARACTERISTICS = "PersonalCharacteristics";

let statistics;



$(function() {
    getJSONs();
});

function getJSONs(callback) {
    let done = 4;
    console.log(done);
}

// Scroll control
$().scroll(function() {
    if ($().scrollTop() > 100) {
        $("#topNav").fadeIn();
    } else {
        $("#topNav").fadeOut();
    }
});

// Page Navigation - js from https://www.w3schools.com/howto/howto_js_scroll_to_top.asp
function scrollToTop(id) {
    let position = (id === undefined) ? 0 : $(id).position();
    console.log(position, id);

    $('html, body').animate({
        scrollTo: position
    }, 200);
}