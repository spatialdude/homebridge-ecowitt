import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { EcowittAccessory } from './EcowittAccessory';
import { GW1000Accessory } from './GW1000Accessory';
import { WH25Accessory } from './WH25Accessory';
import { WH31Accessory } from './WH31Accessory';
import { WH65Accessory } from './WH65Accessory';
import { WH55Accessory } from './WH55Accessory';
import { WH57Accessory } from './WH57Accessory';
import { WH51Accessory } from './WH51Accessory';

import * as restify from 'restify';
import * as crypto from 'crypto';
//import { timeStamp } from 'node:console';
//import { type } from 'node:os';

// interface SensorInfo {
//   name: string;
//   model: string;
//   displayName: string;
// }

interface StationInfo {
  manufacturer: string;
  model: string;
  serialNumber: string;
  softwareRevision: string;
  frequency: string;
  PASSKEY: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sensors: any [];
}

const SensorInfos = {
  GW1000: {
    name: 'GW1000',
    displayName: 'Gateway',
  },
  WH25: {
    name: 'WH25',
    displayName: 'Thermometer/Hygrometer/Barometer',
  },
  WH31: {
    name: 'WH31',
    displayName: 'Thermometer/Hygrometer',
  },
  WH65: {
    name: 'WH65',
    displayName: '7 in 1 Weather Sensor',
  },
  WH55: {
    name: 'WH55',
    displayName: 'Leak Detector',
  },
  WH57: {
    name: 'WH57',
    displayName: 'Lightning Sensor',
  },
  WH51: {
    name: 'WH51',
    displayName: 'Soil Moisture Sensor',
  },
};

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class EcowittPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public wxDataReportServer: restify.Server;
  public wxDataReport = null;

  public wxStationInfo: StationInfo = {
    manufacturer: 'Ecowitt',
    model: '',
    serialNumber: this.config.mac,
    softwareRevision: '',
    frequency: '',
    PASSKEY: crypto
      .createHash('md5')
      .update(this.config.mac)
      .digest('hex').toUpperCase(),
    sensors: [],
  };

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.log.info('config:', JSON.stringify(this.config, undefined, 2));

    this.wxDataReportServer = restify.createServer();
    this.wxDataReportServer.use(restify.plugins.bodyParser());

    this.log.info('Data report path:', this.config.path);
    this.log.info('Data report port:', this.config.port);

    this.wxDataReportServer.post(
      this.config.path,
      (req, res, next) => {
        this.log.info('Data source address:', req.socket.remoteAddress);
        this.log.info('Request:', req.toString());
        this.wxDataReportReport(req.body);
        next();
      });


    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      this.wxUnregisterAccessories();

      this.wxDataReportServer.listen(this.config.port, () => {
        this.log.info('Listening at %s', this.wxDataReportServer.url);
      });
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  wxDataReportReport(dataReport) {
    if (dataReport.PASSKEY !== this.wxStationInfo.PASSKEY) {
      this.log.error('Report not for this station:', JSON.stringify(dataReport, undefined, 2));
      return;
    }

    this.log.info('Data report:', JSON.stringify(dataReport, undefined, 2));

    if (!this.wxDataReport) {
      this.wxDataReport = dataReport;
      this.wxRegisterAccessories(dataReport);
    } else {
      this.wxDataReport = dataReport;
    }

    this.wxUpdateAccessories(dataReport);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addSensorType(add: boolean, type: string, channel: any = undefined) {
    if (add) {
      this.wxStationInfo.sensors.push(
        {
          type: type,
          channel: channel,
        });
    }
  }

  wxUnregisterAccessories() {
    this.log.info('Unregistering cached accessories:', this.accessories.length);
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories);
  }

  wxRegisterAccessories(dataReport) {
    this.wxStationInfo.model = dataReport.model;
    this.wxStationInfo.softwareRevision = dataReport.stationtype;
    this.wxStationInfo.frequency = dataReport.freq;

    this.log.info('Checking for sensors');

    this.addSensorType(/GW1000/.test(dataReport.model), 'GW1000');
    this.addSensorType(dataReport.wh25batt !== undefined, 'WH25');
    this.addSensorType(dataReport.wh57batt !== undefined, 'WH57');
    this.addSensorType(dataReport.wh65batt !== undefined, 'WH65');

    if (!this.config?.th?.hidden) {
      for (let channel = 1; channel <= 8; channel++) {
        this.addSensorType(dataReport[`batt${channel}`] !== undefined, 'WH31', channel);
      }
    }

    if (!this.config?.soil?.hidden) {
      for (let channel = 1; channel <= 8; channel++) {
        this.addSensorType(dataReport[`soilbatt${channel}`] !== undefined, 'WH51', channel);
      }
    }

    if (!this.config?.leak?.hidden) {
      for (let channel = 1; channel <= 4; channel++) {
        this.addSensorType(dataReport[`leakbatt${channel}`] !== undefined, 'WH55', channel);
      }
    }

    this.log.info('WX Station:', JSON.stringify(this.wxStationInfo, undefined, 2));

    for (const sensor of this.wxStationInfo.sensors) {
      const sensorId = this.config.mac +
        '-' +
        sensor.type +
        (sensor.channel > 0 ? '-' + sensor.channel.toString() : '');
      const uuid = this.api.hap.uuid.generate(sensorId);

      this.log.info('sensorId:', sensorId, 'uuid:', uuid);

      const sensorInfo = SensorInfos[sensor.type];

      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        //new EcowittAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        //} else {
      }
      {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory type:', sensor.type, 'channel:', sensor.channel);

        // create a new accessory
        const accessory = new this.api.platformAccessory(sensorInfo.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.sensorInfo = sensorInfo;

        switch (sensor.type) {
          case 'GW1000':
            sensor.accessory = new GW1000Accessory(this, accessory);
            break;

          case 'WH25':
            sensor.accessory = new WH25Accessory(this, accessory);
            break;

          case 'WH31':
            sensor.accessory = new WH31Accessory(this, accessory, sensor.channel);
            break;

          case 'WH51':
            sensor.accessory = new WH51Accessory(this, accessory, sensor.channel);
            break;

          case 'WH55':
            sensor.accessory = new WH55Accessory(this, accessory, sensor.channel);
            break;

          case 'WH57':
            sensor.accessory = new WH57Accessory(this, accessory);
            break;

          case 'WH65':
            sensor.accessory = new WH65Accessory(this, accessory);
            break;

          default:
            sensor.accessory = new EcowittAccessory(this, accessory);
            break;
        }

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  wxUpdateAccessories(dataReport) {
    const dateUTC = new Date(dataReport.dateutc);
    this.log.info('Report time:', dateUTC);

    for (const sensor of this.wxStationInfo.sensors) {
      this.log.info('Updating:', sensor.type, sensor.channel);
      sensor.accessory.update(dataReport);
    }
  }
}
