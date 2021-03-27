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

  public updateRate(ratein: number) {
    if (!isFinite(ratein)) {
      this.updateActive(false);
      this.updateName('N/A');
      return;
    }

    let rate: string;

    switch (this.platform.config?.ws?.rain?.units) {
      case 'in':
        rate = `${ratein} in/h`;
        break;

      default:
      case 'mm':
        rate = `${Math.round(ratein * 25.4)} mm/h`;
        break;
    }

    this.updateActive(true);
    this.updateName(`${this.name}: ${rate}`);
    this.updateDetected(ratein > 0);
  }

  //----------------------------------------------------------------------------

  public updateTotal(totalin: number) {
    if (!isFinite(totalin)) {
      this.updateActive(false);
      this.updateName('N/A');
      return;
    }

    let total: string;

    switch (this.platform.config?.ws?.rain?.units) {
      case 'in':
        total = `${totalin} in`;
        break;

      default:
      case 'mm':
        total = `${Math.round(totalin * 25.4)} mm`;
        break;
    }

    this.updateActive(true);
    this.updateName(`${this.name}: ${total}`);
    this.updateDetected(totalin > 0);
  }

  //----------------------------------------------------------------------------

  private updateActive(active: boolean) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.Active,
      active);
  }

  //----------------------------------------------------------------------------

  private updateDetected(detected: boolean) {
    this.service.updateCharacteristic(
      this.platform.Characteristic.LeakDetected,
      detected
        ? this.platform.Characteristic.LeakDetected.LEAK_DETECTED
        : this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED);
  }

  //----------------------------------------------------------------------------
}
