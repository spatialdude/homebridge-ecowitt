import { Service, PlatformAccessory /*ServiceEventTypes*/ } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { ThermoHygroSensor } from './ThermoHygroSensor';


// https://en.wikipedia.org/wiki/Ultraviolet_index

const uvInfos = [
  { level: 0, risk: 'Low' },
  { level: 3, risk: 'Moderate' },
  { level: 6, risk: 'High' },
  { level: 8, risk: 'Very High' },
  { level: 11, risk: 'Extreme' },
];

export class WH65 extends ThermoHygroSensor {
  protected solarRadiation!: Service;
  protected uvIndex!: Service;
  protected uvThreshold: number;

  // protected windDir: Service;
  // protected windSpeed: Service;
  // protected windGust: Service;
  // protected maxDailyGust: Service;

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.setModel('WH65');
    this.setProductData('Solar Powererd 7-in-1 Outdoor Sensor');

    this.setName(this.temperatureSensor, 'Outdoor Temperature');
    this.setName(this.humiditySensor, 'Outdoor Humidity');

    this.solarRadiation = this.accessory.getService(this.platform.Service.LightSensor)
      || this.accessory.addService(this.platform.Service.LightSensor);

    // Solar Radiation

    if (!this.platform.config.ws?.solarradiation?.hidden) {
      this.setName(this.solarRadiation, 'Solar Radiation');

      this.solarRadiation
        .getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .setProps({
          minValue: 0,
          maxValue: 150000,
        });
    }

    // UV Sensor

    this.uvThreshold = this.platform.config?.ws?.uv?.threshold ?? 6;

    if (!this.platform.config.ws?.uv?.hidden) {
      this.uvIndex = this.addOccupancySensor('UV Index');

      this.platform.log.info('uvThreshold:', this.uvThreshold);
    }
  }

  update(dataReport) {
    this.platform.log.info('WH65 Update');
    this.platform.log.info('  wh65batt:', dataReport.wh65batt);
    this.platform.log.info('  tempf:', dataReport.tempf);
    this.platform.log.info('  humidity:', dataReport.humidity);
    this.platform.log.info('  solarradiation:', dataReport.solarradiation);
    this.platform.log.info('  uv:', dataReport.uv);
    this.platform.log.info('  winddir:', dataReport.winddir);
    this.platform.log.info('  windspeedmph:', dataReport.windspeedmph);
    this.platform.log.info('  windgustmph:', dataReport.windgustmph);
    this.platform.log.info('  maxdailygust:', dataReport.maxdailygust);
    this.platform.log.info('  rainratein:', dataReport.rainratein);
    this.platform.log.info('  eventrainin:', dataReport.eventrainin);
    this.platform.log.info('  hourlyrainin:', dataReport.hourlyrainin);
    this.platform.log.info('  dailyrainin:', dataReport.dailyrainin);
    this.platform.log.info('  weeklyrainin:', dataReport.weeklyrainin);
    this.platform.log.info('  monthlyrainin:', dataReport.monthlyrainin);
    this.platform.log.info('  yearlyrainin:', dataReport.yearlyrainin);
    this.platform.log.info('  totalrainin:', dataReport.totalrainin);

    this.updateStatusActive(this.temperatureSensor, true);
    this.updateStatusActive(this.humiditySensor, true);
    this.updateStatusActive(this.solarRadiation, true);

    const lowBattery = dataReport.wh65batt === '1';

    this.updateTemperature(dataReport.tempf);
    this.updateStatusLowBattery(this.temperatureSensor, lowBattery);

    this.updateHumidity(dataReport.humidity);
    this.updateStatusLowBattery(this.humiditySensor, lowBattery);

    if (this.solarRadiation) {
      this.updateName(this.solarRadiation, `Solar Radiation: ${dataReport.solarradiation} W/m²`);
      this.solarRadiation.updateCharacteristic(
        this.platform.Characteristic.CurrentAmbientLightLevel,
        Math.round(this.toLux(dataReport.solarradiation)));
      this.updateStatusLowBattery(this.solarRadiation, lowBattery);
    }

    if (this.uvIndex) {
      const uv = parseInt(dataReport.uv);

      this.updateStatusActive(this.uvIndex, true);
      this.updateName(this.uvIndex, `UV Index: ${this.toRisk(uv)} (${uv})`);
      this.updateOccupancyDetected(this.uvIndex, uv > this.uvThreshold);
    }
  }

  toLux(wm2): number {
    wm2 = parseFloat(wm2);
    return wm2 > 0
      ? wm2 / 0.00788
      : 0;
  }


  toRisk(uvIndex) {
    let uvInfo = uvInfos[0];

    for (let i = 1; i < uvInfos.length; i++) {
      if (uvIndex >= uvInfos[i].level) {
        uvInfo = uvInfos[i];
      }
    }

    return uvInfo.risk;
  }
}
