import { Service, PlatformAccessory } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { ThermoHygroSensor } from './ThermoHygroSensor';

import * as Utils from './Utils.js';

//------------------------------------------------------------------------------

export class ThermoHygroBaroSensor extends ThermoHygroSensor {
  protected absolutePressureSensor: Service;
  protected relativePressureSensor: Service;

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.absolutePressureSensor = this.addOccupancySensor('Absolute Pressure');
    this.relativePressureSensor = this.addOccupancySensor('Relative Pressure');
  }

  updateRelativePressure(baromabs) {
    this.updateName(this.absolutePressureSensor,
      `Abs. Pressure: ${Math.round(Utils.tohPa(baromabs)).toString()} hPa`);
  }

  updateAbsolutePressure(baromrel) {
    this.updateName(this.relativePressureSensor,
      `Rel. Pressure: ${Math.round(Utils.tohPa(baromrel)).toString()} hPa`);
  }
}
