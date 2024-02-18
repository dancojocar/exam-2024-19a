var koa = require('koa');
var app = module.exports = new koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');

app.use(bodyParser());

app.use(cors());

app.use(middleware);

function middleware(ctx, next) {
  const start = new Date();
  return next().then(() => {
    const ms = new Date() - start;
    console.log(`${start.toLocaleTimeString()} ${ctx.response.status} ${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
  });
}

const vehicles = [
  { id: 1, model: "SUV-200", status: "new", capacity: 5, owner: "John Doe", manufacturer: "ABC Motors", cargo: 500 },
  { id: 2, model: "SEDAN-150", status: "working", capacity: 4, owner: "Alice Smith", manufacturer: "XYZ Vehicles", cargo: 400 },
  { id: 3, model: "TRUCK-500", status: "damaged", capacity: 2, owner: "Bob Johnson", manufacturer: "DEF Trucks", cargo: 2000 },
  { id: 4, model: "VAN-300", status: "private", capacity: 8, owner: "Eva Brown", manufacturer: "GHI Vans", cargo: 800 },
  { id: 5, model: "HATCHBACK-100", status: "working", capacity: 3, owner: "Mike White", manufacturer: "JKL Cars", cargo: 300 },
  { id: 6, model: "MOTORBIKE-50", status: "new", capacity: 1, owner: "Sara Green", manufacturer: "MNO Bikes", cargo: 50 },
  { id: 7, model: "RV-400", status: "working", capacity: 6, owner: "Chris Taylor", manufacturer: "PQR Recreations", cargo: 600 },
  { id: 8, model: "ELECTRIC-CAR-120", status: "private", capacity: 4, owner: "Olivia Black", manufacturer: "STU Electric", cargo: 400 },
  { id: 9, model: "BUS-1000", status: "new", capacity: 20, owner: "Daniel Lee", manufacturer: "VWX Buses", cargo: 2000 },
  { id: 10, model: "PICKUP-250", status: "working", capacity: 2, owner: "Grace Miller", manufacturer: "YZ Pickups", cargo: 1000 },
  { id: 11, model: "COMPACT-80", status: "new", capacity: 3, owner: "Tom Anderson", manufacturer: "LMN Motors", cargo: 350 },
  { id: 12, model: "SPORTS-300", status: "working", capacity: 2, owner: "Emily Turner", manufacturer: "OPQ Cars", cargo: 250 },
  { id: 13, model: "HYBRID-200", status: "damaged", capacity: 4, owner: "Jack Robinson", manufacturer: "RST Hybrids", cargo: 500 },
  { id: 14, model: "TRAILER-600", status: "private", capacity: 10, owner: "Sophie Davis", manufacturer: "UVW Trailers", cargo: 1200 },
  { id: 15, model: "CONVERTIBLE-180", status: "working", capacity: 2, owner: "Alex Garcia", manufacturer: "XYZ Convertibles", cargo: 200 },
  { id: 16, model: "MINIVAN-400", status: "new", capacity: 7, owner: "Isaac Carter", manufacturer: "ABC Vans", cargo: 700 },
  { id: 17, model: "ELECTRIC-BIKE-30", status: "working", capacity: 1, owner: "Lily Martin", manufacturer: "DEF E-Bikes", cargo: 30 },
  { id: 18, model: "LUXURY-250", status: "private", capacity: 4, owner: "Nathan Moore", manufacturer: "GHI Luxuries", cargo: 300 },
  { id: 19, model: "CLASSIC-120", status: "new", capacity: 2, owner: "Mia Rodriguez", manufacturer: "JKL Classics", cargo: 150 },
  { id: 20, model: "OFF-ROAD-180", status: "working", capacity: 4, owner: "Zoe Hernandez", manufacturer: "MNO Off-Roads", cargo: 400 },
];

const router = new Router();

router.get('/all', ctx => {
  ctx.response.body = vehicles;
  ctx.response.status = 200;
});

router.get('/types', ctx => {
  ctx.response.body = vehicles.map(entry => entry.manufacturer);
  ctx.response.status = 200;
});

router.get('/vehicles/:type', ctx => {
  const headers = ctx.params;
  const type = headers.type;
  ctx.response.body = vehicles.filter(obj => obj.manufacturer == type);
  ctx.response.status = 200;
});

router.get('/my/:owner', ctx => {
  const headers = ctx.params;
  const owner = headers.owner;
  ctx.response.body = vehicles.filter(obj => obj.owner == owner);
  ctx.response.status = 200;
});

router.get('/vehicle/:id', ctx => {
  // console.log("ctx: " + JSON.stringify(ctx));
  const headers = ctx.params;
  // console.log("body: " + JSON.stringify(headers));
  const id = headers.id;
  if (typeof id !== 'undefined') {
    const index = vehicles.findIndex(entry => entry.id == id);
    if (index === -1) {
      const msg = "No entity with id: " + id;
      console.log(msg);
      ctx.response.body = { text: msg };
      ctx.response.status = 404;
    } else {
      let entry = vehicles[index];
      ctx.response.body = entry;
      ctx.response.status = 200;
    }
  } else {
    ctx.response.body = { text: 'Id missing or invalid' };
    ctx.response.status = 404;
  }
});

const broadcast = (data) =>
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

router.post('/vehicle', ctx => {
  // console.log("ctx: " + JSON.stringify(ctx));
  const headers = ctx.request.body;
  // console.log("body: " + JSON.stringify(headers));
  const model = headers.model;
  const status = headers.status;
  const capacity = headers.capacity;
  const owner = headers.owner;
  const manufacturer = headers.manufacturer;
  const cargo = headers.cargo;
  if (typeof model !== 'undefined'
    && typeof status !== 'undefined'
    && typeof capacity !== 'undefined'
    && typeof owner !== 'undefined'
    && typeof manufacturer !== 'undefined'
    && typeof cargo !== 'undefined') {
    const index = vehicles.findIndex(entry => entry.model == model && entry.owner == owner);
    if (index !== -1) {
      const msg = "The entity already exists!";
      console.log(msg);
      ctx.response.body = { text: msg };
      ctx.response.status = 404;
    } else {
      let maxId = Math.max.apply(Math, vehicles.map(entry => entry.id)) + 1;
      let entry = {
        id: maxId,
        model,
        status,
        capacity,
        owner,
        manufacturer,
        cargo
      };
      vehicles.push(entry);
      broadcast(entry);
      ctx.response.body = entry;
      ctx.response.status = 200;
    }
  } else {
    const msg = "Missing or invalid model: " + model + " status: " + status + " capacity: " + capacity
      + " owner: " + owner + " manufacturer: " + manufacturer + " cargo: " + cargo;
    console.log(msg);
    ctx.response.body = { text: msg };
    ctx.response.status = 404;
  }
});

router.delete('/vehicle/:id', ctx => {
  const headers = ctx.params;
  const id = headers.id;
  if (typeof id !== 'undefined') {
    const index = vehicles.findIndex(entry => entry.id == id);
    if (index === -1) {
      const msg = "No entity with id: " + id;
      console.log(msg);
      ctx.response.body = { text: msg };
      ctx.response.status = 404;
    } else {
      let entry = vehicles[index];
      vehicles.splice(index, 1);
      ctx.response.body = entry;
      ctx.response.status = 200;
    }
  } else {
    const msg = "Id missing or invalid. id: " + id;
    console.log(msg);
    ctx.response.body = { text: msg };
    ctx.response.status = 404;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 2419;

server.listen(port, () => {
  console.log(`🚀 Server listening on ${port} ... 🚀`);
});