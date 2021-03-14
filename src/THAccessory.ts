import { Service, PlatformAccessory } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';
import { EcowittPlatformAccessory } from './platformAccessory';


export class THAccessory extends EcowittPlatformAccessory {
  protected temperatureSensor: Service;
  protected humiditySensor: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.temperatureSensor = this.accessory.getService(this.platform.Service.TemperatureSensor)
      || this.accessory.addService(this.platform.Service.TemperatureSensor);

    this.humiditySensor = this.accessory.getService(this.platform.Service.HumiditySensor)
      || this.accessory.addService(this.platform.Service.HumiditySensor);
  }

  updateTemperature(tempf) {
    this.updateCurrentTemperature(this.temperatureSensor, tempf);
  }

  updateHumidity(humidity) {
    this.updateCurrentRelativeHumidity(this.humiditySensor, humidity);
  }
}
