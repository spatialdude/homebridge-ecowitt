import { PlatformAccessory } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { THAccessory } from './THAccessory';


export class WH31Accessory extends THAccessory {
  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
    protected channel: number,
  ) {
    super(platform, accessory);

    this.setName(this.temperatureSensor, `Indoor Temperature ${this.channel}`);
    this.setName(this.humiditySensor, `Indoor Humidity ${this.channel}`);
  }

  update(dataReport) {
    const batt = dataReport[`batt${this.channel}`];
    const tempf = dataReport[`temp${this.channel}f`];
    const humidity = dataReport[`humidity${this.channel}`];

    this.platform.log.info(`WH31 Channel ${this.channel} Update`);
    this.platform.log.info('  batt:', batt);
    this.platform.log.info('  tempf:', tempf);
    this.platform.log.info('  humidity:', humidity);

    const lowBattery = batt === '1';

    this.updateTemperature(tempf);
    this.updateStatusLowBattery(this.temperatureSensor, lowBattery);
    this.updateStatusActive(this.temperatureSensor, true);

    this.updateHumidity(humidity);
    this.updateStatusLowBattery(this.humiditySensor, lowBattery);
    this.updateStatusActive(this.humiditySensor, true);
  }
}

