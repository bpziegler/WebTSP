const BORDER: number = 4;
const CITY_RADIUS: number = 3;
const USE_MOVE_ONE: boolean = true;
const USE_SUB_PATH: boolean = true;
const USE_REV_PATH: boolean = false;


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

    constructor(numCity: number, canvas: HTMLCanvasElement) {
        this.numCity = numCity;
        this.canvas = canvas;
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
        }
        this.calcCityPairsDis();
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
        for (let i: number = 0; i < len / 2; i++) {
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
        for (let i: number = 0; i < len / 2; i++) {
            this.swapCity(this.wrap(dest+i), this.wrap(src+(len-1-i)));
        }
    }

    public getLogPrefix(): string {
        const elap = (Date.now() - this.startTime) / 1000.0;
        return 'elap ' + elap.toFixed(1) + '   iter ' + this.iter + '   ';
    }

    public async setProgress(desc: string, cur: number, max: number, extra?: string) {
        if (Date.now() - this.lastProgress > 500) {
            this.lastProgress = Date.now();
            if (this.lastChangeStr) {
                console.log(this.getLogPrefix() + this.lastChangeStr);
                this.lastChangeStr = undefined;
                await this.draw();
            } else {
                console.log(this.getLogPrefix() + desc + '  ' + cur + ' of ' + max + '   ' + extra);
            }
            await timerPromise(0);  // We do this so the user can refresh the page, etc
        }
    }

    public async logChange(desc: string, numChange: number, minDis: number) {
        this.lastChangeStr = desc + '  numChange ' + numChange + '   minDis ' + minDis.toFixed(1);
        if (Date.now() - this.lastProgress > 100) {
            this.lastProgress = Date.now();
            console.log(this.getLogPrefix() + this.lastChangeStr);
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
                // Subtract values - we are reversing the path from p1 to p2
                // So subtract p1Prev dis p1, and p2 dis p2Next
                // Then add p1Prev dis p2, and p1 dis p2Next
                const p1 = this.orderAry[i];
                const p1Prev = this.orderAry[this.wrap(i-1)];
                const p2 = this.orderAry[j];
                const p2Next = this.orderAry[this.wrap(j+1)];
                const oldVal: number = this.cityDis(p1Prev, p1) + this.cityDis(p2, p2Next);
                const newVal: number = this.cityDis(p1Prev, p2) + this.cityDis(p1, p2Next);
                if (newVal < oldVal) {
                    minDis = minDis + newVal - oldVal;;
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

        for (let i: number = 0; i < this.numCity; i++) {
            await this.setProgress(desc, i, this.numCity, minDis.toFixed(1));
            for (let j: number = 0; j < this.numCity; j++) if (i != j) {
                await this.setProgress(desc, i, this.numCity, minDis.toFixed(1));
                for (let k: number = 0; k < this.numCity; k++) {
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
            while (USE_MOVE_ONE) {
                const numChange = await this.optimizeUsingMoveOne();
                if (numChange == 0) break;
                totChange += numChange;
            }
            while (USE_SUB_PATH) {
                const numChange =  await this.optimizeUsingSubPath();
                if (numChange == 0) break;
                totChange += numChange;
            }
            while (USE_REV_PATH) {
                const numChange =  await this.optimizeUsingRevPath();
                if (numChange == 0) break;
                totChange += numChange;
            }
            if (totChange == 0) break;
        }
        this.setProgress('Done', 0, 0);
    }

    public async draw() {
        const ctx: CanvasRenderingContext2D | null= this.canvas.getContext("2d");
        if (ctx) {
            ctx.scale(1, 1);
            // ctx.fillText("hello", 10, 10);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, this.width, this.height);

            for (let i: number = 0; i < this.numCity; i++) {
                const p1 = this.orderAry[i];
                const p2 = this.orderAry[this.wrap(i+1)];
                const x1 = this.cityX[p1];
                const y1 = this.cityY[p1];
                const x2 = this.cityX[p2];
                const y2 = this.cityY[p2];
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.closePath();
            }
            for (let i: number = 0; i < this.numCity; i++) {
                const p1 = this.orderAry[i];
                const x1 = this.cityX[p1];
                const y1 = this.cityY[p1];
                ctx.beginPath();
                ctx.arc(x1, y1, CITY_RADIUS, 0, 2*Math.PI, true);
                ctx.fillStyle = 'blue';
                ctx.fill();
            }
            await timerPromise(0);  // We do this so the canvas will draw
        }
    }
}

export { TSP, shuffleAry };
