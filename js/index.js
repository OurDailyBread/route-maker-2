// Route maker by David Lee
// davesbusinessmail@yahoo.com

// used when zooming
var zoomScale = 2;
var zoomLevel = 0;
var prevZoomLevel = 0;
var circleSize = 60;
var lineSize = 20;

// used when drawing lines
var lineDrawTime = 2; // seconds

// our global map data.  contains data for all the maps.
// mapData is used when saving to the server and as well as when loading each indivual map
var mapData = {};
for (var i = 1; i <= 8; i++) {
  mapData['floor' + i] = {
    'settings': {
      'url': $('#map-url-input').val(),
      'name': $('.map-name').text(),
      'x': 0,
      'y': 0,
      'width': '500px',
      'height': '500px',
      'viewWidth': $('.map').css('width'),
      'viewHeight': $('.map').css('height'),
      'zoom': 0,
      'circleSize': 30

    },
    'circles': [],
    'lines': []
  }
}

var mapPosition = {
  'x': 0,
  'y': 0,
  'scale': 1
}

// Login screen required to save edits
$('.login-overlay').hide().removeClass('login-hidden');
$('.login-box').hide().removeClass('login-hidden');

setTimeout(function() {
  $('.background-title')
    .addClass('background-title-reposition');
  updateTitle();
  setTimeout(function() {
    if (parseInt($('body').css('width')) <= 480) {
      $('.background-title').remove();
    }
  }, 500);
}, 2000);

$(document).ready(function() {
  // Parse is cloud based database https://www.parse.com/docs/js/guide

  Parse.initialize("vuy4wJOqWfcqAhipECk6g3bIFKL0sRG58VWSqyWr", "ufzZkjqxGC5jJjlClWMmnmK1pWLJKPKgQj0inIIi");
  // initialize (app key, javascript key)

  Parse.User.logOut();

  // Testing purposes
  //$('.map2').css('background-image','url(http://routemaker.parseapp.com/1stFloorMap.jpg)');
  //$('.map2').css({
  //  'width': '4320px',
  //  'height': '2160px',
  //  'background-size': '4320px 2160px'
  //});

  // adjusting for zoom
  var map2Container = $('.map2-container');
  var map2ContainerCenterX = parseFloat(map2Container.css('width')) / 2;
  var map2ContainerCenterY = parseFloat(map2Container.css('height')) / 2;

  // move origin to center of page (less calculations when zooming)
  $('.map2').css({
    'left': map2ContainerCenterX + 'px',
    'top': map2ContainerCenterY + 'px'
  });
  $('.circles-lines-container').css({
    'left': map2ContainerCenterX + 'px',
    'top': map2ContainerCenterY + 'px'
  });

  // configure starting screen
  mapPosition.x = -240;
  mapPosition.y = 50;
  panMap();

  // Census maps
  // Floor 1: http://routemaker.parseapp.com/1stFloorMap.jpg
  // Floor 2: http://routemaker.parseapp.com/2ndFloorMap.jpg
  // Floor 3: http://routemaker.parseapp.com/3rdFloorMap.jpg
  // Floor 4: http://routemaker.parseapp.com/4thFloorMap.jpg
  // Floor 5: http://routemaker.parseapp.com/5thFloorMap.jpg
  // Floor 6: http://routemaker.parseapp.com/6thFloorMap.jpg
  // Floor 7: http://routemaker.parseapp.com/7thFloorMap.jpg
  // Floor 8: http://routemaker.parseapp.com/8thFloorMap.jpg

  addNewCircle('Hello');

  loadData('initial start');

  $(".circle").draggable();

  //$('.circle.z10,.circle.z9,.right-panel,.bottom-panel').each(function() {
  //  var values = getTransformValues($(this).css('transform'));
  //  $(this).addClass('no-transition').css('transform', 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(0)');
  //});

  $('.right-panel,.bottom-panel').hide().removeClass('initial-hidden');

  recordPanelCircles();

}); // Document ready done

function updateTitle() {
  var webpageWidth = parseInt($('body').css('width'));
  if (webpageWidth < 1500) {
    $('.background-title').css({
      'opacity': '0'
    });
    setTimeout(function() {
      $('.background-title').css('z-index', -100);
    }, 1000);
  } else {
    $('.background-title').css({
      'z-index': 1000,
      'opacity': '1'
    });
  }
}

// used for browser window resizing
var prevBodyWidth = parseFloat($('body').css('width'));

// Window resizing requires recalculating the view
$(window).resize(function() {
  // adjusting for zoom
  var map2Container = $('.map2-container');
  var map2ContainerCenterX = parseFloat(map2Container.css('width')) / 2;
  var map2ContainerCenterY = parseFloat(map2Container.css('height')) / 2;

  // move origin to center of page (less calculations when zooming)
  $('.map2').css({
    'left': map2ContainerCenterX + 'px',
    'top': map2ContainerCenterY + 'px'
  });
  $('.circles-lines-container').css({
    'left': map2ContainerCenterX + 'px',
    'top': map2ContainerCenterY + 'px'
  });

  updateTitle();

  // Readjust the circle lines size to match the new window size
  $('.circles-lines-container').css('width', $('.map2-container').css('width'));
  $('.circles-lines-container').css('height', $('.map2-container').css('height'));
  console.log('resizing map width: ' + $('.map2-container').css('width'));

  var newBodyWidth = parseFloat($('body').css('width'));
  var newOffset = newBodyWidth - prevBodyWidth;
  /*
  $('.circle.z10').each(function() {
    var scaleFromBase = Math.pow(zoomScale, zoomLevel);
    var values = getTransformValues($(this).css('transform'));
    var adjustedX = values.translateX + ((newOffset / 2) * (1/ scaleFromBase)); // offset is 1/2 since the origin is also moved when the window resizes
    $(this).css('transform','translate(' + adjustedX + 'px,' + values.translateY + 'px) scale(' + values.scaleX + ')');
  });*/

  $('.right-panel,.bottom-panel').removeClass('zooms quick-zooms kenetic-slide');
  adjustEditor();

  prevBodyWidth = newBodyWidth;

});

// maps, circles, and line are saved after each map selection.
// also used when saving to the Parse database server
function saveMap(mapNumber) {
  console.log('saving map');

  var map = $('.map2');

  var circleList = [];
  var lineList = [];
  $('.circle').each(function() {
    var circle = {};
    circle.name = $(this).text();
    circle.aliases = $(this).attr('data-aliases');
    circle.class = $(this).attr('class');
    circle.left = $(this).css('left');
    circle.top = $(this).css('top');
    circle.z10 = $(this).hasClass('z10');
    circle.transform = $(this).css('transform');
    circle.weight = $(this).attr('data-weight');
    circle.appearance = $(this).attr('data-appearance');

    circleList.push(circle);
  });
  $('.line').each(function() {
    var line = {};
    line.begin = $(this).attr('data-begin');
    line.end = $(this).attr('data-end');
    line.left = $(this).css('left');
    line.top = $(this).css('top');
    line.lineHeight = $(this).css('height');
    line.length = $(this).css('width');
    line.angle = $(this).attr('angle');

    lineList.push(line);
  });

  var size = map.css('background-size').split(' ');
  var settings = {};

  settings.url = $('#map-url-input').val();
  settings.name = $('.map-name').text();
  settings.x = mapPosition.x;
  settings.y = mapPosition.y;
  settings.width = size[0];
  settings.height = size[1];
  settings.zoom = zoomLevel;
  settings.viewWidth = $('.map2-container').css('width');
  settings.viewHeight = $('.map2-container').css('height');
  settings.circleSize = $('#circle-size-value-input').val();

  settings.version = '2.0';

  var floorName = 'floor' + mapNumber;
  mapData[floorName] = {
    'settings': settings,
    'circles': circleList,
    'lines': lineList
  }

  updateAutocomplete();

}

// Maps are loaded when an overhead button is selected.
// also used to load from the database server
function loadMap(mapNumber) {
  console.log('loading map ' + mapNumber);
  // clear previous map circles and lines
  $('.circle,.line').remove();

  var floorName = 'floor' + mapNumber;
  $('.map-name').text(mapData[floorName].settings.name);

  // adjust all values to the same zoom level
  //preLoadZoom(floorName, zoomLevel);
  preloadAdjustment(mapNumber, zoomLevel);

  var loadedMapWidth = parseFloat(mapData[floorName].settings.width);
  var loadedMapHeight = parseFloat(mapData[floorName].settings.height);
  $('.map2').css({
    'background-image': 'url(' + mapData[floorName].settings.url + ')',
    'background-size': loadedMapWidth + 'px ' + loadedMapHeight + 'px',
    'width': loadedMapWidth + 'px',
    'height': loadedMapHeight + 'px'
  });
  console.log('loaded image size: ' + loadedMapWidth + 'px,' + loadedMapHeight + 'px');

  // load editor settings
  $('#map-url-input').val(mapData[floorName].settings.url);
  $('#circle-size-value-input').val(mapData[floorName].settings.circleSize);

  // load circle and line size
  circleSize = mapData[floorName].settings.circleSize;
  lineSize = mapData[floorName].settings.circleSize / 3;

  // map2
  //$('.map2').css('transform', mapData[floorName].settings.transform);
  //console.log('loading map transform: ' + mapData[floorName].settings.transform);

  // load circles and lines
  var totalCircles = mapData[floorName].circles;
  var totalLines = mapData[floorName].lines;
  console.log('number of loaded circles: ' + totalCircles.length + ' lines: ' + totalLines.length);

  // for calculating circle size
  var scaleFromBase = Math.pow(zoomScale, zoomLevel);

  // draw circles
  for (var index in totalCircles) {

    var transform = totalCircles[index].transform;
    if (totalCircles[index].transform == 'matrix(0,0,0,0,0,0)') {
      transform = 'none';
    }
    var circle = $('<div>')
      .addClass(totalCircles[index].class)
      .addClass('no-transition opacity-0')
      .css({
        'left': totalCircles[index].left,
        'top': totalCircles[index].top,
        'transform': transform
      })
      .text(totalCircles[index].name)
      .attr({
        'data-aliases': totalCircles[index].aliases,
        'data-weight': totalCircles[index].weight,
        'data-appearance': totalCircles[index].appearance
      });

    circle.appendTo('.circles-lines-container');

    circle.draggable();

    var newlyAddedCircle = $('.circle').last();

    if ((newlyAddedCircle.hasClass('z10') == false) &&
      (newlyAddedCircle.hasClass('z9') == false)) {
      // circle resized 
      newlyAddedCircle.css({
        'width': circleSize,
        'height': circleSize,
        'margin-left': (-1) * circleSize / 2,
        'margin-top': (-1) * circleSize / 2,
        'border-radius': circleSize * 2 / 3
      });

      if (zoomLevel <= 0) {
        //console.log('adjusting circle text thats too small: ' + (1 / scaleFromBase));
        $('.circle').not(':has(.z10,.z9)').addClass('zooms').each(function() {
          var values = getTransformValues($(this).css('transform'));
          $(this).css('transform', 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(' + (1 / scaleFromBase) + ')');
          //console.log('resizing circle translate(' + values.translateX + 'px,' + values.translateY  + 'px) scale(' + (1 / scaleFromBase) + ')');
        })
      } else {
        $('.circle').not(':has(.z10,.z9)').addClass('zooms').each(function() {
          var values = getTransformValues($(this).css('transform'));
          $(this).css('transform', 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(1)');
        })
      }
    }
  }

  // always populate the new circle box
  if (isBoxEmpty()) {
    addNewCircle();
  }

  // draw lines
  for (var index in totalLines) {
    //console.log('angle: ' + totalLines[index].angle)
    $('<div>')
      .attr({
        'data-begin': totalLines[index].begin,
        'data-end': totalLines[index].end,
        'angle': totalLines[index].angle
      })
      .addClass('line')
      .css({
        'position': 'absolute',
        'transform': totalLines[index].angle,
        left: totalLines[index].left,
        top: totalLines[index].top
      })
      .height(totalLines[index].lineHeight)
      .width(totalLines[index].length)
      .addClass('no-transition opacity-0')
      .appendTo('.circles-lines-container');
    redrawLine($('.line').last()); // adds visual adjustments so the line looks connected

  }

  updateEditBox($('.selected-edit'));

  $('.circle,.line').removeClass('zooms');

  if ($('.edit-mode').hasClass('edit-mode-on') == true) {
    $('.circle').removeClass('map-hidden opacity-0 no-transition');
    $('.line,.right-panel,.bottom-panel').removeClass('opacity-0 no-transition');
  } else {
    $('.circle:not(.z10,.z9)').each(function() {
      if ($(this).attr('data-appearance') == 'always') {
        $(this).removeClass('map-hidden opacity-0 no-transition');
      } else {
        $(this).addClass('map-hidden').removeClass('no-transition');
      }
    });
    $('.line').addClass('opacity-0').removeClass('no-transition');
  }
}

// Adjust circles lying on editor panel to correct location due to different screen sizes
function preloadAdjustment(mapNumber, newZoomLevel) {
  // adjusts Z10 and Z9 circles to the moved/zoomed map settings
  var floorName = 'floor' + mapNumber;
  var totalCircles = mapData[floorName].circles;

  var scaleFromBase = Math.pow(zoomScale, newZoomLevel);
  var scaleFromCurrent = Math.pow(zoomScale, newZoomLevel - mapData[floorName].settings.zoom);

  for (var index in totalCircles) {
    if ((totalCircles[index].class.indexOf('z10') > 0) || (totalCircles[index].class.indexOf('z9') > 0)) {
      console.log('panel circle is adjusted through preloadAdjustment')
        // new window size correction
      var currentLeft = parseFloat(totalCircles[index].left);
      var currentTop = parseFloat(totalCircles[index].top);
      var savedBodyWidth = parseFloat(mapData[floorName].settings.viewWidth);
      var newOffset = (parseFloat($('.map2-container').css('width')) - savedBodyWidth) / 2;
      currentLeft = currentLeft + newOffset;
      //console.log('z10 z9 offset: ' + newOffset + ' current left ' + currentLeft);

      // zoom and pan correction
      var diffX = mapPosition.x - parseFloat(mapData[floorName].settings.x);
      var diffY = mapPosition.y - parseFloat(mapData[floorName].settings.y);
      //console.log('load data settings on load map ' + mapData[floorName].settings.x + ',' + mapData[floorName].settings.y);
      //console.log('new map diff ' + diffX + ',' + diffY);
      var values = getTransformValues(totalCircles[index].transform);

      // distance to center of map = (baseX + mapPosition.x - diff.x) * prevScaleFromBase = (adjustedX + mapPosition.x) * scaleFromBase;

      var centerToCircleX = currentLeft + values.translateX + mapPosition.x - (diffX);
      var centerToCircleY = currentTop + values.translateY + mapPosition.y - (diffY);

      var newX = (centerToCircleX * (1 / scaleFromCurrent)) - mapPosition.x;
      var newY = (centerToCircleY * (1 / scaleFromCurrent)) - mapPosition.y;

      totalCircles[index].left = newX;
      totalCircles[index].top = newY;
      totalCircles[index].transform = 'scale(' + (1 / scaleFromBase) + ')';
      //console.log('updated left ' + totalCircles[index].left);

    }
  }
}

// map data (mapData) is loaded from a Parse database.
// it also centers the image but keeps the loaded zoom level.
// if initialStart is set to "inital start" then it hides the default
// editing menus
function loadData(initialStart) {
  console.log('loading from online database Parse');

  $('.circle').remove();
  $('.line').remove();

  var dataTableObject = Parse.Object.extend("SaveTable");
  var dataTable = new dataTableObject();

  var query = new Parse.Query(dataTableObject);
  query.descending('createdAt');
  query.first({
    success: function(result) {
      console.log('Loaded map was created on : ' + result.get('createdAt').toString())
      var totalDataJSON = JSON.parse(result.get('data'));
      mapData = totalDataJSON;

      // Center loaded floor map to center
      var floorName = 'floor' + $('.map-selected').text();
      zoomLevel = mapData[floorName].settings.zoom;
      //var currentMapCenterX = parseFloat($('.map2-container').css('width')) / 2;
      var currentMapCenterX = 0; // map origin moved to center of the screen
      //var currentMapCenterY = parseFloat($('.map2-container').css('height')) / 2;
      var currentMapCenterY = 0; // map origin moved to center of the screen

      var loadedMapCenterX = parseFloat(mapData[floorName].settings.viewWidth) / 2;
      var loadedMapCenterY = parseFloat(mapData[floorName].settings.viewHeight) / 2;

      console.log('loaded map position (x,y): ' + mapData[floorName].settings.x + ',' + mapData[floorName].settings.y + ',' +
        ' current center: ' + currentMapCenterX + ',' + currentMapCenterX +
        ' loaded center: ' + loadedMapCenterX + ',' + loadedMapCenterY);

      // only for version 1.0 load
      var startingXPos = parseFloat(mapData[floorName].settings.x) + (currentMapCenterX - loadedMapCenterX);
      var startingYPos = parseFloat(mapData[floorName].settings.y) + (currentMapCenterY - loadedMapCenterY);

      console.log('load file starting position (x,y): ' + startingXPos + ',' + startingYPos);
      mapPosition.x = startingXPos;
      mapPosition.y = startingYPos;

      panMap();

      //$('.error-display').text(mapData[floorName].settings.zoom);

      if (typeof mapData[floorName].settings.version == 'undefined') {
        console.log('updating map from version 1.0')
          // version 1.0 did not have a versioning vartiable
          // version 1.0 also positions the points based off the view and not map position
          // the solution is add the map position difference to the left/top of the circles and lines

        for (var floorName2 in mapData) {

          var totalCircles = mapData[floorName2].circles;
          var totalLines = mapData[floorName2].lines;

          for (var index in totalCircles) {
            mapData[floorName2].circles[index].left = parseFloat(mapData[floorName2].circles[index].left) + (0 - parseFloat(mapData[floorName2].settings.x)) + 'px';
            mapData[floorName2].circles[index].top = parseFloat(mapData[floorName2].circles[index].top) + (0 - parseFloat(mapData[floorName2].settings.y)) + 'px';
          }
          for (var index in totalLines) {
            mapData[floorName2].lines[index].left = parseFloat(mapData[floorName2].lines[index].left) + (0 - parseFloat(mapData[floorName2].settings.x)) + 'px';
            mapData[floorName2].lines[index].top = parseFloat(mapData[floorName2].lines[index].top) + (0 - parseFloat(mapData[floorName2].settings.y)) + 'px';
          }

          var loadedMapCenterX = parseFloat(mapData[floorName].settings.viewWidth) / 2;
          var loadedMapCenterY = parseFloat(mapData[floorName].settings.viewHeight) / 2;

          var currentMapCenterX = 0; // map origin moved to center of the screen
          var currentMapCenterY = 0; // map origin moved to center of the screen

          var startingXPos = parseFloat(mapData[floorName2].settings.x) + (currentMapCenterX - loadedMapCenterX);
          var startingYPos = parseFloat(mapData[floorName2].settings.y) + (currentMapCenterY - loadedMapCenterY);

          console.log('load file starting position (x,y): ' + startingXPos + ',' + startingYPos);

          mapData[floorName2].settings.x = startingXPos;
          mapData[floorName2].settings.y = startingYPos;
        }

      }

      // for calculating circle size
      var scaleFromBase = Math.pow(zoomScale, zoomLevel);

      // supposedly used to load all image in the back for faster reload by caching
      for (var floorNameIndex in mapData) {
        var image = $('<div>')
          .addClass('.image-preloader')
          .css('background-image', mapData[floorNameIndex].settings.url);
        image.appendTo('.image-preloader-container');
      }

      console.log('load data settings ' + mapData[floorName].settings.x + ',' + mapData[floorName].settings.y);
      // Load map to current setting
      loadMap($('.map-selected').text());

      updateAutocomplete();

      if (initialStart == 'initial start') {
        $('.edit-mode').removeClass('edit-mode-on');
        $('.edit-mode').text('Login');
        $('.circle.z10,.circle.z9').addClass('no-transition opacity-0');
        $('.map-name').removeAttr('contenteditable');
      } else {
        //alert("Data loaded from Parse cloud");
        showErrorMessage('Data loaded from Parse cloud', $('.map-name'));
      }

    },
    error: function(error) {
      showErrorMessage('Error code: ' +
          error.code + ' Message: ' +
          error.message, $('.username'));
        console.log('Error code: ' +
          error.code + ' Message: ' +
          error.message);
    }
  });
}

// map data (mapData) is saved to a Parse database
function saveData() {
  console.log('saving to online database Parse');

  saveMap($('.map-selected').text());

  for (var floorName in mapData) {
    //preLoadZoom(floorName, zoomLevel);
  }

  var currentUser = Parse.User.current();
  if (!currentUser) {
    showLogin();
    return;
  }

  var totalDataJSON = JSON.stringify(mapData);

  Parse.Cloud.run('saveMap', {
    mapData: totalDataJSON
  }, {
    success: function(saveLocation) {
      console.log(saveLocation)
      alert("Data saved to Parse cloud");
      status.success("Data saved to Parse cloud");
    },
    error: function(error) {
      console.log(error)
      alert('Parse database save error: ' + error);
      status.error('Parse database save error: ' + error);
    }
  });

}

// Used for accelerated sliding maps (currently not used)
var start = {
  x: 0,
  y: 0
};
var stop = {
  x: 0,
  y: 0
};
var diff = {
  x: 0,
  y: 0,
};

// used for mouse based clicks
var mouseStateMap = "";
var mouseOffset = 0;

// Begining of interactive code
// These next three functions allows the user to move the map
// Map starts moving
$('.touch-click-reader').bind('mousedown touchstart', function(e) {
  console.log('mousedown touchstart for map2-container called');

  console.log('closing menues');
  // close autocomplete menus
  $('#start-input').autocomplete('close');
  $('#destination-input').autocomplete('close');

  // unfocus map name edit
  $('.map-name').blur();

  /*
  // map cannot be moved when zooming
  if ($('.zoom-in').hasClass('zoom-in-active') || $('.zoom-out').hasClass('zoom-out-active')) {
    $('.zooms').removeClass('zooms');
    $('.zoom-in').removeClass('zoom-out-active');
    $('.zoom-out').removeClass('zoom-out-active');
    return (e);
  }*/

  // circle selected instead.  map doesnt move (return)
  if ($('.selected').length > 0) {
    return;
  }

  skipAnimation();

  // touch event processing begins here

  e.preventDefault();
  var orig = e.originalEvent;

  console.log('clicked: ' + e.originalEvent.pageX + ',' + e.originalEvent.pageY);

  removeKeneticSlide();

  if ((e.type == "mousedown") ||
    (orig.touches.length == 1)) { // Note: touches is not available on desktop browsers

    $('.zooms').removeClass('zooms');

    // touch calculations
    start.x = e.originalEvent.pageX;
    start.y = e.originalEvent.pageY;
    stop.x = 0;
    stop.y = 0;
    diff.x = 0;
    diff.y = 0;
    mouseStateMap = "down";

  } else if (orig.touches.length > 1) {
    prevDistance = Math.sqrt(Math.pow(parseFloat(orig.touches[0].pageX) - parseFloat(orig.touches[1].pageX), 2) +
      Math.pow(parseFloat(orig.touches[0].pageY) - parseFloat(orig.touches[1].pageX), 2));
    mouseStateMap = "down";
  }
});

// Map stops moving 
$('.touch-click-reader').bind('mouseup touchend', function(e) {
  console.log('mouseup touchend for map2-container called');
  mouseStateMap = "";

  // kenetic touch calculations (how fast/far the sliding goes)
  //console.log(JSON.stringify(diff));
  var offsetScale = 20;

  if ((Math.abs(diff.x) < 10) && (Math.abs(diff.y) < 10)) {
    return;
  } else {
    diff.x = diff.x * offsetScale;
    diff.y = diff.y * offsetScale;

    // a quick check to ensure it doesnt spin out too far
    if (diff.x > 2500) {
      diff.x = 2500
    }
    if (diff.x < (-2500)) {
      diff.x = -2500;
    }
    if (diff.y > 2500) {
      diff.y = 2500;
    }
    if (diff.y < (-2500)) {
      diff.y = -2500;
    }
    // kenetic touch enabled

    $('.map2').addClass('kenetic-slide');
    $('.circles-lines-container').addClass('kenetic-slide');

    $('.right-panel,.bottom-panel').addClass('panel-kenetic-slide');
    $('.circle.z10,.circle.z9').addClass('panel-kenetic-slide');

    $('.line').addClass('line-kenetic-slide');

  }

  panMap();

});

// Map is moving
$('.touch-click-reader').bind('mousemove touchmove', function(e) {
  //console.log('mouse state moved');
  e.preventDefault();

  if (mouseStateMap == "down") {

    // Zoom when pinching
    var orig = e.originalEvent;
    if (e.type == "touchmove") {
      if (orig.touches.length > 1) {
        if (prevDistance == 0) {
          return;
        }

        var newDistance = Math.sqrt(Math.pow(parseFloat(orig.touches[0].pageX) - parseFloat(orig.touches[1].pageX), 2) + Math.pow(parseFloat(orig.touches[0].pageY) - parseFloat(orig.touches[1].pageX), 2));

        //$('.error-display').text('prev distance: ' + prevDistance + ', new:' + newDistance);
        if (Math.abs(newDistance - prevDistance) > 100) {
          if (prevDistance > newDistance) {
            zoomOut();
          } else {
            zoomIn();
          }
          prevDistance = 0;
          mouseStateMap = "";
        }

        return;
      }
    }

    // touch/click calculations
    stop.x = e.originalEvent.pageX;
    stop.y = e.originalEvent.pageY;

    diff.x = stop.x - start.x;
    diff.y = stop.y - start.y;

    // map updated
    panMap();

    start.x = stop.x;
    start.y = stop.y;
  }
});

function getTransformValues(matrix) {
  //console.log('getTransformValues called')
  // Only works for scale and translate (no rotation/skew)

  //console.log(matrix);
  if ((typeof matrix == 'undefined') || (matrix == 'none')) {
    matrix = 'matrix(1,0,0,1,0,0)';
  }
  //console.log('transforming this matrix to values: ' + matrix);

  var parameters = matrix.split('(')[1].split(')')[0];
  var parts = parameters.split(',');
  //console.log(parts.toString());

  // http://www.tutorialspark.com/css3/CSS3_Matrix_Transform.php
  // transform:matrix(a, b, c, d, X, Y);
  // a= scaleX() and d=ScaleY()
  // b= skewY() and c=SkewX() */
  // X= translateX() and Y=translateY()

  var values = {
    scaleX: parseFloat(parts[0]),
    skewY: parseFloat(parts[1]),
    skewX: parseFloat(parts[2]),
    scaleY: parseFloat(parts[3]),
    translateX: parseFloat(parts[4]),
    translateY: parseFloat(parts[5])
  }
  return values;
}

// sets global mapPosition variable
function panMap() {
  //console.log('panMap called.  panning map');
  //console.log('current map position (x/y): ' + mapPosition.x + ',' + mapPosition.y);
  //console.log('current movement (x/y): ' + diff.x + ',' + diff.y);

  var scaleFromBase = Math.pow(zoomScale, zoomLevel);

  mapPosition.x = mapPosition.x + (diff.x / scaleFromBase);
  mapPosition.y = mapPosition.y + (diff.y / scaleFromBase);

  var newX = mapPosition.x * scaleFromBase;
  var newY = mapPosition.y * scaleFromBase;

  //console.log('map transform values: ' + JSON.stringify(transform));
  //console.log('setting map matrix: ' + 'translate(' + mapPosition.x + 'px,' + mapPosition.y + 'px) '
  //       + 'scale(' + transform.scaleX + ',' + transform.scaleY + ')');
  $('.map2').css('transform', 'translate(' + newX + 'px,' + newY + 'px) ' + 'scale(' + scaleFromBase + ')');

  $('.circles-lines-container').css('transform', 'translate(' + newX + 'px,' + newY + 'px) ' + 'scale(' + scaleFromBase + ')');

  // snapshot when kenetic sliding is cancelled
  if ((diff.x == 0) && (diff.y == 0)) {
    recordPanelCircles();
  }

  adjustEditor();

  //console.log('updated map position (x/y): ' + mapPosition.x + ',' + mapPosition.y + ' end of panMap');

}

function removeKeneticSlide() {
  // kenetic slide removed by setting target to current position and then removing the transition class
  //console.log('removeKeneticSlide called.  removing kenetic slide');
  //console.log('current map position (x/y): ' + mapPosition.x + ',' + mapPosition.y);

  var map = $('.map2');
  var matrix = map.css('transform');
  var transform = getTransformValues(matrix);

  var newX = transform.translateX;
  var newY = transform.translateY;

  var scaleFromBase = Math.pow(zoomScale, zoomLevel);

  mapPosition.x = newX / scaleFromBase;
  mapPosition.y = newY / scaleFromBase;

  //console.log('reverted map position (x/y): ' + mapPosition.x + ',' + mapPosition.y);

  diff.x = 0;
  diff.y = 0;

  // target set to current position instead of projected position
  panMap();

  $('.map2').removeClass('kenetic-slide');
  $('.circles-lines-container').removeClass('kenetic-slide');
  $('.right-panel,.bottom-panel').removeClass('panel-kenetic-slide');
  $('.circle.z10,.circle.z9').removeClass('panel-kenetic-slide').addClass('no-transition');
  $('.line').removeClass('line-kenetic-slide');
  $('.zooms').removeClass('zooms');
  $('.quick-zooms').removeClass('quick-zooms');

}

// The circle on the map with the given name is returned
function getCircle(name) {
  //console.log('getCircle called')
  var circle = $('.circle').filter(function() {
    return $(this).text() == name;
  });

  return circle;
}

/*
// circle size is scaled based off zoom level
function resizeCircle(selection, newZoomLevel) {
  //console.log('resizeCircle called');
  var scaleFromBase = Math.pow(zoomScale, newZoomLevel);

  $(selection).css({
    'width': circleSize * scaleFromBase,
    'height': circleSize * scaleFromBase,
    'margin-left': (-1) * circleSize * scaleFromBase / 2),
    'margin-top': (-1) * circleSize * scaleFromBase / 2),
    'border-radius': (circleSize * scaleFromBase) * 2 / 3)
  });
  
}*/

// creates a line connecting two points.  drawn as a rotated thin box. css and div based graphics.
// Thanks to http://www.monkeyandcrow.com/blog/drawing_lines_with_css3/ for some of the original code
function createLine(x1, y1, x2, y2, name1, name2) {
  //console.log('calling createLine');

  var scale = Math.pow(zoomScale, zoomLevel);
  var height = lineSize;

  var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  var transform = 'rotate(' + angle + 'deg) translate(-' + ((height / 2) - 1) + 'px,-' + (height / 2) + 'px)';

  // line adjusted so it looks like the ends connect perfectly
  length = length + height - 1;

  var line = $('<div>')
    .appendTo('.circles-lines-container')
    .attr({
      'data-begin': name1,
      'data-end': name2,
      'angle': 'rotate(' + angle + 'deg) translate(-' + ((height / 2) - 1) + 'px,-' + (height / 2) + 'px)'
    })
    .addClass('line')
    .css({
      'transform': transform,
      'left': x1,
      'top': y1
    })
    .height(height)
    .width(length);
  /*
      .offset({
        left: x1,
        top: y1
      });*/

  return line;
}

// updates said line with new coordinates
function updateLine(line, x1, y1, x2, y2) {
  //console.log('calling updateLine');

  var scale = Math.pow(zoomScale, zoomLevel);
  var height = lineSize;

  var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  var transform = 'rotate(' + angle + 'deg) translate(-' + ((height / 2) - 1) + 'px,-' + (height / 2) + 'px)';

  // line adjusted so it looks like the ends connect perfectly
  length = length + height - 1;

  line
    .addClass('line-moving')
    .attr({
      'angle': 'rotate(' + angle + 'deg) translate(-' + ((height / 2) - 1) + 'px,-' + (height / 2) + 'px)'
    })
    .css({
      'transform': transform,
      left: x1,
      top: y1
    })
    .height(height)
    .width(length);
  /*.offset({
     left: x1,
     top: y1
   }); appears to be buggy*/

  return line;
}

function redrawLine(selection) {
  //console.log('redrawLine called');
  var beginName = selection.attr('data-begin');
  var endName = selection.attr('data-end');
  var beginCircle = getCircle(beginName);
  var endCircle = getCircle(endName);
  var beginValues = getTransformValues(beginCircle.css('transform'));
  var endValues = getTransformValues(endCircle.css('transform'));
  var beginX = parseFloat(beginCircle.css('left')) + beginValues.translateX;
  var beginY = parseFloat(beginCircle.css('top')) + beginValues.translateY;
  var endX = parseFloat(endCircle.css('left')) + endValues.translateX;
  var endY = parseFloat(endCircle.css('top')) + endValues.translateY;
  //console.log('updating line: ' + beginName + ' to ' + endName);
  updateLine(selection, beginX, beginY, endX, endY);
  //console.log('new coords:' + selection.css('left') + ',' + selection.css('top'));
  $('.line-moving').removeClass('line-moving');
}

var mapTimeouts = [];
// map selection is based on selected overhead number buttons
function selectMap(selection) {
  console.log('selectMap called');
  skipAnimation();

  saveMap($('.map-selected').text());
  $('.map2').addClass('quick-zooms');
  $('.map-button').removeClass('map-selected');
  $(selection).addClass('map-selected');
  loadMap($(selection).text());

  for (var index in mapTimeouts) {
    clearTimeout(timeouts[index]);
  }

  mapTimeouts = setTimeout(function() {
    $('.map2').removeClass('quick-zooms');
    if (($('.edit-mode').hasClass('edit-mode-on') == false) &&
      (($('#start-input').val() != '') || ($('#destination-input').val() != '')) &&
      $(selection).hasClass('floor-highlight')) {
      showRoute();
    }
  }, 1000);

}

function zoomIn() {
  console.log('zoomIn called')
  if ($('.zoom-in').hasClass('zoom-in-active') || $('.zoom-out').hasClass('zoom-out-active')) {
    return;
  }

  removeKeneticSlide();
  //clearRoute();
  clearStartDestination();

  $('.zoom-in').addClass('zooms');
  $('.zoom-in').addClass('zoom-in-active');
  $('.map2').addClass('zooms');

  //zoom(zoomLevel + 1);
  zoom2(zoomLevel + 1);
  setTimeout(function() {
    $('.zooms').removeClass('zooms');
    $('.zoom-in').removeClass('zoom-in-active');
    $('.line-moving').removeClass('line-moving');
  }, 2000);

}

function zoomOut() {
  console.log('zoomOut called');
  if ($('.zoom-in').hasClass('zoom-in-active') || $('.zoom-out').hasClass('zoom-out-active')) {
    return;
  }
  removeKeneticSlide();
  //clearRoute();
  clearStartDestination();

  $('.zoom-out').addClass('zooms');
  $('.zoom-out').addClass('zoom-out-active');
  $('.map2').addClass('zooms');

  //zoom(zoomLevel - 1);
  zoom2(zoomLevel - 1);

  setTimeout(function() {
    $('.zooms').removeClass('zooms');
    $('.zoom-out').removeClass('zoom-out-active');
    $('.line-moving').removeClass('line-moving');
  }, 2000);

}

function zoom2(newZoomLevel) {
  //console.log('zoom2 called')
  console.log('prev zoom level: ' + zoomLevel);
  console.log('new zoom level: ' + newZoomLevel)
  var scaleFromBase = Math.pow(zoomScale, newZoomLevel);
  mapPosition.scale = scaleFromBase;
  console.log('new scale: ' + scaleFromBase);

  if (newZoomLevel <= 0) {
    //console.log('adjusting circle text thats too small: ' + (1 / scaleFromBase));
    $('.circle').not(':has(.z10,.z9)').addClass('zooms').each(function() {
      var values = getTransformValues($(this).css('transform'));
      $(this).css('transform', 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(' + (1 / scaleFromBase) + ')');
      //console.log('resizing circle translate(' + values.translateX + 'px,' + values.translateY  + 'px) scale(' + (1 / scaleFromBase) + ')');
    })
  } else {
    $('.circle').not(':has(.z10,.z9)').addClass('zooms').each(function() {
      var values = getTransformValues($(this).css('transform'));
      $(this).css('transform', 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(1)');
    })
  }

  prevZoomLevel = zoomLevel;
  zoomLevel = newZoomLevel;

  var newX = mapPosition.x * scaleFromBase;
  var newY = mapPosition.y * scaleFromBase;

  //console.log('translate(' + newX + 'px,' + newY + 'px) scale(' + scaleFromBase + ')');

  $('.map2').addClass('zooms')
    .css('transform', 'translate(' + newX + 'px,' + newY + 'px) scale(' + scaleFromBase + ')');
  $('.circles-lines-container').addClass('zooms')
    .css('transform', 'translate(' + newX + 'px,' + newY + 'px) scale(' + scaleFromBase + ')');

  $('.right-panel,.bottom-panel,.z10,.z9,.line').addClass('zooms');
  adjustEditor();

  prevZoomLevel = zoomLevel;
  setTimeout(function() {
    // after animation
    //console.log('new map transform values: ' + $('.map2').css('transform'));
    $('.zooms').removeClass('zooms');
  }, 2000);

}

// This section shows all the autocomplete functions

function updateAutocomplete() {
  console.log('updateAutocomplete called.  updating autocomplete list');
  var list = [];
  // Only circles on the current floor are added
  for (var floorName in mapData) {
    var circlesList = mapData[floorName].circles;
    for (var index in circlesList) {
      // Add circle names

      // Duplicate names are not added to the same floor.
      // Duplicates names are used to connect floors, however.
      var found = false;
      for (var searchIndex in list) {
        if (circlesList[index].name == list[searchIndex]) {
          found = true;
        }
      }
      // Unique name found.  Add to list.
      if (found == false) {
        //console.log('autocomplete index' + index);
        var classes = circlesList[index].class.split(' ');
        // circles lying on the editing panel are not included
        if ((classes.indexOf('z10') == (-1)) &&
          (classes.indexOf('z9') == (-1))) {
          // Add circle name
          list.push(circlesList[index].name);

          // Add alias names
          var aliases = circlesList[index].aliases;
          if (typeof aliases != 'undefined') {
            var aliasList = circlesList[index].aliases.split(',');
            for (var index2 in aliasList) {
              //console.log('alias added to autocompleted: ' + aliasList[index2])
              list.push(aliasList[index2]);
            }
          }
        }
      }
    }
  }
  list = list.sort();

  $('#start-input').autocomplete({
    minLength: 0,
    position: {
      my: 'left bottom',
      at: 'left top',
      collision: 'flip'
    },
    autoFocus: 'false',
    source: list,
    select: function(event, ui) {
      $('#start-input').val(ui.item.value);
      showRoute();
    },
    messages: {
      noResults: '',
      results: function() {}
    }
  });

  $('#destination-input').autocomplete({
    minLength: 0,
    position: {
      my: 'left bottom',
      at: 'left top',
      collision: 'flip'
    },
    autoFocus: 'true',
    source: list,
    select: function(event, ui) {
      $('#destination-input').val(ui.item.value);
      showRoute();
    },
    messages: {
      noResults: '',
      results: function() {}
    }
  });

  $("#name").autocomplete({
    minLength: 0,
    position: {
      my: 'left bottom',
      at: 'left top',
      collision: 'flip'
    },
    source: list,
    select: function(event, ui) {
      $('#name').val(ui.item.value);
      updateName();
    },
    messages: {
      noResults: '',
      results: function() {}
    }
  });

}

function showStarts() {
  //console.log('showStart called');
  $('#start-input').autocomplete('search', '');
}

function showDestinations() {
  //console.log('showDestinations called');
  $('#destination-input').autocomplete('search', '');
}

// This section shows all the route calculations and drawings and view movement

function clearRoute() {
  //console.log('clearRoute called')
  //$('.circle').removeClass('zooms route-circle-appear');
  //$('.circle').css('animation-delay', '');
  //$('.circle').css('transition', '');
  //$('.line').removeClass('zooms route-line-appear');
  //$('.line').css('animation-delay', '');
  //$('.line').css('transition', '');
  $('.line').each(function() {
    //console.log('line left: '+ $(this).css('left'));
    redrawLine($(this));
  });
}

function clearStartDestination() {
  //console.log('clearStartDestination called')
  $('#start-input').val('');
  $('#destination-input').val('');
}

var shortestPath = [];

// This shows the path from the start to the destination
// and marks the floors that it passes through.

function showRoute() {
  console.log('showRoute called')
  $('.disable-buttons-overlay').removeClass('disable-buttons-hidden');

  var start = $('#start-input').val();
  var destination = $('#destination-input').val();

  // always show the first circle
  $('.circle').each(function() {
    if (start.toLowerCase() != $(this).text().toLowerCase()) {
      $(this).removeClass('zooms');
    }
  });
  $('.line').removeClass('zooms');

  $('.floor-highlight').removeClass('floor-highlight');

  // both fields must be set before a path is made.
  // If one is set, the same value is used for the other
  if ((start == '') && (destination == '')) {
    $('.disable-buttons-overlay').addClass('disable-buttons-hidden');
    return;
  } else if ((start != '') && (destination == '')) {
    destination = start;
  } else if ((start == '') && (destination != '')) {
    start = destination;
  }

  // search for the circle name if alias selected
  start = findCircleName(start);
  destination = findCircleName(destination);

  // build path
  shortestPath = buildShortestPathTree(start, destination);

  if ((typeof shortestPath == 'undefined') || (
      shortestPath.length == 0)) {
    console.log('No such path found');
    $('.disable-buttons-overlay').addClass('disable-buttons-hidden');
    $('#start-input').blur();
    $('#destination-input').blur();
    return;
  }

  $('.disable-buttons-overlay').addClass('disable-buttons-hidden');

  $('#start-input').blur();
  $('#destination-input').blur();

  // floors are marked that are part of the route
  console.log('shortest path: ' + shortestPath.toString());
  //alert('path waypoints ' + shortestPath.toString());
  markFloors(shortestPath);

  // finally, the path is drawn
  setTimeout(function() {
    drawPath(shortestPath, lineDrawTime, true);
  }, 100);
}

function findCircleName(possibleAlias) {
  var foundName = possibleAlias;
  for (var floorName in mapData) {
    var circlesList = mapData[floorName].circles;
    for (var index2 in circlesList) {
      if (circlesList[index2].name == foundName) {
        return foundName;
      } else {
        var aliases = circlesList[index2].aliases;
        if (typeof aliases != 'undefined') {
          var aliasList = circlesList[index2].aliases.split(',');
          for (var index3 in aliasList) {
            if (possibleAlias == aliasList[index3]) {
              foundName = circlesList[index2].name;
              return foundName;
            }
          }
        }
      }
    }
  }
  return;
}

function buildShortestPathTree(startingPoint, endPoint) {
  console.log('buildShortestPathTree called')
  var shortestPath = [];

  if ((typeof startingPoint == "undefined") || (typeof endPoint == "undefined")) {
    return shortestPath;
  }
  //console.log('Starting route');
  // checklist used to verify the shortest path to each point
  var pointsChecklist = {};
  for (var floorName in mapData) {
    var circlesList = mapData[floorName].circles;
    for (var index in circlesList) {
      var classes = circlesList[index].class;
      if ((classes.indexOf('z10') > 0) && (classes.indexOf('z9') > 0)) {
        continue;
      }
      var name = circlesList[index].name;
      pointsChecklist[name] = {};
      pointsChecklist[name].parent = "";
      pointsChecklist[name].shortestDistanceToHere = Number.MAX_VALUE;
      pointsChecklist[name].noOtherPaths = false; // Lets you know if the point is a dead end (or final point)
    }
  }

  //console.log('Points checklist built');

  // Starting and end points have to be in the checklist to work
  if ((pointsChecklist.hasOwnProperty(startingPoint) == false) ||
    (pointsChecklist.hasOwnProperty(endPoint) == false)) {
    return;
  }

  // reset origin
  pointsChecklist[startingPoint].shortestDistanceToHere = 0;

  // Starting point will be point with distance initially set to zero
  var nextClosestPoint = getNextClosestPoint();

  // This loop finds the shortest path at each point.  Djikstra's algorithm
  while (nextClosestPoint != "none") {
    //console.log("Start looping through index " + nextClosestPoint);
    var nextPoint = "none";
    for (var floorName in mapData) {
      var linesList = mapData[floorName].lines;
      for (var index in linesList) {
        if (lineGoesToPanel(linesList[index]) == true) {
          //console.log('line ' + linesList[index].begin + ' ' + linesList[index].end + ' goes to panel');
          continue;
        }
        var found = false;
        if (linesList[index].begin == nextClosestPoint) {
          nextPoint = linesList[index].end;
          found = true;
        } else if (linesList[index].end == nextClosestPoint) {
          nextPoint = linesList[index].begin;
          found = true;
        }
        if (found) {
          if (pointsChecklist[nextPoint].noOtherPaths == false) {
            var lineLength = parseFloat(linesList[index].length);
            //console.log('next point ' + nextPoint);
            var circle = getCircle(nextPoint);
            //console.log('circle weight ' +  parseFloat(circle.weight));
            var circleWeight;
            if ((typeof circle.weight == 'undefined') || parseFloat(circle.weight < 0)) {
              circleWeight = 1;
            } else {
              circleWeight = parseFloat(circle.weight);
            }
            var weightedLength = lineLength * circleWeight;
            //console.log('circle weight: ' + circleWeight + ' weight length ' + weightedLength);

            if ((pointsChecklist[nextPoint].shortestDistanceToHere == Number.MAX_VALUE) ||
              (pointsChecklist[nextPoint].shortestDistanceToHere >
                (pointsChecklist[nextClosestPoint].shortestDistanceToHere + weightedLength))) {

              pointsChecklist[nextPoint].shortestDistanceToHere =
                pointsChecklist[nextClosestPoint].shortestDistanceToHere + weightedLength;
              pointsChecklist[nextPoint].parent = nextClosestPoint;
            }
          }

        }
      }
    }

    pointsChecklist[nextClosestPoint].noOtherPaths = true;
    //console.log("Finished checking all paths leaving current point " + nextClosestPoint);
    nextClosestPoint = getNextClosestPoint();
  }
  console.log("Dijkstra's Algorithm Done");

  // Path is obtained by going from end point and following the parents to the starting point
  // Sequence is reversed by stacking on the front of the array with unshift
  var nextName = endPoint;
  while (pointsChecklist[nextName].parent != "") {
    //console.log("Point traversed: " + nextName);
    shortestPath.unshift(nextName); // unshift places items first in the array, unlike push
    nextName = pointsChecklist[nextName].parent;
  }
  shortestPath.unshift(nextName);
  //alert(shortestPath)

  // verify if a path does indeed exist
  if ((shortestPath[shortestPath.length - 1] == endPoint) &&
    (shortestPath[0] == startingPoint)) {
    console.log('shortest path found')
    return shortestPath;
  } else {
    return [];
  }

  // Additional functions used only by buildShortestPathTree
  // Finds the next closest point thats connected and hasnt been determined as a dead end
  function getNextClosestPoint() {
    var shortestDistance = -1;
    var locatedPoint = "none";
    // Find the cloest point that hasn't been checked off (confirmed not shortest path)
    for (var name in pointsChecklist) {
      //console.log("Searching index " + index);
      if (pointsChecklist[name].noOtherPaths == false) {
        if ((shortestDistance == -1) ||
          (pointsChecklist[name].shortestDistanceToHere < shortestDistance)) {
          shortestDistance = pointsChecklist[name].shortestDistanceToHere;
          if (shortestDistance != Number.MAX_VALUE) {
            locatedPoint = name;
          }
        }
      }
    }
    return locatedPoint;
  }

  function lineGoesToPanel(line) {
    var circleNameBegin = line.begin;
    var circleNameEnd = line.end;
    for (var floorName in mapData) {
      var circlesList = mapData[floorName].circles;
      for (var index in circlesList) {
        if ((line.begin == circlesList[index].name) || (line.end == circlesList[index].name)) {
          var classes = circlesList[index].class;
          if ((classes.indexOf('z10') > 0) || (classes.indexOf('z9') > 0)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function getCircle(circleName) {
    for (var floorName in mapData) {
      var circlesList = mapData[floorName].circles;
      for (var index in circlesList) {
        if (circleName == circlesList[index].name) {
          return circlesList[index];
        }
      }
    }
  }
}

// Floor buttons that contain part of the route are highlighted blue
function markFloors(path) {
  console.log('markFloors called. marking floors');

  if (path.length == 1) {

  }

  for (var floorName in mapData) {
    var circlesList = mapData[floorName].circles;

    // count the number of circles on the floor that is part of the route
    var numberOfCirclesOnFloor = 0;

    for (var index in circlesList) {
      for (var pathIndex in path) {
        if (circlesList[index].name == path[pathIndex]) {
          numberOfCirclesOnFloor = numberOfCirclesOnFloor + 1;
        }
      }
    }

    // If its 2 or more, then mark the floor.
    // Otherwise it could be just an elevator passing through.
    if (numberOfCirclesOnFloor > 1) {
      var floorNumberArray = floorName.split('floor');
      var floorNumber = floorNumberArray[1];
      $('.map-button').filter(function() {
        return $(this).text() == floorNumber;
      }).addClass('floor-highlight');
    }

    // If the only one entry (start/destination) is filled then show that floor
    if ((numberOfCirclesOnFloor == 1) && (path.length == 1)) {
      var floorNumberArray = floorName.split('floor');
      var floorNumber = floorNumberArray[1];
      $('.map-button').filter(function() {
        return $(this).text() == floorNumber;
      }).addClass('floor-highlight');
    }
  }
}

// This is the animation for the path drawing.

// timesouts are used to sequentially pan the camera view
// They need to be cleared out individually when the panning is canceled (when the map is clicked).
var timeouts = [];

function drawPath(path, delayDuration, enablePan) {
    console.log('drawPath called.  drawing path: ' + path.toString + ' delay: ' + delayDuration + ' panning enabled: ' + enablePan);

    for (var index in timeouts) {
      clearTimeout(timeouts[index]);
    }
    timeouts = [];

    $('.disable-buttons-overlay').removeClass('disable-buttons-hidden');
    $('.zoom-in').addClass('zoom-out-active');
    $('.zoom-out').addClass('zoom-out-active');

    //clearRoute();

    $('.circle:not(.z10,.z9)').each(function() {
      var startName = $('#start-input').val();
      var destinationName = $('#destination-input').val();

      // hide only enroute circles
      // begin and end circles are not hidden
      if (($(this).text() == startName) || ($(this).text() == destinationName)) {
        $(this).removeClass('map-hidden opacity-0');

      } else {
        //console.log('circle hidden: ' + $(this).text());
        // key points on map are not hidden
        if ($(this).attr('data-appearance') == 'always') {
          $(this).removeClass('map-hidden opacity-0');

        } else if ((path.indexOf($(this).text()) > 0) && ($(this).attr('data-appearance') == 'route')) {
          // key point on route are not hidden
          $(this).removeClass('map-hidden opacity-0');
        } else {
          // hide all others
          $(this).addClass('map-hidden').removeClass('opacity-0');
        }
      }
    });

    $('.line').addClass('opacity-0');
    for (var index in path) {
      if (index > 0) {
        $('.line[data-begin="' + path[parseInt(index)] + '"][data-end="' + path[parseInt(index) - 1] + '"]').removeClass('opacity-0');
        $('.line[data-begin="' + path[parseInt(index) - 1] + '"][data-end="' + path[parseInt(index)] + '"]').removeClass('opacity-0');
      }

    }

    var timer = 0;

    for (var index in path) {

      // the next circle on the path
      var circle = getCircle(path[parseInt(index)]);
      var circleCurrent = circle.not(':has(.z10,.z9)');

      // is it on the map?
      if (circleCurrent.length > 0) {
        // the camera moves to follow the path drawing
        timeouts.push(setTimeout(function(panCircle) {
          if ($('.zoom-in').hasClass('zoom-out-active') &&
            $('.zoom-out').hasClass('zoom-out-active')) {
            if (panCircle.attr('data-appearance') == 'enroute') {
              panCircle.removeClass('map-hidden');
            }
            if (enablePan == true) {
              panToCircle(panCircle);
            }
          }
        }, timer * delayDuration * 1000, circleCurrent));
      }

      //console.log('set timer: ' + timer);

      if (circleCurrent.length > 0) {
        timer++;
      }

      if (parseInt(index) == path.length - 1) {
        // some clean up after the path animation
        setTimeout(function(lastCircle) {
          lastCircle.removeClass('map-hidden');
          $('.zoom-in').removeClass('zoom-out-active');
          $('.zoom-out').removeClass('zoom-out-active');
          console.log('path drawn.  clearing out route.');
          //clearRoute();

          $('.disable-buttons-overlay').addClass('disable-buttons-hidden');
        }, (timer * delayDuration) * 1000, circleCurrent);
      }
    }
  }
  /*
  // The animation requires a separate function in order to trigger
  function triggerLine(line) {
    setTimeout(function() {
      //console.log('transtion: ' + line.css('transition'));
      line.removeClass('route-line-zero');
    }, 100);
  }
  */

// The map can follow the path as it appears
function panToCircle(selection) {
  //console.log('panToCircle called');
  recordPanelCircles();
  var scaleFromBase = Math.pow(zoomScale, zoomLevel);
  //console.log('before mapPosition: ' + mapPosition.x + ',' + mapPosition.y)
  diff.x = (-1) * (mapPosition.x + parseFloat(selection.css('left'))) * scaleFromBase;
  diff.y = (-1) * (mapPosition.y + parseFloat(selection.css('top'))) * scaleFromBase;
  $('.map2').addClass('zooms');
  $('.circles-lines-container').addClass('zooms');
  panMap();

}

// clicking anywhere on the map cancels the panning and draws the entire route
function skipAnimation() {
  console.log('skipAnimation called');
  $('.zooms').removeClass('zooms');
  removeKeneticSlide();

  for (var index in shortestPath) {
    var circle = getCircle(shortestPath[parseInt(index)]);
    if ((circle.attr('data-appearance') == 'always') ||
      (circle.attr('data-appearance') == 'route')) {
      circle.removeClass('map-hidden');
    } else if ((index == 0) || (index == (shortestPath.length - 1))) {
      circle.removeClass('map-hidden');
    }

  }
  $('.disable-buttons-overlay').addClass('disable-buttons-hidden');
  $('.zoom-in').removeClass('zoom-out-active');
  $('.zoom-out').removeClass('zoom-out-active');

}

// End of public functions

// Beginning of edit mode functions

// This function enables circles to be draggable
// all line connection and circle selection and edit is done through here
// The key 3 functions checks for mouse/touch start, moving, and stop

// Original draggable code from http://popdevelop.com/2010/08/touching-the-web/

// Used to draw lines connecting two circles
var firstCircle = $('.circle');

$.fn.draggable = function() {

    var offset = null;
    var mouseOffset = null;
    var mouseDownState = false;
    var selectedCircle = this;

    // on touchstart or mousedown
    var start = function(e) {
      console.log('(mouse/touch draggable) start called');

      // stops the kenetic slide from swiping the map
      removeKeneticSlide();

      if ($('.edit-mode').hasClass('edit-mode-on') == false) {
        return;
      }

      // no editing during zoom animations
      if ($('.zoom-in').hasClass('zoom-in-active') ||
        $('.zoom-out').hasClass('zoom-out-active')) {
        return;
      }

      // prevents the container div from being dragged
      e.preventDefault();

      // new circles need to remove their zoom-in animations once they start moving
      //$(this).removeClass('zooms-circle');

      // calculate offset of where you touched the circle (allows you to drag from any part of the circle)
      var orig = e.originalEvent;
      var pos = $(this).position();
      if (e.type == "touchstart") {
        offset = {
          x: orig.changedTouches[0].pageX - pos.left,
          y: orig.changedTouches[0].pageY - pos.top
        };
      } else if (e.type == "mousedown") {
        console.log('clicking position: ' + orig.pageX + ',' + orig.pageY);
        // offset calculated so the circle is being dragged at the same point touched/clicked
        mouseDownState = true;
        mouseOffset = {
          x: orig.pageX - pos.left,
          y: orig.pageY - pos.top
        };
      }

      // Selected circles are highlighted gold when being dragged
      // then are highlighted white afterwards.
      // Only one circle is highlighted at time.
      // The edit circle name panel shows the selected circle
      // Line connections are also from the selected circle

      $(this).addClass('selected');

      // Mobile only
      if (e.type == "touchstart") {
        var firstName = firstCircle.text();
        var secondName = $(this).text();
        if (orig.touches.length == 1) {
          // first circle set.  second circle touched will add a line to connect them
          firstCircle = $(this);
        }
        if (orig.touches.length > 1) {
          // two touched circles connected with a new line
          var firstPos = firstCircle.position();
          var noDuplicate = true;
          $('div[data-begin="' + firstName + '"][data-end="' + secondName + '"],div[data-begin="' + secondName + '"][data-end="' + firstName + '"]').each(function() {
            noDuplicate = false;
          });
          if ((noDuplicate == true) && (firstName != secondName)) {
            createLine(firstPos.left, firstPos.top, pos.left, pos.top, firstName, secondName);
          } else {
            alert('No duplicate connections allowed');
          }
        }

      }

      // Desktop only.  Mouse interface requires clicking 'Connect'
      // to draw a line between two circle.  
      // Select the circle, click connect, then click another circle.

      if ($('.move-connect').hasClass('move-connect-selected')) {
        firstCircle = $('.selected-edit');
        var secondName = $(this).text();
        // line cannot be to itself
        if (firstName != secondName) {

          var firstName = firstCircle.text();
          var secondName = $(this).text();

          var firstPos = firstCircle.position();
          var noDuplicate = true;
          $('div[data-begin="' + firstName + '"][data-end="' + secondName + '"],div[data-begin="' + secondName + '"][data-end="' + firstName + '"]').each(function() {
            noDuplicate = false;
          });

          if (noDuplicate == true) {
            $('.message').remove();
            createLine(firstPos.left, firstPos.top, pos.left, pos.top, firstName, secondName);
          } else {
            var message = $('<div>')
              .text('No duplicate lines on same floor')
              .addClass('message');

            $('.message').remove();
            $('.move-connect').after(message);
            setTimeout(function() {
              $('.message').remove();
            }, 5000);
          }
        }

        // Circle editing panel does not show the newly selected circle when connect mode is on.
        // The connection capability is turned on if the 'Connect' button is enabled (turns brown).
        // Instead the previous circle is shown (...might be redundant, but if for some reasons is wasn't shown)
        updateEditBox(firstCircle);

      } else {
        // Otherwise, the currently selected circle gets shown in the editing panel (in edit mode)
        updateEditBox($(this));
      }

    }

    // Sometime the mouse moves too quicly and is no longer hovering
    // over the circle even though the mous button is down.
    // To keep track of the moving circle, I assigned it to a variable.

    // touch based move
    var moveMe = function(e) {
      selectedCircle = this;
      move(e);
    }

    // mouse based move
    var mouseMoveMe = function(e) {
      if (mouseDownState == false) {
        // mouse has not been clicked
        return;
      }
      selectedCircle = $('.selected');
      move(e);
    }

    // general moved used by both mouse and touch
    var move = function(e) {
      //console.log('(mouse/touch draggable) move called');

      // prevents the screen from being accidentally dragged
      e.preventDefault();

      // circles cannot be moved while outside edit mode
      if ($('.edit-mode').hasClass('edit-mode-on') == false) {
        return;
      }
      // circles cannot be moved while zooming
      if ($('.zoom-in').hasClass('zoom-in-active') ||
        $('.zoom-out').hasClass('zoom-out-active')) {
        return;
      }

      var orig = e.originalEvent;

      // the new circle location is calculated and assigned
      var newYPos;
      var newXPos;

      //console.log('mouseDownState: ' + mouseDownState);
      if (e.type == "touchmove") {
        newYPos = orig.changedTouches[0].pageY - offset.y;
        newXPos = orig.changedTouches[0].pageX - offset.x;
      } else if (e.type == "mousemove") {
        if (mouseDownState == false) {
          // mouse has not been clicked
          return;
        }
        newYPos = orig.pageY - mouseOffset.y;
        newXPos = orig.pageX - mouseOffset.x;
      }

      var scaleFromBase = Math.pow(zoomScale, zoomLevel);
      var values = getTransformValues($(selectedCircle).css('transform'));

      if (zoomLevel <= 0) {
        //console.log('adjusting circle text thats too small: ' + (1 / scaleFromBase));
        //console.log('selected circle name: ' + $(selectedCircle).text() + ' z10,z9 circle (1 = yes) ?: ' + $(selectedCircle).not(':has(.z10,.z9)').length);
        $(selectedCircle).not(':has(.z10,.z9)').css({
          top: ((newYPos + values.translateX) / scaleFromBase) + 'px',
          left: ((newXPos + values.translateY) / scaleFromBase) + 'px',
          transform: 'scale(' + (1 / scaleFromBase) + ')'
        });
      } else {
        $(selectedCircle).not(':has(.z10,.z9)').css({
          top: ((newYPos + values.translateX) / scaleFromBase) + 'px',
          left: ((newXPos + values.translateY) / scaleFromBase) + 'px',
          transform: 'scale(1)'
        });
      }

      //console.log('z10,z9 circle (1 = yes) ?: ' + $(selectedCircle).filter('.circle').length);
      $(selectedCircle).filter('.z10,.z9').css({
        top: ((newYPos + values.translateX) / scaleFromBase) + 'px',
        left: ((newXPos + values.translateY) / scaleFromBase) + 'px',
        transform: 'scale(' + values.scaleX + ')'
      });

      // Lines are redraw after moving the circle

      var currentName = $(selectedCircle).text();
      var circleXPos = parseFloat($(selectedCircle).css('left')) + values.translateX;
      var circleYPos = parseFloat($(selectedCircle).css('top')) + values.translateY;

      $('[data-begin="' + currentName + '"]').each(function() {

        var otherName = $(this).attr('data-end');
        var otherNameCircle = getCircle(otherName);
        var otherValues = getTransformValues($(otherNameCircle).css('transform'));
        var sameXPos = parseFloat(otherNameCircle.css('left')) + otherValues.translateX;
        var sameYPos = parseFloat(otherNameCircle.css('top')) + otherValues.translateY;
        updateLine($(this), circleXPos, circleYPos, sameXPos, sameYPos);

      });
      $('[data-end="' + currentName + '"]').each(function() {

        var otherName = $(this).attr('data-begin');
        var otherNameCircle = getCircle(otherName);
        var otherValues = getTransformValues($(otherNameCircle).css('transform'));
        var sameXPos = parseFloat(otherNameCircle.css('left')) + otherValues.translateX;
        var sameYPos = parseFloat(otherNameCircle.css('top')) + otherValues.translateY;
        updateLine($(this), sameXPos, sameYPos, circleXPos, circleYPos);
      });

      // Circles can be move to the editing panels so they
      // dont move along with the map.  They are kept track of
      // by assigning a z-index class z10 (right panel) or z9 (bottom panel)

      var panels = getPanelPositions();

      var callUpdateAutocomplete = false;
      //console.log('movingX: ' + newXPos + ' panelEdge: ' + panels.rightPanelLeft);
      // Set on board z-index if moved to board
      if ((newXPos / scaleFromBase) < panels.rightPanelLeft) {
        if ($(selectedCircle).hasClass('z10') == true) {
          callUpdateAutocomplete = true;
          $(selectedCircle).removeClass('z10');
        }

        if ((newYPos / scaleFromBase) < panels.bottomPanelTop) {
          // circle is resized and placed on map level
          if ($(selectedCircle).hasClass('z9') == true) {
            $(selectedCircle).removeClass('z9');
            callUpdateAutocomplete = true;
          }
          $(selectedCircle).css({
            'width': circleSize + 'px',
            'height': circleSize + 'px',
            'margin-left': (-1) * circleSize / 2 + 'px',
            'margin-top': (-1) * circleSize / 2 + 'px',
            'border-radius': (circleSize * 2 / 3) + 'px'
          });
        } else {
          // circle is set to 60 and set to bottom panel level
          var values = getTransformValues($(selectedCircle).css('transform'));
          $(selectedCircle).addClass('z9 circle-60 no-transition')
            .css({
              'width': '',
              'height': '',
              'margin-left': '',
              'margin-top': '',
              'border-radius': '',
              'transform': 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(' + (1 / scaleFromBase) + ')'
            });

        }
      } else {
        // circle is set to 60 and set to right panel level
        var values = getTransformValues($(selectedCircle).css('transform'));
        $(selectedCircle).addClass('z10 circle-60 no-transition')
          .css({
            'width': '',
            'height': '',
            'margin-left': '',
            'margin-top': '',
            'border-radius': '',
            'transform': 'translate(' + values.translateX + 'px,' + values.translateY + 'px) scale(' +
              (1 / scaleFromBase) + ')'
          });
        //console.log('matrix ' + $(selectedCircle).css('transform'));
        //console.log('scale from base ' + scaleFromBase);
      }

      if (callUpdateAutocomplete == true) {
        updateAutocomplete();
      }

      //var bodyWidth = parseFloat($('body').css('width'));
      //var panelWidth = parseFloat($('.right-panel').css('width'));
      var newCircleBoxHeight = parseFloat($('.new-circle').css('height'));
      var newCircleBoxWidth = parseFloat($('.new-circle').css('width'));
      var removeCircleBoxHeight = parseFloat($('.remove-circle').css('height'));
      var removeCircleBoxWidth = parseFloat($('.remove-circle').css('width'));

      // If the new circle box is empty, add new circle
      if (((newXPos / scaleFromBase) < panels.rightPanelLeft) ||
        ((newYPos / scaleFromBase) > panels.rightPanelTop + ((newCircleBoxHeight + 20) / scaleFromBase))) {

        if (isBoxEmpty()) {
          addNewCircle();
        }
      }

      // The trash can highlights when a the circle is move over it
      if (((newXPos / scaleFromBase) > panels.rightPanelLeft + ((20 + newCircleBoxWidth) / scaleFromBase)) &&
        ((newYPos / scaleFromBase) < panels.rightPanelTop + ((20 + newCircleBoxHeight) / scaleFromBase))) {
        //if (((newXPos / scaleFromBase) > panels.rightPanelLeft) &&
        //  ((newYPos / scaleFromBase) > panels.rightPanelTop + ((newCircleBoxHeight + 20) / scaleFromBase)) &&
        //  ((newYPos / scaleFromBase) < panels.rightPanelTop + ((20 + newCircleBoxHeight + 20 + removeCircleBoxHeight + 20) / scaleFromBase))) {
        $('.icon').addClass('icon-mouseover');
      } else {
        $('.icon').removeClass('icon-mouseover');
      }

    }

    // touch based
    var stopMe = function(e) {
      selectedCircle = this;
      stop(e);
    }

    // mouse based
    var mouseStopMe = function(e) {
      if (mouseDownState == false) {
        // mouse has not been clicked
        return;
      }

      selectedCircle = $('.selected');
      stop(e);

    }

    // general stop for mouse and touch
    var stop = function(e) {
      console.log('(mouse/touch draggable) stop called');
      e.preventDefault();

      // no editing done unless in edit mode
      if ($('.edit-mode').hasClass('edit-mode-on') == false) {
        return;
      }

      // prevents the container from being dragged
      var orig = e.originalEvent;

      var newYPos;
      var newXPos;

      if (e.type == "touchend") {
        newYPos = orig.changedTouches[0].pageY - offset.y;
        newXPos = orig.changedTouches[0].pageX - offset.x;
      } else if ((e.type == "mouseup") && (mouseDownState == true)) {
        newYPos = orig.pageY - mouseOffset.y;
        newXPos = orig.pageX - mouseOffset.x;
        // reset mouse down flag
        mouseDownState = false;
      }

      // These are the dimenions for some of the editing panels.
      // It's to calcluate if the circle has be dragged over it
      var bodyWidth = parseFloat($('body').css('width'));
      var panelWidth = parseFloat($('.right-panel').css('width'));
      var newCircleBoxHeight = parseFloat($('.new-circle').css('height'));
      var newCircleBoxWidth = parseFloat($('.new-circle').css('width'));
      var removeCircleBoxHeight = parseFloat($('.remove-circle').css('height'));

      var scaleFromBase = Math.pow(zoomScale, zoomLevel);
      var panels = getPanelPositions();

      // trash can removes circles dragged over it
      // This is how circles are removed from the board
      if (((newXPos / scaleFromBase) > panels.rightPanelLeft + ((20 + newCircleBoxWidth) / scaleFromBase)) &&
        ((newYPos / scaleFromBase) < panels.rightPanelTop + ((20 + newCircleBoxHeight) / scaleFromBase))) {
        var currentName = $(selectedCircle).text();
        $('.line[data-begin="' + currentName + '"],.line[data-end="' + currentName + '"]').each(function() {
          $("#name").val('');
          $('#line-ends').html('');
          $(this).remove();
        });
        $(selectedCircle).remove();

        // The auto complete fields for drawing routes needs to be updated.
        // This recalculates the remaining circles.
        updateAutocomplete();
      }

      // Since the trash can is now so close, sometimes it deletes before another circle appears.
      // Another check is needed to ensure a new circle is available.
      if (isBoxEmpty()) {
        addNewCircle();
      }

      // reselect the original selection if using the connect button to draw a line
      // to a new circle
      if ($('.move-connect').hasClass('move-connect-selected') == false) {
        $('.selected-edit').removeClass('selected-edit');
        $(selectedCircle).addClass('selected-edit');

      }

      $(selectedCircle).removeClass('selected');

      // clears trash can highlight and returns the line colors back to normal
      $('.icon').removeClass('icon-mouseover');
      $('.line-moving').removeClass('line-moving')

    }

    // Initialization of new draggable circle by setting it as selected
    $('.selected-edit').removeClass('selected-edit');
    $(this).addClass('selected-edit');

    // add events to each circle (must be declaried after function declarations)
    this.bind("touchstart mousedown", start);
    this.bind("touchmove mousemove", moveMe);
    $(document).bind("mousemove", mouseMoveMe);
    this.bind("touchend mouseup", stopMe);
    $(document).bind("mouseup", mouseStopMe);

  } // End of draggable function

// checks to see to if the the New Circle box is empty
function isBoxEmpty() {
  console.log('isBoxEmpty called');
  var isEmpty = true;

  //var bodyWidth = parseFloat($('body').css('width'));
  var panelWidth = parseFloat($('.right-panel').css('width'));
  var newCircleBoxHeight = parseFloat($('.new-circle').css('height'));
  var scaleFromBase = Math.pow(zoomScale, zoomLevel);
  var panels = getPanelPositions();

  $('.circle.z10').each(function() {
    var values = getTransformValues($(this).css('transform'));
    var currentLeftPos = parseFloat($(this).css('left')) + values.translateX;
    var currentTopPos = parseFloat($(this).css('top')) + values.translateY;
    //console.log('currentLeftPos ' + currentLeftPos + ' rightPanelLeft ' + panels.rightPanelLeft);
    //console.log('currentTopPos ' + currentTopPos + ' right panel bottom ' + (panels.rightPanelTop + ((newCircleBoxHeight + 20) / scaleFromBase)));
    if ((currentLeftPos > panels.rightPanelLeft) &&
      (currentTopPos < (panels.rightPanelTop + ((newCircleBoxHeight + 20) / scaleFromBase)))) {

      isEmpty = false;
    }
  });
  console.log('empty: ' + isEmpty);
  return isEmpty;
}

// add a new circle to the NewCircle box.
// will use lowest available number as the name if no name is used
function addNewCircle(name) {
  console.log('addNewCircle called: ' + name);

  // the next available number is used as the name if the name isn't specified
  var circleIndex = 0;
  if (typeof name == 'undefined') {
    var hasDuplicate;
    do {
      hasDuplicate = false;
      circleIndex++;
      var circleName = findCircleName(circleIndex);
      if (typeof circleName != 'undefined') {
        hasDuplicate = true;
      }
    } while ((hasDuplicate == true) || (circleIndex > 10000));

    if (circleIndex > 10000) {
      // insert warning of exceeded remcommend number of indexes
      showErrorMessage('No duplicate on same floor', $('.move-connect'));
      return;
    } else {
      $('.message').remove();
    }
  }

  console.log('found unique circle index: ' + circleIndex);

  name = circleIndex;

  var scaleFromBase = Math.pow(zoomScale, zoomLevel);
  //var bodyWidth = parseFloat($('body').css('width'));
  //var panelWidth = parseFloat($('.right-panel').css('width')) / scaleFromBase;
  var newCircleBoxHeight = parseFloat($('.new-circle').css('height')) / scaleFromBase;
  var newCircleBoxWidth = parseFloat($('.new-circle').css('width')) / scaleFromBase;
  var panel = getPanelPositions();
  var centerOfPanelX = panel.rightPanelLeft + 20 + (newCircleBoxWidth / 2);
  var centerOfPanelY = panel.rightPanelTop + 20 + (newCircleBoxHeight / 2);

  console.log('adding circle with name: ' + name);
  var circle = $('<div>')
    .addClass('circle draggable z10 selected-edit opacity-0')
    .css('transform', 'translate(' + centerOfPanelX + 'px,' + centerOfPanelY +
      'px) scale(' + (1 / scaleFromBase) + ')')
    .text(name);

  circle.appendTo('.circles-lines-container');

  var newCircle = $('.circle').last();
  newCircle.draggable();
  setTimeout(function() {
    newCircle.removeClass('opacity-0').addClass('no-transition');
  }, 100);

}

// The circle name/line editor box shows the circle that is touched/clicked-on
function updateEditBox(selection) {
  console.log('updateEditBox called');
  $('.message').remove(); // duplicate warning removed if present

  var name = selection.text();
  // Update edit box
  $('#name').val(name);

  // Populate alist list
  $('#alias').val('');
  $('#alias-list').html('');

  if (typeof selection.attr('data-aliases') != 'undefined') {
    console.log('populating aliases: ' + selection.attr('data-aliases'));

    var aliasList = selection.attr('data-aliases').split(',');

    for (var index in aliasList) {

      var aliasEntry = $('<div>');
      var aliasName = $('<div>')
        .addClass('alias-entry-style')
        .text(aliasList[index]);
      var deleteContainer = $('<div>')
        .addClass('set-right')
        .click(function() {
          $(this).parent().remove();

          // update alias list
          var aliasString = ''
          $('.alias-entry-style').each(function() {
            if (aliasString == '') {
              aliasString = $(this).text();
            } else {
              aliasString = aliasString + ',' + $(this).text();
            }
          });
          var circle = getCircle($('#name').val());
          circle.attr('data-aliases', aliasString);
        });
      var deleteButton = $('<span>')
        .addClass('glyphicon glyphicon-remove');
      deleteButton.appendTo(deleteContainer);
      aliasName.appendTo(aliasEntry);
      deleteContainer.appendTo(aliasEntry);
      aliasEntry.appendTo('#alias-list');
    }
  }

  // Populate line list
  $('#line-ends').html('');

  $('.line[data-begin="' + name + '"],.line[data-end="' + name + '"]').each(function() {
    var endName;
    if ($(this).attr('data-begin') == name) {
      endName = $(this).attr('data-end');
    } else {
      endName = $(this).attr('data-begin');
    }

    var lineEntry = $('<div>');
    var lineName = $('<div>')
      .addClass('entry-style')
      .text(endName);
    var deleteContainer = $('<div>')
      .addClass('set-right')
      .click(function() {
        var startName = $('.selected-edit').text();
        var endName = $(this).parent().find('div:nth-child(1)').text();
        $('.line[data-begin="' + startName + '"][data-end="' + endName + '"]').remove();

        $('.line[data-begin="' + endName + '"][data-end="' + startName + '"]').remove();

        $(this).parent().remove();
      });
    var deleteButton = $('<span>')
      .addClass('glyphicon glyphicon-remove');
    deleteButton.appendTo(deleteContainer);
    lineName.appendTo(lineEntry);
    deleteContainer.appendTo(lineEntry);
    lineEntry.appendTo('#line-ends');
  });

  $('#weight').val(selection.attr('data-weight'));

  if (typeof selection.attr('data-appearance') == 'undefined') {
    selection.attr('data-appearance', 'begin-end');
    $('input[name=display][value="begin-end"]', '.route-radio-buttons-form').prop('checked', true);
  } else {
    $('input[name=display][value="' + selection.attr('data-appearance') + '"]', '.route-radio-buttons-form').prop('checked', true);
  }

}

// Selected circle name can be updated
function updateName() {
  console.log('updateName called');
  var oldName = $('.selected-edit').text();
  var newName = $('#name').val();
  
  if (($('#name').val() == '') || ($('#name').val() == ' ')) {
    showErrorMessage('Blank names are not allowed', $('#name'));
    return;
  }

  var hasDuplicate = false;
  var circle = getCircle(newName);
  if (circle.length > 0) {
    hasDuplicate = true;
  }

  if (hasDuplicate) {
    // insert warning of duplicate
    showErrorMessage('No duplicates on same floor', $('#name'));
    return;
  } else {
    $('.message').remove();
  }

  // name update affects connecting lines 
  $('[data-begin]').each(function() {
    if ($(this).attr('data-begin') == oldName) {
      $(this).attr('data-begin', newName);
    }
  });
  $('[data-end]').each(function() {
    if ($(this).attr('data-end') == oldName) {
      $(this).attr('data-end', newName);
    }
  });

  // circle name updated
  $('.selected-edit').text(newName);
  var indexes = getCircleIndexes(oldName);
  if (typeof indexes != 'undefined') {
    /*console.log(JSON.stringify(indexes));
    console.log('circle name ' + mapData[indexes.floorName].circles[indexes.circleIndex].name);
    mapData[indexes.floorName].circles[indexes.circleIndex].name = newName;
    console.log('circle new name ' + mapData[indexes.floorName].circles[indexes.circleIndex].name);
    console.log('mapData');
    console.log(mapData)
    updateAutocomplete();*/

    saveMap($('.map-selected').text());
  } else {
    console.log('updateName error, unable to find circle in data model')
  }

}

function getCircleIndexes(nameOrAlias) {
  var indexes = {
    floorName: '',
    circleIndex: -1,
    aliasIndex: -1
  }

  for (var floorName in mapData) {
    var circlesList = mapData[floorName].circles;
    for (var index2 in circlesList) {
      if (nameOrAlias == circlesList[index2].name) {
        indexes = {
          floorName: floorName,
          circleIndex: parseInt(index2)
        };
        return indexes;
      } else {
        var aliases = circlesList[index2].aliases;
        if (typeof aliases != 'undefined') {
          var aliasList = circlesList[index2].aliases.split(',');
          for (var index3 in aliasList) {
            if (nameOrAlias == aliasList[index3]) {
              indexes = {
                foorName: floorName,
                circleIndex: parseInt(index2),
                aliasIndex: parseInt(index3)
              }
              return indexes;
            }
          }
        }
      }
    }
  }

  return;
}

function addAlias() {
  console.log('addAlias called');
  
  if (($('#alias').val() == '') || ($('#alias').val() == ' ')) {
    showErrorMessage('Blank aliases are not allowed', $('#alias'));
    return;
  }

  var associatedCircle = findCircleName($('#alias').val());
  console.log('searched alias returns circle name ' + associatedCircle);
  if (typeof associatedCircle != 'undefined') {
    // insert warning of duplicate
    showErrorMessage('No duplicates allowed', $('#alias'));
  } else {
    $('.message').remove();
  }

  // circle edit panel's alias list updated
  var aliasEntry = $('<div>');
  var aliasName = $('<div>')
    .addClass('alias-entry-style')
    .text($('#alias').val());
  var deleteContainer = $('<div>')
    .addClass('set-right')
    .click(function() {
      $(this).parent().remove();
      // clicking on the button removes the alias from the circle
      var aliasString = ''
      $('.alias-entry-style').each(function() {
        if (aliasString == '') {
          aliasString = $(this).text();
        } else {
          aliasString = aliasString + ',' + $(this).text();
        }
      });
      var circle = getCircle($('#name').val());
      circle.attr('data-aliases', aliasString);
    });
  var deleteButton = $('<span>')
    .addClass('glyphicon glyphicon-remove');
  deleteButton.appendTo(deleteContainer);
  aliasName.appendTo(aliasEntry);
  deleteContainer.appendTo(aliasEntry);
  aliasEntry.appendTo('#alias-list');

  // circle's alias list updated
  var aliasString = ''
  $('.alias-entry-style').each(function() {
    if (aliasString == '') {
      aliasString = $(this).text();
    } else {
      aliasString = aliasString + ',' + $(this).text();
    }
  });
  var circle = getCircle($('#name').val());
  circle.attr('data-aliases', aliasString);

  console.log('new alias updated: ' + circle.attr('data-aliases'));

}

function updateWeight() {
  if ($('#weight').val() < 0) {
    showErrorMessage('Weight cannot be less than zero', $('#weight'));
    return;
  } else {
    $('.message').remove();
  }
  var circle = getCircle($('#name').val());
  circle.attr('data-weight', $('#weight').val());
}

function showErrorMessage(message, location) {
  console.log('showErrorMessage ' + message);
  var message = $('<div>')
      .text(message)
      .addClass('message');

  $('.message').remove();
  location.after(message);
  setTimeout(function() {
    $('.message').remove();
  }, 5000);
}

// when does the circle show up on the route
function updateAppearance(selection) {

  var circle = getCircle($('#name').val());
  circle.attr('data-appearance', $(selection).val());
  // value="begin-end"  Only at begin/end
  // value="route"      On route
  // value="always"     Always on map
  $(selection).prop('checked', true);
}

// the input box below the map has a url that can be changed to change the map image source
function updateImage() {
  console.log('updateImage called');

  setImgSize($('#map-url-input').val());

}

// The background image is set to its original size when its first loaded
function setImgSize(imgSrc) {
  console.log('setImgSize called');
  var newImg = new Image();
  newImg.onload = function() {
    var height = newImg.height;
    var width = newImg.width;
    console.log('loaded image width: ' + width + ' height: ' + height);

    $('.map2').addClass('zooms').css({
      'background-image': 'url(' + $('#map-url-input').val() + ')',
      'background-size': width + 'px ' + height + 'px',
      'width': width + 'px',
      'height': height + 'px'
    });
    showErrorMessage('New map image loaded', $('.map-name'));
        
    /* version 2 no longer needs to scale base image
    var scaleFromBase = Math.pow(zoomScale, zoomLevel);
    console.log('scaling to zoom scale factor ' + scaleFromBase);

    var zoomedWidth = width * scaleFromBase;
    var zoomedHeight = height * scaleFromBase;
    $('.map2').css({
      'background-size': zoomedWidth + 'px ' + zoomedHeight + 'px',
      'width': zoomedWidth + 'px',
      'height': zoomedHeight + 'px'
    });
    console.log('updated image width: ' + zoomedWidth + ' height: ' + zoomedHeight); */
  }

  newImg.src = imgSrc; // this must be done AFTER setting onload
  if (newImg.complete || newImg.readyState === 4) {
    newImg.onload();
  }
}

function updateCircleSize() {
  console.log('resizing circles and lines ');
  
  circleSize = $('#circle-size-value-input').val();
  
  if (parseFloat(circleSize) < 0) {
    showErrorMessage('Circle size cannot be less than zero', $('.map-name'));
    return;
  } else {
    $('.message').remove();
  }
  
  var scaleFromBase = Math.pow(zoomScale, zoomLevel);
  $('.circle:not(.z10,.z9)').each(function() {
    $(this).addClass('zooms');

    $(this).css('width', circleSize);
    $(this).css('height', circleSize);
    $(this).css('margin-left', (-1) * circleSize / 2);
    $(this).css('margin-top', (-1) * circleSize / 2);
    $(this).css('border-radius', (circleSize * 2 / 3));
  });
  lineSize = circleSize / 3;
  $('.line').each(function() {
    $(this).addClass('zooms');
    redrawLine($(this));
  });
  setTimeout(function() {
    $('.circle').removeClass('zooms');
    $('.line').removeClass('zooms line-moving');
  }, 2000);
}

// mouse based browsers need the connect button to draw lines.
// click a second point when the connect button is on to draw the line.
// there is always one circle selected
function toggleConnect() {
  $('.move-connect').toggleClass('move-connect-selected');
  if ($('.move-connect').hasClass('move-connect-selected')) {
    firstCircle = $('.selected');
  }
}

function toggleEdit() {
  console.log('toggleEdit called');
  clearStartDestination();
  shortestPath = [];
  skipAnimation();

  if ($('.edit-mode').hasClass('edit-mode-on')) {
    // edit mode turns off
    saveMap($('.map-selected').text());
    $('.edit-mode').removeClass('edit-mode-on');
    $('.edit-mode').text('Login');

    $('.departure-destination').removeClass('map-hidden');
    $('.map-name').removeAttr('contenteditable');

    $('.circle:not(.z10,.z9)').removeClass('no-transition').addClass('map-hidden');
    $('.line').addClass('opacity-0');
    $('.circle.z10,.circle.z9').removeClass('no-transition').addClass('opacity-0');

    $('.right-panel,.bottom-panel').fadeOut();

  } else {
    // edit mode turns on
    $('.edit-mode').addClass('edit-mode-on');
    $('.edit-mode').text('Log off');

    $('.departure-destination').addClass('map-hidden');
    $('.map-name').attr('contenteditable', true);

    $('.circle:not(.z10,.z9)').removeClass('no-transition').removeClass('map-hidden opacity-0').css('transform', 'none');
    $('.line').removeClass('opacity-0 line-moving');
    $('.circle.z10,.circle.z9').removeClass('no-transition').removeClass('opacity-0');

    $('.right-panel,.bottom-panel').fadeIn();

  }

}

var circlesZ10Z9 = [];

function adjustEditor() {
  //console.log('adjustEditor called');
  var scaleFromBase = Math.pow(zoomScale, zoomLevel);
  var prevScaleFromBase = Math.pow(zoomScale, prevZoomLevel);

  // panels are adjusted  
  var panels = getPanelPositions();

  var scale = 1 / scaleFromBase;

  //if ($('.edit-mode').hasClass('edit-mode-on') == false) {
  //  $('.right-panel').addClass('no-transition opacity-0');
    //scale = 0;
  //}

  $('.right-panel').css('transform', 'translate(' +
    panels.rightPanelLeft + 'px,' +
    panels.rightPanelTop + 'px) scale(' + scale + ')');
  $('.bottom-panel').css('transform', 'translate(' +
    panels.bottomPanelLeft + 'px,' +
    panels.bottomPanelTop + 'px) scale(' + scale + ')');

  circlesZ10Z9 = [];

  restorePanelCircles();
  /*
  scale = 1 / scaleFromBase;
  // circles on the panels are adjusted
  $('.circle.z9').each(function(){
    var values = getTransformValues($(this).css('transform'));
    // apparently left and top includes transform
    var baseX = parseFloat($(this).css('left')) + values.translateX;
    var baseY = parseFloat($(this).css('top')) + values.translateY;  
    //console.log('panel circle ' + $(this).text() + ' base: ' + baseX + ',' + baseY + ' translate: ' + values.translateX + ',' + values.translateY);
    var centerToCircleX = baseX + mapPosition.x - (diff.x * scale);
    var centerToCircleY = baseY + mapPosition.y - (diff.y * scale);
    //console.log('centerToCircle: ' + centerToCircleX + ',' + centerToCircleY);
    // distance to center of map = (baseX + mapPosition.x - diff.x) * prevScaleFromBase = (adjustedX + mapPosition.x) * scaleFromBase;
    //console.log('scale from base:' + scaleFromBase);
    //console.log('diff: ' + diff.x + ',' + diff.y);
    var adjustedX = (centerToCircleX * prevScaleFromBase / scaleFromBase) - mapPosition.x;
    var adjustedY = (centerToCircleY * prevScaleFromBase / scaleFromBase) - mapPosition.y;
    
    //console.log('adjusted panel circle: ' + adjustedX + ',' + adjustedY + ' scale ' + scale);
    
    if ($('.edit-mode').hasClass('edit-mode-on') == false) {
      $(this).addClass('no-transition opacity-0');
    }
      
    $(this).addClass('no-transition').css({

      //'left': adjustedX,
      //'top': adjustedY,
      //'transform': 'scale(' + (1 / scaleFromBase) + ')'
        'left': '0px',
        'top': '0px',
        'transform': 'translate(' + adjustedX + 'px,' + adjustedY + 'px) scale(' + scale + ')'
    });
    
    
    // retain coords so lines can be drawn to target location instead of current
    circlesZ10Z9.push({
      x: adjustedX,
      y: adjustedY,
      name: $(this).text()
    })
    
    
  });
  */
  recordPanelCircles();

  //console.log('checking lines.');
  // Lines are redraw after moving the circle

  // Deep copy
  var copy = jQuery.extend(true, {}, circlesZ10Z9);
  for (var index in circlesZ10Z9) {

    $('.line[data-begin="' + circlesZ10Z9[index].name + '"]').each(function() {

      var otherCircleOnPanel = false;
      // if the other circle is also on the panel then do a custom line update
      for (var index2 in copy) {
        if ($(this).attr('data-end') == copy[index2].name) {
          updateLine($(this), circlesZ10Z9[index].x, circlesZ10Z9[index].y, copy[index2].x, copy[index2].y);
          otherCircleOnPanel = true;
        }
      }
      if (otherCircleOnPanel == false) {
        var otherName = $(this).attr('data-end');
        var otherNameCircle = getCircle(otherName);
        var otherValues = getTransformValues($(otherNameCircle).css('transform'));
        var sameXPos = parseFloat(otherNameCircle.css('left')) + otherValues.translateX;
        var sameYPos = parseFloat(otherNameCircle.css('top')) + otherValues.translateY;
        updateLine($(this), circlesZ10Z9[index].x, circlesZ10Z9[index].y, sameXPos, sameYPos);
      }
    });

    $('.line[data-end="' + circlesZ10Z9[index].name + '"]').each(function() {

      var otherCircleOnPanel = false;
      // if the other circle is also on the panel then do a custom line update
      for (var index2 in copy) {
        if ($(this).attr('data-begin') == copy[index2].name) {
          updateLine($(this), copy[index2].x, copy[index2].y, circlesZ10Z9[index].x, circlesZ10Z9[index].y);
          otherCircleOnPanel = true;
        }
      }
      if (otherCircleOnPanel == false) {
        var otherName = $(this).attr('data-begin');
        var otherNameCircle = getCircle(otherName);
        var otherValues = getTransformValues($(otherNameCircle).css('transform'));
        var sameXPos = parseFloat(otherNameCircle.css('left')) + otherValues.translateX;
        var sameYPos = parseFloat(otherNameCircle.css('top')) + otherValues.translateY;
        updateLine($(this), sameXPos, sameYPos, circlesZ10Z9[index].x, circlesZ10Z9[index].y);
      }
    });

  }
}

function getPanelPositions() {
  var scaleFromBase = Math.pow(zoomScale, zoomLevel);
  var prevScaleFromBase = Math.pow(zoomScale, prevZoomLevel);

  // panels are adjusted
  var leftCornerToCenter = (-1) * mapPosition.x;
  var centerToRightEdge = (parseFloat($('.map2-container').css('width')) / 2) * (1 / scaleFromBase);
  var centerToLeftEdge = (-1) * centerToRightEdge;
  var rightOffset = (-1 * parseFloat($('.right-panel').css('width'))) / scaleFromBase;

  var topCornerToCenter = (-1) * mapPosition.y;
  var centerToTopEdge = (-1) * (parseFloat($('.map2-container').css('height')) / 2) * (1 / scaleFromBase);
  var centerToBottomEdge = (-1) * centerToTopEdge;
  var bottomOffset = (-1 * parseFloat($('.bottom-panel').css('height'))) / scaleFromBase;

  var panels = {
    rightPanelLeft: leftCornerToCenter + centerToRightEdge + rightOffset,
    rightPanelTop: topCornerToCenter + centerToTopEdge,
    rightPanelRight: leftCornerToCenter + centerToRightEdge,
    bottomPanelLeft: leftCornerToCenter + centerToLeftEdge,
    bottomPanelTop: topCornerToCenter + centerToBottomEdge + bottomOffset
  };

  return panels;
}

// record the distance the circles are from the edges and restore them when moving the map or zooming
// right panel
var rightOffset = {};
var topOffset = {};
// bottom panel
var bottomOffset = {};
var leftOffset = {};

function recordPanelCircles() {
  //console.log('recordPanelCircles called');
  $('.circle.z10').each(function() {
    var scaleFromBase = Math.pow(zoomScale, zoomLevel);
    var values = getTransformValues($(this).css('transform'));
    //console.log('z10 record left ' + (parseFloat($(this).css('left'))) + ' translateX ' + values.translateX + ' mapPositionX ' + mapPosition.x + ' scaleFromBase ' + scaleFromBase);
    var currentXPositionFromOrigin = (parseFloat($(this).css('left')) + values.translateX + mapPosition.x) * scaleFromBase;
    var originToRight = parseFloat($('.map2-container').css('width')) / 2;
    rightOffset[$(this).text()] = currentXPositionFromOrigin - originToRight;

    var currentYPositionFromOrigin = (parseFloat($(this).css('top')) + values.translateY + mapPosition.y) * scaleFromBase;
    var originToTop = parseFloat($('.map2-container').css('height')) / 2;
    topOffset[$(this).text()] = currentYPositionFromOrigin - originToTop;

    //console.log('circle offset ' + rightOffset[$(this).text()] + ' top offset ' + topOffset[$(this).text()]);
  });

  $('.circle.z9').each(function() {
    var scaleFromBase = Math.pow(zoomScale, zoomLevel);
    var values = getTransformValues($(this).css('transform'));

    var currentXPositionFromOrigin = (parseFloat($(this).css('left')) + values.translateX + mapPosition.x) * scaleFromBase;
    var originToLeft = (-1) * parseFloat($('.map2-container').css('width')) / 2;
    leftOffset[$(this).text()] = currentXPositionFromOrigin - originToLeft;

    var currentYPositionFromOrigin = (parseFloat($(this).css('top')) + values.translateY + mapPosition.y) * scaleFromBase;
    var originToBottom = (-1) * parseFloat($('.map2-container').css('height')) / 2;
    bottomOffset[$(this).text()] = currentYPositionFromOrigin - originToBottom;

    //console.log('circle offset ' + rightOffset[$(this).text()] + ' top offset ' + topOffset[$(this).text()]);
  });
}

function restorePanelCircles() {
  //console.log('restorePanelCircles called');
  $('.circle.z10').each(function() {
    var scaleFromBase = Math.pow(zoomScale, zoomLevel);
    var values = getTransformValues($(this).css('transform'));
    //console.log('z10 values ' + JSON.stringify(values));
    //console.log('z10 restore left ' + (parseFloat($(this).css('left'))) + ' translateX ' + values.translateX + ' mapPositionX ' + mapPosition.x + ' scaleFromBase ' + scaleFromBase);
    var currentPositionXFromOrigin = (parseFloat($(this).css('left')) + values.translateX + mapPosition.x) * scaleFromBase;
    var originToRight = parseFloat($('.map2-container').css('width')) / 2;
    var currentXRightOffset = currentPositionXFromOrigin - originToRight;
    var differenceX = currentXRightOffset - rightOffset[$(this).text()];
    var scaledDifferenceX = differenceX / scaleFromBase;
    //console.log('z10 currentPostionXFromOrigin ' + currentPositionXFromOrigin + ' originToRight ' + originToRight + ' currentXRightOffset ' + currentXRightOffset + ' differenceX ' + differenceX);

    var currentPositionYFromOrigin = (parseFloat($(this).css('top')) + values.translateY + mapPosition.y) * scaleFromBase;
    var originToTop = parseFloat($('.map2-container').css('height')) / 2;
    var currentYTopOffset = currentPositionYFromOrigin - originToTop;
    var differenceY = currentYTopOffset - topOffset[$(this).text()];
    var scaledDifferenceY = differenceY / scaleFromBase;

    //console.log('z10 scaled difference ' + scaledDifferenceX + ',' + scaledDifferenceY);
    var newX = values.translateX - scaledDifferenceX;
    var newY = values.translateY - scaledDifferenceY;
    var adjustedScale = 1 / scaleFromBase;
    $(this).css('transform', 'translate(' + newX + 'px,' + newY + 'px) scale(' + adjustedScale + ')');

    circlesZ10Z9.push({
      x: parseFloat($(this).css('left')) + newX,
      y: parseFloat($(this).css('top')) + newY,
      name: $(this).text()
    })
  });

  $('.circle.z9').each(function() {
    var scaleFromBase = Math.pow(zoomScale, zoomLevel);
    var values = getTransformValues($(this).css('transform'));
    //console.log('z9 values ' + JSON.stringify(values));
    var currentPositionXFromOrigin = (parseFloat($(this).css('left')) + values.translateX + mapPosition.x) * scaleFromBase;
    var originToLeft = (-1) * parseFloat($('.map2-container').css('width')) / 2;
    var currentXLeftOffset = currentPositionXFromOrigin - originToLeft;
    var differenceX = currentXLeftOffset - leftOffset[$(this).text()];
    var scaledDifferenceX = differenceX / scaleFromBase;

    var currentPositionYFromOrigin = (parseFloat($(this).css('top')) + values.translateY + mapPosition.y) * scaleFromBase;
    var originToBottom = (-1) * parseFloat($('.map2-container').css('height')) / 2;
    var currentYTopOffset = currentPositionYFromOrigin - originToBottom;
    var differenceY = currentYTopOffset - bottomOffset[$(this).text()];
    var scaledDifferenceY = differenceY / scaleFromBase;

    //console.log('z9 scaled difference ' + scaledDifferenceX + ',' + scaledDifferenceY);
    var newX = values.translateX - scaledDifferenceX;
    var newY = values.translateY - scaledDifferenceY;
    var adjustedScale = 1 / scaleFromBase;
    $(this).css('transform', 'translate(' + newX + 'px,' + newY + 'px) scale(' + adjustedScale + ')');

    circlesZ10Z9.push({
      x: parseFloat($(this).css('left')) + newX,
      y: parseFloat($(this).css('top')) + newY,
      name: $(this).text()
    })
  });
}

// Login functions

// Sample login by David Lee
// http://codepen.io/OurDailyBread/pen/pjMPpz
// Thanks to http://andwecode.com/create-popup-login-and-signup-form/ and zomato.com for the concept

function showLogin() {
  $('.login-overlay').fadeIn(500);
  $('.login-box').fadeIn(500);
}

function closeLogin() {
  $('.login-overlay').fadeOut(500);
  $('.login-box').fadeOut(500);
}

function login() {
  Parse.User.logIn(
    $('#username-input').val(),
    $('#password-input').val(), {
      success: function(user) {
        $('#username-input').val('');
        $('#password-input').val('');
        showErrorMessage('Login succeded. Saving data.', $('.username'));
        saveData();
        setTimeout(function(){
          closeLogin();
        }, 3000);
      },
      error: function(user, error) {
        // The login failed. Check error to see why.
        showErrorMessage('Error code: ' +
          error.code + ' Message: ' +
          error.message, $('.username'));
        console.log('Error code: ' +
          error.code + ' Message: ' +
          error.message);
      }
    });
}

function resetPassword() {
  // send reset password link
  var email = prompt('Please enter your email for password reset link:', '');
  if (email != null) {
    Parse.User.requestPasswordReset(email, {
      success: function(result) {
        showErrorMessage('Password reset link sent to email', $('.username'));
      },
      error: function(error) {
        showErrorMessage('Error code: ' +
          error.code + ' Message: ' +
          error.message, $('.username'));
        console.log('Error code: ' +
          error.code + ' Message: ' +
          error.message);
      }
    })
  }
}