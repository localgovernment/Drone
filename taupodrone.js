require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/tasks/Locator",
  "dojo/domReady!"
  ], function(Map, MapView, FeatureLayer, Locate, Search, Locator){

  var map = new Map({
    basemap: "streets-navigation-vector"
  });

  var aerodromes = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Aerodromes/FeatureServer?token=2JM9b-YtFgfD9QdH5PBRRcXW0FCKLS7Lw6cu33MGApksIA2HfwahfE7gO5IlJCa0n-5lK58T4b3HzbvDAgCB5vSluTGaUy97r67cgbWSm0AWtTJraxtE1q7s6uO_Zw12lP1FpgnJCOEWRb59PjE3o6WAbLfUNMer43HnXEsI_hF4cYEKIMRCxp3WcLNHl5INaGK5MIOldKAlwirEsQjOhZvuguiHhPTnEva6ik5bVcjJVQ-PnKpHp4zPM6a-lZo_"
  });
   
  map.add(aerodromes);

  var aerodromes_4k = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Aerodromes_4km_Buffers/FeatureServer?token=iiA3D_etwckY3v2wxilFiWviil6wSAWBNg9Rf37K4qZYbY3Faao5NCyYw9iPxMHEX1_EMSHhIufznEalnaG-ki1HmVlOrLpENoegodOgMmaoMZy9-vx6yeW8VjYZPEQCOK0vlRA6JqDNtVmXigSOhlGuT2V7sEaHLxWJtW31uU9E6K-Dw2ECUj-Bwevxwuetwsitq_u35OY6gSdxbNGucDbM8yZrJpiOLb7ie9rmgHlNzz0fWSbmMZzUqKS3fKYe"
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
 
  var search = new Search({
    sources: [{
      locator: new Locator({ url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"}),
      countryCode:"NZ"
    }],
    view: view,
    includeDefaultSources: false,
    locationEnabled: false    
  });
  
  
//    // Search widget
//  var search = new Search({
//    view: view,
//    locationEnabled: false
//  });

  view.ui.add(searchWidget, "top-right"); // Add to the view
  
});
