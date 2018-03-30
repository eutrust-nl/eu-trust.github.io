const BASE_URL = "https://opendata.cbs.nl/ODataApi/odata/80518ENG/";
const URLS = {
    TYPED_DATA_SET: "TypedDataSet",
    TABLE_INFOS: "TableInfos",
    DATA_PROPERTIES: "DataProperties",
    COUNTRIES: "Countries",
    PERSONAL_CHARACTERISTICS: "PersonalCharacteristics"
};

let totalJSONs = Object.keys(URLS).length;
let loadedJSONs = 0;

let rawData = {};
let statistics;



$(function() {
    getJSONs();



    // Setup handlers
    // Show/hide "back to top"
    $(window).on( "scroll", function() {
        let $topNav = $("#topNav");
        if ($('html, body').scrollTop() > $("header").height()) {
            $topNav.css("visibility", "visible");
            $topNav.show("fast");
        } else {
            $topNav.hide("fast");
        }
    });
});

function getJSONs(callback) {
    // Reset counter variable
    loadedJSONs = 0;
    $.each(URLS, function(key ,url) {
        console.log("Started retrieving", url);
        $.getJSON(BASE_URL + url,
            function (data) {
                console.log(url, "was retrieved");

                // Add the data to the raw data pool
                rawData[url] = data.value;

                loadedJSONs ++;
                console.log(loadedJSONs, totalJSONs, totalJSONs === loadedJSONs);
                if (loadedJSONs === totalJSONs) {
                    console.log(rawData);
                }
            })
            .fail(function () {
                console.error("An error occurred while trying to get", url);
            });
    });
}



// Scroll control
// Page Navigation - js from https://www.w3schools.com/howto/howto_js_scroll_to_top.asp
function scrollToTop(id) {
    let position = (id === undefined) ? 0 : $(id).position().top;

    $('html, body').animate({
        scrollTop: position
    }, 200);
}