import { Point } from "./point";
import { Cluster, findNearestPoint } from "./cluster";

const BORDER: number = 4;
const CITY_RADIUS: number = 3;
const IDEAL_CLUSTER_SIZE: number = 75;

function hexString(num: number, len: number): string {
    return ("000000000000000" + num.toString(16)).substr(-len);
}

function shuffleAry(ary: number[]) {
    let counter: number = ary.length;
    while(counter > 0) {
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = ary[counter];
        ary[counter] = ary[index];
        ary[index] = temp;
    }
    return ary;
}

async function timerPromise(waitMS: number): Promise<undefined> {
    return new Promise<undefined>((resolve, reject) => {
        let timerId: number;
        let timerFunc = () => {
            clearTimeout(timerId);
            resolve();
        }
        timerId = setTimeout(timerFunc, waitMS);
    });
}

class TSP {
    private numCity: number;
    private canvas: HTMLCanvasElement;
    private statusSpan: HTMLElement;
    private width: number = 0;
    private height: number = 0;
    public orderAry: number[] = [];
    public cityX: number[] = [];
    public cityY: number[] = [];
    public cityDis: number[][] = [];
    public iter: number = 0;
    public lastProgress: number = 0;
    public lastChangeStr?: string;
    public startTime: number = 0;
    public needStop: boolean = false;
    public doMove: boolean;
    public doSubPath: boolean;
    public doRevPath: boolean;
    public cityPoints: Point[] = [];
    public numCluster: number = 0;
    public clusters: Cluster[] = [];
    public clusterColors: string[] = [];
    public clusterCenters: Point[] = [];

    constructor(numCity: number, canvas: HTMLCanvasElement, statusSpan: HTMLElement, doMove: boolean, doSubPath: boolean, doRevPath: boolean) {
        this.numCity = numCity;
        this.canvas = canvas;
        this.statusSpan = statusSpan;
        this.doMove = doMove;
        this.doSubPath = doSubPath;
        this.doRevPath = doRevPath;
    }

    public wrap(idx: number): number {
        let i = idx;
        while (i >= this.numCity) {
            i -= this.numCity;
        }
        while (i < 0) {
            i += this.numCity;
        }
        return i;
    }

    public initCities(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.randomOrder();
        for (let i: number = 0; i < this.numCity; i++) {
            this.cityX[i] = Math.random() * (width - BORDER*2) + BORDER;
            this.cityY[i] = Math.random() * (height - BORDER*2) + BORDER;
            this.cityPoints.push(new Point(this.cityX[i], this.cityY[i]));
        }
        this.calcCityPairsDis();
        this.numCluster = Math.ceil(this.numCity / IDEAL_CLUSTER_SIZE);
        this.clusters = Cluster.createClusters(this.cityPoints, this.numCluster);
        this.clusterCenters = this.clusters.map(cluster => cluster.center);
        this.clusterColors = [];
        for (let i: number = 0; i < this.numCluster; i++) {
            const red = Math.floor(Math.random() * 256);
            const grn = Math.floor(Math.random() * 256);
            const blu = Math.floor(Math.random() * 256);
            const color: string = '#'  + hexString(red, 2) + hexString(grn, 2) + hexString(blu, 2);
            if (color.length !== 7) {
                throw new Error("Bad color!");
            }
            this.clusterColors.push(color);
        }
    }

    public calcCityPairsDis() {
        for (let i: number = 0; i < this.numCity; i++) {
            this.cityDis[i] = [];
            for (let j: number = 0; j < this.numCity; j++) {
                this.cityDis[i][j] = this.calcPointDis(i, j);
            }
        }
    }

    public calcPointDis(i: number, j: number): number {
        return this.ptDis(this.cityX[i], this.cityY[i], this.cityX[j], this.cityY[j]);
    }

    public ptDis(x1: number, y1: number, x2: number, y2: number): number {
        const xd = x1 - x2;
        const yd = y1 - y2;
        return Math.sqrt(xd*xd + yd*yd);
    }

    public randomOrder() {
        for (let i: number = 0; i < this.numCity; i++) {
            this.orderAry[i] = i;
        }
        shuffleAry(this.orderAry);
    }

    public logCities() {
        for (let i: number = 0; i < this.numCity; i++) {
            console.log(`${i}   ${this.cityX[i].toFixed(1)}   ${this.cityY[i].toFixed(1)}`);
        }
        const tspDis = this.calcTSPDis();
        console.log('TSP Distance = ' + tspDis.toFixed(1));
    }

    public calcTSPDis(): number {
        let result: number = 0;

        for (let i: number = 0; i < this.numCity; i++) {
            const p1 = this.orderAry[i];
            const p2 = this.orderAry[this.wrap(i+1)];
            result += this.cityDis[p1][p2];
        }

        return result;
    }

    public swapCity(i: number, j: number) {
        const tmp = this.orderAry[i];
        this.orderAry[i] = this.orderAry[j];
        this.orderAry[j] = tmp;
    }

    public checkOrder() {
        const tmp: number[] = [];

        for (let i: number = 0; i < this.numCity; i++) {
            tmp[i] = 0;
        }

        for (let i: number = 0; i < this.numCity; i++) {
            const pos = this.orderAry[i];
            if (tmp[pos] != 0) {
                throw new Error('Invalid order array at: ' + i);
            }
            tmp[pos] = 1;
        }
    }

    public insertSubPath(dest: number, src: number, len: number) {
        for (let i: number = 0; i < len; i++) {
            this.swapCity(this.wrap(dest+i), this.wrap(src+i));
        }
    }

    public reversePathSimple(dest: number, src: number) {
        const len = this.wrap(dest - src);
        for (let i: number = 0; i < len / 2; i++) {
            this.swapCity(this.wrap(dest+i), this.wrap(src+(len-1-i)));
        }
    }

    public reversePath(dest: number, src: number, len: number) {
        for (let i: number = 0; i < len; i++) {
            this.swapCity(this.wrap(dest+i), this.wrap(src+(len-1-i)));
        }
    }

    public getLogPrefix(): string {
        const elap = (Date.now() - this.startTime) / 1000.0;
        return 'elap ' + elap.toFixed(1) + '   iter ' + this.iter + '   ';
    }

    public async setProgress(desc: string, cur: number, max: number, extra?: string) {
        if (this.needStop) {
            throw new Error('Do Stop');
        }

        if (Date.now() - this.lastProgress > 500) {
            this.lastProgress = Date.now();
            if (this.lastChangeStr) {
                var s: string = this.getLogPrefix() + this.lastChangeStr;
                console.log(s);
                this.statusSpan.innerHTML = s;
                this.lastChangeStr = undefined;
                await this.draw();
            } else {
                var s: string = this.getLogPrefix() + desc + '  ' + cur + ' of ' + max + '   ' + extra;
                console.log(s);
                this.statusSpan.innerHTML = s;
            }
            await timerPromise(0);  // We do this so the user can refresh the page, etc
        }
    }

    public async logChange(desc: string, numChange: number, minDis: number) {
        this.lastChangeStr = desc + '  numChange ' + numChange + '   minDis ' + minDis.toFixed(1);
        if (Date.now() - this.lastProgress > 100) {
            this.lastProgress = Date.now();
            var s: string = this.getLogPrefix() + this.lastChangeStr;
            console.log(s);
            this.statusSpan.innerHTML = s;
            this.lastChangeStr = undefined;
            await this.draw();
        }
    }

    public async optimizeUsingMoveOne(): Promise<number> {
        let numChange: number = 0;
        let minDis: number = this.calcTSPDis();

        for (let i: number = 0; i < this.numCity; i++) {
            await this.setProgress('optimizeUsingMoveOne', i, this.numCity, minDis.toFixed(1));
            for (let j: number = 0; j < this.numCity; j++) if (i != j) {
                const origAry = this.orderAry.slice();
                this.reversePathSimple(i, j);
                let curDis: number = this.calcTSPDis();
                if (curDis >= minDis) {
                    this.orderAry = origAry.slice();
                } else {
                    minDis = curDis;
                    numChange += 1;
                    await this.logChange('optimizeUsingMoveOne', numChange, minDis);
                }
            }
        }

        return numChange;
    }

    public async optimizeUsingChangeFunc(desc: string, changeFunc: any): Promise<number> {
        let numChange: number = 0;
        let minDis: number = this.calcTSPDis();

        // const maxLen: number = Math.sqrt(this.numCity);
        const maxLen: number = this.numCity / 2;

        for (let i: number = 0; i < this.numCity; i++) {
            await this.setProgress(desc, i, this.numCity, minDis.toFixed(1));
            for (let j: number = 0; j < this.numCity; j++) if (i != j) {
                await this.setProgress(desc, i, this.numCity, minDis.toFixed(1));
                for (let k: number = 0; k < maxLen; k++) {
                    const origAry = this.orderAry.slice();
                    changeFunc(i, j, k);
                    let curDis: number = this.calcTSPDis();
                    if (curDis >= minDis) {
                        this.orderAry = origAry.slice();
                    } else {
                        minDis = curDis;
                        numChange += 1;
                        await this.logChange(desc, numChange, minDis);
                    }
                }
            }
        }

        return numChange;
    }

    public async optimizeUsingSubPath(): Promise<number> {
        return await this.optimizeUsingChangeFunc('optimizeUsingSubPath', (i: number, j: number, k: number) => { this.insertSubPath(i, j, k) });
    }

    public async optimizeUsingRevPath(): Promise<number> {
        return await this.optimizeUsingChangeFunc('optimizeUsingRevPath', (i: number, j: number, k: number) => { this.reversePath(i, j, k) });
    }

    public async fullOptmize() {
        this.iter = 0;
        this.startTime = Date.now();
        while (true) {
            this.iter += 1;
            let totChange: number = 0;
            while (this.doMove) {
                const numChange = await this.optimizeUsingMoveOne();
                totChange += numChange;
                if (numChange == 0) break;
            }
            while (this.doSubPath) {
                const numChange =  await this.optimizeUsingSubPath();
                totChange += numChange;
                if (numChange >= 0) break;
            }
            while (this.doRevPath) {
                const numChange =  await this.optimizeUsingRevPath();
                totChange += numChange;
                if (numChange >= 0) break;
            }
            if (totChange == 0) break;
        }
        await this.draw();
        this.setProgress('Done', 0, 0);
    }

    public stop() {
        this.needStop = true;
    }

    public async draw() {
        if (this.needStop) {
            throw new Error('Do Stop');
        }

        const ctx: CanvasRenderingContext2D | null= (this.canvas) ? this.canvas.getContext("2d") : null;
        if (ctx) {
            ctx.scale(1, 1);
            // ctx.fillText("hello", 10, 10);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, this.width, this.height);

            // Draw Cluster Lines
            for (let i: number = 0; i < this.numCity; i++) {
                const p1: number = this.orderAry[i];
                const x1: number = this.cityX[p1];
                const y1: number = this.cityY[p1];
                const pt: Point = new Point(x1, y1);
                const nearestClusterIdx: number = findNearestPoint(pt, this.clusterCenters);
                const clusterPt: Point = this.clusterCenters[nearestClusterIdx];

                ctx.beginPath();
                ctx.strokeStyle = "#e0e0e0";
                ctx.moveTo(x1, y1);
                ctx.lineTo(clusterPt.x, clusterPt.y);
                ctx.stroke();
                ctx.closePath();
            }

            // Draw City Path Lines
            for (let i: number = 0; i < this.numCity; i++) {
                const p1: number = this.orderAry[i];
                const p2: number = this.orderAry[this.wrap(i+1)];
                const x1: number = this.cityX[p1];
                const y1: number = this.cityY[p1];
                const x2: number = this.cityX[p2];
                const y2: number = this.cityY[p2];
                ctx.beginPath();
                ctx.strokeStyle = "#000000";
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.closePath();
            }

            // Draw Cities
            for (let i: number = 0; i < this.numCity; i++) {
                const p1: number = this.orderAry[i];
                const x1: number = this.cityX[p1];
                const y1: number = this.cityY[p1];
                const pt: Point = new Point(x1, y1);
                const nearestClusterIdx: number = findNearestPoint(pt, this.clusterCenters);

                ctx.beginPath();
                ctx.fillStyle = this.clusterColors[nearestClusterIdx];
                ctx.arc(x1, y1, CITY_RADIUS, 0, 2*Math.PI, true);
                ctx.fill();
                ctx.closePath();
            }

            // Draw Cluster centers
            for (let i: number = 0; i < this.clusters.length; i++) {
                const clusterPt = this.clusterCenters[i];
                ctx.beginPath();
                ctx.fillStyle = this.clusterColors[i];
                ctx.fillText(i.toString(), clusterPt.x, clusterPt.y);
                ctx.closePath();
            }

            await timerPromise(0);  // We do this so the canvas will draw
        }
    }
}

export { TSP, shuffleAry };
