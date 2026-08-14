const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const routes={
  '/api/missions':require('../api/missions'),
  '/api/auth/login':require('../api/auth/login'),
  '/api/auth/session':require('../api/auth/session'),
  '/api/auth/logout':require('../api/auth/logout')
};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};

http.createServer(async(request,response)=>{
  const url=new URL(request.url,`http://${request.headers.host}`);
  if(routes[url.pathname]){
    request.query=Object.fromEntries(url.searchParams);
    if(['POST','PATCH','DELETE'].includes(request.method)){
      let raw=''; for await(const chunk of request) raw+=chunk;
      try{request.body=raw?JSON.parse(raw):{};}catch{return response.writeHead(400).end('{"error":"Invalid JSON."}');}
    }
    return routes[url.pathname](request,response);
  }
  const route=url.pathname==='/edit'?'/edit.html':url.pathname;
  const relative=route==='/'?'/index.html':route;
  const filename=path.resolve(root,`.${relative}`);
  if(!filename.startsWith(root) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');
  fs.createReadStream(filename).pipe(response);
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`Whimsy local server on http://127.0.0.1:${process.env.PORT||4173}`));
