const express = require('express') // call express
const app = express() // define our app using express
const path = require('path')
const cors = require('cors')
const bodyParser = require('body-parser')
const router = express.Router()
const _ = require('lodash')
const unirest = require('unirest')
const config_obj = require('./config.json')

if(!config_obj.CALLER_PORT || !config_obj.CALLER_IP) {
  return console.log(new Error({error: "Please, fill in the config_obj.json properly"}))
}

app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())
app.use(express.static(path.join(__dirname)))


router.get('/getzillowdata', (req, res) => { // NEED TO TEST
  var zwsid = req.query.zwsid
  var zpid = req.query.zpid
  var address = req.query.address.replace(/ /g, '+')
  var citystatezip = req.query.citystatezip.replace(/ /g, '+')

  if( zpid ) {
    unirest.get('http://www.zillow.com/webservice/GetZestimate.htm')
    .headers({'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'})
    .query('zws-id=' + zwsid)
    .query('zpid=' + zpid)
    .query('rentzestimate=true')
    .end(function (response) {
      res.json(response.body)
    })
  } else if( zwsid !== "undefined" && address !== "undefined+undefined+undefined" && citystatezip !== "undefined" ) {
    unirest.get('http://www.zillow.com/webservice/GetSearchResults.htm')
    .headers({'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'})
    .query('zws-id=' + zwsid)
    .query('address=' + address)
    .query('citystatezip=' + citystatezip)
    .query('rentzestimate=true')
    .end(function (response) {
      res.json(response.body)
    })
  } else {
    res.json({error: "Please pass the zwid, the city, the state and the Zip or the ZpID"})
  }
})

app.use('/zillowcaller', router)
app.listen(config_obj.CALLER_PORT)
console.log('Server running at http://'+config_obj.CALLER_IP+':' + config_obj.CALLER_PORT + '/')
