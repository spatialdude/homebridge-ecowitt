import { Service, PlatformAccessory } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';
import { EcowittPlatformAccessory } from './platformAccessory';


export class WH51Accessory extends EcowittPlatformAccessory {
  protected battery: Service;
  protected soilMoistureSensor: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly channel: number,
  ) {
    super(platform, accessory);

    const name = this.platform.config?.soil?.[`ch${this.channel}`] || `Soil Moisture ${this.channel}`;

    this.battery = this.addBattery(name);

    this.soilMoistureSensor = this.accessory.getService(this.platform.Service.HumiditySensor)
    || this.accessory.addService(this.platform.Service.HumiditySensor);

    this.setName(this.soilMoistureSensor, name);
    this.setStatusActive(this.soilMoistureSensor, false);
  }

  update(dataReport) {
    const soilbatt = dataReport[`soilbatt${this.channel}`];
    const soilmoisture = dataReport[`soilmoisture${this.channel}`];

    this.platform.log.info(`WH51 Channel ${this.channel} Update`);
    this.platform.log.info('  soilbatt:', soilbatt);
    this.platform.log.info('  soilmoisture:', soilmoisture);

    this.setStatusActive(this.soilMoistureSensor, true);

    const voltage = parseFloat(soilbatt);
    const lowBattery = voltage <= 1.1;

    this.updateBatteryLevel(this.battery, voltage / 1.6 * 100);
    this.updateStatusLowBattery(this.battery, lowBattery);

    this.updateCurrentRelativeHumidity(this.soilMoistureSensor, parseFloat(soilmoisture));
    this.updateStatusLowBattery(this.soilMoistureSensor, lowBattery);
  }
}
