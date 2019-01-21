// https://developers.arcgis.com/javascript/latest/sample-code/intro-popup/index.html
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/tasks/Locator"
], function(
  Map, MapView, FeatureLayer, Locator
) {

  // Create the Map
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
 
  // Create the MapView
  var view = new MapView({
    container: "viewDiv",  // Reference to the scene div
    map: map,  // Reference to the map object created before the scene
    zoom: 10,  // Sets zoom level based on level of detail (LOD)
    center: [175.9, -38.8]  // Sets centre point of view using longitude,latitude
  });   
  
  // Set up a locator task using the world geocoding service
  var locatorTask = new Locator({
    url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    countryCode:"NZ"
  });

  /*******************************************************************
   * This click event sets generic content on the popup not tied to
   * a layer, graphic, or popupTemplate. The location of the point is
   * used as input to a reverse geocode method and the resulting
   * address is printed to the popup content.
   *******************************************************************/
  view.popup.autoOpenEnabled = false;
  view.on("click", function(event) {

    // Get the coordinates of the click on the view
    var lat = Math.round(event.mapPoint.latitude * 1000) / 1000;
    var lon = Math.round(event.mapPoint.longitude * 1000) / 1000;

    view.popup.open({
      title: "Aerodrome and Council Information...",
      location: event.mapPoint // Set the location of the popup to the clicked location
    });

    /*
    // view.popup.content = getAddress(event);
    getAddress(event).then(function(content){
      // view.popup.content = content;
      console.log(content);
    }); */
    
    // Display the popup
    // Execute a reverse geocode using the clicked location
    locatorTask.locationToAddress(event.mapPoint).then(function(
      response) {
      // If an address is successfully found, show it in the popup's content
      return response.address;
    }).catch(function(error) {
      // If the promise fails and no result is found, show a generic message      
        return "No address was found for this location";
    });
    
  });
  
  // Execute a reverse geocode using the clicked location
  function getAddress(event) {
    content = '<b>Address:</b>';
    return locatorTask.locationToAddress(event.mapPoint).then(function(response) {
      console.log(response.address);
      return content.concat(response.address,'<br>',aerodromes(event));
    }, function(err) {
      return content.concat(' No address found at that location');
    });
  }
  
  /*
  // return aerodromes at given event as an html formatted list
  function aerodromes(content, event) {
  
    var query = aerodromes_4k.createQuery();
    query.geometry = view.toMap(event);  // the point location of the pointer
    query.spatialRelationship = "intersects";  // this is the default
    query.returnGeometry = false;
    query.outFields = [ "Aerodrome" ];
    
    aerodromes_4k.queryFeatures(query).then(function(result){    
      var aerodromeFeatures = result.features;
      if (aerodromeFeatures.length) {   
        content = '<b>Aerodromes</b><ul>'
        for (var i = 0; i < aerodromeFeatures.length; i++) 
          content = content.concat('<li>',aerodromeFeatures[i].attributes['Aerodrome'],'</li>');
        content = content.concat('</ul>');
      }        
      else {
        content = 'Not within 4km of a Taupo Aerodrome';
      }
      view.popup.content = content;
    })

    return content; 
  }
  */
  
});
