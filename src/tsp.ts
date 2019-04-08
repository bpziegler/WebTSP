const BORDER = 4;

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
        for (let i: number = 0; i < len; i++) {
            this.swapCity(this.wrap(dest+i), this.wrap(src+i));
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

    public setProgress(desc: string, cur: number, max: number, extra?: string) {
        if (Date.now() - this.lastProgress > 500) {
            this.lastProgress = Date.now();
            if (this.lastChangeStr) {
                console.log(this.getLogPrefix() + this.lastChangeStr);
                this.lastChangeStr = undefined;
                this.draw();
            } else {
                console.log(this.getLogPrefix() + desc + '  ' + cur + ' of ' + max + '   ' + extra);
            }
    }
    }

    public logChange(desc: string, numChange: number, minDis: number) {
        this.lastChangeStr = desc + '  numChange ' + numChange + '   minDis ' + minDis.toFixed(1);
        if (Date.now() - this.lastProgress > 100) {
            this.lastProgress = Date.now();
            console.log(this.getLogPrefix() + this.lastChangeStr);
            this.lastChangeStr = undefined;
            this.draw();
        }
    }

    public optimizeUsingMoveOne(): number {
        let numChange: number = 0;
        let minDis: number = this.calcTSPDis();

        for (let i: number = 0; i < this.numCity; i++) {
            this.setProgress('optimizeUsingMoveOne', i, this.numCity, minDis.toFixed(1));
            for (let j: number = 0; j < this.numCity; j++) if (i != j) {
                this.swapCity(i, j);
                let curDis: number = this.calcTSPDis();
                if (curDis >= minDis) {
                    this.swapCity(i, j);
                } else {
                    minDis = curDis;
                    numChange += 1;
                    this.logChange('optimizeUsingMoveOne', numChange, minDis);
                }
            }
        }

        return numChange;
    }

    public optimizeUsingChangeFunc(desc: string, changeFunc: any): number {
        let numChange: number = 0;
        let minDis: number = this.calcTSPDis();

        for (let i: number = 0; i < this.numCity; i++) {
            this.setProgress(desc, i, this.numCity, minDis.toFixed(1));
            for (let j: number = 0; j < this.numCity; j++) if (i != j) {
                for (let k: number = 0; k < this.numCity; k++) {
                    const origAry = this.orderAry.slice();
                    changeFunc(i, j, k);
                    let curDis: number = this.calcTSPDis();
                    if (curDis >= minDis) {
                        this.orderAry = origAry.slice();
                    } else {
                        minDis = curDis;
                        numChange += 1;
                        this.logChange(desc, numChange, minDis);
                    }
                }
            }
        }

        return numChange;
    }

    public optimizeUsingSubPath(): number {
        return this.optimizeUsingChangeFunc('optimizeUsingSubPath', (i: number, j: number, k: number) => { this.insertSubPath(i, j, k) });
    }

    public optimizeUsingRevPath(): number {
        return this.optimizeUsingChangeFunc('optimizeUsingRevPath', (i: number, j: number, k: number) => { this.reversePath(i, j, k) });
    }

    public fullOptmize() {
        this.iter = 0;
        this.startTime = Date.now();
        while (true) {
            this.iter += 1;
            let totChange: number = 0;
            while (true) {
                const numChange = this.optimizeUsingMoveOne();
                if (numChange == 0) break;
                totChange += numChange;
            }
            while (true) {
                const numChange = this.optimizeUsingSubPath();
                if (numChange == 0) break;
                totChange += numChange;
            }
            while (true) {
                const numChange = this.optimizeUsingRevPath();
                if (numChange == 0) break;
                totChange += numChange;
            }
            if (totChange == 0) break;
        }
        this.setProgress('Done', 0, 0);
    }

    public draw() {
        const ctx: CanvasRenderingContext2D | null= this.canvas.getContext("2d");
        if (ctx) {
            ctx.fillText("hello", 10, 10);
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
        }
    }
}

export { TSP, shuffleAry };
