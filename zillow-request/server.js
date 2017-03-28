/**
 * Service for Cogent to fetch data from various Source
 * @version 1.0
 */

/**
 * Imports and requires
 */
const http = require('http')
const express = require('express') // call express
const app = express() // define our app using express
const bodyParser = require('body-parser')
const bodyParserXml = require('body-parser-xml')(bodyParser)
const path = require('path')
const cors = require('cors')
const router = express.Router()
const jstoxml = require('jstoxml')
const xml2js = require('xml2js').parseString
const zillow = require('./lib/zillow.js')
const geocode = require('./lib/geocode.js')
const gsupdate = require('./lib/gs-update.js')
const household = require('./lib/household-income.js')
const _ = require('lodash')
const crime = require('./lib/crime-update.js')
const mongoose = require('mongoose')
const unirest = require('unirest')
const config_obj = require('./config.json')
const q = require('q')
const mongooseSchedule = require('mongoose-schedule')

if(!config_obj.ROUTER_IP || !config_obj.ROUTER_PORT || !config_obj.REQUEST_IP || !config_obj.REQUEST_PORT) {
  return console.log(new Error({error: "Please, fill in the config_obj.json properly"}))
}

function createJSON2XML (data) {
  var json = []

  json.push({
    _name: "ZillowValue",
    _attrs:{},
    _content: data["ZillowValue"]
  })
  json.push({
    _name: "ZillowValueLow",
    _attrs:{},
    _content: data["ZillowValueLow"]
  })
  json.push({
    _name: "ZillowValueHigh",
    _attrs:{},
    _content: data["ZillowValueHigh"]
  })
  json.push({
    _name: "ZillowValueReliability",
    _attrs:{},
    _content: data["ZillowValueReliability"]
  })
  json.push({
    _name: "ZillowRent",
    _attrs:{},
    _content: data["ZillowRent"]
  })
  json.push({
    _name: "ZillowRentLow",
    _attrs:{},
    _content: data["ZillowRentLow"]
  })
  json.push({
    _name: "ZillowRentHigh",
    _attrs:{},
    _content: data["ZillowRentHigh"]
  })
  json.push({
    _name: "ZillowRentReliability",
    _attrs:{},
    _content: data["ZillowRentReliability"]
  })
  json.push({
    _name: "ZillowZpid",
    _attrs:{},
    _content: data["ZillowZpid"]
  })
  json.push({
    _name: "lastUpdated",
    _attrs:{},
    _content: data["lastUpdated"]
  })
  json.push({
    _name: "oneWeekChange",
    _attrs:{
      deprecated: data["oneWeekChangeDeprecated"]
    },
    _content: ''
  })
  json.push({
    _name: "Address",
    _attrs:{},
    _content: data["Address"]
  })
  json.push({
    _name: "City",
    _attrs:{},
    _content: data["City"]
  })
  json.push({
    _name: "State",
    _attrs:{},
    _content: data["State"]
  })
  json.push({
    _name: "Zip",
    _attrs:{},
    _content: data["Zip"]
  })
  json.push({
    _name: "CrimeOverall",
    _attrs:{},
    _content: data["CrimeOverall"]
  })
  json.push({
    _name: "CrimePersonal",
    _attrs:{},
    _content: data["CrimePersonal"]
  })
  json.push({
    _name: "CrimeProperty",
    _attrs:{},
    _content: data["CrimeProperty"]
  })
  json.push({
    _name: "Latitude",
    _attrs:{},
    _content: data["Latitude"]
  })
  json.push({
    _name: "Longitude",
    _attrs:{},
    _content: data["Longitude"]
  })
  json.push({
    _name: "Type",
    _attrs:{},
    _content: data["Type"]
  })
  json.push({
    _name: "ElemSchoolName",
    _attrs:{},
    _content: data["ElemSchoolName"]
  })
  json.push({
    _name: "ElemSchoolRating",
    _attrs:{},
    _content: data["ElemSchoolRating"]
  })
  json.push({
    _name: "MiddleSchoolName",
    _attrs:{},
    _content: data["MiddleSchoolName"]
  })
  json.push({
    _name: "MiddleSchoolRating",
    _attrs:{},
    _content: data["MiddleSchoolRating"]
  })
  json.push({
    _name: "HighSchoolName",
    _attrs:{},
    _content: data["HighSchoolName"]
  })
  json.push({
    _name: "HighSchoolRating",
    _attrs:{},
    _content: data["HighSchoolRating"]
  })
  json.push({
    _name: "HouseHolIncome",
    _attrs:{},
    _content: data["HouseHolIncome"]
  })

  return json
}
// Sample request
// var xmlRequest = "<Dataservice_request><properties><property><Address>112 E San Pedro C</Address><City>Gilbert</City><State>AZ</State><Zip>85234</Zip><ZsID/></property><property><Address>123 E San Pedro C</Address><City>Gilbert</City><State>AZ</State><Zip>85211</Zip><ZsID/></property></properties></Dataservice_request>"

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.xml())
app.use(cors())
app.use(express.static(path.join(__dirname)))

/**
 * Routes for Request
 */
app.post('/zillowrequest/api', (req, res) => {
  res.set('Content-Type', 'application/xml') // Set page content to HTML
  xml2js(req.body.data, (err, result) => { // Parse XML String from the request
    var addresses = result.Dataservice_request.properties[0].property // Get addresses list
    var newAddresses = [] // Array where the response will be
    var amount = 0 // To control when the request should finish. Counts how manny addresses have been requested
    _.each(addresses, (address) => { // Loop through each address
      address['Address'] = address['Address']? address['Address'][0] : '' // For some rease, the data is inside and array
      address['City'] = address['City']? address['City'][0] : '' // For some rease, the data is inside and array
      address['State'] = address['State']? address['State'][0] : '' // For some rease, the data is inside and array
      address['Zip'] = address['Zip']? address['Zip'][0].replace(/\W/g, '') : '' // For some rease, the data is inside and array
      address['Zpid'] = address['Zpid']? address['Zpid'][0].replace(/\W/g, '') : '' // For some rease, the data is inside and array

      zillow.startZillow(address) // Add zillow data
        .then((adWithZillow) => {
          return crime.crime(adWithZillow) // Add crime data
        })
        .then((adWithCrime) => {
          return geocode.geocode(adWithCrime) // Add geocode data
        })
        .then((adWithgscode) => {
          return household.houseHolIncomedMethod(adWithgscode) // add house income data
        })
        .then((adWithhousehold) => {
          return gsupdate.gsUpdate(adWithhousehold) // add school data
        })
        .then((finalAd) => { // Finished
          finalAd = createJSON2XML(finalAd)
          newAddresses.push({porperty: finalAd}) // Push each completed address to the newAddresses array
          amount++ // increments the amount
          if (amount == addresses.length) { // If the amount is the same as the numbers of addressses, then it is finished and should return the response
            var obj = JSON.parse(JSON.stringify(result)) // Clones the object, so it won't affect the original object
            obj.Dataservice_response = obj.Dataservice_request // Changes name
            delete obj.Dataservice_request // Changes name
            obj.Dataservice_response.properties = newAddresses // Inserts the array with the finished addresses into the object
            var newXml = jstoxml.toXML(obj) // Parse to XML
            res.send(newXml) // Return the response
          }
        })
        .catch((error) => {
          console.log(error)
        })
    })
  })
})

app.get('/zillowrequest', (req, res) => {
  res.sendFile('index.html', { root: __dirname }) // Test page
})

/**
 * Router Service
 */
mongoose.connect('mongodb://localhost/trackers')

var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log("Connection OK")
  var dataSchema = mongoose.Schema({
    // NEED TO ADD AUTOINCREMENT, callerNumber will be the ID
    callerNumber: {
      type: Number,
      default: 0
    },
    zwsid: {
      type: String
    },
    ipAddress: {
      type: String
    },
    notes: {
      type: String
    },
    active: {
      type: Boolean,
      default: true
    },
    maxCount: {
      type: Number,
      default: 100
    },
    lastAccess: {
      type: Date,
      default: Date.now
    },
    currentCount: {
      type: Number,
      default: 0
    }

  }, {collection: 'callers'})

  dataSchema.pre('save', function(next){
    next()
  })

  var Caller = mongoose.model('Callers', dataSchema)

  function cron (date, model, args) {

    var newDate = new Date(date.setTime( date.getTime() + 86400000 ))

    mongooseSchedule.job({
      data: {
        model: model,
        method: 'findOneAndUpdate',
        execution_date: newDate
        args: args
      }
    }, () {
      console.log(model + " was reset!")
    })

    // this.newDate = new Date(date.setTime( date.getTime() + 86400000 ))
    // this.schedule = {}
    // this.setup = (args) => {
    //   this.schedule = schedule.scheduleJob(this.newDate, function(){
    //     Caller.findOneAndUpdate(args).where('active', true).exec((err, doc) => {
    //       if (err) return console.log(new Error(err))
    //       //RESET OK
    //     })
    //   })
    // }
  }

  app.get('/zillowrouter/getzillowdata', (req, res) => {
    var address = req.query.address
    var citystatezip = req.query.citystatezip
    var zpid = req.query.zpid

    if(address && citystatezip || zpid) {
      Caller.findOneAndUpdate(
          {$where: function () {return (this.currentCount < this.maxCount)} },
          {$set: {lastAccess: new Date()}, $inc: {currentCount: 1}},
          {new: true}
      ).where('active', true)
        .exec((err, doc) => {
          if(doc.currentCount < doc.maxCount) {
            unirest.get('http://' + doc.ipAddress + '/zillowcaller/getzillowdata')
              .query('zwsid=' + doc.zwsid)
              .query('address=' + address)
              .query('citystatezip=' + citystatezip)
              .query('zpid=' + zpid)
              .end(function (response) {
                res.json(response)
              })
          } else {
            cron(doc.lastAccess, doc, {
              doc,
              {$set: {currentCount: 0}}
            })
          }
        })
    } else {
      res.json({error: 'Please inform Address and City, State and ZIP'}) //HANDLE THIS ERROR
    }

  })

  app.post('/zillowrouter/resettrackers', (req, res) => {
    Caller.update({}, { $set: {currentCount: 0} }, {multi: true, upsert: true}, (err) => {

        if (err) res.json({error: err})
        res.json({message: "Tracker count reset OK"})
      })
  })

  app.post('/zillowrouter/disabletracker', (req, res) => {
    var id = req.query.callerNumber
    if(id){
      Caller.update({callerNumber:id}, { $set: {active: false} }, {upsert: true}, (err) => {
          if (err) res.json({error: err})
          res.json({message: "Tracker count reset OK"})
        })
    } else {
      res.json({error: "Please pass an ID"})
    }
  })

  app.get('/zillowrouter/gettrackerdata', (req, res) => {
    var id = req.query.callerNumber
    if(id){
      Caller.findOne({callerNumber: id}).where('active', true)
        .exec((err, doc) => {
          if (err) res.json({error: err})
          res.json(doc)
        })
    } else {
      res.json({error: "Please pass an ID"})
    }
  })

  app.get('/zillowrouter/getstatus', (req, res) => {
    var id = req.query.callerNumber
    if(id){
      Caller.findOne({callerNumber: id}).where('active', true)
        .exec((err, doc) => {
          if (err) res.json({error: err})
          var status = doc.currentCount == doc.maxCount
          res.json({
            hasReachedMax: status,
            currentCount: doc.currentCount,
            maxCount: doc.maxCount
          })
        })
    } else {
      res.json({error: "Please pass an ID"})
    }
  })

  app.post('/zillowrouter/updatetrackerdata', (req, res) => { // OK

    var callerNumber = req.query.callerNumber

    if (callerNumber) {
      Caller.findOne({callerNumber: callerNumber}).where('active', true)
        .exec((err, doc) => {
          if (!doc && doc.length) {
            return res.json({error: 'No tracker with the ID was found'})
          }

          var oldDoc = _.cloneDeep(doc)

          doc.zwsid = req.query.zwsid || doc.zwsid
          doc.ipAddress = req.query.ipAddress || doc.ipAddress
          doc.notes = req.query.notes || doc.notes
          doc.maxCount = req.query.maxCount || doc.maxCount

          doc.save((err) => {
            if (err) return console.log(new Error(err))
            res.json({old: oldDoc, new: doc})
          })
        })
    } else {
      res.json({error: 'Please pass an ID'})
    }
  })

  app.post('/zillowrouter/newcaller', (req, res) => { // OK
    var ip = req.query.ipAddress
    var zwsid = req.query.zwsid
    if (ip && zwsid) {
      Caller.find().where('active', true).exec((err, docs) => { // Gets next callerNumber
        if (err) return new Error(err)

        var max = (_.maxBy(docs, 'callerNumber') || {}).callerNumber || 0

        var caller = new Caller({
          callerNumber: max + 1,
          ipAddress: ip,
          zwsid: zwsid
        })

        Caller.find({ipAddress: ip, zwsid: zwsid}).where('active', true)
          .exec((err, docs) => {
            if (err) return new Error(err)
            if (!docs.length) {
              caller.save((err) => {
                res.json({message: 'Caller registered OK'})
              })
            } else {
              res.json({error: 'Caller already registered'})
            }
          })
      })
    } else {
      res.json({error: 'Please pass an ZwsID and a IP Address'})
    }
  })

  /**
   * Configuration
   */

  var server = app.listen(config_obj.REQUEST_PORT, function () {
    console.log('Example app listening at http://%s:%s', config_obj.REQUEST_IP, config_obj.REQUEST_PORT)
  })
})

/**
 * Exports
 */
module.exports = {

}
