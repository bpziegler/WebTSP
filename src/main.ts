import tsp = require('./tsp');

function run(numCity: number, canvas: HTMLCanvasElement, width: number, height: number, statusSpan: HTMLElement) {
    const mainTSP = new tsp.TSP(numCity, canvas, statusSpan);
    mainTSP.initCities(width, height);
    return mainTSP;
}

export {
   run
}
