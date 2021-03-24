
'use strict';

//------------------------------------------------------------------------------

export function toCelcius(fahrenheit): number {
  return (parseFloat(fahrenheit) - 32) * 5 / 9;
}

//------------------------------------------------------------------------------

export function tohPa(inHg): number {
  return parseFloat(inHg) * 33.8638;
}
//------------------------------------------------------------------------------

const kWindSectors = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

//------------------------------------------------------------------------------

export function toWindSector(degrees): string {
  if (typeof degrees !== 'number' || isNaN(degrees)) {
    return 'Unkown';
  }

  const index = Math.round(degrees % 360 / 22.5);

  let sectorName = kWindSectors[index];
  if (!sectorName) {
    sectorName = 'Variable';
  }

  return sectorName;
}

//------------------------------------------------------------------------------
