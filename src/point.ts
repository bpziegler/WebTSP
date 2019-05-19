const NUMBER_MATCH_THRESHOLD = 1e-6;

export class Point {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return "x = " + this.x.toFixed(3) + "  y = " + this.y.toFixed(3);
    }

    static ptDis(p1: Point, p2: Point): number {
        const xDis = p1.x - p2.x;
        const yDis = p1.y - p2.y;
        return Math.sqrt(xDis * xDis + yDis * yDis);
    }

    static pointsMatch(p1: Point, p2: Point): boolean {
        const xDiff = Math.abs(p1.x - p2.x);
        const yDiff = Math.abs(p1.y - p2.y);
        return (xDiff < NUMBER_MATCH_THRESHOLD) && (yDiff < NUMBER_MATCH_THRESHOLD);
    }

    static getCenter(points: Point[]): Point {
        let xTot: number = 0;
        let yTot: number = 0;
        for (let i = 0; i < points.length; i++) {
            xTot += points[i].x;
            yTot += points[i].y;
        }
        return (points.length > 0) ? new Point(xTot / points.length, yTot / points.length) : new Point(0, 0);
    }

    static createRandomPoints(numPoint: number, width: number, height: number, border: number): Point[] {
        let result: Point[] = [];

        for (let i = 0; i < numPoint; i++) {
            let x = Math.random() * (width - border*2) + border;
            let y = Math.random() * (height - border*2) + border;
            result.push(new Point(x, y));
        }

        return result;
    }
}

