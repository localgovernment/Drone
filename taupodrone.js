require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/tasks/Locator",
  "esri/tasks/support/Query",
  "esri/geometry/Point",
  "dojo/domReady!"
  ], function(Map, MapView, FeatureLayer, Locate, Search, Locator, Query, Point){

  var map = new Map({
    basemap: "streets-navigation-vector"
  });

  var aerodromes = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Aerodromes/FeatureServer"
  });

   
  map.add(aerodromes);

  var aerodromes_4k = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Aerodromes_4km_Buffers/FeatureServer"
  });

  map.add(aerodromes_4k);

  var view = new MapView({
    container: "viewDiv",  // Reference to the scene div
    map: map,  // Reference to the map object created before the scene
    zoom: 10,  // Sets zoom level based on level of detail (LOD)
    center: [175.9, -38.8]  // Sets centre point of view using longitude,latitude
  });   
  
  var locateBtn = new Locate({
    view: view
  });
  
  // Add the locate widget to the top left corner of the view
  view.ui.add(locateBtn, {
    position: "top-left"
  });
  
 // https://gis.stackexchange.com/questions/297918/limiting-the-search-widget-results-to-a-country-in-arcgis-js-api-4-9?rq=1
 // Set local to NZ
  var search = new Search({
    sources: [{
      locator: new Locator({ url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"}),
      countryCode:"NZ"
    }],
    view: view,
    includeDefaultSources: false,
    locationEnabled: false    
  });

  view.ui.add(search, "top-right"); // Add to the view
  
  // query buffer on click/tap
  view.on("click", function(event){
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-tasks-support-Query.html
    // https://developers.arcgis.com/javascript/latest/sample-code/featurelayer-query/index.html

    var query = aerodromes_4k.createQuery();
    query.geometry = view.toMap(event);  // the point location of the pointer
    console.log(query.geometry);
    query.spatialRelationship = "intersects";  // this is the default
    query.returnGeometry = false;
    query.outFields = [ "Aerodrome" ];
    
    aerodromes_4k.queryFeatures(query).then(function(result){
      var features = result.features;
      if (features.length) {
        for (var i = 0; i < features.length; i++) 
          console.log(features[i].attributes['Aerodrome']);
        }        
        else {
          console.log('Not within 4km of a Taupo Aerodrome');
        }
    })    
  })
    
});
