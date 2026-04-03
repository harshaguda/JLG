export type Coordinate = {
    lat: number;
    lng: number;
};

/**
 * Edit this file with your own coordinates.
 * - `radiusCoordinate` is used to create the Radius question center.
 * - `tentacleCoordinates` must contain exactly 3 coordinates.
 */
export const radiusCoordinate: Coordinate = {
    lat: 41.40367433308992, 
    lng: 2.2033578747895404,
};

export const tentacleCoordinates: [Coordinate, Coordinate, Coordinate] = [
    { lat: 41.40408826797548, lng: 2.199926773819841 },
    { lat: 41.402787049518416, lng: 2.1951184575356346},
    { lat: 41.397743104417735, lng: 2.20265499060203 },
    { lat:41.40814422453895, lng: 2.2014347462515507}
];
