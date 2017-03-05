var fs = require('fs')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var googlemaps = require('googlemaps')
var _ = require('underscore')
var querystring = require('querystring')
var waterfall = require('async-waterfall')
var q = require('q')

var parseLatestData = function (results) {
  try {
    results = JSON.parse(results)
  } catch (e) {
    return null
  }

  if (results) {
    return _.findWhere(results.data)
  } else {
    return null
  }
}

var findLatestData = function (zip) {
  return request({
    url: 'https://api.censusreporter.org/1.0/data/show/latest?table_ids=B19013&geo_ids=86000US' + zip
  })
    .then(function (results) {
      return parseLatestData(results.body)
    })
}

function houseHolIncomedMethod (data) {
  var dfd = q.defer()

  Promise
    .props({
      elem: findLatestData(data['Zip'])
    })
    .then(function (results) {
      // console.log(results.elem["B19013"]["estimate"]["B19013001"], 'results *************')
      console.log(results, '*****************resulets', results.elem)
      // results.elem["B19013"]["estimate"]["B19013001"]
      if ((results != undefined) && (results.elem != undefined)) {
        if (results.elem['B19013']['estimate'] != undefined) {
          var val = results.elem['B19013']['estimate']['B19013001']
        }else {
          var val = '-'
        }
      }else {
        var val = '-'
      }
      data["HouseHolIncome"] = val
      setTimeout(function () {
        dfd.resolve(data)
      }, 100)
    })

  return dfd.promise
}

module.exports = {
  houseHolIncomedMethod:houseHolIncomedMethod
}
