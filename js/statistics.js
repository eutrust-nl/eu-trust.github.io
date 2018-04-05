const BASE_URL = "https://opendata.cbs.nl/ODataApi/odata/80518ENG/";
const URLS = {  // list of all url endings from the api, that are going to be loaded
    TYPED_DATA_SET: "TypedDataSet",
    TABLE_INFOS: "TableInfos",
    DATA_PROPERTIES: "DataProperties",
    COUNTRIES: "Countries",
    PERSONAL_CHARACTERISTICS: "PersonalCharacteristics"
};

let totalJSONs = Object.keys(URLS).length;
let loadedJSONs = 0;

let rawData = {};   // container object for api data
let statistics;     // container for displayed stats
let defaultFilters = {  // default selected filters upon page load
    "Countries": ["Germany", "Netherlands", "Greece", "France", "United Kingdom"],

};
let defaultGroup = "Counties";  // default grouping upon page load


/***************************************************
 *
 * Main Function Stuff
 * - Executed on document load
 *
 ***************************************************/
$(function() {
    getJSONs(function() {
        // 1. convert fetched data into usable stats
        generateStatsFromData();
        // 2. update display with stats
        updateDisplay();
    });
});


/***************************************************
 *
 * Display and Handle Stuff
 *
 ***************************************************/
/* Display updating function
 * Kicks of all functions related to displaying of statistics and other
 * related stuff
 * */
function updateDisplay() {
    // 1. Filter Categories - multiple divs with checkboxes and select all button

    // 2. Statistics from selected filters - show bar charts base on statistics

    // 3. Generate tabs for interesting facts for selected categories

    // 4. Generate sentences highlighting given facts for categories

    //[5. Add an "Take the eu trust test" section]
}


/* Scroll control
 * Page Navigation - https://www.w3schools.com/howto/howto_js_scroll_to_top.asp
 * Scrolls the viewport to element with given id or if none is given, goes back
 * to the top; smoothed with animation
 * */
function scrollToTop(id) {
    let position = (id === undefined) ? 0
        : $(id).position().top - $("nav").height();

    $('html, body').animate({
        scrollTop: position
    }, 200);
}

/* Show/hide "back to top" link in navigation
 * Working around an initial visibility issue that occurred when not changing the
 * visibility of the element in css
 * */
$(window).on( "scroll", function() {
    let $topNav = $("#topNav");
    if ($('html, body').scrollTop() > $("header").height()) {
        $topNav.css("visibility", "visible");
        $topNav.show("fast");
    } else {
        $topNav.hide("fast");
    }
});


/***************************************************
 *
 * Data and Statistics Stuff
 *
 ***************************************************/
function generateStatsFromData(filters) {
    if (filters !== undefined) {
        // create stats with filters
        console.log("Applying filters", filters);
        return;

        /* Possible multiple select filters
        Filter by
        1. Personal Characteristics
            A. Gender - 2
            B. Age group - 7
            C. Martial status - 4
            D. Level of education - 3

        2. Topic
            A. Score Level of Trust (Scale of low 0 to high 10)
            and/or
            B. Percentage of People that Trust (People with score of 6 or higher)
                in
                a. Other people
                b. Legal system
                c. Police
                d. Politicians
                e. Parliament
                f. Political parties
                g. European parliament
                h. United Nations

        3. Countries by continent
            A. Europe - 29
            B. Asia - 2

        4. Periods
            A. 2002
            B. 2004
            C. 2006
            D. 2008
            E. 2010
            F. 2012
            G. 2014
         */
    }

    // Create filtered stats if no filter is given




}


/***************************************************
 *
 * API Stuff
 * ----------
 * @function getJSONs()
 * - resets counter variables to discern if loading has been finished
 *  and starts all needed api calls (ajax calls with jquery method)
 *
 * ----------
 * @async_function
 * - after finishing the requests, they kick off a given callback function
 *
 ***************************************************/
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
                    callback();
                }
            })
            .fail(function () {
                console.error("An error occurred while trying to get", url);
            });
    });
}