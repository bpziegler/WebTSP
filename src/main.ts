import tsp = require('./tsp');

console.log("hello from main!");

function run(numCity: number, c: HTMLCanvasElement) {
    const mainTSP = new tsp.TSP(numCity, c);
    mainTSP.initCities(500, 500);
    mainTSP.fullOptmize();
    mainTSP.draw();
}

export {
   run
}
