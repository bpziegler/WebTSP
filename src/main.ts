import tsp = require('./tsp');

async function run(numCity: number, canvas: HTMLCanvasElement, width: number, height: number) {
    const mainTSP = new tsp.TSP(numCity, canvas);
    mainTSP.initCities(width, height);
    await mainTSP.fullOptmize();
    await mainTSP.draw();
    console.log("run function done");
}

async function test() {
    const mainTSP = new tsp.TSP(75, undefined);
    mainTSP.initCities(500, 500);
    await mainTSP.fullOptmize();
    console.log("test function done");
}

export {
   run,
   test
}
