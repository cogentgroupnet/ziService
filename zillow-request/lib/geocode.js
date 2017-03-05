var fs = require('fs')
var GoogleMaps = require('googlemaps') // Modified
var _ = require('underscore')
var q = require('q')
var querystring = require('querystring')
var waterfall = require('async-waterfall')

var googlemaps = new GoogleMaps({ // Modified declration
  'google-client-id': 'gme-colonyamericanhomes1',
  'google-private-key': 'hG39I7TPZ08s3qyemv5lhO0dQ7o='
})

// var geocodeAddress = Promise.promisify(googlemaps.geocode); Removed this promise because of updates to the googlemaps package.
//                                                             googlemaps.geocode already returns a promise

var geocode = function (data) {
  var dfd = q.defer()

  var addressParts = _.compact([
    data['Address'],
    data['City'],
    data['State'],
    data['Zip']
  ])

  var address = addressParts.join(' ')

  googlemaps.geocode({address: address}, function (err, response) {
    var location = {
      lat: '-',
      lng: '-'
    }

    var locationType = '-'

    if (err) {
      dfd.reject(err)
    }

    if (response.results && response.results[0]) {
      location = response.results[0].geometry.location
      locationType = response.results[0].geometry.location_type
    }

    if (response.status == 'OK') {
      location.type = locationType
      setTimeout(function () {
        data["Latitude"] = location.lat
        data["Longitude"] = location.lng
        data["Type"] = location.type
        dfd.resolve(data)
      }, 100)
    } else {
        data["Latitude"] = '-'
        data["Longitude"] = '-'
        data["Type"] = '-'

        dfd.reject(data)
    }
  })

  return dfd.promise
}

module.exports = {
  geocode:geocode
}
