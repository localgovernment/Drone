// https://developers.arcgis.com/javascript/latest/sample-code/intro-popup/index.html
require([
  "esri/core/urlUtils",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/tasks/Locator",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/geometry/Point",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/Expand"
], function(urlUtils, Map, MapView, FeatureLayer, Locator, Locate, Search, Point, GraphicsLayer, Graphic, Expand){
  // Defaults
  var defaultScale = 500;  // When zooming into a location
  // X marks the spot (see GraphicsLayer)
  var defaultGraphic = new Graphic({
        /* symbol: { 
          type: "simple-marker",
          style: "x",
          color: "teal",
          size: "14px",
          outline: {  // autocasts as new SimpleLineSymbol()
            color:"teal",
            width: "5px"  // points
          }
        } */        
        symbol: {
          type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
          url: "favicon.png",
          width: "30px",
          height: "30px"
        }
      });
        
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
  
  // Graphics Layer for X marks the spot
  var graphicsLayer = new GraphicsLayer({
  });
  
  map.add(graphicsLayer);
  
  // Check if device is a mobile (will a popup auto dock)
  var isMobile = function() {
      return (view.width <= view.popup.dockOptions.breakpoint.width)
    }
  
  // Read the URL, return mappoint or null
  // https://developers.arcgis.com/javascript/latest/api-reference/esri-core-urlUtils.html#urlToObject
  // https://developers.arcgis.com/javascript/3/jssamples/ags_basic.html
  var urlLocation = function() {
    var urlObject = urlUtils.urlToObject(document.location.href);  
    if (!(urlObject.query === null)) {
      if ("lat"in urlObject.query && "long" in urlObject.query) {
        return new Point({latitude:urlObject.query.lat,longitude:urlObject.query.long})
      }
      else {
        return null
      }
    }
    else {
      return null;
    }
  }
   
  // Create the MapView
  var view = new MapView({
    container: "viewDiv",  // Reference to the scene div
    map: map,  // Reference to the map object created before the scene
    zoom: 10,  // Sets zoom level based on level of detail (LOD)
    center: [175.9, -38.8]  // Sets centre point of view using longitude,latitude
  });   
  view.when(function() {
    var mapPoint = urlLocation();
    if (mapPoint === null) {
      if (isMobile()) {
        locateBtn.locate(); // force locate to 'fire' after view has loaded
      }
    }
    else {
      view.goTo({target: mapPoint, scale: defaultScale}).then(function(){
        dronePopup(mapPoint);  
      });
    }
    search.focus();
  }, function(error) {});

  // Set up a locator task using the world geocoding service
  var locatorTask = new Locator({
    url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    countryCode:"NZ"
  });
  
  if (isMobile()) {
    // Handy locate me button
    var locateBtn = new Locate({
      view: view,
      scale: defaultScale,
      graphic: null
    });
    locateBtn.on("locate", function(locateEvent){
      // https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Locate.html#scale
      
      // console.log('View Coordinates');
      // console.log(view.center); // - this could be useful instead?
      
      var coords = locateEvent.position.coords;  
      var mapPoint = new Point({latitude:coords.latitude,longitude:coords.longitude}); // seems to work - default spatial reference is WGS84
      // var mapPoint = webMercatorUtils.geographicToWebMercator(new Point({latitude:coords.latitude,longitude:coords.longitude}));  // web mercator https://stackoverflow.com/a/38933993/353455 
         
      dronePopup(mapPoint);
    })
  }
      
  // Handy address search box
  // https://gis.stackexchange.com/questions/297918/limiting-the-search-widget-results-to-a-country-in-arcgis-js-api-4-9?rq=1
  // Set local to NZ
  var search = new Search({
    sources: [{
          locator: locatorTask,
          singleLineFieldName: "SingleLine", // if this is excluded and user just types an address, then address is random!
          countryCode: 'NZ',
          localSearchOptions: {
            minScale: 300000,
            distance: 50000
          }
        }
      ],    
    view: view,
    maxSuggestions: 3,
    locationEnabled: false,
    popupEnabled: false,
    includeDefaultSources: false // otherwise ArcGIS source appears in suggestions
    // autoSelect: true // see search-complete event handler below https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Search.html#autoSelect
  });
  
  // No longer using Search On - but code below may be used in future
  /*
  search.on('search-complete', function(event) {
    console.log('Search Complete: ', event);
    search.suggest(search.searchterm).then(function(suggestions){
      console.log('Suggest Response: ',suggestions);
      if (suggestions.numResults) {
        console.log('key: ', suggestions.results[0].results[0].key);
        // no, no this isn't documented anywhere - trial and error.  hints given that suggest key = magic key
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-tasks-Locator.html#suggestLocations  (look for magickey)
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Search.html#autoSelect
        search.sources.items[0].locator.addressToLocations({magicKey: suggestions.results[0].results[0].key}).then(function(location){
          console.log('address: ', location);
        });
      }
      else {
        search.clear();
      }
    }); 
  }); */
  
  search.goToOverride = function(view, goToParams) {
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html#goTo
    // note esri doco isn't clear - lots of trial and error to get this to work
    var target = goToParams.target.target;
    view.goTo({target: target, scale: defaultScale}, goToParams.options).then(function(){
      dronePopup(target.center);
    });
    // search.suggest(); // clear suggest error if there is one
    search.clear();
    if (isMobile())
      search.blur(); // gets rid of keyboard after search (at least on iOS)
  }
  
  // override view's popup
  view.popup.autoOpenEnabled = false;
  view.on("click", function(event) {    
    view.goTo({target: event.mapPoint, scale: defaultScale}).then(function(){
      dronePopup(event.mapPoint);  
    });
  });
  
  function dronePopup(mapPoint) {
    
    // draw X on the map
    graphicsLayer.removeAll();
    defaultGraphic.geometry = mapPoint;
    graphicsLayer.add(defaultGraphic);
      
    // Get the coordinates of the click on the view
    var lat = Math.round(mapPoint.latitude * 100000) / 100000;
    var lon = Math.round(mapPoint.longitude * 100000) / 100000;
    
    // Set up the query for determining the aerodromes
    var aerodromeQuery = prepareIntersectsQuery(aerodromes4K, mapPoint, ["Aerodrome"]);
       
    // Set up the query for determining council property
    var councilPropertyQuery = prepareIntersectsQuery(councilProperty, mapPoint, ["Description"]);

    // Open the popup - add content later  
    var urlLink = urlUtils.urlToObject(document.location.href).path + "?lat="+mapPoint.latitude+"&long="+mapPoint.longitude;
    view.popup.open({
      // Set the popup's title to the coordinates of the location, link svg font from https://raw.githubusercontent.com/Esri/calcite-ui-icons/master/icons/link-16.svg - added width and height attributes
      title: "Lat Long: " + lat + ", " + lon + ' <a href="'+urlLink+'" target="_blank" class="icon-ui-link" id="latLongLink" title="Copy and paste this link into a form"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M6.086 2.09l2.828 2.83c.045.044.075.097.117.143a3.497 3.497 0 0 1 .694 3.496 3.364 3.364 0 0 1-2.121 2.121l-.104-.104a1.491 1.491 0 0 1-.412-.78 2.5 2.5 0 0 0 1.12-4.17l-.523-.521L5.38 2.797a2.5 2.5 0 0 0-3.536 3.536L4.15 8.639a4.52 4.52 0 0 0-.042 1.346c-.047-.041-.099-.072-.144-.117L1.136 7.04a3.5 3.5 0 0 1 4.95-4.95zm4.752 6.166l2.319 2.32A2.5 2.5 0 0 1 9.62 14.11l-2.828-2.829a2.503 2.503 0 0 1 0-3.535 2.47 2.47 0 0 1 1.104-.63 1.45 1.45 0 0 0-.397-.784l-.104-.104a3.449 3.449 0 0 0-1.31.81 3.51 3.51 0 0 0 0 4.95l2.828 2.829a3.5 3.5 0 0 0 4.95-4.95L11.036 7.04c-.046-.045-.099-.077-.146-.119a4.5 4.5 0 0 1-.052 1.335z"/></svg></a>',
      location: mapPoint, // Set the location of the popup to the clicked location
    });
    
    view.popup.collapsed = false;
    view.popup.dockOptions.buttonEnabled = false;
    view.popup.collapseEnabled = false;
    view.popup.content = '<p><b>Address: </b>';
    
    // Execute a reverse geocode using the clicked location
    locatorTask.locationToAddress(mapPoint).then(function(
      response) {
      // If an address is successfully found, show it in the popup's content
      // view.popup.content += response.address + '</p>';
      if (response.attributes.PlaceName.length === 0) {
        view.popup.content += response.address;
      }
      else {
        view.popup.content += response.attributes.LongLabel.substr(response.attributes.PlaceName.length + 1).trim(); // remove placename from start of long form address -plus one for the comma
      }
      console.log(response);
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
    search.focus();
    instructionsExpand.collapse();
  }
  
    // prepare an intersect query
  function prepareIntersectsQuery(featureLayer, mapPoint, outFields) {
    var query = aerodromes4K.createQuery();
    query.geometry = mapPoint;
    query.spatialRelationship = "intersects";  // this is the default
    query.returnGeometry = false;
    query.outFields = outFields;
    return query;    
  }
  
  // Help on using the app
  // https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=featurelayerview-query-distance
  // https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Expand.html#content
  /* var droneInstructions = document.createElement("div");
  droneInstructions.style.padding = "10px";
  droneInstructions.style.backgroundColor = "white";
  
  droneInstructions.style.width = "300px";
  droneInstructions.innerHTML = [
    "<b>Drag</b> the pointer over the data to view stats",
    "within one mile of the pointer location."
  ].join(" ");*/
  
  instructionsDiv = dojo.byId("instructionsDiv");
  if (view.width < 375)
      instructionsDiv.style.width = (view.width - 70) + "px"
  else
      instructionsDiv.style.width = "305px";

  var instructionsExpand = new Expand({
    expandIconClass: "esri-icon-question", // https://esri.github.io/calcite-web/documentation/icons/
    expandTooltip: "How to use the drone app",
    mode: "floating",
    view: view,
    content: instructionsDiv
  });
      
  // Place widgets on the map
  if (isMobile())
    view.ui.add(locateBtn, "top-left");
  view.ui.add(instructionsExpand, "top-left");        
  view.ui.add(search, "top-right");  
});
