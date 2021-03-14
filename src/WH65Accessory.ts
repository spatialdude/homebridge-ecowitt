import { Service, PlatformAccessory /*ServiceEventTypes*/ } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';
import { THAccessory } from './THAccessory';


export class WH65Accessory extends THAccessory {
  protected solarRadiation: Service;
  protected uvIndex: Service;

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.setName(this.temperatureSensor, 'Outdoor Temperature');
    this.setName(this.humiditySensor, 'Outdoor Humidity');

    this.solarRadiation = this.accessory.getService(this.platform.Service.LightSensor)
      || this.accessory.addService(this.platform.Service.LightSensor);

    this.setName(this.solarRadiation, 'Solar Radiation');

    this.solarRadiation
      .getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .setProps({
        minValue: 0,
        maxValue: 150000,
      });

    this.uvIndex = this.addOccupancySensor('UV Index');
    this.uvIndex
      .getCharacteristic(this.platform.Characteristic.OccupancyDetected)
      .setProps({
        minValue: 0,
        maxValue: 15,
      });
  }

  update(dataReport) {
    this.platform.log.info('WH65 Update');
    this.platform.log.info('  wh65batt:', dataReport.wh65batt);
    this.platform.log.info('  tempf:', dataReport.tempf);
    this.platform.log.info('  humidity:', dataReport.humidity);
    this.platform.log.info('  solarradiation:', dataReport.solarradiation);
    this.platform.log.info('  uv:', dataReport.uv);

    this.updateStatusActive(this.temperatureSensor, true);
    this.updateStatusActive(this.humiditySensor, true);
    this.updateStatusActive(this.solarRadiation, true);
    this.updateStatusActive(this.uvIndex, true);

    const lowBattery = dataReport.wh65batt === '1';

    this.updateTemperature(dataReport.tempf);
    this.updateStatusLowBattery(this.temperatureSensor, lowBattery);

    this.updateHumidity(dataReport.humidity);
    this.updateStatusLowBattery(this.humiditySensor, lowBattery);

    this.solarRadiation.updateCharacteristic(
      this.platform.Characteristic.CurrentAmbientLightLevel,
      Math.round(this.toLux(dataReport.solarradiation)));
    this.updateStatusLowBattery(this.solarRadiation, lowBattery);

    this.updateName(this.uvIndex, `UV Index: ${dataReport.uv}`);
    this.uvIndex.updateCharacteristic(
      this.platform.Characteristic.OccupancyDetected,
      parseInt(dataReport.uv));
  }

  toLux(wm2): number {
    wm2 = parseFloat(wm2);
    return wm2 > 0
      ? wm2 / 0.00788
      : 0;
  }
}
