import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { inherits } from 'node:util';

import { EcowittHomebridgePlatform } from './platform';


export class EcowittPlatformAccessory {

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, platform.wxStationInfo.manufacturer)
      .setCharacteristic(this.platform.Characteristic.ProductData, platform.wxStationInfo.frequency)
      .setCharacteristic(this.platform.Characteristic.Model, platform.wxStationInfo.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, platform.wxStationInfo.serialNumber)
      .setCharacteristic(this.platform.Characteristic.HardwareRevision, platform.wxStationInfo.model)
      .setCharacteristic(this.platform.Characteristic.SoftwareRevision, platform.wxStationInfo.softwareRevision);
  }

  addBattery(name: string) {
    const battery = this.accessory.getService(this.platform.Service.Battery)
      || this.accessory.addService(this.platform.Service.Battery);

    battery.setCharacteristic(
      this.platform.Characteristic.Name,
      name || (this.accessory.context.sensorInfo.name + ' Battery'));

    battery.setCharacteristic(
      this.platform.Characteristic.ChargingState,
      this.platform.Characteristic.ChargingState.NOT_CHARGEABLE);

    battery.setCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);

    return battery;
  }

  toCelcius(fahrenheit: any): number {
    return (parseFloat(fahrenheit) - 32) * 5 / 9;
  }

  tohPa(inHg: any): number {
    return parseFloat(inHg) * 33.8638;
  }
}

export class WH25 extends EcowittPlatformAccessory {
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

export class WH65 extends EcowittPlatformAccessory {
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

export class WH57 extends EcowittPlatformAccessory {
  protected battery: Service;
  protected lightningSensor: Service;
  protected lightningDistance: Service;
  protected lightningCount: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.lightningDistance = this.accessory.getService(this.platform.Service.OccupancySensor)
      || this.accessory.addService(this.platform.Service.OccupancySensor);

    this.lightningCount = this.accessory.getService(this.platform.Service.MotionSensor)
      || this.accessory.addService(this.platform.Service.MotionSensor);

    this.lightningSensor = this.accessory.getService(this.platform.Service.ContactSensor)
      || this.accessory.addService(this.platform.Service.ContactSensor);

    this.battery = this.addBattery('⚡Battery');
  }

  update(dataReport) {
    this.platform.log.info('WH57 Update');
    this.platform.log.info('  wh57batt:', dataReport.wh57batt);
    this.platform.log.info('  lightning:', dataReport.lightning);
    this.platform.log.info('  lightning_num:', dataReport.lightning_num);
    this.platform.log.info('  lightning_time:', dataReport.lightning_time);

    // Battery

    const batteryLevel = parseFloat(dataReport.wh57batt) / 5;
    const lowBattery = batteryLevel <= 0.2
      ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.battery.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    this.battery.updateCharacteristic(
      this.platform.Characteristic.BatteryLevel,
      batteryLevel * 100);

    // Detection time

    const lightningTime = dataReport.lightning_time > ''
      ? parseInt(dataReport.lightning_time)
      : 0;

    const lightningDetected = lightningTime > 0 && lightningTime < 300000; // < 5 min

    this.lightningSensor.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      !lightningDetected
        ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
        : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);

    this.lightningSensor.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    let contactText = '';

    if (lightningTime) {
      const ms = lightningTime;
      let s = Math.floor(ms / 1000);
      let m = Math.floor(s / 60);
      s = s % 60;
      let h = Math.floor(m / 60);
      m = m % 60;
      const d = Math.floor(h / 24);
      h = h % 24;

      // eslint-disable-next-line no-inner-declarations
      function append(t: string, sep = ',') {
        if (contactText) {
          contactText += sep;
        }

        contactText += t;
      }

      if (d > 1) {
        append(d.toString() + ' days');
      } else if (d || h || m) {
        if (d) {
          append(d > 1 ? d.toString() + ' days' : '1 day');
        }
        if (h) {
          append(h > 1 ? h.toString() + ' hours' : '1 hour');
        }
        if (m && !d) {
          append(m > 1 ? m.toString() + ' minutes' : '1 minute');
        }
      } else if (s) {
        append(m > 1 ? m.toString() + ' seconds' : '1 second');
      }

      contactText += ' ago';
    }

    this.lightningSensor.updateCharacteristic(
      this.platform.Characteristic.Name,
      contactText);

    // Distance to lightning

    this.lightningDistance.updateCharacteristic(
      this.platform.Characteristic.Name,
      `⚡Distance: ${dataReport.lightning} km`);

    this.lightningDistance.updateCharacteristic(
      this.platform.Characteristic.OccupancyDetected,
      lightningDetected);

    this.lightningDistance.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    // Number of lightning strikes

    this.lightningCount.updateCharacteristic(
      this.platform.Characteristic.MotionDetected,
      lightningDetected);

    this.lightningCount.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery);

    this.lightningCount.updateCharacteristic(
      this.platform.Characteristic.Name,
      `⚡Strikes: ${dataReport.lightning_num}`);
  }
}