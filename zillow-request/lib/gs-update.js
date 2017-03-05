var fs = require('fs')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var _ = require('underscore')
var querystring = require('querystring')
var waterfall = require('async-waterfall')
var q = require('q')


var findSchoolDistrictByLocation = function (options) {
  return request({
    url: 'http://www.greatschools.org/geo/boundary/ajax/getSchoolByLocation.json?' +
      querystring.stringify(options)
  })
    .then(function (results) {
      return parseSchoolDistrictData(results)
    })
}

var parseSchoolDistrictData = function (results) {
  try {
    results = JSON.parse(results.body) // Need to parse the body, not the results itself
  } catch (e) {
    return null
  }

  if (results.schools && results.schools.length > 0) {
    return _.findWhere(results.schools, {
      schoolType: 'public'
    })
  } else {
    return null
  }
}

var gsUpdate = function (data) {
  var dfd = q.defer()
  Promise
    .props({
      elem: findSchoolDistrictByLocation({ lat: data["Latitude"], lon: data["Longitude"], level: 'e'}),
      middle: findSchoolDistrictByLocation({ lat: data["Latitude"], lon: data["Longitude"], level: 'm'}),
      high: findSchoolDistrictByLocation({ lat: data["Latitude"], lon: data["Longitude"], level: 'h'})
    })
    .then(function (results) {
      data["ElemSchoolName"] = results.elem ? results.elem.name : ''
      data["ElemSchoolRating"] = results.elem ? results.elem.rating : ''
      data["MiddleSchoolName"] = results.middle ? results.middle.name : ''
      data["MiddleSchoolRating"] = results.middle ? results.middle.rating : ''
      data["HighSchoolName"] = results.high ? results.high.name : ''
      data["HighSchoolRating"] = results.high ? results.high.rating : ''

      setTimeout(function () {
        dfd.resolve(data)
      }, 100)
    })

  return dfd.promise
}

module.exports = {
  gsUpdate: gsUpdate
}
