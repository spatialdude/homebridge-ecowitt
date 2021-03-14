import { Service, PlatformAccessory } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';
import { THAccessory } from './THAccessory';


export class THBAccessory extends THAccessory {
  protected absolutePressureSensor: Service;
  protected relativePressureSensor: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.absolutePressureSensor = this.addOccupancySensor('Absolute Air Pressure');
    this.relativePressureSensor = this.addOccupancySensor('Relative Air Pressure');
  }

  updateRelativePressue(baromabs) {
    this.updateName(this.absolutePressureSensor,
      Math.round(this.tohPa(baromabs)).toString() + ' hPa (Abs)');
  }

  updateAbsolutePressure(baromrel) {
    this.updateName(this.relativePressureSensor,
      Math.round(this.tohPa(baromrel)).toString() + ' hPa (Rel)');
  }
}
