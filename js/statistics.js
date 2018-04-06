const BASE_URL = "https://opendata.cbs.nl/ODataApi/odata/80518ENG/";
const URLS = {  // list of all url endings from the api, that are going to be loaded
    TYPED_DATA_SET: "TypedDataSet",
    TABLE_INFOS: "TableInfos",
    DATA_PROPERTIES: "DataProperties",
    COUNTRIES: "Countries",
    PERSONAL_CHARACTERISTICS: "PersonalCharacteristics",
    PERIODS: "Periods",
    CATEGORY_GROUPS: "CategoryGroups"
};

let totalJSONs = Object.keys(URLS).length;
let loadedJSONs = 0;

let rawData = {};   // container object for api data
let statistics;     // container for displayed stats
let defaultFilters = {  // default selected filters upon page load
    "PersonalCharacteristics": "*",
    "Countries": ["Germany", "The Netherlands", "Greece", "France", "United Kingdom"],
    "Topics": "*",
    "Periods": [2014, 2012]
};

let activeFilters = defaultFilters;

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
        initDisplay();
    });
});


/***************************************************
 *
 * Display and Handle Stuff
 *
 ***************************************************/
/* Display initialization function
 * Kicks of all functions related to displaying of statistics and other
 * related stuff
 * */
function initDisplay() {
    initFilters();
    updateDisplay();
}

function updateDisplay() {
    // 1. Filter Categories - multiple divs with checkboxes and select all button
    updateFilters();
    // 2. Statistics from selected filters - show bar charts base on statistics
    updateStatistics();
    // 3. Generate tabs for interesting facts for selected categories
    updateFactTabs();
    // 4. Generate sentences highlighting given facts for categories
    updateFacts();
}

function initFilters() {
    let $filters = $("#filters");
    $filters.html(
        "<form onchange='updateFilters()'>" +
            "<div id='character'>" +
                "<h3>Personal Characteristics</h3>" +
            "</div>" +
            "<div id='topic'>" +
                "<h3>Topics</h3>" +
            "</div>" +
            "<div id='country'>" +
                "<h3>Countries</h3>" +
            "</div>" +
            "<div id='period'>" +
                "<h3>Periods</h3>" +
            "</div>" +
        "</form>" +
        "<p>Group by " +
            "<select name='group' onchange='updateFilters()'>" +
                "<option value='character'>Personal Characteristic</option>" +
                "<option value='topic' selected>Topic</option>" +
                "<option value='country'>Country</option>" +
                "<option value='period'>Periods</option>" +
            "</select>" +
        "</p>"
    );

    // Personal Characteristics
    let characterContainer = $("#character", $filters);
    $.each(rawData[URLS.PERSONAL_CHARACTERISTICS], function (index, object) {
        // Category groups apply
        characterContainer.append(
            "<label>" +
                "<input type='checkbox' name='character' value='" + object["Key"] + "'>" +
                object["Title"] +
            "</label>"
        );

    });

    // Topics
    let topicContainer = $("#topic", $filters);
    $.each(rawData[URLS.DATA_PROPERTIES], function(index, object) {
        if (object["Type"] === "Topic") {
            topicContainer.append(
                "<label>" +
                    "<input type='checkbox' name='topic' value='" + object["Key"] + "'>" +
                    object["Title"] +
                "</label>"
            );
        }
    });

    // Countries
    let countryContainer = $("#country", $filters);
    $.each(rawData[URLS.COUNTRIES], function(index, object) {
        // Category groups apply
        countryContainer.append(
            "<label>" +
                "<input type='checkbox' name='country' value='" + object["Key"] + "'>" +
                object["Title"] +
            "</label>"
        );

    });

    // Periods
    let periodContainer = $("#period", $filters);
    $.each(rawData[URLS.PERIODS], function(index, object) {
        //console.log(object["Key"], object["Title"]);
        periodContainer.append(
            "<label>" +
                "<input type='checkbox' name='period' value='" + object["Key"] + "'>" +
                object["Title"] +
            "</label>"
        );
    });

    $.each($("input", $filters), function(index, item) {
        switch (item.name) {
            case "character":
                if (activeFilters.PersonalCharacteristics === "*") {
                    if (getCharacteristicForKey(item.value) === "Total") {
                        item.checked = true;
                    }
                    break;
                }
                $.each(activeFilters.PersonalCharacteristics, function (index, characteristic) {
                    if (getCharacteristicForKey(item.value) === characteristic)
                        item.checked = true;
                });
                break;

            case "topic":
                if (activeFilters.Topics === "*") {
                    item.checked = true;
                    break;
                }
                $.each(activeFilters.Topics, function (index, topic) {
                    if (getTopicForKey(item.value) === topic)
                        item.checked = true;
                });
                break;
            case "country":
                if (activeFilters.Countries === "*") {
                    item.checked = true;
                    break;
                }
                $.each(activeFilters.Countries, function (index, country) {
                    if (getCountryForKey(item.value) === country)
                        item.checked = true;
                });
                break;
            case "period":
                if (activeFilters.Periods === "*") {
                    item.checked = true;
                    break;
                }
                $.each(activeFilters.Periods, function (index, period) {
                    if (getPeriodForKey(item.value) === period)
                        item.checked = true;
                });
                break;
        }
    });
}

function updateFilters() {
    let $filters = $("#filters");
    let groupTopic = $("select", $filters).find(":selected")[0].value;

    console.log("Filters changed");

    $.each($("input", $filters), function(index, item) {
        if (item.name === groupTopic) {
            item.type = "radio";
        } else {
            item.type = "checkbox";
        }
    });

    $.each($("input", $filters), function(index, item) {
        if (item.checked) {
            $(item).parent("label").addClass("active");

        } else {
            $(item).parent("label").removeClass("active");
        }
    });
}

function updateStatistics() {

}

function updateFactTabs() {

}

function updateFacts() {

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
    }, 500);
}

/* Show/hide "back to top" link in navigation
 * Working around an initial visibility issue that occurred when not changing the
 * visibility of the element in css
 * Also highlight active element in nav
 * */
$(window).on( "scroll", function() {
    let $topNav = $("#topNav");
    let $scroll = $('html, body').scrollTop();
    let $activeNav = $("nav .active");
    let navOffset = $("nav").height();
    let $brandNav = $("#brandNav");

    if ($scroll > $("header").height()) {
        $topNav.css("visibility", "visible");
        $topNav.show("fast");
    } else {
        $topNav.hide("fast");
    }

    // Change active highlight
    if($scroll >= $("#action").position().top - navOffset) {
        let $actNav = $("#actNav");
        if ($activeNav !== $actNav) {
            $activeNav.removeClass("active");
            $actNav.addClass("active");
        }
    } else if($scroll >= $("#comparison").position().top - navOffset) {
        let $compNav = $("#compNav");
        if ($activeNav !== $compNav) {
            $activeNav.removeClass("active");
            $compNav.addClass("active");
        }
    } else if($scroll >= $("#statistics").position().top - navOffset) {
        let $statNav = $("#statNav");
        if ($activeNav !== $statNav) {
            $activeNav.removeClass("active");
            $statNav.addClass("active");
        }
    } else if ($activeNav !== $brandNav) {
        $activeNav.removeClass("active");
        $brandNav.addClass("active");
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

        // Iterate over all properties of all
        $.each(rawData[URLS.TYPED_DATA_SET], function(index, object) {
            $.each(object, function(key, value) {

            });
        });
        return;

        /* Possible multiple select filters
        Filter by
        1. Personal Characteristics
        -> Whose trust should be displayed/What kind of people are they
            A. Gender - 2
            B. Age group - 7
            C. Martial status - 4
            D. Level of education - 3

        2. Topics
            A. Score Level of Trust (Scale of low 0 to high 10)
            and/or
            B. Percentage of People that Trust (People with score of 6 or higher)
            -> What kind of trust should be displayed (x axis)
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
        -> From what countries should the people be
            A. Europe - 29
            B. Asia - 2

        4. Periods
        -> What time periods should be shown
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
    generateStatsFromData(defaultFilters);
}

function getCategoryGroupByID(id) {
    return rawData[URLS.CATEGORY_GROUPS][id];
}

function getCountryForKey(key) {
    let country = "Unknown country";
    $.each(rawData[URLS.COUNTRIES], function(index, obj) {
        if (obj["Key"] === key) {
            country = obj["Title"];
        }
    });
    return country;
}

function getCharacteristicForKey(key) {
    let characteristic = "Unknown characteristic";
    $.each(rawData[URLS.PERSONAL_CHARACTERISTICS], function(index, obj) {
        if (obj["Key"] === key) {
            characteristic = obj["Title"];
        }
    });
    return characteristic;
}

function getTopicForKey(key) {
    let topic = "Unknown topic";
    $.each(rawData[URLS.CATEGORY_GROUPS], function(index, obj) {
        if (obj["Key"] === key) {
            topic = obj["Title"];
        }
    });
    return topic;
}

function getPeriodForKey(key) {
    let period = "Unknown period";
    $.each(rawData[URLS.PERIODS], function(index, obj) {
        if (obj["Key"] === key) {
            period = obj["Title"];
        }
    });
    return parseInt(period);
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