import { Service, PlatformAccessory } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';
import { EcowittPlatformAccessory } from './platformAccessory';


export class WH25Accessory extends EcowittPlatformAccessory {
  protected temperatureSensor: Service;
  protected humiditySensor: Service;
  protected absolutePressureSensor: Service;
  protected relativePressureSensor: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.temperatureSensor = this.accessory.getService(this.platform.Service.TemperatureSensor)
      || this.accessory.addService(this.platform.Service.TemperatureSensor);

    this.temperatureSensor.setCharacteristic(
      this.platform.Characteristic.Name,
      'Indoor Temperature');

    this.humiditySensor = this.accessory.getService(this.platform.Service.HumiditySensor)
      || this.accessory.addService(this.platform.Service.HumiditySensor);

    this.humiditySensor.setCharacteristic(
      this.platform.Characteristic.Name,
      'Indoor Humidity');

    this.absolutePressureSensor = this.accessory.getService(this.platform.Service.OccupancySensor)
      || this.accessory.addService(this.platform.Service.OccupancySensor);

    this.relativePressureSensor = this.accessory.getService(this.platform.Service.MotionSensor)
      || this.accessory.addService(this.platform.Service.MotionSensor);
  }

  update(dataReport) {
    this.platform.log.info('WH25 Update');
    this.platform.log.info('  wh25batt:', dataReport.wh25batt);
    this.platform.log.info('  tempinf:', dataReport.tempinf);
    this.platform.log.info('  humidityin:', dataReport.humidityin);
    this.platform.log.info('  baromrelin', dataReport.baromrelin);
    this.platform.log.info('  baromabsin', dataReport.baromabsin);

    const lowBattery = dataReport.wh25batt == '1'
      ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    // Temperature
    this.temperatureSensor.updateCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
      this.toCelcius(dataReport.tempinf));

    this.temperatureSensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    // Humidity
    this.humiditySensor.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      parseFloat(dataReport.humidityin));

    this.humiditySensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    // Barometer
    this.absolutePressureSensor.updateCharacteristic(
      this.platform.Characteristic.Name,
      Math.round(this.tohPa(dataReport.baromabsin)).toString() + ' hPa (Abs)');

    this.absolutePressureSensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    this.relativePressureSensor.updateCharacteristic(
      this.platform.Characteristic.Name,
      Math.round(this.tohPa(dataReport.baromrelin)).toString() + ' hPa (Rel)');

    this.relativePressureSensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);
  }
}
