import tsp = require('./tsp');

async function run(numCity: number, canvas: HTMLCanvasElement, width: number, height: number) {
    const mainTSP = new tsp.TSP(numCity, canvas);
    mainTSP.initCities(width, height);
    await mainTSP.fullOptmize();
    await mainTSP.draw();
    console.log("run function done");
}

export {
   run
}
