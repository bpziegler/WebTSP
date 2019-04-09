import tsp = require('./tsp');

function run(numCity: number, canvas: HTMLCanvasElement, width: number, height: number) {
    const mainTSP = new tsp.TSP(numCity, canvas);
    mainTSP.initCities(width, height);
    mainTSP.fullOptmize();
    mainTSP.draw();
}

export {
   run
}
