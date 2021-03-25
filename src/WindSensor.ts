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

  public updateDirection(winddir: number, windspeedmph = Number.NaN, forceThreshold = -1) {

    if (isFinite(windspeedmph)) {
      const beaufort = WindUtil.toBeafort(windspeedmph);

      this.updateName(`${this.name}: ${winddir}° ${WindUtil.toSector(winddir)}`);
      this.updateMotionDetected(beaufort.force >= forceThreshold);
    } else {
      this.updateName(`${this.name}: ${winddir}° ${WindUtil.toSector(winddir)}`);
    }
  }

  //----------------------------------------------------------------------------

  public updateSpeed(windspeedmph: number, forceThreshold = -1) {

    if (!isFinite(windspeedmph)) {
      this.updateName('');
      return;
    }

    const beaufort = WindUtil.toBeafort(windspeedmph);

    this.updateName(`${this.name}: ${beaufort.description}`);
    this.updateMotionDetected(beaufort.force >= forceThreshold);
  }

  //----------------------------------------------------------------------------
}
