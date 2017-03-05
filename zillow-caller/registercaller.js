var unirest = require('unirest')
var publicIp = require('public-ip')
const config_obj = require('./config.json')
var zwsid = process.argv[2]

if(!config_obj.ROUTER_IP || !config_obj.ROUTER_PORT) {
  return console.log(new Error({error: "Please, fill in the config_obj.json properly"}))
}

publicIp.v4().then(ip => {
  console.log('http://' + config_obj.ROUTER_IP + ':' + config_obj.ROUTER_PORT + '/zillowrouter/newcaller')
  unirest.post('http://' + config_obj.ROUTER_IP + ':' + config_obj.ROUTER_PORT + '/zillowrouter/newcaller')
    .query('zwsid=' + zwsid)
    .query('ipAddress=' + ip + ':' + config_obj.CALLER_PORT)
    .end(function (response) {
      console.log(response.body)
    })

})
