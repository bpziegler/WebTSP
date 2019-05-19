import { Point } from "./point";
import { Cluster } from "./cluster";

const NUM_POINT = 1000;
const NUM_CLUSTER = Math.floor(Math.sqrt(NUM_POINT));


const points: Point[] = Point.createRandomPoints(NUM_POINT, 1000, 1000, 5);
const clusters: Cluster[] = Cluster.createClusters(points, NUM_CLUSTER);

for (let i = 0; i < clusters.length; i++) {
    console.log(i + "   " + clusters[i].toString());
}
