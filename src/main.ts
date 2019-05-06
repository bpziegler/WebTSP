import tsp = require('./tsp');

function run(numCity: number, canvas: HTMLCanvasElement, width: number, height: number, statusSpan: HTMLElement, doMove: boolean, doSubPath: boolean, doRevPath: boolean) {
    const mainTSP = new tsp.TSP(numCity, canvas, statusSpan, doMove, doSubPath, doRevPath);
    mainTSP.initCities(width, height);
    return mainTSP;
}

export {
   run
}
