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