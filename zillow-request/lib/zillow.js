var fs = require('fs')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var _ = require('underscore')
var qs = require('querystring')
var waterfall = require('async-waterfall')
var cheerio = require('cheerio')
var numeral = require('numeral')
var q = require('q')

var zillow = require('./zillow-v2')

var request = require('request')


var startZillow = function (data) {
  var dfd = q.defer()

  var addressParts = []

  var addressParts = [
    data['Address'],
    data['City'],
    data['State'],
    data['Zip'],
    data['Zpid']
  ]

  var address = addressParts.join(' ')

  zillow.getDataAddress(addressParts)

    .then(function (results) {
      data["ZillowValue"] = results.value
      data["ZillowValueLow"] = results.valueLow
      data["ZillowValueHigh"] = results.valueHigh
      data["ZillowValueReliability"] = results.valueScore
      data["ZillowRent"] = results.rent
      data["ZillowRentLow"] = results.rentLow
      data["ZillowRentHigh"] = results.rentHigh
      data["ZillowRentReliability"] = results.rentScore
      data["ZillowZpid"] = results.zpid
      data["lastUpdated"] = results.lastUpdated
      data["oneWeekChangeDeprecated"] = results.oneWeekChangeDeprecated
      data['Address'] = results.address
      data['City'] = results.city
      data['State'] = results.state
      data['Zip'] = results.zipcode
      data['Latitude'] = results.latitude
      data['Longitude'] = results.longitude

      dfd.resolve(data)
    })
    .catch(function (error) {
      dfd.reject(error)
    })
    .finally(function () {
    })

  return dfd.promise
}

module.exports = {
  startZillow: startZillow
}
