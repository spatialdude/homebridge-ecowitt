import { Service, PlatformAccessory /*ServiceEventTypes*/ } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { ThermoHygroSensor } from './ThermoHygroSensor';

import * as Utils from './Utils.js';

import { WindSensor } from './WindSensor';
import { RainSensor } from './RainSensor';

//------------------------------------------------------------------------------

// https://en.wikipedia.org/wiki/Ultraviolet_index

const uvInfos = [
  { level: 0, risk: 'Low' },
  { level: 3, risk: 'Moderate' },
  { level: 6, risk: 'High' },
  { level: 8, risk: 'Very High' },
  { level: 11, risk: 'Extreme' },
];

//------------------------------------------------------------------------------

export class WH65 extends ThermoHygroSensor {
  protected solarRadiation!: Service;
  protected uvIndex!: Service;
  protected uvThreshold: number;

  protected windDirection: WindSensor | undefined;
  protected windSpeed: WindSensor | undefined;
  protected windGust: WindSensor | undefined;
  protected maxDailyGust: WindSensor | undefined;

  protected rainRate: RainSensor | undefined;
  protected eventRainRate: RainSensor | undefined;
  protected hourlyRain: RainSensor | undefined;
  protected dailyRain: RainSensor | undefined;
  protected weeklyRain: RainSensor | undefined;
  protected monthlyRain: RainSensor | undefined;
  protected yearlyRain: RainSensor | undefined;
  protected totalRain: RainSensor | undefined;

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.setModel('WH65');
    this.setProductData(`${platform.wxStationInfo.frequency}Hz Solar Powererd 7-in-1 Outdoor Sensor`);

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

    // Wind

    this.windDirection = new WindSensor(platform, accessory, 'Wind Dir');
    this.windSpeed = new WindSensor(platform, accessory, 'Wind Speed');
    this.windGust = new WindSensor(platform, accessory, 'Wind Gust');
    this.maxDailyGust = new WindSensor(platform, accessory, 'Max Daily Gust');

    // Rain

    this.rainRate = new RainSensor(platform, accessory, 'Rain Rate');
    this.eventRainRate = new RainSensor(platform, accessory, 'Event Rain Rate');
    this.hourlyRain = new RainSensor(platform, accessory, 'Hourly Rain');
    this.dailyRain = new RainSensor(platform, accessory, 'Daily Rain');
    this.weeklyRain = new RainSensor(platform, accessory, 'Weekly Rain');
    this.monthlyRain = new RainSensor(platform, accessory, 'Monthly Rain');
    this.yearlyRain = new RainSensor(platform, accessory, 'Yearly Rain');
    this.totalRain = new RainSensor(platform, accessory, 'Total Rain');

  }

  update(dataReport) {
    this.platform.log.info('WH65 Update');
    this.platform.log.info('  wh65batt:', dataReport.wh65batt);
    this.platform.log.info('  tempf:', dataReport.tempf);
    this.platform.log.info('  humidity:', dataReport.humidity);
    this.platform.log.info('  solarradiation:', dataReport.solarradiation);
    this.platform.log.info('  uv:', dataReport.uv);

    const winddir = parseFloat(dataReport.winddir);
    const windspeedmph = parseFloat(dataReport.windspeedmph);
    const windgustmph = parseFloat(dataReport.windgustmph);
    const maxdailygust = parseFloat(dataReport.maxdailygust);

    this.platform.log.info('  winddir:', winddir);
    this.platform.log.info('  windspeedmph:', windspeedmph);
    this.platform.log.info('  windgustmph:', windgustmph);
    this.platform.log.info('  maxdailygust:', maxdailygust);

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
        Math.round(Utils.toLux(dataReport.solarradiation)));
      this.updateStatusLowBattery(this.solarRadiation, lowBattery);
    }

    if (this.uvIndex) {
      const uv = parseInt(dataReport.uv);

      this.updateStatusActive(this.uvIndex, true);
      this.updateName(this.uvIndex, `UV Index: ${this.toRisk(uv)} (${uv})`);
      this.updateOccupancyDetected(this.uvIndex, uv > this.uvThreshold);
    }

    // Wind

    this.windDirection?.updateDirection(winddir, windspeedmph, 1);
    this.windSpeed?.updateSpeed(windspeedmph, 1);
    this.windGust?.updateSpeed(windgustmph, 1);
    this.maxDailyGust?.updateSpeed(maxdailygust, 1);

    // Rain

    this.rainRate?.updateRate(parseFloat(dataReport.rainratein));
    this.eventRainRate?.updateRate(parseFloat(dataReport.eventrainin));
    this.hourlyRain?.updateTotal(parseFloat(dataReport.hourlyrainin));
    this.dailyRain?.updateTotal(parseFloat(dataReport.dailyrainin));
    this.weeklyRain?.updateTotal(parseFloat(dataReport.weeklyrainin));
    this.monthlyRain?.updateTotal(parseFloat(dataReport.monthlyrainin));
    this.yearlyRain?.updateTotal(parseFloat(dataReport.yearlyrainin));
    this.totalRain?.updateTotal(parseFloat(dataReport.totalrainin));
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
