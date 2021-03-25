import { PlatformAccessory /*CharacteristicValue,*/ /*Service*/ } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { Sensor } from './Sensor';

//------------------------------------------------------------------------------

export class RainSensor extends Sensor {

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly name: string,
  ) {
    super(platform,
      accessory,
      accessory.getService(name)
      || accessory.addService(
        platform.Service.LeakSensor,
        name,
        platform.serviceUuid(name)));
  }

  //----------------------------------------------------------------------------

  public updateRate(rate: number, threhsold = 0) {
    const mm = Math.round(25.4 * rate);

    if (isFinite(rate)) {
      this.updateName(`${this.name}: ${mm} mm/h`);
      this.updateDetected(rate > threhsold);
      this.updateActive(rate > 0);
    } else {
      this.updateName('');
      this.updateActive(false);
    }
  }

  //----------------------------------------------------------------------------

  public updateTotal(total: number, threhsold = 0) {
    const mm = Math.round(25.4 * total);

    if (isFinite(mm)) {
      this.updateName(`${this.name}: ${mm} mm`);
      this.updateDetected(total > threhsold);
    } else {
      this.updateName('');
      this.updateActive(false);
    }
  }

  private updateActive(active: boolean) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.Active,
      active);
  }

  private updateDetected(detected: boolean) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.LeakDetected,
      detected
        ? this.platform.Characteristic.LeakDetected.LEAK_DETECTED
        : this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED);
  }

  //----------------------------------------------------------------------------
}
