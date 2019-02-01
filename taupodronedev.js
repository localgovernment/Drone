// https://developers.arcgis.com/javascript/latest/sample-code/intro-popup/index.html
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/tasks/Locator",
  "esri/widgets/Locate",
  "esri/widgets/Search"
], function(Map, MapView, FeatureLayer, Locator, Locate, Search){
  // Defaults
  var defaultScale = 500;  // When zooming into a location

  // Create the Map
  var map = new Map({
    basemap: "streets-navigation-vector"
  });

  var aerodromes = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Aerodromes/FeatureServer"
  });
   
  map.add(aerodromes);

  var aerodromes4K = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Aerodromes_4km_Buffers/FeatureServer"
  });

  map.add(aerodromes4K);
  
  // Add council property - queried but not displayed on the map
  var councilProperty = new FeatureLayer({
    url: "https://services7.arcgis.com/S7DHOirgbYgdtrbR/arcgis/rest/services/Taupo_Council_Land/FeatureServer"
  });
   
  // Create the MapView
  var view = new MapView({
    container: "viewDiv",  // Reference to the scene div
    map: map,  // Reference to the map object created before the scene
    zoom: 10,  // Sets zoom level based on level of detail (LOD)
    center: [175.9, -38.8]  // Sets centre point of view using longitude,latitude
  });   
  view.when(function() {
    locateBtn.locate(); // force locate to 'fire' after view has loaded
  }, function(error) {});

  // Set up a locator task using the world geocoding service
  var locatorTask = new Locator({
    url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    countryCode:"NZ"
  });
  
  // Handy locate me button
  var locateBtn = new Locate({
    view: view,
    scale: defaultScale
  });
  locateBtn.on("locate", function(locateEvent){
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Locate.html#scale
    console.log(locateEvent.position.coords);
  })
    
  // Handy address search box
  // https://gis.stackexchange.com/questions/297918/limiting-the-search-widget-results-to-a-country-in-arcgis-js-api-4-9?rq=1
  // Set local to NZ
  var search = new Search({
    sources: [{locator: locatorTask, countryCode: "NZ"}],
    view: view,
    includeDefaultSources: false,
    locationEnabled: false,
    popupEnabled: false
  });
 
   /*******************************************************************
   * This click event sets generic content on the popup not tied to
   * a layer, graphic, or popupTemplate. The location of the point is
   * used as input to a reverse geocode method and the resulting
   * address is printed to the popup content.
   *******************************************************************/
  view.popup.autoOpenEnabled = false;
  view.on("click", function(event) {    
    dronePopup(event);
  });
  
  function dronePopup(event) {
  
    var mapPoint = event.mapPoint;
      
    // Get the coordinates of the click on the view
    var lat = Math.round(mapPoint.latitude * 100000) / 100000;
    var lon = Math.round(mapPoint.longitude * 100000) / 100000;
    
    // Set up the query for determining the aerodromes
    var aerodromeQuery = prepareIntersectsQuery(aerodromes4K, event, ["Aerodrome"]);
       
    // Set up the query for determining council property
    var councilPropertyQuery = prepareIntersectsQuery(councilProperty, event, ["Description"]);

    // Open the popup - add content later  
    view.popup.open({
      // Set the popup's title to the coordinates of the location
      title: "Lat Long: " + lat + ", " + lon,
      location: mapPoint, // Set the location of the popup to the clicked location
    });
    
    view.popup.collapsed = false;
    view.popup.content = '<p><b>Address: </b>';
    
    // Execute a reverse geocode using the clicked location
    locatorTask.locationToAddress(mapPoint).then(function(
      response) {
      // If an address is successfully found, show it in the popup's content
      view.popup.content += response.address + '</p>';
    }).catch(function(error) {
      // If the promise fails and no result is found, show a generic message for address
      view.popup.content += 'No address was found at this location</p>';
    }).then(function() {
      // add all aerodromes within 4km of map point
      view.popup.content += '<p><b>Aerodromes:</b>';
      return aerodromes4K.queryFeatures(aerodromeQuery).then(function(result){    
        var aerodromeFeatures = result.features;
        if (aerodromeFeatures.length) {       
          view.popup.content += '<ul>';
          for (var i = 0; i < aerodromeFeatures.length; i++) 
            view.popup.content += '<li>' + aerodromeFeatures[i].attributes['Aerodrome'] + '</li>';
          view.popup.content += '</ul></p>';
        }         
        else {
          view.popup.content += ' Not within 4km of a Taupo Aerodrome</p>';
        }
      });
    }).then(function(){
      // is council property impacted?
      return councilProperty.queryFeatures(councilPropertyQuery).then(function(result){    
        var isCouncil = false;
        var councilPropertyFeatures = result.features;
        if (councilPropertyFeatures.length) {                 
          view.popup.content += '<p><b>Council Property:</b> ' + councilPropertyFeatures[0].attributes['Description'] + '</p>'
          isCouncil = true;
        }
        return isCouncil;
      });
    }).then(function(isCouncil){
      view.popup.content += '<p>Please use the above information to assist in the filling out of the Taupo Airport Authority <a href="https://taupoairport.co.nz/rpas-form/"  target="_blank">RPAS Agreement Form</a>';
      if (isCouncil) {
        view.popup.content += ' and the Taupo District Council <a href="https://www.taupodc.govt.nz/our-services/a-to-z/Documents/RPAS%20Permit%20Application%20Form.pdf"  target="_blank">Drone Permit</a>';
      }
      view.popup.content += '</p>';
    });
  
  }
  
    // prepare an intersect query
  function prepareIntersectsQuery(featureLayer, event, outFields) {
    var query = aerodromes4K.createQuery();
    query.geometry = view.toMap(event);  // the point location of the pointer
    query.spatialRelationship = "intersects";  // this is the default
    query.returnGeometry = false;
    query.outFields = outFields;
    return query;    
  }
      
  // Place widgets on the map
  view.ui.add(locateBtn, "top-left");
  view.ui.add(search, "top-right");
});