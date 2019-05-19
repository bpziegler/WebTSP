import { Point } from "./point";

export function findNearestPoint(point: Point, points: Point[]): number {
    let result: number = -1;
    let minDis = Number.MAX_VALUE;

    for (let i = 0; i < points.length; i++) {
        const dis = Point.ptDis(point, points[i]);
        if (dis < minDis) {
            result = i;
            minDis = dis;
        }
    }

    return result;
}


export class Cluster {
    public center: Point = new Point(0, 0);
    public prevCenter: Point = new Point(0, 0);
    public points: Point[] = [];

    constructor(initialCenter: Point) {
        this.center = initialCenter;
    }

    toString() {
        return this.center.toString() + "  numPoints = " + this.points.length;
    }

    resetPoints() {
        this.points = [];
    }

    updateCenter(): boolean {
        let didChange = false;
        this.prevCenter = this.center;
        this.center = Point.getCenter(this.points);
        return !Point.pointsMatch(this.prevCenter, this.center);
    }

    static createClusters(points: Point[], numCluster: number): Cluster[] {
        let clusters: Cluster[] = [];

        // Initialize the clusters
        for (let i = 0; i < numCluster; i++) {
            // Pick a random point as its center
            const idx = Math.floor(Math.random() * points.length);
            const randomPoint = points[idx];
            const cluster = new Cluster(randomPoint);
            clusters.push(cluster);
        }

        let numChange: number = 0;
        let iter: number = 0;
        do {
            iter += 1;
            console.log(`Begin Iter ${iter}`);

            // Assign each of the points to a cluster
            const clusterCenters: Point[] = clusters.map(cluster => cluster.center);
            for (let i = 0; i < clusters.length; i++) {
                clusters[i].resetPoints();
            }
            for (let i = 0; i < points.length; i++) {
                const nearestClusterIdx: number = findNearestPoint(points[i], clusterCenters);
                // console.log(i, nearestClusterIdx);
                clusters[nearestClusterIdx].points.push(points[i]);
            }

            numChange = 0;
            for (let i = 0; i < clusters.length; i++) {
                const didChange = clusters[i].updateCenter();
                numChange += (didChange) ? 1 : 0;
            }
            const numEmptyCluster: number = clusters.filter(cluster => cluster.points.length === 0).length;
            console.log(`End Iter ${iter}   numChange ${numChange}   numEmptyCluster ${numEmptyCluster}`);
        } while (numChange > 0);

        return clusters;
    }
}

