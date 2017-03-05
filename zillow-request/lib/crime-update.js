var fs = require('fs')
var _ = require('lodash')
var q = require('q')
var crimeData = require('./crime-data.js')

var crime = function (data) {
  var dfd = q.defer()

  var addressParts = _.compact([
    data["Address"],
    data["City"],
    data["State"],
    data["Zip"]
  ])

  var address = addressParts.join(' ')

  var crime = _.find(crimeData, (item) => {

    return item.mid.replace(/\W/g, '') == data["Zip"].replace(/\W/g, '')
  })

  data["CrimeOverall"] =  crime ? crime.overall : '-'
  data["CrimePersonal"] =  crime ? crime.personsafe : '-'
  data["CrimeProperty"] =  crime ? crime.propsafe : '-'

  dfd.resolve(data)

  return dfd.promise
}

module.exports = {
  crime: crime
}
