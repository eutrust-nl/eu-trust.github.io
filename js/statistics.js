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
    "PersonalCharacteristics":  ["Total"],
    "Topics":                   ["Other people"],
    "Countries":                ["Germany", "The Netherlands", "Greece", "France", "United Kingdom"],
    "Periods":                  ["2002","2006","2010","2014"]
};

let activeFilters = {
    "PersonalCharacteristics": [],
    "Topics": [],
    "Countries": [],
    "Periods": []
};

/***************************************************
 *
 * Main Function Stuff
 * - Executed on document load
 *
 ***************************************************/
$(function() {
    getJSONs(function() {
        // 1. initialize filters
        initFilters();
        // 2. update display with stats
        updateDisplay();
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
function updateDisplay() {
    // 1. Filter Categories - multiple divs with checkboxes and select all button
    updateFilters();
    // 2. Statistics from selected filters - show bar charts and graphs based on statistics/filters
    updateStatistics();
    // 3. Generate tabs for interesting facts for selected categories
    updateFactTabs();
    // 4. Generate sentences highlighting given facts for categories
    updateFacts();
}

function initFilters() {
    let $filters = $("#filters");
    $filters.html(
        "<form onchange='updateDisplay()'>" +
            "<div id='PersonalCharacteristics'>" +
                "<h3>Personal Characteristics</h3>" +
            "</div>" +
            "<div id='Topics'>" +
                "<h3>Topics</h3>" +
                "<div id='Score'>" +
                    "<h4 title='Trust in other people and in a number of political and organisational institutions in terms of a mark from 0 to 10, where 0 equals no trust at all and 10 equals complete trust.'>Evaluation of trust in</h4>" +
                "</div>" +
                "<div id='Percentile'>" +
                    "<h4 title='The percentage of people assigning a score of 6 or higher in answer to the questions about trust in other people and a number of political and organisational institutions, where 0 means no trust at all and 10 means complete trust.'>Percentage of people with trust in</h4>" +
                "</div>" +
            "</div>" +
            "<div id='Countries'>" +
                "<h3>Countries</h3>" +
            "</div>" +
            "<div id='Periods'>" +
                "<h3>Periods</h3>" +
            "</div>" +
            /* Removed for complexity sake, for now
            "<p>Group by " +
                "<select name='group'>" +
                    "<option value='PersonalCharacteristics'>Personal Characteristic</option>" +
                    "<option value='Topics'>Topic</option>" +
                    "<option value='Countries'>Country</option>" +
                    "<option value='Periods' selected>Periods</option>" +
                "</select>" +
            "</p>" +*/
        "</form>"
    );

    // Convert default filters to corresponding keys
    $.each(defaultFilters, function(key, array) {
        $.each(array, function (index, value) {
            switch (key) {
                case "PersonalCharacteristics":
                    defaultFilters[key][index] = getKeyForCharacteristic(value);
                    break;
                case "Countries":
                    defaultFilters[key][index] = getKeyForCountry(value);
                    break;
                case "Periods":
                    defaultFilters[key][index] = getKeyForPeriod(value);
                    break;
                case "Topics":
                    let unit = "score";
                    if (value.slice(-1) === "%") {
                        unit = "%";
                        value = value.slice(0, -1);
                    }
                    defaultFilters[key][index] = getKeyForTopic(value, unit);
                    break;
            }
        });
    });

    // Personal Characteristics
    let characterContainer = $("#PersonalCharacteristics", $filters);
    $.each(rawData[URLS.PERSONAL_CHARACTERISTICS], function (index, object) {
        // Category groups apply
        let categoryGroup = getCategoryGroupByID(object["CategoryGroupID"])["Title"];
        let categoryContainer = $("#" + categoryGroup.replace(/\s/g,''), characterContainer);

        if (categoryContainer.length === 0) {
            categoryContainer = $("<div id='" + categoryGroup.replace(/\s/g,'') + "'>" +
                "<h4>" + categoryGroup + "</h4>" +
                "</div>");
            $(characterContainer).append(categoryContainer);
        }

        categoryContainer.append(
            "<label title='" + object["Description"] +"'>" +
                "<input type='radio' name='PersonalCharacteristics' value='" + object["Key"] + "'>" +
                object["Title"] +
            "</label>"
        );
    });

    // Topics
    let scoreContainer = $("#Score", $filters);
    let percentileContainer = $("#Percentile", $filters);
    $.each(rawData[URLS.DATA_PROPERTIES], function(index, object) {
        if (object["Type"] === "Topic") {
            ((object["Unit"] === "score") ? scoreContainer : percentileContainer).append(
                "<label title='" + object["Description"] +"'>" +
                    "<input type='radio' name='Topics' value='" + object["Key"] + "'>" +
                    object["Title"] +
                "</label>"
            );
        }
    });

    // Countries
    let countryContainer = $("#Countries", $filters);
    $.each(rawData[URLS.COUNTRIES], function(index, object) {

        // Category groups apply
        let categoryGroup = getCategoryGroupByID(object["CategoryGroupID"])["Title"];
        let categoryContainer = $("#" + categoryGroup.replace(/\s/g,''), countryContainer);
        if (categoryContainer.length === 0) {
            categoryContainer = $("<div id='" + categoryGroup.replace(/\s/g,'') + "'>" +
                "<h4>" + categoryGroup + "</h4>" +
                "</div>");
            $(countryContainer).append(categoryContainer);
        }

        categoryContainer.append(
            "<label title='" + object["Description"] +"'>" +
                "<input type='checkbox' name='Countries' value='" + object["Key"] + "'>" +
                object["Title"] +
            "</label>"
        );
    });

    // Periods
    let periodContainer = $("#Periods", $filters);
    $.each(rawData[URLS.PERIODS], function(index, object) {
        periodContainer.append(
            "<label title='" + object["Description"] +"'>" +
                "<input type='checkbox' name='Periods' value='" + object["Key"] + "'>" +
                object["Title"] +
            "</label>"
        );
    });

    $.each($("input", $filters), function(index, item) {
        if (defaultFilters[item.name][0] === "*") {
            item.checked = true;
        } else {
            switch (item.name) {
                case "PersonalCharacteristics":
                    item.checked = $.inArray(item.value, defaultFilters[item.name]) !== -1;
                    break;
                case "Countries":
                    item.checked = $.inArray(item.value, defaultFilters[item.name]) !== -1;
                    break;
                case "Periods":
                    item.checked = $.inArray(item.value, defaultFilters[item.name]) !== -1;
                    break;
                case "Topics":
                    item.checked = $.inArray(item.value, defaultFilters[item.name]) !== -1;
                    break;
            }
        }
    });
}

function updateFilters() {
    let $filters = $("#filters");
    /* Removed for complexity sake, for now
    let groupTopic = "PersonalCharacteristics"; //$("select", $filters).find(":selected")[0].value;

    $.each($("input", $filters), function(index, item) {
        if (item.name === groupTopic) {
            item.type = "radio";
        } else if (item.type === "radio"){
            item.type = "checkbox";
        }
    });*/

    $.each($("input", $filters), function(index, item) {
        index = $.inArray(item.value, activeFilters[item.name]);
        // If filter is not in active filter list, add it
        if (item.checked && index === -1) {
            activeFilters[item.name].push(item.value);
        }
        // Otherwise, if the filter is not active and in active filter list, remove it
        else if (!item.checked && index > -1) {
            activeFilters[item.name].splice(index, 1);
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
    let $graphs = $("#graphs");
    $graphs.html("");

    // convert fetched data into usable stats based on filters
    generateStatsFromData();


    // Bar chart - for score values
    $.each(statistics, function(cKey, periods) {
        // create country div with chart outline
        let graphContainer = $(
            "<div class='graph-container' id='"+ cKey + "-graph'>" +
                "<table class='bar-graph'>" +
                    "<caption>" + getCountryForKey(cKey) + "</caption>" +
                "</table>" +
            "</div>"
        ).appendTo($graphs);

        let ticks = $("<div class=\"ticks\"></div>").appendTo($graphs);
        for(let i = 10; i >= 0; i--) {
            ticks.append("<div class=\"tick\" style=\"height: " + (400/10) + "px;\"><p>"+ i +".0</p></div>\n");
        }

        let legend = $(
            "<thead>" +
                "<tr>" +
                    "<th></th>" +
                "</tr>" +
            "</thead>"
        ).appendTo($("table", graphContainer));

        let graph = $(
            "<tbody>" +
            "</tbody>"
        ).appendTo($("table", graphContainer));

        let periodGraph = undefined;

        $.each(periods, function(pKey, value) {
            // create graphics/scale

            // Add element to legend
            let periodLegend = $("<th class='legend " + pKey + "-graph'>" +
                getPeriodForKey(pKey)
                + "</th>").appendTo($("tr", legend));

            // Create graph container
            if (periodGraph === undefined)
                periodGraph = $("<tr class='period' id='" + cKey + "-" + pKey + "'>" +
                    "<th scope='row'>" + getTopicForKey(activeFilters.Topics[0]) + "</th>" +
                    "</tr>").appendTo(graph);

            let periodChart = $("<td class='" + pKey + "-graph bar' style='height: " + ((value / 10.0) * 500.0) + "px;'>" +
                "<p>" + ((value !== null) ? value : "N/A") + "</p>" +
                "</td>").appendTo(periodGraph);
        });
    });
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
function generateStatsFromData() {

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
    // create stats with filters
    console.log("Applying filters", activeFilters);
    statistics = {};
    $.each(activeFilters.Countries, function(cIndex, cKey) {
        statistics[cKey] = {};
    });

    console.log("Stats structure:", statistics);


    // Iterate over all properties of all
    $.each(rawData[URLS.TYPED_DATA_SET], function(i, obj) {
        let filtersApply = true;
        $.each(obj, function(key, value) {
            switch(key) {
                case "Countries":
                    if ($.inArray(value, activeFilters.Countries) === -1) {
                        filtersApply = false;
                        return;
                    }
                    break;
                case "Periods":
                    if ($.inArray(value, activeFilters.Periods) === -1) {
                        filtersApply = false;
                        return;
                    }
                    break;
                case "PersonalCharacteristics":
                    if ($.inArray(value, activeFilters.PersonalCharacteristics) === -1) {
                        filtersApply = false;
                        return;
                    }
                    break;
            }

        });
        if (filtersApply) {
            statistics[obj["Countries"]][obj["Periods"]] = obj[activeFilters.Topics[0]];
        }
    });

    console.log("Stats filtered:", statistics);

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
function getKeyForCountry(country) {
    let key = "Unknown country key";
    $.each(rawData[URLS.COUNTRIES], function(index, obj) {
        if (obj["Title"] === country) {
            key = obj["Key"];
        }
    });
    return key;
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
function getKeyForCharacteristic(characteristic) {
    let key = "Unknown characteristic key";
    $.each(rawData[URLS.PERSONAL_CHARACTERISTICS], function(index, obj) {
        if (obj["Title"] === characteristic) {
            key = obj["Key"];
        }
    });
    return key;
}

function getTopicForKey(key) {
    let topic = "Unknown topic";
    $.each(rawData[URLS.DATA_PROPERTIES], function(index, obj) {
        if (obj["Key"] === key ) {
            topic = obj["Title"];
        }
    });
    return topic;
}
function getKeyForTopic(topic, unit) {
    let key = "Unknown topic key";
    $.each(rawData[URLS.DATA_PROPERTIES], function(index, obj) {
        if (obj["Title"] === topic && obj["Unit"] === unit) {
            key = obj["Key"];
        }
    });
    return key;
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
function getKeyForPeriod(period) {
    let key = "Unknown period key";
    $.each(rawData[URLS.PERIODS], function(index, obj) {
        if (obj["Title"] === period) {
            key = obj["Key"];
        }
    });
    return key;
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