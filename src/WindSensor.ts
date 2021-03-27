import { PlatformAccessory /*CharacteristicValue,*/ /*Service*/ } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { MotionSensor } from './MotionSensor';

import * as WindUtil from './WindUtil.js';

//------------------------------------------------------------------------------

export class WindSensor extends MotionSensor {

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly name: string,
  ) {

    super(platform, accessory, name);
  }

  //----------------------------------------------------------------------------

  public updateDirection(winddir: number, windspeedmph = Number.NaN) {

    if (!isFinite(winddir)) {
      this.updateStatusActive(false);
      this.updateName('N/A');
      return;
    }

    this.updateStatusActive(true);
    this.updateName(`${this.name}: ${winddir}° ${WindUtil.toSector(winddir)}`);
    this.updateMotionDetected(windspeedmph > 0);
  }

  //----------------------------------------------------------------------------

  public updateSpeed(windspeedmph: number, forceThreshold = 1) {

    if (!isFinite(windspeedmph)) {
      this.updateStatusActive(false);
      this.updateName('N/A');
      return;
    }

    const beaufort = WindUtil.toBeafort(windspeedmph);

    let speed: string;

    switch (this.platform.config?.ws?.wind?.units) {
      case 'kts':
        speed = `${Math.round(windspeedmph * 86.897624) / 100} Kts`;
        break;

      case 'mph':
        speed = `${windspeedmph} Mph`;
        break;

      case 'kmh':
        speed = `${Math.round(windspeedmph * 16.09344) / 10} Km/h`;
        break;

      case 'mps':
        speed = `${Math.round(windspeedmph * 44.704) / 100} m/s`;
        break;

      case 'beaufort':
      default:
        speed = beaufort.description;
        break;
    }

    this.updateStatusActive(true);
    this.updateName(`${this.name}: ${speed}`);
    this.updateMotionDetected(beaufort.force >= forceThreshold);
  }

  //----------------------------------------------------------------------------
}
