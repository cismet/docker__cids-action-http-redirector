'use strict';

const fs = require('fs');
const http = require('http');
const url = require('url');
const request = require('request')

const confFile = 'app.conf';
const globalConf = JSON.parse(fs.readFileSync(confFile));

function doErrorResponse(_error, _res, res) {
  if (_res) {
    console.log(`request FAILED: ${_res.request.href} => ${_res.statusCode} (${_res.statusMessage})`);
  }
  if (_error) console.error(_error);
  res.writeHead(502);
  res.end();
}

function respond(req, res) {
  let routeRegex = /^\/+|\/+$/g;
  let redirectionIdentifier = url.parse(req.url).path.replace(routeRegex, '');
  if (redirectionIdentifier) {
    console.log(`preparing redirection for ${redirectionIdentifier}`);

    let actionApiRequestOptions = {
      url : globalConf.actionApiUrl,
      headers : globalConf.actionApiHeaders,
      formData : {
        taskparams: {
          value: JSON.stringify({
            parameters : { 
              [globalConf.redirectionIdentifierParameter] : redirectionIdentifier
            }
          }),
          options: {
            contentType: 'application/json'
          }
        }
      }
    };
    if (globalConf.actionApiAuthEnabled) {
      actionApiRequestOptions.headers['Authorization'] = 'Basic ' + Buffer.from(globalConf.actionApiUser + ':' + globalConf.actionApiPassword).toString('base64');  
    }

    request.post(actionApiRequestOptions, (_error, _res, _body) => {
      if (_error || _res.statusCode != 200) {
        doErrorResponse(_error, _res, res);
      } else {
        let location = JSON.parse(_body).res;
        if (location) {        
          console.log(`redirecting to: ${location}`);              
          res.writeHead(302, { Location: location });
          res.end();    
        } else {
          res.writeHead(404, 'Weiterleitungs-Daten nicht gefunden.');
          res.end();    
        }
      }
    });
  } else {
    res.writeHead(400, 'Weiterleitungs-Identifier nicht gesetzt.');
    res.end();    
  }
};

const server = http.createServer(respond);
server.listen(globalConf.port, globalConf.host, () => {
  console.log(`Server running at http://${globalConf.host}:${globalConf.port}/`);
});