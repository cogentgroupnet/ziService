'use strict'

var Promise = require('bluebird')
var cheerio = require('cheerio')
var qs = require('querystring')
var request = require('request')
var numeral = require('numeral')
var q = require('q')
const config_obj = require('../config.json')

function scrubInput (input) {

  if (!input) {
    return ''
  }
  var value = input.replace(/[^\d.]+/g, '')

  if (input.indexOf('M') !== -1) {
    value = value * 1000000
  }

  if (input.indexOf('K') !== -1) {
    value = value * 1000
  }

  return value
}

function makeRequest (options) {
  var dfd = q.defer()
  // options.headers = {
  //
  // }

  request.get(options, function (error, response, body) {

    if (error) {
      dfd.reject(error)
    }

    dfd.resolve(body)
  })

  return dfd.promise
}

function calculateScore (high, low) {
  if (!high || !low) {
    return '-'
  }

  var score = ((high - low) / (high))

  if (score > 0.25) {
    return 'C'
  } else if (score > 0.10) {
    return 'B'
  } else {
    return 'A'
  }
}

function parsePageContents (contents) {
  var $ = cheerio.load(contents)

  var propertyData = {}

  var result = $('result').length? $('result').eq(0) : $('response')

  propertyData.zpid = result.find('zpid').text()
  propertyData.rentLow = scrubInput(result.find('rentzestimate').find('valuationRange').find('low').text())
  propertyData.rentHigh = scrubInput(result.find('rentzestimate').find('valuationRange').find('high').text())
  propertyData.rent = scrubInput(result.find('rentzestimate').find('amount').text())

  propertyData.rentScore = calculateScore(propertyData.rentHigh, propertyData.rentLow)

  propertyData.valueLow = scrubInput(result.find('zestimate').find('valuationRange').find('low').text())
  propertyData.valueHigh = scrubInput(result.find('zestimate').find('valuationRange').find('high').text())
  propertyData.value = scrubInput(result.find('zestimate').find('amount').text())

  propertyData.valueScore = calculateScore(propertyData.valueHigh, propertyData.valueLow)

  propertyData.lastUpdated = result.find('zestimate').find('last-updated').text()

  propertyData.oneWeekChangeDeprecated = result.find('zestimate').find('oneWeekChange').attr("deprecated")
  propertyData.oneWeekChangeDeprecated = propertyData.oneWeekChangeDeprecated?
                                         propertyData.oneWeekChangeDeprecated.replace(/\W/g, '') : ''

  propertyData.address = result.find('address').find('street').text()
  propertyData.zipcode = result.find('address').find('zipcode').text()
  propertyData.city = result.find('address').find('city').text()
  propertyData.state = result.find('address').find('state').text()
  propertyData.latitude = result.find('address').find('latitude').text()
  propertyData.longitude = result.find('address').find('longitude').text()

  return propertyData
}

function pullApiData (url) {
  var options = {
    url: url
  }

  return makeRequest(options)
    .then(function (body) {
      var data = parsePageContents(body)
      // console.log(data)
      return data
    })
}

function findPropertyLink (address) {
  var url = 'https://www.zillow.com/widgets/zestimate/ZestimateSmallWidget.htm'

  url = url + '?' + qs.stringify({
    did: 'zillow-shv-small-iframe-widget',
    type: 'iframe',
    address: address
  })

  var options = {
    url: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
    }
  }

  return makeRequest(options)
    .then(function (body) {
      var $ = cheerio.load(body)

      var seeMoreLink = $('#see-more-details-link').attr('href')

      if ($('#see-more-details-link').length) {
        return seeMoreLink
      }

      var hasOptions = $('.second-error')

      if (!hasOptions.length) {
        throw new Error('No results')
      }

      var zpid = $('.more-link:first-child').attr('zpid')

      if (!zpid) {
        throw new Error('Error selecting property')
      }

      return 'https://www.zillow.com/homedetails/lookup/' + zpid + '_zpid/'
    })
}

function getZillowDataAddress (address) {
  // console.log('http://' + config_obj.ROUTER_IP + ':' + config_obj.ROUTER_PORT + '/zillowrouter/getzillowdata?&address=' + address[0] + '&citystatezip=' + address[1] +'+'+ address[2] +'+'+ address[3]+ '&zpid=' +address[4])
  return pullApiData('http://' + config_obj.ROUTER_IP + ':' + config_obj.ROUTER_PORT + '/zillowrouter/getzillowdata?&address=' + address[0] + '&citystatezip=' + address[1] +"+"+ address[2] +"+"+ address[3]+ '&zpid=' +address[4])
}

module.exports = {
  getDataAddress: getZillowDataAddress
}
