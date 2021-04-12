import { Service, PlatformAccessory } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { EcowittAccessory } from './EcowittAccessory';


export class WH41 extends EcowittAccessory {
  protected battery: Service;
  protected airQualitySensor: Service;
  protected name: string;

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly channel: number,
  ) {
    super(platform, accessory);

    this.setModel(
      'WH41',
      'Wireless PM2.5 Air Quality Sensor');
    this.setSerialNumber(`CH${this.channel}`);

    this.name = this.platform.config?.pm25?.[`name${this.channel}`] || `CH${this.channel} PM2.5`;

    this.airQualitySensor = this.accessory.getService(this.platform.Service.AirQualitySensor)
      || this.accessory.addService(this.platform.Service.AirQualitySensor);

    this.setName(this.airQualitySensor, this.name);
    this.setStatusActive(this.airQualitySensor, false);

    this.battery = this.addBattery(this.name, true);
  }

  update(dataReport) {
    const pm25batt = parseFloat(dataReport[`pm25batt${this.channel}`]);
    const pm25 = parseFloat(dataReport[`pm25_ch${this.channel}`]);
    const pm25_avg_24h = parseFloat(dataReport[`pm25_avg_24h_ch${this.channel}`]);

    this.platform.log.info(`WH41 Channel ${this.channel} Update`);
    this.platform.log.info('  pm25batt:', pm25batt);
    this.platform.log.info('  pm25:', pm25);
    this.platform.log.info('  pm25_avg_24h:', pm25_avg_24h);

    this.setStatusActive(this.airQualitySensor, true);

    // Battery

    const batteryLevel = pm25batt / 5;
    const lowBattery = batteryLevel <= 0.2;

    this.updateBatteryLevel(this.battery, batteryLevel * 100);
    this.updateStatusLowBattery(this.battery, lowBattery);
    this.updateStatusLowBattery(this.airQualitySensor, lowBattery);

    this.airQualitySensor.updateCharacteristic(
      this.platform.Characteristic.PM2_5Density,
      pm25);

    const airQuality = pm25 < 5
      ? this.platform.Characteristic.AirQuality.EXCELLENT
      : pm25 <= 10
        ? this.platform.Characteristic.AirQuality.GOOD
        : pm25 <= 20
          ? this.platform.Characteristic.AirQuality.FAIR
          : pm25 <= 25
            ? this.platform.Characteristic.AirQuality.INFERIOR
            : this.platform.Characteristic.AirQuality.POOR;

    this.airQualitySensor.updateCharacteristic(
      this.platform.Characteristic.AirQuality,
      airQuality);
  }
}
