import { Service, PlatformAccessory } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';
import { EcowittPlatformAccessory } from './platformAccessory';


export class WH65Accessory extends EcowittPlatformAccessory {
  protected temperatureSensor: Service;
  protected humiditySensor: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.temperatureSensor = this.accessory.getService(this.platform.Service.TemperatureSensor)
      || this.accessory.addService(this.platform.Service.TemperatureSensor);

    this.temperatureSensor.setCharacteristic(
      this.platform.Characteristic.Name,
      'Outdoor Temperature');

    this.humiditySensor = this.accessory.getService(this.platform.Service.HumiditySensor)
      || this.accessory.addService(this.platform.Service.HumiditySensor);

    this.humiditySensor.setCharacteristic(
      this.platform.Characteristic.Name,
      'Outdoor Humidity');
  }

  update(dataReport) {
    this.platform.log.info('WH65 Update');
    this.platform.log.info('  wh65batt:', dataReport.wh65batt);
    this.platform.log.info('  tempf:', dataReport.tempf);
    this.platform.log.info('  humidity:', dataReport.humidity);

    const lowBattery = dataReport.wh65batt == '1'
      ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.temperatureSensor.updateCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
      this.toCelcius(dataReport.tempf));

    this.temperatureSensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    this.humiditySensor.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      parseFloat(dataReport.humidity));

    this.humiditySensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);
  }
}
